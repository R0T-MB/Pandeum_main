from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..database import get_db
from ..schemas import (
    ProviderResponse, UserResponse, ProviderVerification, UserRoleUpdate,
    ReviewModerationSchema, ReviewModerationAction,
)
from ..auth import get_current_admin_user, is_super_admin
from ..models import User, Provider, Review

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
    # El super admin (fundador) tiene autoridad total sobre OTROS admins/usuarios.
    # Su propio rol de admin es PERMANENTE: no puede desactivarse a sí mismo.
    if is_super_admin(admin):
        if user.id == admin.id and role_data.is_admin is False:
            raise HTTPException(status_code=403, detail="El rol de super admin es permanente y no puedes eliminarlo")
        user.is_admin = role_data.is_admin
        db.commit()
        db.refresh(user)
        return user
    # Para el resto de administradores: no pueden modificar su propio rol...
    if user.id == admin.id:
        raise HTTPException(status_code=403, detail="No puedes modificar tu propio rol")
    # ...ni modificar el rol de otro administrador
    if user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes permisos para modificar a otro administrador")
    user.is_admin = role_data.is_admin
    db.commit()
    db.refresh(user)
    return user


def _to_moderation_schema(review: Review) -> dict:
    return {
        "id": review.id,
        "provider_id": review.provider_id,
        "user_id": review.user_id,
        "user_name": review.user.full_name or review.user.email if review.user else "Desconocido",
        "provider_name": review.provider.business_name if review.provider else "Desconocido",
        "rating": review.rating,
        "comment": review.comment,
        "fraud_risk_flags": review.fraud_risk_flags or {},
        "review_verification_status": review.review_verification_status,
        "created_at": review.created_at,
    }


@router.get("/reviews/queue", response_model=List[ReviewModerationSchema])
def get_review_queue(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Reseñas pendientes o marcadas (para revisión manual del admin)."""
    reviews = db.query(Review).filter(
        Review.review_verification_status.in_(["pending", "rejected"])
    ).order_by(Review.created_at.asc()).all()
    return [_to_moderation_schema(r) for r in reviews]


@router.put("/reviews/{review_id}/moderate", response_model=ReviewModerationSchema)
def moderate_review(
    review_id: UUID,
    action: ReviewModerationAction,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    review = db.query(Review).filter(Review.id == str(review_id)).first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    status_map = {"approve": "approved", "reject": "rejected", "pending": "pending"}
    if action.action not in status_map:
        raise HTTPException(status_code=400, detail="Acción inválida: approve|reject|pending")
    review.review_verification_status = status_map[action.action]
    db.commit()
    db.refresh(review)
    return _to_moderation_schema(review)