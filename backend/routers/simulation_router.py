from fastapi import APIRouter, HTTPException
from backend.simulator import SimulationRequest, run_qiskit_simulation

router = APIRouter(
    prefix="/api/v1",
    tags=["Quantum Simulation"]
)

@router.post("/simulate")
def simulate_circuit(payload: SimulationRequest):
    """
    Translates incoming JSON circuit AST and simulates it using Qiskit Aer backend.
    """
    try:
        results = run_qiskit_simulation(payload)
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")
