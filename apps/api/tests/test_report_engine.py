import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.services.report_engine import (
    compute_body_analytics,
    compute_speech_analytics,
    generate_interview_report,
    render_html_report,
)
from tests.test_auth import create_test_jwt


def test_compute_speech_analytics():
    turns = [
        {
            "user_transcript": "Um hello, I basically worked on React and uh Redux.",
            "duration_seconds": 5.0,
        },
        {
            "user_transcript": "Actually I like optimized component re-renders with useMemo.",
            "duration_seconds": 6.0,
        },
    ]
    analytics = compute_speech_analytics(turns)
    assert analytics.wpm > 0
    assert analytics.filler_rate > 0
    assert "um" in analytics.filler_words_found
    assert "actually" in analytics.filler_words_found
    assert analytics.average_answer_length_seconds == 5.5


def test_compute_body_analytics():
    vision = [
        {
            "eye_contact_score": 0.90,
            "posture_score": 0.85,
            "head_pose_stability": 0.92,
            "expressiveness_score": 0.80,
        },
        {
            "eye_contact_score": 0.80,
            "posture_score": 0.75,
            "head_pose_stability": 0.88,
            "expressiveness_score": 0.70,
        },
    ]
    analytics = compute_body_analytics(vision)
    assert analytics.avg_eye_contact == 0.85
    assert analytics.avg_posture == 0.80
    assert analytics.head_pose_stability == 0.90
    assert analytics.expressiveness == 0.75


@pytest.mark.asyncio
async def test_generate_interview_report_and_html():
    turns = [
        {
            "question_id": "q-1",
            "interviewer_question": "Tell me about yourself.",
            "user_transcript": (
                "I am a passionate software engineering fresher with experience in web apps."
            ),
            "duration_seconds": 10.0,
            "turn_metrics": {"quality_score": 82},
        }
    ]
    vision = [
        {
            "eye_contact_score": 0.88,
            "posture_score": 0.85,
            "head_pose_stability": 0.90,
            "expressiveness_score": 0.76,
        }
    ]

    report = await generate_interview_report(
        interview_id="test-report-01",
        user_id="user-rpt-1",
        target_role="Frontend Developer",
        turns=turns,
        vision_metrics=vision,
    )

    assert 0 <= report.overall_score <= 100
    assert len(report.strengths) > 0
    assert len(report.weaknesses) > 0
    assert len(report.recommended_resources) > 0

    # Test HTML render
    html = render_html_report(report, "Frontend Developer")
    assert "<!DOCTYPE html>" in html
    assert "AI Mock Interview Report" in html
    assert "Frontend Developer" in html
    assert str(report.overall_score) in html


def test_report_api_endpoints():
    client = TestClient(app)
    user_id = "candidate-report-endpoint"
    token = create_test_jwt(user_id=user_id, email="report@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create interview
    create_res = client.post(
        "/api/v1/interviews",
        json={"target_role": "Frontend Developer", "difficulty": "fresher"},
        headers=headers,
    )
    interview_id = create_res.json()["id"]

    # 2. Generate report
    gen_res = client.post(
        f"/api/v1/interviews/{interview_id}/report/generate",
        headers=headers,
    )
    assert gen_res.status_code == 201
    report_data = gen_res.json()
    assert report_data["interview_id"] == interview_id
    assert "overall_score" in report_data

    # 3. Fetch report via GET
    get_res = client.get(
        f"/api/v1/interviews/{interview_id}/report",
        headers=headers,
    )
    assert get_res.status_code == 200

    # 4. Fetch HTML report view
    html_res = client.get(
        f"/api/v1/interviews/{interview_id}/report/html",
        headers=headers,
    )
    assert html_res.status_code == 200
    assert "text/html" in html_res.headers["content-type"]
