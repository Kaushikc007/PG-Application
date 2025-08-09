from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil
from pathlib import Path

from app.core.database import get_db
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.models import User
from app.schemas import FileUploadResponse
from app.core.config import settings
from datetime import datetime

router = APIRouter()

# Allowed file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx"}
MAX_FILE_SIZE = settings.MAX_FILE_SIZE  # 10MB

def validate_file(file: UploadFile) -> bool:
    """Validate uploaded file."""
    # Check file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        return False
    
    # Check file size (this is approximate as we haven't read the full file yet)
    return True

def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename while preserving extension."""
    file_extension = Path(original_filename).suffix
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{file_extension}"

@router.post("/image", response_model=FileUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload image file."""
    # Validate file
    if not validate_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE} bytes"
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path(settings.UPLOAD_DIR) / "images"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename)
    file_path = upload_dir / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    return FileUploadResponse(
        filename=unique_filename,
        file_path=str(file_path),
        file_size=len(content),
        upload_time=datetime.utcnow()
    )

@router.post("/document", response_model=FileUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload document file."""
    # Validate file
    if not validate_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE} bytes"
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path(settings.UPLOAD_DIR) / "documents"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename)
    file_path = upload_dir / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    return FileUploadResponse(
        filename=unique_filename,
        file_path=str(file_path),
        file_size=len(content),
        upload_time=datetime.utcnow()
    )

@router.post("/multiple-images", response_model=List[FileUploadResponse])
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload multiple image files."""
    if len(files) > 10:  # Limit to 10 files at once
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files allowed at once"
        )
    
    uploaded_files = []
    upload_dir = Path(settings.UPLOAD_DIR) / "images"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    for file in files:
        # Validate file
        if not validate_file(file):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type for {file.filename}. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File {file.filename} too large. Maximum size: {MAX_FILE_SIZE} bytes"
            )
        
        # Reset file pointer
        await file.seek(0)
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename)
        file_path = upload_dir / unique_filename
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            uploaded_files.append(FileUploadResponse(
                filename=unique_filename,
                file_path=str(file_path),
                file_size=len(content),
                upload_time=datetime.utcnow()
            ))
        except Exception as e:
            # Clean up any successfully uploaded files
            for uploaded_file in uploaded_files:
                try:
                    os.remove(uploaded_file.file_path)
                except:
                    pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file {file.filename}: {str(e)}"
            )
    
    return uploaded_files

@router.get("/download/{file_type}/{filename}")
async def download_file(
    file_type: str,
    filename: str,
    current_user: User = Depends(get_current_active_user)
):
    """Download uploaded file."""
    if file_type not in ["images", "documents"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be 'images' or 'documents'"
        )
    
    file_path = Path(settings.UPLOAD_DIR) / file_type / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

@router.delete("/{file_type}/{filename}")
async def delete_file(
    file_type: str,
    filename: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete uploaded file."""
    if file_type not in ["images", "documents"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be 'images' or 'documents'"
        )
    
    file_path = Path(settings.UPLOAD_DIR) / file_type / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    try:
        os.remove(file_path)
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )

@router.get("/list/{file_type}")
async def list_files(
    file_type: str,
    current_user: User = Depends(get_current_active_user)
):
    """List uploaded files."""
    if file_type not in ["images", "documents"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be 'images' or 'documents'"
        )
    
    upload_dir = Path(settings.UPLOAD_DIR) / file_type
    
    if not upload_dir.exists():
        return {"files": []}
    
    files = []
    for file_path in upload_dir.iterdir():
        if file_path.is_file():
            stat = file_path.stat()
            files.append({
                "filename": file_path.name,
                "size": stat.st_size,
                "created_time": datetime.fromtimestamp(stat.st_ctime),
                "modified_time": datetime.fromtimestamp(stat.st_mtime)
            })
    
    return {"files": files}
