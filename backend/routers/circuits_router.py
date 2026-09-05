import uuid
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

def ensure_valid_uuid(user_id_str: str) -> str:
    """Safely normalizes any string ID into a valid RFC4122 UUID."""
    if not user_id_str:
        return "d1000000-0000-0000-0000-000000000001"
    try:
        return str(uuid.UUID(str(user_id_str)))
    except (ValueError, TypeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(user_id_str)))

# --- Routes ---

@router.get("/")
def list_circuits(user_id: Optional[str] = None):
    """Fetch saved circuits. Optionally filter by user_id if provided."""
    try:
        supabase = get_supabase()
        query = supabase.table("saved_circuits").select("*")
        if user_id:
            valid_id = ensure_valid_uuid(user_id)
            query = query.eq("user_id", valid_id)
        response = query.order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        print(f"[CircuitsRouter] list_circuits error: {e}")
        return []

@router.get("/{circuit_id}")
def get_circuit(circuit_id: str):
    """Fetch a single circuit by its ID."""
    try:
        supabase = get_supabase()
        response = supabase.table("saved_circuits").select("*").eq("id", circuit_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Circuit not found")
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_circuit(payload: CircuitCreateRequest):
    """Save a new circuit layout with resilient UUID validation and user provisioning."""
    valid_user_id = ensure_valid_uuid(payload.user_id)
    try:
        supabase = get_supabase()
        
        # Ensure user exists in users table to satisfy foreign key constraint
        try:
            user_check = supabase.table("users").select("id").eq("id", valid_user_id).execute()
            if not user_check.data:
                supabase.table("users").insert({
                    "id": valid_user_id,
                    "email": f"user_{valid_user_id[:8]}@quantumcraft.dev",
                    "full_name": "Quantum Explorer",
                    "role": "student"
                }).execute()
        except Exception as u_err:
            print(f"[CircuitsRouter] User check/insert notice: {u_err}")

        data = payload.model_dump(exclude_none=True)
        data["user_id"] = valid_user_id

        response = supabase.table("saved_circuits").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Supabase insert returned no data")
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CircuitsRouter] Supabase insert error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save circuit to database: {str(e)}")

@router.delete("/{circuit_id}")
def delete_circuit(circuit_id: str):
    """Delete a saved circuit."""
    try:
        supabase = get_supabase()
        response = supabase.table("saved_circuits").delete().eq("id", circuit_id).execute()
        return {"message": "Circuit deleted successfully", "data": response.data}
    except Exception as e:
        print(f"[CircuitsRouter] Delete error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete circuit: {str(e)}")