from datetime import datetime, timedelta
from typing import Optional, Dict
import json
import urllib.request
from jose import JWTError, jwt as jose_jwt
import jwt as pyjwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jose_jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jose_jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict:
    try:
        payload = jose_jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

def verify_clerk_token(token: str) -> Optional[Dict]:
    issuer = settings.CLERK_ISSUER
    jwks_url = settings.CLERK_JWKS_URL
    if not issuer or not jwks_url:
        return None

    try:
        unverified_header = pyjwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            return None

        resp = urllib.request.urlopen(jwks_url, timeout=10)
        jwks = json.loads(resp.read())

        key_data = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                key_data = key
                break

        if not key_data:
            return None

        from jwt.algorithms import RSAAlgorithm
        public_key = RSAAlgorithm.from_jwk(json.dumps(key_data))

        payload = pyjwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False}
        )
        return payload
    except Exception:
        return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials

    try:
        payload = jose_jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") == "access":
            user_id: str = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return user
    except JWTError:
        pass

    clerk_payload = verify_clerk_token(token)
    if clerk_payload:
        clerk_user_id = clerk_payload.get("sub")
        if not clerk_user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de Clerk inválido: sin sub")

        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if user:
            return user

        email = clerk_payload.get("email") or clerk_payload.get("email_address")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No se pudo obtener email del token de Clerk"
            )

        full_name = clerk_payload.get("name")
        email_verified = clerk_payload.get("email_verified", False)

        existing = db.query(User).filter(User.email == email).first()
        if existing and not existing.clerk_user_id:
            existing.clerk_user_id = clerk_user_id
            existing.email_verified = email_verified
            if full_name:
                existing.full_name = full_name
            db.commit()
            db.refresh(existing)
            return existing

        user = User(
            clerk_user_id=clerk_user_id,
            email=email,
            full_name=full_name,
            email_verified=email_verified,
            account_type="client",
            is_provider=False,
            is_admin=False,
            password_hash=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador")
    return current_user