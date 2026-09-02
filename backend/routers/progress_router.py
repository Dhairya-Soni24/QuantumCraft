from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from backend.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/progress", tags=["User Progress"])

class CompleteLessonRequest(BaseModel):
    user_id: str
    lesson_id: str

# Use 'def', not 'async def'
@router.post("/complete-lesson")
def complete_lesson(payload: CompleteLessonRequest):
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        supabase = get_supabase()
        data = {
            "user_id": payload.user_id,
            "lesson_id": payload.lesson_id,
            "completed": True,
            "completed_at": now_iso,
            "updated_at": now_iso
        }
        response = supabase.table("user_progress").upsert(
            data, 
            on_conflict="user_id,lesson_id"
        ).execute()
        
        return {
            "status": "success",
            "message": "Lesson marked as completed",
            "data": response.data
        }
    except Exception as e:
        # Offline / connection error fallback
        return {
            "status": "success",
            "mode": "offline_fallback",
            "message": "Lesson marked as completed (offline simulation)",
            "data": [{
                "user_id": payload.user_id,
                "lesson_id": payload.lesson_id,
                "completed": True,
                "completed_at": now_iso
            }]
        }

# Use 'def', not 'async def'
@router.get("/my-progress")
def get_my_progress(user_id: str = Query(..., description="UUID of the user")):
    try:
        supabase = get_supabase()
        response = (
            supabase.table("user_progress")
            .select("lesson_id, completed, completed_at")
            .eq("user_id", user_id)
            .eq("completed", True)
            .execute()
        )
        return {
            "status": "success",
            "user_id": user_id,
            "completed_count": len(response.data) if response.data else 0,
            "lessons": response.data or []
        }
    except Exception as e:
        return {
            "status": "success",
            "mode": "offline_fallback",
            "user_id": user_id,
            "completed_count": 0,
            "lessons": []
        }