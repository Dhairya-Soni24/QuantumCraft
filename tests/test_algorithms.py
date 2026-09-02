import os
import sys

# Ensure root directory is in sys.path regardless of execution folder
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import pytest
import httpx
from backend.main import app

EXPECTED_ALGORITHM_IDS = [
    "bell-state",
    "deutsch-jozsa",
    "grovers-search",
    "quantum-teleportation",
    "qft-3qubit",
]

SUPPORTED_FRAMEWORKS = ["qiskit", "cirq", "pennylane"]


@pytest.mark.asyncio
async def test_get_algorithm_templates_status():
    """Verify that the templates endpoint responds with 200 OK and valid top-level schema."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        response = await client.get("/algorithms/templates")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    payload = response.json()

    assert payload.get("status") == "success"
    assert payload.get("count") == 5
    assert len(payload.get("templates", [])) == 5


@pytest.mark.asyncio
async def test_algorithm_templates_ids_and_metadata():
    """Ensure all canonical algorithm templates exist with complete metadata."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        response = await client.get("/algorithms/templates")

    templates = response.json().get("templates", [])
    returned_ids = [item["id"] for item in templates]

    # Verify all expected canonical IDs are present
    assert returned_ids == EXPECTED_ALGORITHM_IDS

    for item in templates:
        assert item["title"], f"Missing title in {item['id']}"
        assert item["difficulty"] in ["beginner", "intermediate", "advanced"]
        assert isinstance(item["qubit_count"], int) and item["qubit_count"] > 0
        assert item["description"]
        assert item["mathematical_formula"]
        assert isinstance(item["circuit_ast"], list) and len(item["circuit_ast"]) > 0


@pytest.mark.asyncio
async def test_algorithm_multi_framework_code_generation():
    """Verify that code representations are populated for Qiskit, Cirq, and PennyLane."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        response = await client.get("/algorithms/templates")

    templates = response.json().get("templates", [])

    for item in templates:
        algo_id = item["id"]
        codes = item.get("code_representations", {})

        for fw in SUPPORTED_FRAMEWORKS:
            assert fw in codes, f"Framework '{fw}' missing from template '{algo_id}'"
            code_text = codes[fw]
            assert isinstance(code_text, str) and len(code_text.strip()) > 0, (
                f"Generated code for '{fw}' in template '{algo_id}' is empty"
            )

        # Framework-specific syntax smoke assertions
        assert "QuantumCircuit" in codes["qiskit"]
        assert "cirq.Circuit" in codes["cirq"]
        assert "@qml.qnode" in codes["pennylane"]