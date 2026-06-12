import sys
import os

# Ensure the api directory is in the system path for local and Vercel imports
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.append(api_dir)

from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import shutil
import uuid
import json
import re
from dotenv import load_dotenv

# Load environment variables robustly
load_dotenv()  # Load standard .env if present

current_dir = os.getcwd()
candidate_paths = [
    os.path.join(current_dir, ".env.local"),
    os.path.join(current_dir, "..", ".env.local"),
    os.path.join(current_dir, "frontend", ".env.local"),
    os.path.join(api_dir, ".env.local"),
    os.path.join(api_dir, "..", ".env.local")
]

for path in candidate_paths:
    if os.path.exists(path):
        load_dotenv(dotenv_path=path)
        print(f"Loaded environment variables from {path}")

import asyncio
import time
import io
import httpx
from supabase import create_client, Client
from collections import defaultdict
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import List
from pptx_engine import (
    replace_text_in_pptx,
    validate_pptx,
    extract_text_from_pptx,
    get_cached_download,
    set_cached_download
)
from ai_engine import scrape_target_url, generate_replacements_with_gemini

# Initialize Supabase Admin Client (Service Role Key Bypasses RLS)
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
supabase_key = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or "").strip()
supabase_client: Client = create_client(supabase_url, supabase_key) if (supabase_url and supabase_key) else None

# --- Step 2.2: Middleware for 15MB Size Limit ---
class LimitUploadSize(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST":
            content_length = None
            if "content-length" in request.headers:
                try:
                    content_length = int(request.headers["content-length"])
                except ValueError:
                    pass

            if content_length is not None:
                if content_length > self.max_upload_size:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Payload Too Large: File exceeds 15MB limit"}
                    )
            else:
                total_bytes = 0
                body_chunks = []
                async for chunk in request.stream():
                    total_bytes += len(chunk)
                    if total_bytes > self.max_upload_size:
                        return JSONResponse(
                            status_code=413,
                            content={"detail": "Payload Too Large: File exceeds 15MB limit"}
                        )
                    body_chunks.append(chunk)

                body = b"".join(body_chunks)
                # Downstream expects ASGI stream, chunks of 256KB
                chunks = [body[i:i+262144] for i in range(0, len(body), 262144)]
                chunk_index = 0

                async def mock_receive():
                    nonlocal chunk_index
                    if chunk_index < len(chunks):
                        chunk = chunks[chunk_index]
                        chunk_index += 1
                        return {
                            "type": "http.request",
                            "body": chunk,
                            "more_body": chunk_index < len(chunks)
                        }
                    return {"type": "http.disconnect"}

                request._receive = mock_receive

        return await call_next(request)

# --- Rate Limiter Middleware ---
rate_limit_records = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW = 60 # seconds

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/"):
            x_forwarded_for = request.headers.get("x-forwarded-for")
            if x_forwarded_for:
                client_ip = x_forwarded_for.split(",")[0].strip()
            else:
                client_ip = request.client.host if request.client else "unknown"

            current_time = time.time()
            
            # Prune/clean up all keys whose lists are empty or expired to prevent memory leak
            for ip in list(rate_limit_records.keys()):
                rate_limit_records[ip] = [
                    t for t in rate_limit_records[ip] 
                    if current_time - t < RATE_LIMIT_WINDOW
                ]
                if not rate_limit_records[ip]:
                    del rate_limit_records[ip]
            
            if len(rate_limit_records.get(client_ip, [])) >= RATE_LIMIT_MAX_REQUESTS:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Maximum 5 requests per minute."}
                )
                
            rate_limit_records[client_ip].append(current_time)
            
        return await call_next(request)

# --- Boot-Time Zombie Purge & HTTPX Session Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Boot-time purge: Cleaning up tmp/ directory...")
    os.makedirs("tmp", exist_ok=True)
    for filename in os.listdir("tmp"):
        file_path = os.path.join("tmp", filename)
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
                print(f"Purged zombie file: {filename}")
        except Exception as e:
            print(f"Failed to delete {file_path}: {e}")
            
    # Initialize global HTTPX AsyncClient for connection reuse (TCP pooling/keep-alive)
    timeout = httpx.Timeout(15.0, connect=5.0)
    app.state.client = httpx.AsyncClient(timeout=timeout)
    print("Initialized global HTTPX AsyncClient.")
    
    # Initialize download locks for preventing cache stampede
    app.state.download_locks = defaultdict(asyncio.Lock)
    
    yield
    
    # Clean up HTTPX client on shutdown
    await app.state.client.aclose()
    print("Closed global HTTPX AsyncClient.")

app = FastAPI(title="FundSync API", lifespan=lifespan)

# 15MB limit = 15 * 1024 * 1024 bytes
app.add_middleware(LimitUploadSize, max_upload_size=15728640)
app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Replacements-Count", "X-Slides-Modified", "Content-Disposition"],
)

os.makedirs("tmp", exist_ok=True)

def cleanup_temp_files(*file_paths):
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"Cleaned up {path}")
        except Exception as e:
            print(f"Error cleaning up {path}: {e}")

# --- Phase 1: Propose Replacements ---
class ProposeRequest(BaseModel):
    file_url: str
    target_url: str
    tone_formal: int = 50
    tone_technical: int = 50
    custom_focus: str = ""

@app.post("/api/propose-replacements")
async def propose_replacements(request: ProposeRequest):
    session_id = str(uuid.uuid4())

    try:
        # Reuse global HTTPX AsyncClient from app state
        client = app.state.client

        # Define download and text extraction task
        async def download_and_extract() -> List[str]:
            url_lock = app.state.download_locks[request.file_url]
            async with url_lock:
                # Retrieve cached download if available
                cached_data = get_cached_download(request.file_url)
                if cached_data is not None:
                    print(f"[Download Cache Hit] Using cached file content for {request.file_url}")
                    file_buffer = io.BytesIO(cached_data)
                else:
                    resp = await client.get(request.file_url)
                    if resp.status_code != 200:
                        raise HTTPException(status_code=400, detail="Failed to download file from Supabase.")
                    set_cached_download(request.file_url, resp.content)
                    file_buffer = io.BytesIO(resp.content)
            # Offload CPU-bound slide extraction to a worker thread
            return await asyncio.to_thread(extract_text_from_pptx, file_buffer)

        # 1 & 2. Run Supabase PPTX download/extraction and Firecrawl scraping in parallel
        # This dramatically reduces latency by overlapping network and CPU operations
        presentation_text, sponsor_context = await asyncio.gather(
            download_and_extract(),
            scrape_target_url(request.target_url, client=client)
        )
        
        # 3. Call Gemini to map replacements (Structured Output schema is used internally)
        replacements = await generate_replacements_with_gemini(
            presentation_text, 
            sponsor_context,
            tone_formal=request.tone_formal,
            tone_technical=request.tone_technical,
            custom_focus=request.custom_focus
        )
        
        # If Gemini fails, return empty proposed replacements
        if not replacements:
            replacements = {}
            
        return {
            "session_id": session_id,
            "proposed_replacements": replacements,
            "sponsor_context": sponsor_context
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-guest")
async def upload_guest(file: UploadFile = File(...)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase not configured.")
    
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Guest demo files are limited to 5MB. Please log in for larger files.")
        
    safe_name = re.sub(r'[^A-Za-z0-9_\-\.]', '_', file.filename)
    path = f"guest/{uuid.uuid4().hex[:8]}_{safe_name}"
    
    # Wrap synchronous Supabase upload in asyncio.to_thread
    res = await asyncio.to_thread(
        supabase_client.storage.from_("master-decks").upload,
        path,
        file_content,
        {"content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"}
    )
    if hasattr(res, 'status_code') and res.status_code >= 400:
        raise HTTPException(status_code=500, detail=f"Supabase Upload Error: {res.text}")
        
    url_data = supabase_client.storage.from_("master-decks").get_public_url(path)
    public_url = url_data if isinstance(url_data, str) else url_data.get("publicUrl")
    
    return {"file_url": public_url}

class CompileRequest(BaseModel):
    session_id: str
    file_url: str
    original_filename: str = ""
    replacements: dict

@app.post("/api/compile-deck")
async def compile_deck(
    request: CompileRequest
):
    try:
        # Download master deck into RAM using global HTTPX client, leveraging cache if possible
        client = app.state.client
        
        url_lock = app.state.download_locks[request.file_url]
        async with url_lock:
            cached_data = get_cached_download(request.file_url)
            if cached_data is not None:
                print(f"[Download Cache Hit] Using cached file content for {request.file_url}")
                input_buffer = io.BytesIO(cached_data)
            else:
                resp = await client.get(request.file_url)
                if resp.status_code != 200:
                    raise HTTPException(status_code=400, detail="Failed to download master deck.")
                set_cached_download(request.file_url, resp.content)
                input_buffer = io.BytesIO(resp.content)

        # 4. Process the presentation via the document engine
        def run_engine():
            print(f"DEBUG: Compile Deck Replacements received: {len(request.replacements)}")
            return replace_text_in_pptx(input_buffer, request.replacements)
            
        replacements_made, slides_modified, output_buffer = await asyncio.to_thread(run_engine)

        # 5. Anti-Corruption Validation
        def run_validation():
            return validate_pptx(output_buffer)
        if not await asyncio.to_thread(run_validation):
            raise HTTPException(status_code=500, detail="Document corruption detected during generation. XML structure is invalid.")

        # 6. Upload directly to Supabase Storage (bypassing Vercel download limits)
        if not supabase_client:
            raise HTTPException(status_code=500, detail="Supabase not configured.")
            
        output_buffer.seek(0)
        
        # Clean the original filename for the final output
        safe_name = re.sub(r'[^A-Za-z0-9_\-\.]', '_', request.original_filename)
        if safe_name.lower().endswith(".pptx"):
            safe_name = safe_name[:-5]
        if not safe_name:
            safe_name = "FundSync_Generated"
            
        output_filename = f"generated/{uuid.uuid4().hex[:8]}_{safe_name}_Personalized.pptx"
        
        file_bytes = output_buffer.read()
        
        # Wrap synchronous Supabase upload in asyncio.to_thread
        res = await asyncio.to_thread(
            supabase_client.storage.from_("master-decks").upload,
            output_filename,
            file_bytes,
            {"content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"}
        )
        
        # Check if python supabase client returned an HTTP error (it usually returns response or throws)
        if hasattr(res, 'status_code') and res.status_code >= 400:
            raise HTTPException(status_code=500, detail=f"Supabase Upload Error: {res.text}. (Make sure SUPABASE_SERVICE_ROLE_KEY is in .env)")
        
        # 7. Get public URL
        public_url_data = supabase_client.storage.from_("master-decks").get_public_url(output_filename)
        # Handle dict or string depending on supabase-py version
        public_url = public_url_data if isinstance(public_url_data, str) else public_url_data.get('publicUrl', public_url_data)
        
        return {
            "status": "success",
            "download_url": public_url,
            "replacements_count": replacements_made,
            "slides_modified": slides_modified
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import cloudconvert

@app.post("/api/generate-thumbnail")
async def generate_thumbnail(
    file_url: str = Form(...)
):
    api_key = os.getenv("CLOUDCONVERT_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing CLOUDCONVERT_API_KEY in backend .env")
        
    cloudconvert.configure(api_key=api_key, sandbox=False)
    
    try:
        print("Calling CloudConvert to securely render thumbnail asynchronously from URL...")
        
        def run_cloudconvert_job():
            job = cloudconvert.Job.create(payload={
                "tasks": {
                    "import-my-file": {
                        "operation": "import/url",
                        "url": file_url
                    },
                    "convert-my-file": {
                        "operation": "convert",
                        "input": "import-my-file",
                        "input_format": "pptx",
                        "output_format": "png",
                        "pages": "1-1"
                    },
                    "export-my-file": {
                        "operation": "export/url",
                        "input": "convert-my-file"
                    }
                }
            })
            
            if 'id' not in job:
                print(f"CloudConvert Error: {job}")
                raise RuntimeError(f"CloudConvert API rejected the job: {job.get('message', 'Unknown error')}")
                
            job_result = cloudconvert.Job.wait(id=job['id'])
            
            for task in job_result['tasks']:
                if task['name'] == 'export-my-file' and task['status'] == 'finished':
                    file_info = task['result']['files'][0]
                    return file_info['url']
            return None
                    
        png_url = await asyncio.to_thread(run_cloudconvert_job)
            
        if png_url:
            # Reuse global HTTPX client
            client = app.state.client
            png_resp = await client.get(png_url)
            if png_resp.status_code == 200:
                return Response(content=png_resp.content, media_type="image/png")
                    
        raise HTTPException(status_code=500, detail="Failed to produce output image from CloudConvert.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
