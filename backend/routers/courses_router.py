from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/courses", tags=["Courses & Lessons"])


class LessonItem(BaseModel):
    id: str
    course_id: str
    title: str
    content: str
    position: int

class CourseItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    difficulty: str


@router.get("/", response_model=List[CourseItem])
async def list_courses(difficulty: Optional[str] = None):
    """
    Fetches all available quantum computing courses with optional difficulty filter.
    """
    try:
        supabase = get_supabase()
        query = supabase.table("courses").select("*")
        if difficulty:
            query = query.eq("difficulty", difficulty.lower())
        response = query.order("created_at").execute()
        return response.data or []
    except Exception as e:
        # Provide offline starter courses if database is unreachable
        print(f"[CoursesRouter Warning] DB fetch failed, returning starter courses: {e}")
        return [
            {
                "id": "c-001",
                "title": "Introduction to Quantum Computing",
                "description": "Learn the fundamentals of qubits, superposition, entanglement, and simple quantum algorithms.",
                "difficulty": "beginner"
            },
            {
                "id": "c-002",
                "title": "Quantum Algorithms: Deutsch-Jozsa & Grover",
                "description": "Explore quantum speedups through oracle-based search and evaluation algorithms.",
                "difficulty": "intermediate"
            }
        ]


@router.get("/{course_id}")
async def get_course_details(course_id: str):
    """
    Fetches course metadata and its ordered lessons.
    """
    try:
        supabase = get_supabase()
        course_res = supabase.table("courses").select("*").eq("id", course_id).execute()
        if not course_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
        
        lessons_res = supabase.table("lessons").select("*").eq("course_id", course_id).order("position").execute()
        course_data = course_res.data[0]
        course_data["lessons"] = lessons_res.data or []
        return course_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}/lessons")
async def list_course_lessons(course_id: str):
    """
    Fetches all lessons for a specific course.
    """
    try:
        supabase = get_supabase()
        lessons_res = supabase.table("lessons").select("*").eq("course_id", course_id).order("position").execute()
        return lessons_res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
