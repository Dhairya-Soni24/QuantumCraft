from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from backend.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/circuits", tags=["Circuits"])

# --- Request Models ---
class CircuitCreateRequest(BaseModel):
    user_id: str = Field(..., description="User ID is required by database schema")
    name: str
    canvas_json: Dict[str, Any] = Field(default_factory=dict, description="Matches DB schema column canvas_json")
    description: Optional[str] = ""
    framework: Optional[str] = "qiskit"
    code_snippet: Optional[str] = ""

# --- Routes ---

@router.get("/")
async def list_circuits():
    """Fetch all saved circuits."""
    try:
        supabase = get_supabase()
        response = supabase.table("saved_circuits").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{circuit_id}")
async def get_circuit(circuit_id: str):
    """Fetch a single circuit by its ID."""
    try:
        supabase = get_supabase()
        response = supabase.table("saved_circuits").select("*").eq("id", circuit_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Circuit not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_circuit(payload: CircuitCreateRequest):
    """Save a new circuit layout."""
    try:
        supabase = get_supabase()
        data = payload.model_dump(exclude_none=True)
        response = supabase.table("saved_circuits").insert(data).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{circuit_id}")
async def delete_circuit(circuit_id: str):
    """Delete a saved circuit."""
    try:
        supabase = get_supabase()
        response = supabase.table("saved_circuits").delete().eq("id", circuit_id).execute()
        return {"message": "Circuit deleted successfully", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))