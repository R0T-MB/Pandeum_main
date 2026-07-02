from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import UserResponse, UserLogin, Token, ConversationResponse
from ..auth import get_current_user
from ..models import User
from ..crud import get_user_by_id, get_user_conversations
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me")
def update_me(
    full_name: str = None,
    city: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if full_name:
        current_user.full_name = full_name
    if city:
        current_user.city = city
    db.commit()
    db.refresh(current_user)
    return {"message": "Perfil actualizado", "user": UserResponse.model_validate(current_user)}

@router.get("/me/conversations", response_model=List[ConversationResponse])
def get_my_conversations(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_conversations(db, str(current_user.id), limit)