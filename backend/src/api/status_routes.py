import os
from fastapi import APIRouter
import json
from fastapi.responses import JSONResponse

router = APIRouter()

STATUS_FILE = "/app/config/status.json"

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/maintenance")
async def get_maintenance_status():
    data = {"active": False, "message": ""}
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, "r") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return JSONResponse(content=data)