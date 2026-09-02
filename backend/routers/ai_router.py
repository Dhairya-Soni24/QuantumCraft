from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.ai_services import AIService

router = APIRouter(prefix="/api/v1/ai", tags=["AI Tutor"])

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

@router.post("/recommend", response_model=AIRecommendResponse)
async def get_learning_recommendation(payload: AIRecommendRequest):
    try:
        recommendations = await AIService.recommend_next_steps(
            completed_lessons=payload.completed_lessons,
            recent_quiz_scores=payload.recent_quiz_scores,
            failed_challenges=payload.failed_challenges
        )
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))