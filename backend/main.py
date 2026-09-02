from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.supabase_client import get_supabase

# Import APIRouters
from backend.routers.simulation_router import router as simulation_router
from backend.routers.ai_router import router as ai_router
from backend.routers.circuits_router import router as circuits_router
from backend.routers.courses_router import router as courses_router
from backend.routers.challenges_router import router as challenges_router
from backend.routers.algorithms_router import router as algorithms_router
from backend.routers.progress_router import router as progress_router
from backend.routers.users_router import router as users_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend service for QuantumCraft: AI-based Quantum Learning Platform"
)

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(simulation_router)
app.include_router(ai_router)
app.include_router(circuits_router)
app.include_router(courses_router)
app.include_router(challenges_router)
app.include_router(algorithms_router)
app.include_router(progress_router)
app.include_router(users_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENV,
        "endpoints": [
            "/api/v1/simulate",
            "/api/v1/ai/chat",
            "/api/v1/ai/explain",
            "/api/v1/ai/hint",
            "/api/v1/ai/recommend",
            "/api/v1/circuits",
            "/api/v1/courses",
            "/api/v1/challenges",
            "/api/v1/algorithms/templates",
            "/api/v1/progress/complete-lesson",
            "/api/v1/progress/my-progress",
            "/api/v1/users/{user_id}/stats"
        ]
    }

@app.get("/health")
def health_check():
    """Verify backend and Supabase connection health."""
    try:
        supabase = get_supabase()
        response = supabase.table("courses").select("id").limit(1).execute()
        return {"backend": "healthy", "database": "connected"}
    except Exception as e:
        return {"backend": "healthy", "database": "offline_mode", "details": str(e)}