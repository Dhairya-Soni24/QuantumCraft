import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from backend.ai_services import AIService, chat_tutor_stream

router = APIRouter(prefix="/api/v1/ai", tags=["AI Quantum Tutor"])


# -----------------------------------------------------------------------------
# Schemas: AI Chat
# -----------------------------------------------------------------------------
class AIChatRequest(BaseModel):
    message: str = Field(..., description="Student message / question")
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Recent conversation turns")
    circuit_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Active workspace circuit AST and counts")

class AIChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
    concept_tags: List[str] = []

class StreamChatRequest(BaseModel):
    message: str = Field(..., description="Student prompt")
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Recent conversation history")
    circuit_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Active circuit AST and parameters")


# -----------------------------------------------------------------------------
# Schemas: Circuit Explanation
# -----------------------------------------------------------------------------
class ExplainCircuitRequest(BaseModel):
    qubit_count: int = Field(default=2, ge=1, le=10)
    circuit_ast: List[Dict[str, Any]] = Field(default_factory=list)
    state_vector: Optional[List[Any]] = None
    counts: Optional[Dict[str, Any]] = None

class ExplainCircuitResponse(BaseModel):
    summary: str
    step_by_step: List[str] = []
    mathematical_state: str = ""
    key_takeaways: List[str] = []


# -----------------------------------------------------------------------------
# Schemas: Challenge Hints
# -----------------------------------------------------------------------------
class ChallengeHintRequest(BaseModel):
    challenge_id: str
    current_ast: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    attempt_count: int = 1

class ChallengeHintResponse(BaseModel):
    hint_level: int
    hint: str
    suggested_gate: Optional[str] = None
    concept: str


# -----------------------------------------------------------------------------
# Schemas: Curriculum Recommendations
# -----------------------------------------------------------------------------
class RecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    completed_lessons: Optional[List[str]] = Field(default_factory=list)
    solved_challenges: Optional[List[str]] = Field(default_factory=list)

class RecommendationResponse(BaseModel):
    recommended_course_id: str
    recommended_lesson_id: str
    next_challenge_id: str
    reason: str
    focus_areas: List[str] = []


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@router.post("/chat", response_model=AIChatResponse)
async def chat_with_tutor(payload: AIChatRequest):
    """
    Interactive quantum computing AI tutor chat with live circuit context awareness.
    """
    try:
        res = await AIService.chat_tutor(
            message=payload.message,
            history=payload.history,
            circuit_context=payload.circuit_context
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Chat failed: {str(e)}")


@router.post("/chat/stream")
async def stream_chat_with_tutor(payload: StreamChatRequest):
    """
    Real-time Server-Sent Events (SSE) token streaming endpoint for the AI Quantum Tutor.
    """
    try:
        generator = chat_tutor_stream(
            message=payload.message,
            history=payload.history,
            circuit_context=payload.circuit_context
        )
        return StreamingResponse(
            generator,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Chat Stream failed: {str(e)}")


@router.post("/explain", response_model=ExplainCircuitResponse)
async def explain_circuit(payload: ExplainCircuitRequest):
    """
    Returns an intuitive and mathematical explanation of a given quantum circuit.
    """
    try:
        res = await AIService.explain_circuit(
            qubit_count=payload.qubit_count,
            circuit_ast=payload.circuit_ast,
            state_vector=payload.state_vector,
            counts=payload.counts
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Circuit explanation failed: {str(e)}")


@router.post("/hint", response_model=ChallengeHintResponse)
async def get_challenge_hint(payload: ChallengeHintRequest):
    """
    Returns progressive hints for challenges without giving away full solutions.
    """
    try:
        res = await AIService.get_challenge_hint(
            challenge_id=payload.challenge_id,
            current_ast=payload.current_ast or [],
            attempt_count=payload.attempt_count
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Challenge hint failed: {str(e)}")


@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_curriculum(payload: RecommendationRequest):
    """
    Returns adaptive learning path recommendations based on user progress.
    """
    try:
        res = await AIService.recommend_learning_path(
            user_id=payload.user_id,
            completed_lessons=payload.completed_lessons,
            solved_challenges=payload.solved_challenges
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Curriculum recommendation failed: {str(e)}")
