from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import MemoryUpdate, MemoryResponse
from ..auth import get_current_user
from ..models import User
from ..crud import get_user_memory, update_user_memory

router = APIRouter(prefix="/memory", tags=["memory"])

@router.get("/", response_model=MemoryResponse)
def get_memory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = get_user_memory(db, str(current_user.id))
    if not memory:
        return {
            "user_id": current_user.id,
            "context_data": {},
            "updated_at": current_user.created_at
        }
    return memory

@router.post("/", response_model=MemoryResponse)
def update_memory(
    memory_data: MemoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = update_user_memory(db, str(current_user.id), memory_data.context_data)
    return {
        "user_id": current_user.id,
        "context_data": memory.context_data,
        "updated_at": memory.updated_at
    }