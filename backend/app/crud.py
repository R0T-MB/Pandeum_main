from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import User, Provider, Review, UserMemory, Conversation, WaitingList, ExternalResource
from .schemas import UserRegister, ProviderCreate
from .auth import get_password_hash
from uuid import UUID
from typing import Optional

def create_user(db: Session, user_data: UserRegister, is_provider=False, is_admin=False) -> User:
    hashed_pw = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        password_hash=hashed_pw,
        full_name=user_data.full_name,
        city=user_data.city,
        is_provider=is_provider,
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def create_provider(db: Session, user_id: str, provider_data: ProviderCreate) -> Provider:
    # Primero marcar al usuario como provider
    user = get_user_by_id(db, user_id)
    if user:
        user.is_provider = True
    db_provider = Provider(
        id=user_id,
        **provider_data.dict(exclude_unset=True)
    )
    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)
    return db_provider

def get_provider_rating(db: Session, provider_id: UUID) -> float:
    result = db.query(func.avg(Review.rating)).filter(Review.provider_id == provider_id).scalar()
    return float(result) if result else 0.0

def get_provider_review_count(db: Session, provider_id: UUID) -> int:
    return db.query(func.count(Review.id)).filter(Review.provider_id == provider_id).scalar() or 0

def get_user_memory(db: Session, user_id: str) -> Optional[UserMemory]:
    return db.query(UserMemory).filter(UserMemory.user_id == user_id).first()

def update_user_memory(db: Session, user_id: str, new_context: dict):
    memory = get_user_memory(db, user_id)
    if memory:
        memory.context_data.update(new_context)
        memory.updated_at = func.now()
    else:
        memory = UserMemory(user_id=user_id, context_data=new_context)
        db.add(memory)
    db.commit()
    return memory

def add_to_waiting_list(db: Session, user_id: str, problem_category: str, subcategory: str = None):
    entry = WaitingList(
        user_id=user_id,
        problem_category=problem_category,
        subcategory=subcategory
    )
    db.add(entry)
    db.commit()
    return entry

def get_external_resources(db: Session, category: str, limit=3):
    return db.query(ExternalResource).filter(ExternalResource.category == category).limit(limit).all()

def save_conversation(db: Session, user_id: str, problem_text: str, ai_response: dict, confidence_score: float, category: str, urgency: str):
    conv = Conversation(
        user_id=user_id,
        problem_text=problem_text,
        ai_response=ai_response,
        ai_confidence_score=confidence_score,
        category=category,
        urgency=urgency
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

def get_user_conversations(db: Session, user_id: str, limit: int = 10):
    return db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()).limit(limit).all()

def get_conversation_by_id(db: Session, conversation_id: str, user_id: str):
    return db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()

def get_user_by_clerk_id(db: Session, clerk_user_id: str) -> Optional[User]:
    return db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

def get_or_create_user_from_clerk(
    db: Session,
    clerk_user_id: str,
    email: str,
    full_name: Optional[str] = None,
    email_verified: bool = False,
    account_type: str = "client",
    business_name: Optional[str] = None
) -> User:
    user = get_user_by_clerk_id(db, clerk_user_id)
    if user:
        changed = False
        if user.email != email:
            user.email = email
            changed = True
        if full_name and user.full_name != full_name:
            user.full_name = full_name
            changed = True
        if user.email_verified != email_verified:
            user.email_verified = email_verified
            changed = True
        if user.account_type != account_type:
            user.account_type = account_type
            user.is_provider = (account_type == "provider")
            user.is_admin = (account_type == "admin")
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
        return user

    user = get_user_by_email(db, email)
    if user and not user.clerk_user_id:
        user.clerk_user_id = clerk_user_id
        user.email_verified = email_verified
        user.account_type = account_type
        user.is_provider = (account_type == "provider")
        user.is_admin = (account_type == "admin")
        if full_name:
            user.full_name = full_name
        db.commit()
        db.refresh(user)

        if account_type == "provider":
            _ensure_provider_exists(db, user, business_name)
        return user

    user = User(
        clerk_user_id=clerk_user_id,
        email=email,
        full_name=full_name,
        email_verified=email_verified,
        account_type=account_type,
        is_provider=(account_type == "provider"),
        is_admin=(account_type == "admin"),
        password_hash=None
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if account_type == "provider":
        _ensure_provider_exists(db, user, business_name)
    return user

def _ensure_provider_exists(db: Session, user: User, business_name: Optional[str] = None):
    existing = db.query(Provider).filter(Provider.id == user.id).first()
    if existing:
        return
    provider = Provider(
        id=user.id,
        business_name=business_name or user.full_name or "Negocio sin nombre",
        category="General",
        verification_status="pending",
        available_now=False
    )
    db.add(provider)
    db.commit()