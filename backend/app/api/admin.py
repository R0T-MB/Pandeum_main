from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..database import get_db
from ..schemas import ProviderResponse, UserResponse, ProviderVerification, UserRoleUpdate
from ..auth import get_current_admin_user
from ..models import User, Provider

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/providers/pending", response_model=List[ProviderResponse])
def get_pending_providers(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    providers = db.query(Provider).filter(Provider.verification_status == "pending").all()
    return providers

@router.put("/providers/{provider_id}/verify", response_model=ProviderResponse)
def verify_provider(
    provider_id: UUID,
    verification: ProviderVerification,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    provider = db.query(Provider).filter(Provider.id == str(provider_id)).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    provider.verification_status = verification.verification_status
    db.commit()
    db.refresh(provider)
    return provider

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    return db.query(User).all()

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: UUID,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == str(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_admin = role_data.is_admin
    db.commit()
    db.refresh(user)
    return user