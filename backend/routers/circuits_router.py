from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.auth import get_current_user
from backend.supabase_client import supabase

router = APIRouter(
    prefix="/api/v1/circuits",
    tags=["Saved Quantum Circuits"]
)

class CircuitSaveRequest(BaseModel):
    name: str
    description: Optional[str] = None
    canvas_json: Dict[str, Any]
    code_snippet: Optional[str] = None
    framework: str = "qiskit"

@router.post("/save")
async def save_circuit(payload: CircuitSaveRequest, user: dict = Depends(get_current_user)):
    """
    Saves a circuit under the authenticated user's profile.
    """
    try:
        # Create record in saved_circuits table
        data = {
            "user_id": user["id"],
            "name": payload.name,
            "description": payload.description,
            "canvas_json": payload.canvas_json,
            "code_snippet": payload.code_snippet,
            "framework": payload.framework
        }
        
        response = supabase.table("saved_circuits").insert(data).execute()
        return {
            "status": "success",
            "message": "Circuit saved successfully",
            "data": response.data[0] if response.data else {}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save circuit: {str(e)}"
        )

@router.get("/my-circuits")
async def get_my_circuits(user: dict = Depends(get_current_user)):
    """
    Fetches all circuits created by the authenticated user.
    """
    try:
        response = supabase.table("saved_circuits").select("*").eq("user_id", user["id"]).execute()
        return {
            "status": "success",
            "count": len(response.data),
            "circuits": response.data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch circuits: {str(e)}"
        )

@router.get("/{circuit_id}")
async def get_circuit_by_id(circuit_id: str, user: dict = Depends(get_current_user)):
    """
    Retrieves details for a single saved circuit.
    """
    try:
        response = supabase.table("saved_circuits").select("*").eq("id", circuit_id).eq("user_id", user["id"]).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Circuit not found or access denied."
            )
        return {
            "status": "success",
            "circuit": response.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error retrieving circuit: {str(e)}"
        )

@router.delete("/{circuit_id}")
async def delete_circuit(circuit_id: str, user: dict = Depends(get_current_user)):
    """
    Removes a saved circuit.
    """
    try:
        response = supabase.table("saved_circuits").delete().eq("id", circuit_id).eq("user_id", user["id"]).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Circuit not found or access denied."
            )
        return {
            "status": "success",
            "message": "Circuit deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete circuit: {str(e)}"
        )
