from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .api import auth, users, providers, ai, admin, memory
from .utils.rate_limit import limiter
from .config import settings

app = FastAPI(title="Pandeum API", version="0.1.0")

# Rate limit
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(providers.router)
app.include_router(ai.router)
app.include_router(admin.router)
app.include_router(memory.router)

@app.get("/")
def root():
    return {"message": "Pandeum API is running", "version": "0.1.0"}