import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.ai_services import AIService

client = TestClient(app)

def test_ai_chat_endpoint_schema():
    """Verify /api/v1/ai/chat accepts rolling history, circuit_ast, and qiskit_code."""
    payload = {
        "message": "What does a Hadamard gate do?",
        "history": [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello! How can I help you learn quantum computing?"}
        ],
        "circuit_context": {
            "qubit_count": 2,
            "circuit_ast": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "targets": [0, 1]}
            ],
            "qiskit_code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)"
        }
    }
    response = client.post("/api/v1/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert isinstance(data["reply"], str)
    assert len(data["reply"]) > 0

def test_ai_chat_general_question_without_canvas():
    """Verify AI Tutor responds to general gate questions even if canvas context has no matching gate."""
    payload = {
        "message": "Can you explain how a Toffoli (CCX) gate works?",
        "history": [],
        "circuit_context": {
            "qubit_count": 1,
            "circuit_ast": [],
            "qiskit_code": ""
        }
    }
    response = client.post("/api/v1/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
