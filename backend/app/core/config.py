from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "E-Commerce Platform API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    STORAGE_URL: str = ""
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_BUCKET: str = ""
    
    PAYMENT_SECRET: str = ""
    PAYMENT_WEBHOOK_SECRET: str = ""
    PAYMENT_PROVIDER: str = "simulated"
    PAYMENT_CHECKOUT_BASE_URL: str = "/api/v1/payments/checkout"
    
    WHATSAPP_NUMBER: str = ""
    SUPPORT_PHONE: str = ""
    SUPPORT_EMAIL: str = ""
    
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()