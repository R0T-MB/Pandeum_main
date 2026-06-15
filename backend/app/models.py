from sqlalchemy import Column, String, Integer, Boolean, DateTime, Float, Numeric, JSON, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    oauth_provider = Column(String, nullable=True)
    oauth_id = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    city = Column(String, nullable=True)
    is_provider = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    provider = relationship("Provider", back_populates="user", uselist=False)
    reviews = relationship("Review", foreign_keys="Review.user_id", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")
    user_memory = relationship("UserMemory", back_populates="user", uselist=False)

class Provider(Base):
    __tablename__ = "providers"

    id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    business_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    subcategory = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    verification_status = Column(String, default="pending")
    trust_score = Column(Float, default=0.0)
    trust_factors = Column(JSON, default={})
    price_min = Column(Integer, nullable=True)
    price_max = Column(Integer, nullable=True)
    location_lat = Column(Numeric(10,7), nullable=True)
    location_lng = Column(Numeric(10,7), nullable=True)
    availability_json = Column(JSON, default={})
    portfolio = Column(JSON, default=[])
    response_time_hours = Column(Float, default=None)
    available_now = Column(Boolean, default=False)
    cases_resolved_similar = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="provider")
    services = relationship("Service", back_populates="provider")
    reviews = relationship("Review", foreign_keys="Review.provider_id", back_populates="provider")
    favorites = relationship("Favorite", back_populates="provider")
    case_histories = relationship("CaseHistory", back_populates="provider")

class Service(Base):
    __tablename__ = "services"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    provider_id = Column(UUID(as_uuid=False), ForeignKey("providers.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    price_estimate = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    provider = relationship("Provider", back_populates="services")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"))
    provider_id = Column(UUID(as_uuid=False), ForeignKey("providers.id", ondelete="CASCADE"), index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewer_ip = Column(String, nullable=True)
    reviewer_user_agent = Column(String, nullable=True)
    fraud_risk_flags = Column(JSON, default={})
    review_verification_status = Column(String, default="pending")

    user = relationship("User", foreign_keys=[user_id])
    provider = relationship("Provider", foreign_keys=[provider_id])

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    problem_text = Column(Text, nullable=False)
    ai_response = Column(JSON, nullable=False)
    ai_confidence_score = Column(Float, nullable=True)
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    urgency = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="conversations")
    feedback = relationship("RecommendationFeedback", back_populates="conversation")

class CaseHistory(Base):
    __tablename__ = "case_history"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"))
    provider_id = Column(UUID(as_uuid=False), ForeignKey("providers.id", ondelete="SET NULL"))
    conversation_id = Column(UUID(as_uuid=False), ForeignKey("conversations.id", ondelete="SET NULL"))
    problem_text = Column(Text, nullable=True)
    diagnosis = Column(JSON, nullable=True)
    instant_solutions_attempted = Column(JSON, default=[])
    chosen_solution_type = Column(String, nullable=True)
    resolution_status = Column(String, nullable=True)
    resolution_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    provider = relationship("Provider", back_populates="case_histories")
    user = relationship("User")
    resolution_metrics = relationship("ResolutionMetric", back_populates="case_history", uselist=False)

class ResolutionMetric(Base):
    __tablename__ = "resolution_metrics"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    case_history_id = Column(UUID(as_uuid=False), ForeignKey("case_history.id", ondelete="CASCADE"), unique=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"))
    first_contact_at = Column(DateTime(timezone=True), nullable=True)
    solution_reported_at = Column(DateTime(timezone=True), nullable=True)
    time_to_solution_hours = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case_history = relationship("CaseHistory", back_populates="resolution_metrics")

class Favorite(Base):
    __tablename__ = "favorites"
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    provider_id = Column(UUID(as_uuid=False), ForeignKey("providers.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="favorites")
    provider = relationship("Provider", back_populates="favorites")

class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    conversation_id = Column(UUID(as_uuid=False), ForeignKey("conversations.id", ondelete="CASCADE"))
    provider_id = Column(UUID(as_uuid=False), ForeignKey("providers.id", ondelete="CASCADE"))
    user_clicked = Column(Boolean, default=False)
    user_hired = Column(Boolean, default=False)
    review_left = Column(Boolean, default=False)
    user_returned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="feedback")
    provider = relationship("Provider")

class WaitingList(Base):
    __tablename__ = "waiting_list"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"))
    problem_category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    notified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserMemory(Base):
    __tablename__ = "user_memory"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    context_data = Column(JSON, default={})
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="user_memory")

class ExternalResource(Base):
    __tablename__ = "external_resources"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    resource_type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())