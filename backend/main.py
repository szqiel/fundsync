from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os

app = FastAPI(title="FundSync API")

# Configure CORS so the Next.js frontend can communicate with it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FundSync Document Processing API is live."}

# Placeholder for Phase 2 implementation
@app.post("/api/process-deck")
async def process_deck(file: UploadFile, target_url: str = Form(...)):
    return {"status": "Not implemented yet"}
