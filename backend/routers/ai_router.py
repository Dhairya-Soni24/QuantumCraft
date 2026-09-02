from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from backend.ai_services import AIService

router = APIRouter(prefix="/api/v1/ai", tags=["AI Quantum Tutor"])


# -----------------------------------------------------------------------------
# Schemas: AI Chat
# -----------------------------------------------------------------------------
class ChatMessage(BaseModel):
    sender: str = Field(..., description="'user' or 'assistant'")
    text: str

class AIChatRequest(BaseModel):
    message: str = Field(..., description="Student message / question")
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="Recent conversation turns")
    circuit_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Active workspace circuit AST and counts")

class AIChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
    concept_tags: List[str] = []


# -----------------------------------------------------------------------------
# Schemas: Circuit Explainer
# -----------------------------------------------------------------------------
class AIExplainRequest(BaseModel):
    qubit_count: int = 2
    circuit_ast: List[Dict[str, Any]] = Field(..., description="List of gate operations")
    state_vector: Optional[List[List[float]]] = None
    counts: Optional[Dict[str, int]] = None

class StepDetail(BaseModel):
    step: int
    gate: str
    effect: str
    state_after: Optional[str] = None

class AIExplainResponse(BaseModel):
    title: str
    summary: str
    step_by_step: List[StepDetail]
    quantum_phenomena: List[str]
    dirac_notation: str
    key_takeaways: List[str]


# -----------------------------------------------------------------------------
# Schemas: Progressive Hint Generator
# -----------------------------------------------------------------------------
class AIHintRequest(BaseModel):
    challenge_title: str
    challenge_description: str
    target_state: Optional[str] = None
    current_circuit: Optional[Dict[str, Any]] = None

class AIHintResponse(BaseModel):
    hint: str
    suggested_gate: Optional[str] = None
    level: str = "gentle"
    conceptual_question: Optional[str] = None


# -----------------------------------------------------------------------------
# Schemas: Curriculum Recommendations
# -----------------------------------------------------------------------------
class AIRecommendRequest(BaseModel):
    completed_lessons: List[str] = []
    recent_quiz_scores: List[Dict[str, Any]] = []
    failed_challenges: List[str] = []

class NextStepItem(BaseModel):
    type: str
    lesson_id: str
    title: str

class AIRecommendResponse(BaseModel):
    recommendation_reasoning: str
    next_steps: List[NextStepItem]


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


@router.post("/explain", response_model=AIExplainResponse)
async def explain_quantum_circuit(payload: AIExplainRequest):
    """
    Analyzes circuit AST and generates a step-by-step mathematical & conceptual explanation.
    """
    try:
        res = await AIService.explain_circuit(
            circuit_ast=payload.circuit_ast,
            qubit_count=payload.qubit_count,
            state_vector=payload.state_vector,
            counts=payload.counts
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Circuit explanation failed: {str(e)}")


@router.post("/hint", response_model=AIHintResponse)
async def get_challenge_hint(payload: AIHintRequest):
    """
    Provides progressive hints for challenge tasks without spoiling direct answers.
    """
    try:
        res = await AIService.generate_hint(
            challenge_title=payload.challenge_title,
            challenge_description=payload.challenge_description,
            target_state=payload.target_state,
            current_circuit=payload.current_circuit
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hint generation failed: {str(e)}")


@router.post("/recommend", response_model=AIRecommendResponse)
async def get_learning_recommendation(payload: AIRecommendRequest):
    """
    Suggests adaptive next learning steps based on student progression.
    """
    try:
        res = await AIService.recommend_next_steps(
            completed_lessons=payload.completed_lessons,
            recent_quiz_scores=payload.recent_quiz_scores,
            failed_challenges=payload.failed_challenges
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")