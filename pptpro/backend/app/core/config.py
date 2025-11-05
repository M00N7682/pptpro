"""
Application configuration
"""
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # 기본 설정
    PROJECT_NAME: str = "PPT Pro"
    VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # 데이터베이스
    DATABASE_URL: str = Field(
        default="sqlite:///./pptpro.db",
        description="Database URL (SQLite for dev, PostgreSQL for prod)"
    )
    
    # JWT 설정
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        description="JWT secret key"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS 설정
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins"
    )
    
    # LLM 설정
    OPENAI_API_KEY: str = Field(
        default="",
        description="OpenAI API key"
    )
    
    # 파일 업로드
    MAX_FILE_SIZE_MB: int = 50
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 전역 설정 인스턴스
settings = Settings()