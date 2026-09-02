import os
import sys

# Ensure root directory is on sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import pytest
import httpx
from backend.main import app

@pytest.mark.asyncio
async def test_ai_chat_stream_endpoint():
    """Verify that the SSE streaming endpoint streams token events and finishes with [DONE]."""
    transport = httpx.ASGITransport(app=app)
    payload = {
        "message": "Explain how the Pauli-X gate acts as a NOT gate.",
        "history": [],
        "circuit_context": {"qubit_count": 1, "gates": [{"gate": "x", "targets": [0]}]}
    }

    received_tokens = []
    has_done = False

    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        async with client.stream("POST", "/ai/chat/stream", json=payload) as response:
            assert response.status_code == 200
            assert "text/event-stream" in response.headers.get("content-type", "")

            async for line in response.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        has_done = True
                        break
                    received_tokens.append(data_str)

    assert has_done is True, "Stream should complete with data: [DONE]"
    assert len(received_tokens) > 0, "Stream should deliver at least one data token chunk"
