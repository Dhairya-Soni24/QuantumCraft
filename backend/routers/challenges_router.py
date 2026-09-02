from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
from backend.supabase_client import get_supabase
from backend.simulator import SimulationRequest, GateInstruction, run_qiskit_simulation

router = APIRouter(prefix="/api/v1/challenges", tags=["Quantum Challenges"])


class ChallengeItem(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    points: int = 10
    target_state_vector: Optional[str] = None
    target_counts: Optional[Dict[str, Any]] = None

class ChallengeEvaluationRequest(BaseModel):
    user_id: Optional[str] = None
    qubit_count: int = 2
    circuit_ast: List[GateInstruction]
    shots: int = 1024

class ChallengeEvaluationResponse(BaseModel):
    status: str = Field(..., description="'passed' or 'failed'")
    score: int
    feedback: str
    simulation_output: Dict[str, Any]


# Built-in curriculum challenges
STARTER_CHALLENGES = [
    {
        "id": "chal-001",
        "title": "Create a Bell State (|Φ⁺⟩)",
        "description": "Construct a 2-qubit circuit that produces the maximally entangled state (|00⟩ + |11⟩)/√2 using Hadamard and CNOT gates.",
        "difficulty": "beginner",
        "points": 50,
        "target_state_vector": "[[0.707106, 0.0], [0.0, 0.0], [0.0, 0.0], [0.707106, 0.0]]",
        "target_counts": {"00": 512, "11": 512}
    },
    {
        "id": "chal-002",
        "title": "Quantum Bit Flip (|1⟩ State)",
        "description": "Transform the ground state |0⟩ into the excited state |1⟩ using a Pauli-X gate.",
        "difficulty": "beginner",
        "points": 20,
        "target_state_vector": "[[0.0, 0.0], [1.0, 0.0]]",
        "target_counts": {"1": 1024}
    }
]


@router.get("/", response_model=List[ChallengeItem])
async def list_challenges(difficulty: Optional[str] = None):
    """
    Lists all available quantum algorithm challenges.
    """
    try:
        supabase = get_supabase()
        query = supabase.table("challenges").select("*")
        if difficulty:
            query = query.eq("difficulty", difficulty.lower())
        response = query.order("points").execute()
        return response.data or STARTER_CHALLENGES
    except Exception as e:
        print(f"[ChallengesRouter Warning] DB fetch failed, returning starter challenges: {e}")
        return STARTER_CHALLENGES


@router.get("/{challenge_id}")
async def get_challenge_details(challenge_id: str):
    """
    Fetches details for a specific challenge.
    """
    try:
        supabase = get_supabase()
        res = supabase.table("challenges").select("*").eq("id", challenge_id).execute()
        if res.data:
            return res.data[0]
        
        # Check starter fallback
        for c in STARTER_CHALLENGES:
            if c["id"] == challenge_id:
                return c
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{challenge_id}/evaluate", response_model=ChallengeEvaluationResponse)
async def evaluate_challenge(challenge_id: str, payload: ChallengeEvaluationRequest):
    """
    Executes student's submitted circuit through the quantum simulator and grades it against the challenge target.
    """
    try:
        # 1. Run simulation
        sim_req = SimulationRequest(
            qubit_count=payload.qubit_count,
            circuit_ast=payload.circuit_ast,
            shots=payload.shots
        )
        sim_results = run_qiskit_simulation(sim_req)

        # 2. Check for challenge criteria
        # For Bell State Challenge (chal-001)
        passed = False
        feedback = ""
        points = 0

        counts = sim_results.get("counts", {})
        total_shots = sum(counts.values()) or payload.shots

        if challenge_id in ["chal-001", "bell-state"]:
            # Needs roughly equal 00 and 11, with 01 and 10 close to 0
            count_00 = counts.get("00", 0) / total_shots
            count_11 = counts.get("11", 0) / total_shots
            count_other = (counts.get("01", 0) + counts.get("10", 0)) / total_shots

            if count_00 > 0.35 and count_11 > 0.35 and count_other < 0.1:
                passed = True
                points = 50
                feedback = "Outstanding! You successfully synthesized the maximally entangled Bell State (|Φ⁺⟩)!"
            else:
                passed = False
                feedback = "Not quite. The Bell State requires equal superposition on qubit 0 and CNOT entanglement to qubit 1."
        elif challenge_id in ["chal-002", "bit-flip"]:
            count_1 = counts.get("1", 0) / total_shots
            if count_1 > 0.9:
                passed = True
                points = 20
                feedback = "Correct! The Pauli-X gate flipped the qubit from |0⟩ to |1⟩."
            else:
                passed = False
                feedback = "Your qubit did not collapse to |1⟩ with 100% probability. Apply a Pauli-X gate."
        else:
            # Generic state validation
            passed = len(payload.circuit_ast) > 0
            points = 10 if passed else 0
            feedback = "Circuit simulated successfully."

        # 3. Record submission in DB if available
        try:
            if payload.user_id:
                supabase = get_supabase()
                sub_data = {
                    "user_id": payload.user_id,
                    "challenge_id": challenge_id,
                    "submitted_circuit_json": [g.model_dump() for g in payload.circuit_ast],
                    "status": "passed" if passed else "failed",
                    "feedback": feedback
                }
                supabase.table("challenge_submissions").insert(sub_data).execute()
        except Exception as db_err:
            print(f"[ChallengesRouter] Submission recording skipped: {db_err}")

        return {
            "status": "passed" if passed else "failed",
            "score": points,
            "feedback": feedback,
            "simulation_output": sim_results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Challenge evaluation failed: {str(e)}")
