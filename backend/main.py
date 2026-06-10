from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import os
import shutil
import uuid
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from pydantic import BaseModel
from pptx_engine import replace_text_in_pptx, validate_pptx, extract_text_from_pptx
from ai_engine import scrape_target_url, generate_replacements_with_gemini

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

app = FastAPI(title="FundSync API")

# 15MB limit = 15 * 1024 * 1024 bytes
app.add_middleware(LimitUploadSize, max_upload_size=15728640)

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

# --- Phase 2: Two-Phase Endpoints ---

class CompileRequest(BaseModel):
    session_id: str
    replacements: dict

@app.post("/api/propose-replacements")
async def propose_replacements(
    file: UploadFile = File(...),
    target_url: str = Form(...),
    tone_formal: int = Form(50),
    tone_technical: int = Form(50),
    custom_focus: str = Form("")
):
    if not file.filename.endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .pptx is allowed.")

    session_id = str(uuid.uuid4())
    input_path = f"tmp/input_{session_id}.pptx"

    try:
        # Save uploaded file to disk
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Extract text from the uploaded Master Deck
        presentation_text = extract_text_from_pptx(input_path)
        
        # 2. Scrape the Sponsor URL (includes Safe Mode fallback)
        sponsor_context = await scrape_target_url(target_url)
        
        # 3. Call Gemini to map replacements
        replacements = await generate_replacements_with_gemini(
            presentation_text, 
            sponsor_context,
            tone_formal=tone_formal,
            tone_technical=tone_technical,
            custom_focus=custom_focus
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
        cleanup_temp_files(input_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/compile-deck")
async def compile_deck(
    request: CompileRequest,
    background_tasks: BackgroundTasks
):
    session_id = request.session_id
    replacements = request.replacements

    input_path = f"tmp/input_{session_id}.pptx"
    output_path = f"tmp/output_{session_id}.pptx"

    if not os.path.exists(input_path):
        raise HTTPException(
            status_code=400, 
            detail="Session expired or file not found. Please upload the pitch deck again."
        )

    try:
        # 4. Process the presentation via the document engine
        replacements_made, slides_modified = replace_text_in_pptx(input_path, output_path, replacements)

        # 5. Anti-Corruption Validation
        if not validate_pptx(output_path):
            raise HTTPException(status_code=500, detail="Document corruption detected during generation. XML structure is invalid.")

        # Return the modified file as a stream with the custom metrics header
        headers = {
            "X-Replacements-Count": str(replacements_made),
            "X-Slides-Modified": str(slides_modified)
        }
        
        # Add background task to clean up files after the response is sent
        background_tasks.add_task(cleanup_temp_files, input_path, output_path)
        
        return FileResponse(
            path=output_path, 
            filename=f"FundSync_personalized.pptx", 
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers=headers
        )

    except HTTPException as he:
        cleanup_temp_files(input_path, output_path)
        raise he
    except Exception as e:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=str(e))

import cloudconvert

@app.post("/api/generate-thumbnail")
def generate_thumbnail(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    if not file.filename.endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .pptx is allowed.")
        
    api_key = os.getenv("CLOUDCONVERT_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing CLOUDCONVERT_API_KEY in backend .env")
        
    cloudconvert.configure(api_key=api_key, sandbox=False)
    
    session_id = str(uuid.uuid4())
    os.makedirs("tmp", exist_ok=True)
    input_path = os.path.abspath(f"tmp/thumb_in_{session_id}.pptx")
    output_png = os.path.abspath(f"tmp/thumb_out_{session_id}.png")
    
    try:
        content = file.file.read()
        
        with open(input_path, "wb") as buffer:
            buffer.write(content)
            
        print("Calling CloudConvert to securely render thumbnail...")
        job = cloudconvert.Job.create(payload={
            "tasks": {
                "import-my-file": {
                    "operation": "import/upload"
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
        
        upload_task_id = job['tasks'][0]['id']
        upload_task = cloudconvert.Task.find(id=upload_task_id)
        cloudconvert.Task.upload(file_name=input_path, task=upload_task)
        
        print("Waiting for CloudConvert job completion...")
        job = cloudconvert.Job.wait(id=job['id'])
        
        for task in job['tasks']:
            if task['name'] == 'export-my-file' and task['status'] == 'finished':
                file_info = task['result']['files'][0]
                cloudconvert.download(filename=output_png, url=file_info['url'])
                break
            
        if os.path.exists(output_png):
            background_tasks.add_task(cleanup_temp_files, input_path, output_png)
            return FileResponse(
                path=output_png,
                filename="thumbnail.png",
                media_type="image/png"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to produce output image from CloudConvert.")
            
    except HTTPException:
        cleanup_temp_files(input_path)
        raise
    except Exception as e:
        cleanup_temp_files(input_path)
        raise HTTPException(status_code=500, detail=str(e))
