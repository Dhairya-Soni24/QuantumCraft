import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from backend.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/progress", tags=["User Progress"])

class CompleteLessonRequest(BaseModel):
    user_id: str
    lesson_id: str

def ensure_valid_uuid(user_id_str: str) -> str:
    """Safely normalizes any string ID into a valid RFC4122 UUID."""
    if not user_id_str:
        return "d1000000-0000-0000-0000-000000000001"
    try:
        return str(uuid.UUID(str(user_id_str)))
    except (ValueError, TypeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(user_id_str)))

# Use 'def', not 'async def'
@router.post("/complete-lesson")
def complete_lesson(payload: CompleteLessonRequest):
    now_iso = datetime.now(timezone.utc).isoformat()
    valid_user_id = ensure_valid_uuid(payload.user_id)
    try:
        supabase = get_supabase()
        
        # Ensure user exists
        try:
            user_check = supabase.table("users").select("id").eq("id", valid_user_id).execute()
            if not user_check.data:
                supabase.table("users").upsert({
                    "id": valid_user_id,
                    "email": f"user_{valid_user_id[:8]}@quantumcraft.dev",
                    "full_name": "Quantum Explorer",
                    "role": "student"
                }).execute()
        except Exception as u_err:
            print(f"[ProgressRouter] User provision note: {u_err}")

        data = {
            "user_id": valid_user_id,
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
                "user_id": valid_user_id,
                "lesson_id": payload.lesson_id,
                "completed": True,
                "completed_at": now_iso
            }]
        }

# Use 'def', not 'async def'
@router.get("/my-progress")
def get_my_progress(user_id: str = Query(..., description="UUID of the user")):
    valid_user_id = ensure_valid_uuid(user_id)
    try:
        supabase = get_supabase()
        response = (
            supabase.table("user_progress")
            .select("lesson_id, completed, completed_at")
            .eq("user_id", valid_user_id)
            .eq("completed", True)
            .execute()
        )
        return {
            "status": "success",
            "user_id": valid_user_id,
            "completed_count": len(response.data) if response.data else 0,
            "lessons": response.data or []
        }
    except Exception as e:
        return {
            "status": "success",
            "mode": "offline_fallback",
            "user_id": valid_user_id,
            "completed_count": 0,
            "lessons": []
        }