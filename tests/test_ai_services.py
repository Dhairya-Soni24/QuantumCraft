import os
import sys

# Ensure root directory is in sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import pytest
import httpx
from backend.main import app


@pytest.mark.asyncio
async def test_ai_chat_endpoint():
    transport = httpx.ASGITransport(app=app)
    payload = {
        "message": "What is quantum superposition and how does the Hadamard gate work?",
        "history": [],
        "circuit_context": {
            "qubit_count": 2,
            "circuit_ast": [{"gate": "h", "targets": [0]}]
        }
    }
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.post("/ai/chat", json=payload)
    
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data and len(data["reply"]) > 0
    assert "suggested_actions" in data and isinstance(data["suggested_actions"], list)
    assert "concept_tags" in data and isinstance(data["concept_tags"], list)


@pytest.mark.asyncio
async def test_ai_chat_with_rich_history():
    """Verify that history containing lists (e.g. suggested_actions) does not trigger a 422 error."""
    transport = httpx.ASGITransport(app=app)
    payload = {
        "message": "What should I do next with this circuit?",
        "history": [
            {
                "role": "assistant",
                "content": "Hello! I am your QuantumCraft AI Tutor.",
                "suggested_actions": ["Explain Bell State", "What is a Hadamard gate?"]
            },
            {
                "role": "user",
                "content": "I added an H gate to qubit 0."
            }
        ],
        "circuit_context": {
            "qubit_count": 2,
            "circuit_ast": [{"gate": "h", "targets": [0]}]
        }
    }
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.post("/ai/chat", json=payload)
    
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data and len(data["reply"]) > 0


@pytest.mark.asyncio
async def test_ai_chat_stream_with_rich_history():
    """Verify that SSE stream works when history includes rich metadata without 422 error."""
    transport = httpx.ASGITransport(app=app)
    payload = {
        "message": "Tell me about CNOT gate.",
        "history": [
            {
                "role": "assistant",
                "content": "Hello!",
                "suggested_actions": ["Explain CNOT"]
            }
        ],
        "circuit_context": {"qubit_count": 2, "circuit_ast": []}
    }
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        async with client.stream("POST", "/ai/chat/stream", json=payload) as res:
            assert res.status_code == 200
            assert "text/event-stream" in res.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_ai_chat_bell_state_recognition():
    transport = httpx.ASGITransport(app=app)
    payload = {
        "message": "Can you explain what my circuit does?",
        "history": [],
        "circuit_context": {
            "qubit_count": 2,
            "circuit_ast": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "targets": [0, 1]}
            ]
        }
    }
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.post("/ai/chat", json=payload)
    
    assert res.status_code == 200
    data = res.json()
    assert "Bell State" in data["reply"] or "entanglement" in data["reply"].lower()


@pytest.mark.asyncio
async def test_ai_explain_circuit_endpoint():
    transport = httpx.ASGITransport(app=app)
    payload = {
        "qubit_count": 2,
        "circuit_ast": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "counts": {"00": 512, "11": 512}
    }
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.post("/ai/explain", json=payload)
    
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data and len(data["summary"]) > 0
    assert "step_by_step" in data and len(data["step_by_step"]) >= 2
    assert "key_takeaways" in data and len(data["key_takeaways"]) > 0


@pytest.mark.asyncio
async def test_ai_hint_endpoint():
    transport = httpx.ASGITransport(app=app)
    payload = {
        "challenge_id": "chal-001",
        "current_ast": [{"gate": "h", "targets": [0]}],
        "attempt_count": 2
    }
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.post("/ai/hint", json=payload)
    
    assert res.status_code == 200
    data = res.json()
    assert "hint" in data and len(data["hint"]) > 0
    assert "hint_level" in data
    assert data["hint_level"] == 2
    assert "suggested_gate" in data


@pytest.mark.asyncio
async def test_ai_recommend_endpoint():
    transport = httpx.ASGITransport(app=app)
    payload = {
        "user_id": "test-user-123",
        "completed_lessons": ["l-001"],
        "solved_challenges": ["chal-001"]
    }
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.post("/ai/recommend", json=payload)
    
    assert res.status_code == 200
    data = res.json()
    assert "recommended_course_id" in data
    assert "next_challenge_id" in data
    assert "reason" in data
