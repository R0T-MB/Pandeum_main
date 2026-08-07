from fastapi import APIRouter, Depends, HTTPException, Query, Request
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from ..schemas import ProviderCreate, ProviderUpdate, ProviderResponse, ProviderPublicResponse, ReviewCreate, ReviewResponse, FavoriteResponse, ServiceCreate, ServiceUpdate, ServiceResponse, ProviderResubmitRequest
from ..auth import get_current_user, get_current_admin_user
from ..models import User, Provider, Review, Favorite, Service
from ..crud import create_provider, get_provider_rating, get_provider_review_count
from ..moderation import review_decision
from ..provider_moderation import apply_moderation
from ..config import settings

router = APIRouter(prefix="/providers", tags=["providers"])

def _cooldown_remaining(provider: Provider) -> int:
    """Segundos que faltan para poder re-solicitar (0 si ya puede)."""
    if not provider.rejected_at:
        return 0
    rejected = provider.rejected_at
    if getattr(rejected, "tzinfo", None) is None:
        rejected = rejected.replace(tzinfo=timezone.utc)
    cooldown = settings.PROVIDER_RESUBMIT_COOLDOWN_HOURS * 3600
    remaining = cooldown - int((datetime.now(timezone.utc) - rejected).total_seconds())
    return max(0, remaining)

def _provider_payload(provider: Provider, db: Session) -> dict:
    return {
        **provider.__dict__,
        "user": provider.user,
        "rating": get_provider_rating(db, provider.id),
        "review_count": get_provider_review_count(db, provider.id),
        "can_apply": provider.verification_status != "rejected" or _cooldown_remaining(provider) == 0,
        "cooldown_seconds": _cooldown_remaining(provider) if provider.verification_status == "rejected" else 0,
    }

@router.post("/register", response_model=ProviderResponse)
def register_provider(
    provider_data: ProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.is_provider:
        raise HTTPException(status_code=400, detail="Ya eres un proveedor")
    provider = create_provider(db, str(current_user.id), provider_data)

    # Filtro automático anti negocios de mala intención: analiza los datos de
    # registro y, si hay señales claras (spam/PII/categoría prohibida), el
    # proveedor queda bloqueado automáticamente sin pasar a revisión manual.
    apply_moderation(
        provider,
        business_name=provider_data.business_name,
        description=provider_data.description,
        category=provider_data.category,
    )
    db.commit()
    db.refresh(provider)
    return _provider_payload(provider, db)

@router.post("/resubmit", response_model=ProviderResponse)
def resubmit_provider_request(
    resubmit_data: ProviderResubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Re-solicitud explícita de revisión tras un rechazo (cooldown de 72h)."""
    if not current_user.is_provider:
        raise HTTPException(status_code=403, detail="No eres proveedor")
    provider = db.query(Provider).filter(Provider.id == str(current_user.id)).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Perfil de proveedor no encontrado")
    if provider.verification_status != "rejected":
        raise HTTPException(status_code=400, detail="No hay una solicitud rechazada para re-enviar")
    remaining = _cooldown_remaining(provider)
    if remaining > 0:
        raise HTTPException(
            status_code=429,
            detail="Debes esperar para corregir tu solicitud según las normativas de Pandeum",
            headers={"Retry-After": str(remaining)},
        )
    # Reenvío: vuelve a la cola de revisión y guarda la nota de correcciones del proveedor
    provider.verification_status = "pending"
    provider.rejection_category = None
    provider.rejection_reason = None
    provider.rejected_at = None
    if resubmit_data.correction_note:
        trust_factors = provider.trust_factors or {}
        trust_factors["last_correction_note"] = resubmit_data.correction_note.strip()
        provider.trust_factors = trust_factors
    # Reaplica el filtro: si aún contiene datos de mala intención, no entra a revisión.
    apply_moderation(
        provider,
        business_name=provider.business_name,
        description=provider.description,
        category=provider.category,
    )
    db.commit()
    db.refresh(provider)
    return _provider_payload(provider, db)

@router.get("/", response_model=List[ProviderResponse])
def list_providers(
    category: Optional[str] = Query(None),
    subcategory: Optional[str] = Query(None),
    verified_only: bool = Query(True),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
    
):
    query = db.query(Provider)
    if category:
        query = query.filter(Provider.category == category)
    if subcategory:
        query = query.filter(Provider.subcategory == subcategory)
    if verified_only:
        query = query.filter(Provider.verification_status == "verified")
    providers = query.order_by(Provider.trust_score.desc()).limit(limit).all()
    result = []
    for p in providers:
        rating = get_provider_rating(db, p.id)
        review_count = get_provider_review_count(db, p.id)

        item = {
            **p.__dict__,
            "user": p.user,
            "rating": rating,
            "review_count": review_count
        }

        result.append(item)

    return result

@router.get("/{provider_id}", response_model=ProviderPublicResponse)
def get_provider(provider_id: UUID, db: Session = Depends(get_db)):
    provider = db.query(Provider).filter(Provider.id == str(provider_id)).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    rating = get_provider_rating(db, provider.id)
    review_count = get_provider_review_count(db, provider.id)
    services = db.query(Service).filter(
        Service.provider_id == str(provider_id),
        Service.is_active == True
    ).order_by(Service.created_at.desc()).all()

    data = {
        **provider.__dict__,
        "user": provider.user,
        "rating": rating,
        "review_count": review_count,
        "services": services,
        "can_apply": provider.verification_status != "rejected" or _cooldown_remaining(provider) == 0,
        "cooldown_seconds": _cooldown_remaining(provider) if provider.verification_status == "rejected" else 0,
    }

    return data

@router.put("/me", response_model=ProviderResponse)
def update_my_provider(
    update_data: ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_provider:
        raise HTTPException(status_code=403, detail="No eres proveedor")
    provider = db.query(Provider).filter(Provider.id == str(current_user.id)).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Perfil de proveedor no encontrado")
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(provider, key, value)

    # Reaplica el filtro anti mala intención sobre los datos editados.
    apply_moderation(
        provider,
        business_name=provider.business_name,
        description=provider.description,
        category=provider.category,
    )
    db.commit()
    db.refresh(provider)
    return _provider_payload(provider, db)

@router.post("/{provider_id}/reviews", response_model=ReviewResponse)
def create_or_update_review(
    provider_id: UUID,
    review_data: ReviewCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    provider = db.query(Provider).filter(Provider.id == str(provider_id)).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    if str(current_user.id) == str(provider.id):
        raise HTTPException(status_code=400, detail="No puedes reseñar tu propio perfil")

    # Moderación automática: decide estado (approved/pending/rejected) y flags
    decision = review_decision(review_data.comment or "", db, current_user)

    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.provider_id == str(provider_id)
    ).first()

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    if existing:
        existing.rating = review_data.rating
        existing.comment = review_data.comment
        existing.reviewer_ip = ip
        existing.reviewer_user_agent = ua
        existing.fraud_risk_flags = decision["flags"]
        existing.review_verification_status = decision["status"]
        db.commit()
        db.refresh(existing)
        review = existing
    else:
        review = Review(
            user_id=current_user.id,
            provider_id=str(provider_id),
            rating=review_data.rating,
            comment=review_data.comment,
            reviewer_ip=ip,
            reviewer_user_agent=ua,
            fraud_risk_flags=decision["flags"],
            review_verification_status=decision["status"]
        )
        db.add(review)
        db.commit()
        db.refresh(review)

    return {
        "id": review.id,
        "user_id": current_user.id,
        "user_name": current_user.full_name or current_user.email,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
    }

@router.get("/{provider_id}/reviews", response_model=List[ReviewResponse])
def get_provider_reviews(provider_id: UUID, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(
        Review.provider_id == str(provider_id),
        Review.review_verification_status == "approved"
    ).order_by(Review.created_at.desc()).all()
    result = []
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        user_name = user.full_name or user.email if user else "Usuario eliminado"
        result.append({
            "id": r.id,
            "user_id": r.user_id,
            "user_name": user_name,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
        })
    return result

@router.post("/{provider_id}/favorite")
def add_favorite(
    provider_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.provider_id == str(provider_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya en favoritos")
    fav = Favorite(user_id=current_user.id, provider_id=str(provider_id))
    db.add(fav)
    db.commit()
    return {"message": "Añadido a favoritos"}

@router.delete("/{provider_id}/favorite")
def remove_favorite(
    provider_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.provider_id == str(provider_id)
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="No estaba en favoritos")
    db.delete(fav)
    db.commit()
    return {"message": "Eliminado de favoritos"}

@router.get("/me/favorites", response_model=List[FavoriteResponse])
def get_my_favorites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    result = []
    for fav in favs:
        provider = db.query(Provider).filter(Provider.id == fav.provider_id).first()
        if provider:
            result.append({
                "provider_id": provider.id,
                "provider_name": provider.business_name,
                "created_at": fav.created_at
            })
    return result

# ========== Service Management ==========

@router.get("/me/services", response_model=List[ServiceResponse])
def list_my_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_provider:
        raise HTTPException(status_code=403, detail="No eres proveedor")
    services = db.query(Service).filter(
        Service.provider_id == str(current_user.id)
    ).order_by(Service.created_at.desc()).all()
    return services

@router.post("/me/services", response_model=ServiceResponse, status_code=201)
def create_my_service(
    service_data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_provider:
        raise HTTPException(status_code=403, detail="No eres proveedor")
    service = Service(
        provider_id=str(current_user.id),
        **service_data.dict()
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.put("/me/services/{service_id}", response_model=ServiceResponse)
def update_my_service(
    service_id: UUID,
    service_data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_provider:
        raise HTTPException(status_code=403, detail="No eres proveedor")
    service = db.query(Service).filter(Service.id == str(service_id)).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if service.provider_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="No puedes modificar un servicio que no te pertenece")
    for key, value in service_data.dict(exclude_unset=True).items():
        setattr(service, key, value)
    db.commit()
    db.refresh(service)
    return service

@router.delete("/me/services/{service_id}")
def deactivate_my_service(
    service_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_provider:
        raise HTTPException(status_code=403, detail="No eres proveedor")
    service = db.query(Service).filter(Service.id == str(service_id)).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if service.provider_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="No puedes eliminar un servicio que no te pertenece")
    service.is_active = False
    db.commit()
    return {"message": "Servicio desactivado correctamente"}
