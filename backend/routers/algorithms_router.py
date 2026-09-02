from fastapi import APIRouter
from typing import List, Dict, Any
from backend.simulator import generate_cirq_code, generate_pennylane_code

router = APIRouter(prefix="/api/v1/algorithms", tags=["Algorithms & Templates"])

def _generate_qiskit_code(circuit_ast: List[Dict[str, Any]], qubit_count: int) -> str:
    lines = [
        "from qiskit import QuantumCircuit",
        f"qc = QuantumCircuit({qubit_count})",
        ""
    ]
    for g in circuit_ast:
        name = g["gate"].lower()
        t = g["targets"]
        p = g.get("params", [])
        if name == "h":
            lines.append(f"qc.h({t[0]})")
        elif name == "x":
            lines.append(f"qc.x({t[0]})")
        elif name == "z":
            lines.append(f"qc.z({t[0]})")
        elif name in ["cx", "cnot"]:
            lines.append(f"qc.cx({t[0]}, {t[1]})")
        elif name == "cz":
            lines.append(f"qc.cz({t[0]}, {t[1]})")
        elif name == "swap":
            lines.append(f"qc.swap({t[0]}, {t[1]})")
        elif name in ["ccx", "toffoli"]:
            lines.append(f"qc.ccx({t[0]}, {t[1]}, {t[2]})")
        elif name == "s":
            lines.append(f"qc.s({t[0]})")
        elif name == "t":
            lines.append(f"qc.t({t[0]})")
        elif name in ["p", "phase", "rz"]:
            lines.append(f"qc.rz({p[0] if p else 0.0}, {t[0]})")
    lines.append("\nprint(qc.draw())")
    return "\n".join(lines)


# Canonical Algorithm Library Definitions
TEMPLATES_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "bell-state",
        "title": "Bell State (|Φ⁺⟩)",
        "difficulty": "beginner",
        "qubit_count": 2,
        "description": "Generates a maximally entangled two-qubit state where measurement on one qubit instantaneously determines the state of the other.",
        "mathematical_formula": r"|\Phi^+\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |11\rangle)",
        "circuit_ast": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ]
    },
    {
        "id": "deutsch-jozsa",
        "title": "Deutsch-Jozsa Algorithm (Balanced Oracle)",
        "difficulty": "intermediate",
        "qubit_count": 2,
        "description": "Determines whether a hidden Boolean function is constant or balanced in a single quantum evaluation.",
        "mathematical_formula": r"|\psi\rangle = \frac{1}{2}\sum_{x=0}^1 (-1)^{f(x)}|x\rangle(|0\rangle - |1\rangle)",
        "circuit_ast": [
            {"gate": "x", "targets": [1]},
            {"gate": "h", "targets": [0]},
            {"gate": "h", "targets": [1]},
            {"gate": "cx", "targets": [0, 1]},
            {"gate": "h", "targets": [0]}
        ]
    },
    {
        "id": "grovers-search",
        "title": "Grover's Search Algorithm (2-Qubit)",
        "difficulty": "intermediate",
        "qubit_count": 2,
        "description": "Quadratic speedup for unstructured database search targeting state |11> using Oracle inversion and Amplitude Amplification (Diffusion).",
        "mathematical_formula": r"G = (2|\psi\rangle\langle\psi| - I) O_f",
        "circuit_ast": [
            {"gate": "h", "targets": [0]},
            {"gate": "h", "targets": [1]},
            {"gate": "cz", "targets": [0, 1]},
            {"gate": "h", "targets": [0]},
            {"gate": "h", "targets": [1]},
            {"gate": "x", "targets": [0]},
            {"gate": "x", "targets": [1]},
            {"gate": "cz", "targets": [0, 1]},
            {"gate": "x", "targets": [0]},
            {"gate": "x", "targets": [1]},
            {"gate": "h", "targets": [0]},
            {"gate": "h", "targets": [1]}
        ]
    },
    {
        "id": "quantum-teleportation",
        "title": "Quantum Teleportation Protocol",
        "difficulty": "advanced",
        "qubit_count": 3,
        "description": "Transmits an arbitrary unknown quantum state from Alice to Bob using an EPR entangled pair and two classical bits of communication.",
        "mathematical_formula": r"|\psi\rangle \otimes |\Phi^+\rangle \xrightarrow{\text{Bell Measurement}} (I, X, Z, XZ) |\psi\rangle",
        "circuit_ast": [
            {"gate": "h", "targets": [1]},
            {"gate": "cx", "targets": [1, 2]},
            {"gate": "cx", "targets": [0, 1]},
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [1, 2]},
            {"gate": "cz", "targets": [0, 2]}
        ]
    },
    {
        "id": "qft-3qubit",
        "title": "Quantum Fourier Transform (3-Qubit)",
        "difficulty": "advanced",
        "qubit_count": 3,
        "description": "Maps discrete quantum states into frequency space; fundamental building block for Shor's Algorithm and Phase Estimation.",
        "mathematical_formula": r"|j\rangle \mapsto \frac{1}{\sqrt{N}}\sum_{k=0}^{N-1} \omega^{jk} |k\rangle, \quad \omega = e^{2\pi i / N}",
        "circuit_ast": [
            {"gate": "h", "targets": [0]},
            {"gate": "p", "targets": [0], "params": [1.570796]},
            {"gate": "p", "targets": [0], "params": [0.785398]},
            {"gate": "h", "targets": [1]},
            {"gate": "p", "targets": [1], "params": [1.570796]},
            {"gate": "h", "targets": [2]},
            {"gate": "swap", "targets": [0, 2]}
        ]
    }
]


@router.get("/templates")
async def get_algorithm_templates():
    """Returns canonical quantum algorithms complete with AST and multi-framework code."""
    response = []
    for item in TEMPLATES_CATALOG:
        ast = item["circuit_ast"]
        q_count = item["qubit_count"]
        
        response.append({
            **item,
            "code_representations": {
                "qiskit": _generate_qiskit_code(ast, q_count),
                "cirq": generate_cirq_code(ast, q_count),
                "pennylane": generate_pennylane_code(ast, q_count)
            }
        })
    return {"status": "success", "count": len(response), "templates": response}