from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from ..schemas import UserRegister, UserLogin, Token, TokenRefresh, UserResponse, GoogleAuth
from ..models import User
from ..auth import (
    verify_password, create_access_token, create_refresh_token,
    decode_token, get_password_hash, get_current_user
)
from ..config import settings
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    hashed = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed,
        full_name=user_data.full_name,
        city=user_data.city
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not user.password_hash or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
def refresh(token_data: TokenRefresh):
    payload = decode_token(token_data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token inválido")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario inválido")
    new_access = create_access_token(data={"sub": user_id})
    new_refresh = create_refresh_token(data={"sub": user_id})
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}

@router.post("/google", response_model=Token)
async def google_auth(google_data: GoogleAuth, db: Session = Depends(get_db)):
    # Verificar token con Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={google_data.token}")
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Token de Google inválido")
        info = resp.json()
        email = info.get("email")
        name = info.get("name")
        if not email:
            raise HTTPException(status_code=401, detail="Email no proporcionado por Google")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=name,
            oauth_provider="google",
            oauth_id=info.get("sub")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}