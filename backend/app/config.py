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
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # OpenRouter (fallback AI - optional)
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "openai/gpt-3.5-turbo"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Clerk
    CLERK_ISSUER: Optional[str] = None
    CLERK_JWKS_URL: Optional[str] = None
    CLERK_SYNC_SECRET: Optional[str] = None

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60

    # Guest mode (usuarios sin cuenta)
    GUEST_CHAT_MAX_PER_HOUR: int = 12
    GUEST_CHAT_WINDOW_SECONDS: int = 3600

    model_config = ConfigDict(env_file=".env")

settings = Settings()