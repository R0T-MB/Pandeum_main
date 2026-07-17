from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from ..schemas import ProviderCreate, ProviderUpdate, ProviderResponse, ProviderPublicResponse, ReviewCreate, ReviewResponse, FavoriteResponse, ServiceCreate, ServiceUpdate, ServiceResponse
from ..auth import get_current_user, get_current_admin_user
from ..models import User, Provider, Review, Favorite, Service
from ..crud import create_provider, get_provider_rating, get_provider_review_count

router = APIRouter(prefix="/providers", tags=["providers"])

@router.post("/register", response_model=ProviderResponse)
def register_provider(
    provider_data: ProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.is_provider:
        raise HTTPException(status_code=400, detail="Ya eres un proveedor")
    provider = create_provider(db, str(current_user.id), provider_data)
    return provider

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
        "services": services
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
    db.commit()
    db.refresh(provider)
    rating = get_provider_rating(db, provider.id)
    review_count = get_provider_review_count(db, provider.id)
    return {
        **provider.__dict__,
        "user": provider.user,
        "rating": rating,
        "review_count": review_count
}

@router.post("/{provider_id}/reviews", response_model=ReviewResponse)
def create_or_update_review(
    provider_id: UUID,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    provider = db.query(Provider).filter(Provider.id == str(provider_id)).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    if str(current_user.id) == str(provider.id):
        raise HTTPException(status_code=400, detail="No puedes reseñar tu propio perfil")

    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.provider_id == str(provider_id)
    ).first()

    if existing:
        existing.rating = review_data.rating
        existing.comment = review_data.comment
        db.commit()
        db.refresh(existing)
        review = existing
    else:
        review = Review(
            user_id=current_user.id,
            provider_id=str(provider_id),
            rating=review_data.rating,
            comment=review_data.comment,
            review_verification_status="pending"
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
        Review.provider_id == str(provider_id)
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
