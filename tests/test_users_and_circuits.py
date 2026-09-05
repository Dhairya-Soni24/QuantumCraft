import os
import sys
import uuid
import pytest
import httpx

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app

@pytest.mark.asyncio
async def test_user_login_and_circuit_flow():
    test_email = f"friend_test_{uuid.uuid4().hex[:8]}@quantumcraft.dev"
    test_name = "Friend Scientist"
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        # 1. Register or login new user
        reg_res = await client.post("/users/login-or-register", json={
            "email": test_email,
            "full_name": test_name,
            "role": "student"
        })
        assert reg_res.status_code == 200
        user = reg_res.json()["user"]
        user_id = user["id"]
        assert user["email"] == test_email
        assert user["full_name"] == test_name

        # 2. Update user profile
        upd_res = await client.put(f"/users/{user_id}", json={
            "full_name": "Friend Scientist PhD",
            "role": "instructor"
        })
        assert upd_res.status_code == 200
        assert upd_res.json()["user"]["full_name"] == "Friend Scientist PhD"

        # 3. Save circuit under user
        circuit_res = await client.post("/circuits/", json={
            "user_id": user_id,
            "name": "Friend Bell State",
            "description": "2-qubit entanglement",
            "canvas_json": {"qubit_count": 2, "circuit_ast": [{"gate": "h", "targets": [0]}, {"gate": "cx", "targets": [0, 1]}]},
            "code_snippet": "qc.h(0)\nqc.cx(0, 1)",
            "framework": "qiskit"
        })
        assert circuit_res.status_code == 200
        circuit_data = circuit_res.json()
        circuit_id = circuit_data[0]["id"]
        assert circuit_data[0]["user_id"] == user_id

        # 4. List circuits filtered by user
        list_res = await client.get(f"/circuits/?user_id={user_id}")
        assert list_res.status_code == 200
        user_circuits = list_res.json()
        assert len(user_circuits) >= 1
        assert user_circuits[0]["id"] == circuit_id

        # 5. Delete circuit
        del_res = await client.delete(f"/circuits/{circuit_id}")
        assert del_res.status_code == 200

    # Cleanup DB user
    from backend.supabase_client import get_supabase
    sb = get_supabase()
    sb.table("users").delete().eq("id", user_id).execute()
