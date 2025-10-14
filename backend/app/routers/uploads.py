import os
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from typing import Optional
import uuid

router = APIRouter(prefix="/uploads", tags=["uploads"])

# Ensure uploads directory exists
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

@router.post("/photo/{user_id}")
async def upload_photo(user_id: str, file: UploadFile = File(...)):
    """Upload a photo for a user"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File is not an image")
    
    # Create user directory if it doesn't exist
    user_dir = os.path.join(UPLOADS_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(user_dir, unique_filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return URL to access the file
    # In production, you'd return a URL to a CDN or static file server
    file_url = f"/static/uploads/{user_id}/{unique_filename}"
    
    return {"url": file_url, "filename": unique_filename}
