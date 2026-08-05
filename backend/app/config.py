from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from pathlib import Path
from typing import Optional

# Ruta ABSOLUTA al .env (backend/.env) para que se cargue sin importar
# desde qué directorio se lance uvicorn (env_file relativo falla si se
# ejecuta desde la raíz del repositorio).
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"

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
    CLERK_SYNC_SECRET: str = ""

    # Super admin (fundador): email con autoridad total sobre admins
    SUPER_ADMIN_EMAIL: Optional[str] = None

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60

    # Guest mode (usuarios sin cuenta)
    GUEST_CHAT_MAX_PER_HOUR: int = 12
    GUEST_CHAT_WINDOW_SECONDS: int = 3600

    model_config = ConfigDict(env_file=str(_ENV_FILE), extra="ignore")

settings = Settings()