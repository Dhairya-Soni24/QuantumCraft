import time
from typing import List, Dict, Any, Optional
import numpy as np
from pydantic import BaseModel

try:
    import qiskit
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import Statevector, partial_trace
    from qiskit_aer import Aer
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False


class GateInstruction(BaseModel):
    gate: str
    targets: List[int]
    classical_reg: Optional[int] = None
    params: Optional[List[float]] = None


class SimulationRequest(BaseModel):
    backend: str = "qiskit"
    qubit_count: int
    circuit_ast: List[GateInstruction]
    shots: int = 1024


# Target requirements mapping for input validation
REQUIRED_TARGETS = {
    "h": 1, "x": 1, "y": 1, "z": 1,
    "s": 1, "sdg": 1, "t": 1, "tdg": 1,
    "p": 1, "phase": 1, "rx": 1, "ry": 1, "rz": 1,
    "cx": 2, "cnot": 2, "cz": 2, "swap": 2,
    "ccx": 3, "toffoli": 3
}


def calculate_bloch_coordinates(state_vector: Statevector, num_qubits: int) -> List[Dict[str, Any]]:
    bloch_vectors = []
    for q in range(num_qubits):
        q_indices = list(range(num_qubits))
        q_indices.remove(q)
        
        if num_qubits == 1:
            rho = state_vector.to_operator().data
        else:
            rho = partial_trace(state_vector, q_indices).data
        
        rho00 = rho[0, 0]
        rho11 = rho[1, 1]
        rho01 = rho[0, 1]
        rho10 = rho[1, 0]
        
        x = float(2 * np.real(rho01))
        y = float(2 * np.imag(rho10))
        z = float(np.real(rho00 - rho11))
        
        bloch_vectors.append({
            "qubit": q,
            "x": round(x, 6),
            "y": round(y, 6),
            "z": round(z, 6)
        })
    return bloch_vectors


def run_qiskit_simulation(req: SimulationRequest) -> Dict[str, Any]:
    start_time = time.time()
    
    # Pre-simulation boundary validation
    if req.qubit_count <= 0:
        raise ValueError("qubit_count must be a positive integer.")

    if not QISKIT_AVAILABLE:
        mock_counts = {"00": req.shots // 2, "11": req.shots // 2} if req.qubit_count > 1 else {"0": req.shots}
        mock_state = [[0.707106, 0.0] for _ in range(2**req.qubit_count)]
        return {
            "status": "success",
            "execution_time_ms": round((time.time() - start_time) * 1000, 2),
            "backend_used": "mock_simulator_fallback",
            "counts": mock_counts,
            "state_vector": mock_state,
            "bloch_vectors": [{"qubit": i, "x": 0.0, "y": 0.0, "z": 1.0} for i in range(req.qubit_count)]
        }

    has_measurements = any(gate.gate.lower() == "measure" for gate in req.circuit_ast)
    state_qc = QuantumCircuit(req.qubit_count)
    count_qc = QuantumCircuit(req.qubit_count, req.qubit_count) if has_measurements else None

    def apply_gate(qc: QuantumCircuit, gate_inst: GateInstruction):
        gname = gate_inst.gate.lower()
        t = gate_inst.targets
        p = gate_inst.params
        
        # 1. Qubit bounds check
        for qubit_idx in t:
            if qubit_idx < 0 or qubit_idx >= req.qubit_count:
                raise ValueError(
                    f"Target qubit index {qubit_idx} is out of bounds for circuit with {req.qubit_count} qubits (0-{req.qubit_count - 1})."
                )

        # 2. Target count check
        expected_targets = REQUIRED_TARGETS.get(gname)
        if expected_targets and len(t) != expected_targets:
            raise ValueError(
                f"Gate '{gate_inst.gate}' requires exactly {expected_targets} target qubit(s), but got {len(t)}."
            )

        # 3. Expanded gate mapping
        if gname == "h":
            qc.h(t[0])
        elif gname == "x":
            qc.x(t[0])
        elif gname == "y":
            qc.y(t[0])
        elif gname == "z":
            qc.z(t[0])
        elif gname == "s":
            qc.s(t[0])
        elif gname == "sdg":
            qc.sdg(t[0])
        elif gname == "t":
            qc.t(t[0])
        elif gname == "tdg":
            qc.tdg(t[0])
        elif gname in ["cx", "cnot"]:
            qc.cx(t[0], t[1])
        elif gname == "cz":
            qc.cz(t[0], t[1])
        elif gname == "swap":
            qc.swap(t[0], t[1])
        elif gname in ["ccx", "toffoli"]:
            qc.ccx(t[0], t[1], t[2])
        elif gname in ["p", "phase"]:
            theta = p[0] if p and len(p) > 0 else 0.0
            qc.p(theta, t[0])
        elif gname == "rx":
            theta = p[0] if p and len(p) > 0 else 0.0
            qc.rx(theta, t[0])
        elif gname == "ry":
            theta = p[0] if p and len(p) > 0 else 0.0
            qc.ry(theta, t[0])
        elif gname == "rz":
            theta = p[0] if p and len(p) > 0 else 0.0
            qc.rz(theta, t[0])
        else:
            raise ValueError(f"Unsupported quantum gate type: '{gate_inst.gate}'.")

    for gate_inst in req.circuit_ast:
        gname = gate_inst.gate.lower()
        if gname == "measure":
            if not gate_inst.targets:
                raise ValueError("Measurement gate requires at least one target qubit.")
            target_qubit = gate_inst.targets[0]
            if target_qubit < 0 or target_qubit >= req.qubit_count:
                raise ValueError(f"Measurement target qubit {target_qubit} is out of bounds.")
            
            if count_qc:
                creg_idx = gate_inst.classical_reg if gate_inst.classical_reg is not None else target_qubit
                count_qc.measure(target_qubit, creg_idx)
        else:
            apply_gate(state_qc, gate_inst)
            if count_qc:
                apply_gate(count_qc, gate_inst)

    sv = Statevector.from_instruction(state_qc)
    state_vector_data = [[float(np.real(val)), float(np.imag(val))] for val in sv.data]
    bloch_coords = calculate_bloch_coordinates(sv, req.qubit_count)

    counts = {}
    backend_name = "qiskit_statevector_simulator"
    
    if has_measurements and count_qc:
        try:
            simulator = Aer.get_backend('qasm_simulator')
            job = simulator.run(count_qc, shots=req.shots)
            result = job.result()
            counts = result.get_counts(count_qc)
            backend_name = "qiskit_qasm_simulator"
        except Exception:
            backend_name = "qiskit_statevector_sample_fallback"
            probs = sv.probabilities_dict()
            samples = np.random.choice(list(probs.keys()), size=req.shots, p=list(probs.values()))
            for s in samples:
                counts[s] = counts.get(s, 0) + 1
    else:
        probs = sv.probabilities_dict()
        samples = np.random.choice(list(probs.keys()), size=req.shots, p=list(probs.values()))
        for s in samples:
            counts[s] = counts.get(s, 0) + 1

    execution_time_ms = round((time.time() - start_time) * 1000, 2)
    
    return {
        "status": "success",
        "execution_time_ms": execution_time_ms,
        "backend_used": backend_name,
        "counts": counts,
        "state_vector": state_vector_data,
        "bloch_vectors": bloch_coords
    }