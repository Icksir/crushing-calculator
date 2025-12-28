import os
from pydantic_settings import BaseSettings
from enum import Enum

class Environment(str, Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"

class Settings(BaseSettings):
    # Ambiente
    environment: Environment = Environment.DEVELOPMENT
        
    # Servidor
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    NGINX_PORT: int = 80
    
    # Logging
    log_level: str = "INFO"

    database_url: str = "postgresql+asyncpg://usuario:password@localhost:5432/nombre_db"
    
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    # CORS
    cors_origins: str = "http://localhost:8080,https://kamaskope.icksir.com" 
    
    @property
    def cors_origins_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(',')]
        return origins

    class Config:
        env_file = ".env"
        case_sensitive = False

class DevelopmentSettings(Settings):
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = True
    log_level: str = "DEBUG"

class ProductionSettings(Settings):
    environment: Environment = Environment.PRODUCTION
    debug: bool = False
    log_level: str = "WARNING"

def get_settings() -> Settings:
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    else:
        return DevelopmentSettings()

env_settings = get_settings()