import os
from fastapi import APIRouter, Response
import json
from typing import Dict
from pydantic import BaseModel

# Nuevo modelo que soporta múltiples idiomas
class MaintenanceStatus(BaseModel):
    active: bool
    messages: Dict[str, str]  # Ejemplo: {"es": "Hola", "en": "Hello"}
    
router = APIRouter()

STATUS_FILE = "/app/config/status.json"

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/maintenance", response_model=MaintenanceStatus)
async def get_maintenance_status(response: Response):
    response.headers["Cache-Control"] = "public, max-age=30"
    
    # 1. Estructura por defecto: si no hay archivo, devolvemos esto
    data = {
        "active": False,
        "messages": {} 
    }
    
    # 2. Leemos el archivo
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, "r") as f:
                file_content = json.load(f)
                
                # Opcional: Validación simple para asegurar que no rompa si el JSON es viejo
                if "messages" in file_content:
                    data = file_content
                # Fallback: Si el JSON es viejo (formato anterior "message"), lo adaptamos
                elif "message" in file_content:
                    data = {
                        "active": file_content.get("active", False),
                        "messages": {"es": file_content.get("message", "")}
                    }
                    
        except (json.JSONDecodeError, IOError):
            # Si falla la lectura, devolvemos el data por defecto (False)
            pass
            
    return data