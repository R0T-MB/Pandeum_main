from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Gemini
    GEMINI_API_KEY: str

    # OpenRouter (fallback AI - optional)
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "openai/gpt-3.5-turbo"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60

    model_config = ConfigDict(env_file=".env")

settings = Settings()