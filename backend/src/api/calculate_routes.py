from fastapi import APIRouter, HTTPException
from src.models.schemas import CalculateRequest, CalculateResponse
from src.services.calculator import calculate_profit

router = APIRouter(tags=['runes'])

@router.post("/calculate", response_model=CalculateResponse)
async def calculate_endpoint(request: CalculateRequest):
    """
    Endpoint para calcular el rompimiento de objetos (Dofus 3).
    Solo considera runas normales/base.
    """
    try:
        # Llamamos a la lógica que definimos arriba
        response = await calculate_profit(request)
        return response
    except Exception as e:
        # Manejo básico de errores para no tumbar el servidor
        print(f"Error en calculo: {e}")
        raise HTTPException(status_code=500, detail=str(e))
