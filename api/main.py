from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List
import json
from blob_service import BlobService
from pydantic import BaseModel
import io

app = FastAPI()

# Allow CORS in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store blob service instance
blob_service = None

class ConnectionInfo(BaseModel):
    account_name: str
    container_name: str
    sas_token: str

@app.post("/api/connect")
async def connect(info: ConnectionInfo):
    global blob_service
    try:
        blob_service = BlobService(
            account_name=info.account_name,
            sas_token=info.sas_token,
            container_name=info.container_name
        )
        # Test connection by listing files
        await blob_service.list_files("")
        return {"status": "connected"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/files")
async def list_files(path: str = ""):
    if not blob_service:
        raise HTTPException(status_code=400, detail="Not connected")
    try:
        files = await blob_service.list_files(path)
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(path: str, file: UploadFile = File(...)):
    if not blob_service:
        raise HTTPException(status_code=400, detail="Not connected")
    try:
        content = await file.read()
        await blob_service.upload_file(f"{path}/{file.filename}" if path else file.filename, content)
        return {"status": "uploaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download")
async def download_file(path: str):
    if not blob_service:
        raise HTTPException(status_code=400, detail="Not connected")
    try:
        content, content_type = await blob_service.download_file(path)
        return StreamingResponse(
            io.BytesIO(content),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={path.split('/')[-1]}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.post("/api/create-directory")
async def create_directory(path: str):
    try:
        await blob_service.create_directory(path)
        return {"message": "Directory created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))        
        

@app.delete("/api/delete")
async def delete_file(path: str):
    if not blob_service:
        raise HTTPException(status_code=400, detail="Not connected")
    try:
        await blob_service.delete_file(path)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        