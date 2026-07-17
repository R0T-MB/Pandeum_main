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