from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.supabase_client import supabase

# Import APIRouters
from backend.routers.simulation_router import router as simulation_router
from backend.routers.ai_router import router as ai_router
from backend.routers.circuits_router import router as circuits_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend service for QuantumCraft: AI-based Quantum Learning Platform"
)


# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(simulation_router)
app.include_router(ai_router)
app.include_router(circuits_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENV
    }

@app.get("/health")
def health_check():
    """Verify backend and Supabase connection health."""
    try:
        # Simple query test against public table
        response = supabase.table("courses").select("id").limit(1).execute()
        return {"backend": "healthy", "database": "connected"}
    except Exception as e:
        return {"backend": "healthy", "database": "error", "details": str(e)}