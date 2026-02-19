from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Any, List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Clinical Research Knowledge Hub"
    DEBUG: bool = False

    # ── Database (AWS RDS - MySQL) ────────────────────────────────────────────
    # ADD YOUR RDS ENDPOINT BELOW (e.g. mydb.xxxx.us-east-1.rds.amazonaws.com)
    MYSQL_HOST: str = "YOUR_RDS_ENDPOINT_HERE"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "admin"
    MYSQL_PASSWORD: str = "your_db_password"
    MYSQL_DATABASE: str = "research_hub"

    # ── Redis (Amazon ElastiCache) ────────────────────────────────────────────
    # ADD YOUR ELASTICACHE ENDPOINT BELOW (e.g. myredis.xxxx.cache.amazonaws.com)
    REDIS_HOST: str = "YOUR_ELASTICACHE_ENDPOINT_HERE"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-this-to-a-long-random-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    # ── Pinecone ──────────────────────────────────────────────────────────────
    PINECONE_API_KEY: str = "your_pinecone_api_key"
    PINECONE_INDEX_NAME: str = "research-hub"

    # ── Groq ──────────────────────────────────────────────────────────────────
    GROQ_API_KEY: str = "your_groq_api_key"
    GROQ_MODEL: str = "llama-3.1-70b-versatile"

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Using Any so pydantic-settings passes the raw string to our validator
    # instead of trying to JSON-decode it first (which breaks comma-separated values).
    CORS_ORIGINS: Any = ["http://localhost:5173", "http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            # Accept JSON array syntax: ["http://...","http://..."]
            if v.startswith("["):
                import json
                return json.loads(v)
            # Accept comma-separated: http://...,http://...
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
