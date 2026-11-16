from fastapi.testclient import TestClient

from src.main import app
from tests.test_auth import create_test_jwt


def test_submit_body_metrics_batch_and_get_summary():
    client = TestClient(app)
    user_id = "candidate-vision-test"
    token = create_test_jwt(user_id=user_id, email="candidate-vision@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create interview session
    create_res = client.post(
        "/api/v1/interviews",
        json={"target_role": "Frontend Developer", "difficulty": "fresher"},
        headers=headers,
    )
    assert create_res.status_code == 201
    interview_id = create_res.json()["id"]

    # 2. Submit batch of client-side vision metrics (MediaPipe 5s snapshot)
    batch_payload = {
        "metrics": [
            {
                "timestamp_offset_seconds": 5.0,
                "eye_contact_score": 0.885,
                "head_pose_stability": 0.920,
                "posture_score": 0.840,
                "expressiveness_score": 0.760,
            },
            {
                "timestamp_offset_seconds": 10.0,
                "eye_contact_score": 0.910,
                "head_pose_stability": 0.950,
                "posture_score": 0.870,
                "expressiveness_score": 0.800,
            },
            {
                "timestamp_offset_seconds": 15.0,
                "eye_contact_score": 0.850,
                "head_pose_stability": 0.890,
                "posture_score": 0.820,
                "expressiveness_score": 0.720,
            },
        ]
    }

    batch_res = client.post(
        f"/api/v1/interviews/{interview_id}/metrics/batch",
        json=batch_payload,
        headers=headers,
    )
    assert batch_res.status_code == 201
    batch_data = batch_res.json()
    assert batch_data["interview_id"] == interview_id
    assert batch_data["inserted_count"] == 3
    assert batch_data["latest_snapshot"]["eye_contact_score"] == 0.850

    # 3. Retrieve metrics and verify summary aggregations
    get_res = client.get(
        f"/api/v1/interviews/{interview_id}/metrics",
        headers=headers,
    )
    assert get_res.status_code == 200
    metrics_data = get_res.json()
    assert metrics_data["count"] == 3
    summary = metrics_data["summary"]
    # Check that average is correctly calculated
    expected_avg_eye = round((0.885 + 0.910 + 0.850) / 3, 3)
    assert summary["avg_eye_contact"] == expected_avg_eye
    assert summary["avg_posture"] > 0.8
