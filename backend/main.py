from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import os
import shutil
import uuid
import json

from pptx_engine import replace_text_in_pptx, validate_pptx

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
    expose_headers=["X-Replacements-Count"],
)

os.makedirs("tmp", exist_ok=True)

# --- Step 2.1: FastAPI multipart/form-data POST endpoint ---
@app.post("/api/process-deck")
async def process_deck(
    file: UploadFile = File(...),
    target_url: str = Form(...),
    # Added for Phase 2 testing before Gemini integration
    test_replacements: str = Form(default="{}") 
):
    if not file.filename.endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .pptx is allowed.")

    session_id = str(uuid.uuid4())
    input_path = f"tmp/input_{session_id}.pptx"
    output_path = f"tmp/output_{session_id}.pptx"

    try:
        # Save uploaded file to disk
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Parse test replacements (for Phase 2 testing)
        try:
            replacements = json.loads(test_replacements)
        except json.JSONDecodeError:
            replacements = {}
            
        # Step 2.3: Process the presentation via the document engine
        replacements_made = replace_text_in_pptx(input_path, output_path, replacements)

        # Step 2.4: Anti-Corruption Validation
        if not validate_pptx(output_path):
            raise HTTPException(status_code=500, detail="Document corruption detected during generation. XML structure is invalid.")

        # Return the modified file as a stream with the custom metrics header
        headers = {"X-Replacements-Count": str(replacements_made)}
        
        return FileResponse(
            path=output_path, 
            filename=f"FundSync_{file.filename}", 
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers=headers
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
