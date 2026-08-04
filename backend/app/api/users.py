from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import (
    UserResponse, UserLogin, Token, ConversationResponse,
    AccountRoleUpdate, ConvertToProviderRequest, AccountDeleteRequest
)
from ..auth import get_current_user
from ..models import User
from ..crud import (
    get_user_by_id, get_user_conversations, get_conversation_by_id,
    switch_user_role, convert_to_provider, delete_user_account
)
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

@router.get("/me/conversations/{conversation_id}", response_model=ConversationResponse)
def get_my_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = get_conversation_by_id(db, conversation_id, str(current_user.id))
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return conv

@router.put("/me/role", response_model=UserResponse)
def update_my_role(
    payload: AccountRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        updated = switch_user_role(db, current_user, payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Rol no válido. Usa 'client' o 'provider'.")
    return updated

@router.post("/me/convert-to-provider", response_model=UserResponse)
def convert_my_account_to_provider(
    payload: ConvertToProviderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.is_provider:
        raise HTTPException(status_code=400, detail="Ya eres un proveedor")
    updated = convert_to_provider(db, current_user, business_name=payload.business_name)
    return updated

@router.delete("/me", response_model=dict)
def delete_my_account(
    payload: AccountDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.confirm_email.lower() != current_user.email.lower():
        raise HTTPException(status_code=400, detail="El correo de confirmación no coincide con tu cuenta.")
    delete_user_account(db, current_user)
    return {"message": "Cuenta eliminada permanentemente."}