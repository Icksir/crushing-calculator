import os
from fastapi import APIRouter
import json
from fastapi.responses import JSONResponse

router = APIRouter()

# Obtenemos la ruta absoluta del directorio actual
current_dir = os.path.dirname(os.path.abspath(__file__))
# Construimos la ruta al archivo status.json
STATUS_FILE = os.path.join(current_dir, "..", "..", "config", "status.json")

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/maintenance")
async def get_maintenance_status():
    data = {"active": False, "messages": {"es": "", "en": "", "fr": ""}}
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, "r") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return JSONResponse(content=data)