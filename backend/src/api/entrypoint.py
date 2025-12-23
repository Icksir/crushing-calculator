from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.calculate_routes import router as calculate_routes
from src.api.items_routes import router as items_routes
from src.api.prices_routes import router as prices_routes
from src.api.ocr_routes import router as ocr_routes
from src.api.status_routes import router as status_routes
from src.settings.config import env_settings
import uvicorn

app = FastAPI()

def create_app() -> FastAPI:
    app = FastAPI(
        title="BioBot API",
        description="API para Biobit",
        version="1.0.0",
        debug=env_settings.debug
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=env_settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(calculate_routes, prefix="/api")
    app.include_router(items_routes, prefix="/api")
    app.include_router(prices_routes, prefix="/api")
    app.include_router(ocr_routes, prefix="/api")
    app.include_router(status_routes, prefix="/api")
    
    @app.get("/")
    def health_check():
        return {"status": "ok", "message": "Backend is running"}

    @app.get("/api/health")
    def api_health_check():
        return {"status": "ok", "message": "API is accessible"}

    return app

app = create_app()

# Print routes for debugging
for route in app.routes:
    if hasattr(route, "path"):
        print(f"Route: {route.path}")

print(f"CORS Origins configured: {env_settings.cors_origins_list}")

def main():
    if env_settings.environment == "development":
        uvicorn.run(
            "api.entrypoint:app", 
            host=env_settings.host, 
            port=env_settings.port, 
            reload=True,  
            log_level=env_settings.log_level.lower(),
            loop="asyncio",
        )
    else:
        uvicorn.run(
            "api.entrypoint:app", 
            host=env_settings.host, 
            port=env_settings.port,
            log_level=env_settings.log_level.lower(),
            loop="asyncio"
        )
        
if __name__ == "__main__":
    main()