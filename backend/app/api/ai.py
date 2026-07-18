from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import ProblemRequest, AISolveResponse
from ..ai_engine import AIEngine
from ..auth import get_current_user, get_current_active_user
from ..models import User
from ..crud import get_user_memory, save_conversation, add_to_waiting_list, get_external_resources, get_user_conversations
from typing import Optional

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/solve", response_model=AISolveResponse)
async def solve_problem(
    request: ProblemRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # opcional
):
    user_id = str(current_user.id) if current_user else None
    
    # Obtener memoria contextual si usuario autenticado
    memory_context = None
    if user_id:
        memory = get_user_memory(db, user_id)
        if memory:
            memory_context = memory.context_data
    
    # Obtener conversaciones recientes para contexto de follow-up
    conversation_context = None
    if user_id:
        recent_conversations = get_user_conversations(db, user_id, limit=3)
        if recent_conversations:
            conversation_context = [
                {
                    "problem_text": conv.problem_text,
                    "ai_response": conv.ai_response
                }
                for conv in recent_conversations
            ]
    
    # Llamar al motor IA
    result = await AIEngine.solve_problem(
        problem=request.problem,
        user_location=request.user_location,
        budget=request.budget,
        db=db,
        user_id=user_id,
        memory_context=memory_context,
        conversation_context=conversation_context
    )
    
    # Normalizar fallback para asegurar que sea dict
    fallback = result.get("fallback")
    if not isinstance(fallback, dict):
        fallback = {
            "message": str(fallback) if fallback else None,
            "waitlist_enabled": False
        }
        result["fallback"] = fallback
    
    # Guardar conversación si usuario autenticado
    if user_id:
        # Calcular category de forma segura
        diagnosis = result.get("diagnosis") or {}
        possible_causes = diagnosis.get("possible_causes") or []
        
        if possible_causes:
            category = possible_causes[0]
        else:
            category = result.get("response_mode") or "unknown"
        
        conv = save_conversation(
            db=db,
            user_id=user_id,
            problem_text=request.problem,
            ai_response=result,
            confidence_score=result.get("confidence_score", 0.5),
            category=category,
            urgency=result.get("urgency", "medium")
        )
        result["conversation_id"] = conv.id
    
    # Si no hay proveedores y hay fallback con waitlist, añadir a lista de espera
    if not result.get("has_providers") and fallback.get("waitlist_enabled") and user_id:
        # Calcular problem_category de forma segura
        diagnosis = result.get("diagnosis") or {}
        possible_causes = diagnosis.get("possible_causes") or []
        
        if possible_causes:
            problem_category = possible_causes[0]
        else:
            problem_category = result.get("response_mode") or "unknown"
        
        add_to_waiting_list(
            db=db,
            user_id=user_id,
            problem_category=problem_category
        )
        # Añadir guías externas
        external = get_external_resources(db, category="general")  # simplificado
        if external:
            result["fallback"]["guides"] = [{"title": r.title, "url": r.url} for r in external]
    
    return result

@router.post("/explore")
async def explore_mode(
    request: ProblemRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    # Modo exploración no guarda conversación igual, solo devuelve ideas
    result = await AIEngine.explore_mode(
        problem=request.problem,
        budget=request.budget
    )
    return result