from enum import Enum
from pydantic import BaseModel
from typing import Optional, Dict, Any

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class ChallengeCreateRequest(BaseModel):
    title: str
    description: str
    target_state_vector: Optional[str] = None
    target_counts: Optional[Dict[str, Any]] = None
    difficulty: DifficultyLevel
    points: int = 10

class CourseCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: DifficultyLevel