from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# ========== Auth ==========
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    city: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuth(BaseModel):
    token: str  # Google ID token

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str]
    city: Optional[str]
    is_provider: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ========== Provider ==========
class ProviderBase(BaseModel):
    business_name: str
    category: str  # Technology, Education, Home Services
    subcategory: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    availability_json: Optional[Dict] = {}
    portfolio: Optional[List[str]] = []
    response_time_hours: Optional[float] = None
    available_now: Optional[bool] = False

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(ProviderBase):
    pass

class ProviderResponse(ProviderBase):
    id: UUID
    verification_status: str
    trust_score: float
    trust_factors: Dict
    cases_resolved_similar: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    rating: Optional[float] = 0

    class Config:
        from_attributes = True

# ========== AI ==========
class ProblemRequest(BaseModel):
    problem: str
    user_location: Optional[str] = None
    budget: Optional[int] = None

class DiagnosisItem(BaseModel):
    possible_causes: List[str]
    questions: Optional[List[str]] = None

class InstantSolution(BaseModel):
    steps: List[str]

class ProviderRecommendation(BaseModel):
    provider_id: UUID
    business_name: str
    trust_score: float
    rating: float  # promedio de reseñas
    distance_km: Optional[float] = None
    reason_bullets: List[str]
    estimated_cost: Optional[str] = None
    available_now: bool
    response_time_hours: Optional[float] = None

class CompositeStep(BaseModel):
    role: str
    description: str
    providers: List[ProviderRecommendation] = []
    product: Optional[str] = None

class CompositeSolution(BaseModel):
    type: str = "composite"
    name: str
    steps: List[CompositeStep]

class AISolveResponse(BaseModel):
    confidence_score: float
    diagnosis: DiagnosisItem
    instant_solutions: List[str]
    has_providers: bool
    providers: List[ProviderRecommendation] = []
    composite_solution: Optional[CompositeSolution] = None
    fallback: Optional[Dict] = None  # para Plan B

# ========== Reviews ==========
class ReviewCreate(BaseModel):
    provider_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    rating: int
    comment: Optional[str]
    created_at: datetime
    review_verification_status: str

    class Config:
        from_attributes = True

# ========== Favorites ==========
class FavoriteResponse(BaseModel):
    provider_id: UUID
    provider_name: str
    created_at: datetime

# ========== Conversation History ==========
class ConversationResponse(BaseModel):
    id: UUID
    problem_text: str
    ai_response: Dict
    ai_confidence_score: Optional[float]
    category: Optional[str]
    urgency: Optional[str]
    created_at: datetime

# ========== Memory ==========
class MemoryUpdate(BaseModel):
    context_data: Dict[str, Any]

class MemoryResponse(BaseModel):
    user_id: UUID
    context_data: Dict
    updated_at: datetime

# ========== Admin ==========
class ProviderVerification(BaseModel):
    verification_status: str  # 'verified', 'rejected'

class UserRoleUpdate(BaseModel):
    is_admin: bool