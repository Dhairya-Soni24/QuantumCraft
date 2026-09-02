import pytest
import httpx
import uuid
from backend.main import app

@pytest.mark.asyncio
async def test_complete_lesson_endpoint():
    test_user_id = str(uuid.uuid4())
    test_lesson_id = str(uuid.uuid4())
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.post(
            "/progress/complete-lesson",
            json={"user_id": test_user_id, "lesson_id": test_lesson_id}
        )
    
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "success"
    assert "data" in data


@pytest.mark.asyncio
async def test_get_my_progress_endpoint():
    test_user_id = str(uuid.uuid4())
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.get(f"/progress/my-progress?user_id={test_user_id}")
    
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "success"
    assert "completed_count" in data
    assert isinstance(data.get("lessons"), list)


@pytest.mark.asyncio
async def test_get_user_stats_and_heatmap():
    test_user_id = str(uuid.uuid4())
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.get(f"/users/{test_user_id}/stats")
    
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "success"
    
    stats = data.get("stats", {})
    assert "current_streak_days" in stats
    assert "challenges_solved_count" in stats
    assert "qubit_operations_count" in stats
    assert "total_xp" in stats
    
    heatmap = stats.get("activity_heatmap", [])
    assert len(heatmap) >= 365
    assert "date" in heatmap[0] and "count" in heatmap[0]