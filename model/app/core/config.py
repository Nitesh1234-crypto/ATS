from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    
    # Server settings
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["*"]
    
    # ML model settings
    MODEL_NAME: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    # Scoring weights
    KEYWORD_MATCH_WEIGHT: float = 0.40
    SKILLS_WEIGHT: float = 0.25
    EXPERIENCE_WEIGHT: float = 0.15
    EDUCATION_WEIGHT: float = 0.10
    FORMATTING_WEIGHT: float = 0.10
    
    # Thresholds
    MIN_CONFIDENCE: float = 0.7
    SIMILARITY_THRESHOLD: float = 0.6
    
    # File processing
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    SUPPORTED_FORMATS: List[str] = [".pdf", ".docx", ".doc", ".txt"]
    
    # Redis settings (for caching)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
