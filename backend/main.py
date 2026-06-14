from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import os
import shutil
import uuid
import json
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import asyncio
import time
import io
import httpx
from supabase import create_client, Client
from collections import defaultdict
from contextlib import asynccontextmanager
from pydantic import BaseModel
from pptx_engine import replace_text_in_pptx, validate_pptx, extract_text_from_pptx
from ai_engine import scrape_target_url, generate_replacements_with_gemini

# Initialize Supabase Admin Client (Service Role Key Bypasses RLS)
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
supabase_client: Client = create_client(supabase_url, supabase_key) if supabase_url else None

# --- Step 2.2: Middleware for 15MB Size Limit ---
class LimitUploadSize(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST":
            if "content-length" in request.headers:
                content_length = int(request.headers["content-length"])
                if content_length > self.max_upload_size:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Payload Too Large: File exceeds 15MB limit"}
                    )
        return await call_next(request)

# --- Rate Limiter Middleware ---
rate_limit_records = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW = 60 # seconds

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/"):
            client_ip = request.client.host if request.client else "unknown"
            current_time = time.time()
            
            rate_limit_records[client_ip] = [
                t for t in rate_limit_records[client_ip] 
                if current_time - t < RATE_LIMIT_WINDOW
            ]
            
            if len(rate_limit_records[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Maximum 5 requests per minute."}
                )
                
            rate_limit_records[client_ip].append(current_time)
            
        return await call_next(request)

# --- Boot-Time Zombie Purge & HTTP Pooling ---
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
            
    # Setup global HTTP client for connection pooling performance
    app.state.http_client = httpx.AsyncClient()
    yield
    await app.state.http_client.aclose()

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

class CompileRequest(BaseModel):
    session_id: str
    replacements: dict

@app.post("/api/propose-replacements")
async def propose_replacements(request: ProposeRequest, req: Request):
    session_id = str(uuid.uuid4())

    try:
        # Use global connection pool
        client = getattr(req.app.state, "http_client", httpx.AsyncClient())
        
        # Download file directly into RAM
        resp = await client.get(request.file_url)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download file from Supabase.")
        file_buffer = io.BytesIO(resp.content)
        
        # 1. Extract text from the loaded buffer
        def run_extract():
            return extract_text_from_pptx(file_buffer)
        
        # 2. Run Scraping and Extraction in Parallel
        presentation_text, sponsor_context = await asyncio.gather(
            asyncio.to_thread(run_extract),
            scrape_target_url(request.target_url)
        )
        
        # 3. Call Gemini to map replacements
        replacements = await generate_replacements_with_gemini(
            presentation_text, 
            sponsor_context,
            tone_formal=request.tone_formal,
            tone_technical=request.tone_technical,
            custom_focus=request.custom_focus
        )
        
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
    
    res = supabase_client.storage.from_("master-decks").upload(path, file_content, {"content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"})
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
        # Download master deck into RAM
        async with httpx.AsyncClient() as client:
            resp = await client.get(request.file_url)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to download master deck.")
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
        import re
        safe_name = re.sub(r'[^A-Za-z0-9_\-\.]', '_', request.original_filename)
        if safe_name.lower().endswith(".pptx"):
            safe_name = safe_name[:-5]
        if not safe_name:
            safe_name = "FundSync_Generated"
            
        output_filename = f"generated/{uuid.uuid4().hex[:8]}_{safe_name}_Personalized.pptx"
        
        res = supabase_client.storage.from_("master-decks").upload(
            output_filename, 
            output_buffer.read(), 
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
            async with httpx.AsyncClient() as client:
                png_resp = await client.get(png_url)
                if png_resp.status_code == 200:
                    return Response(content=png_resp.content, media_type="image/png")
                    
        raise HTTPException(status_code=500, detail="Failed to produce output image from CloudConvert.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
