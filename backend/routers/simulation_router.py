from fastapi import APIRouter, HTTPException
from backend.simulator import SimulationRequest, run_qiskit_simulation

router = APIRouter(prefix="/api/v1/simulate", tags=["Simulation Engine"])

@router.post("")
@router.post("/simulate")
def simulate_circuit(payload: SimulationRequest):
    """
    Translates incoming JSON circuit AST and simulates it using Qiskit Aer backend.
    """
    try:
        results = run_qiskit_simulation(payload)
        return results
    except ValueError as ve:
        # Handles out-of-bounds qubit indices, incorrect target lengths, or unknown gates
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Unexpected execution failures
        raise HTTPException(status_code=500, detail=f"Simulation Engine Error: {str(e)}")