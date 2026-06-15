from fastapi import Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
from jose import JWTError
from .database import get_db
from .auth import decode_token
from .models import User

def get_db_session():
    return Depends(get_db)

def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization:
        return None
    
    if not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except (JWTError, AttributeError):
        return None