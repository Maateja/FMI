import pytest
from src.services.adaptive_interviewer import (
    extract_candidate_signals,
    generate_adaptive_follow_up_heuristic,
)


def test_extract_candidate_signals_project_and_tech():
    text = "In my final year, I built an e-commerce website using React and Node.js with MongoDB."
    signals = extract_candidate_signals(text)
    assert signals["has_project"] is True
    assert "React" in signals["technologies"]
    assert "Node.js" in signals["technologies"]
    assert "MongoDB" in signals["technologies"]


def test_extract_candidate_signals_certification():
    text = "I completed an AWS certified developer associate course on Coursera."
    signals = extract_candidate_signals(text)
    assert signals["has_certification"] is True
    assert "AWS" in signals["technologies"]


def test_follow_up_on_project_and_tech_stack():
    text = "For my college capstone, I developed a chat application using React, FastAPI, and PostgreSQL."
    res = generate_adaptive_follow_up_heuristic(text, question="Tell me about yourself", current_round="warmup")
    assert res["requires_deep_dive"] is True
    assert "tech stack" in res["follow_up_question"].lower() or "architect" in res["follow_up_question"].lower()
    assert "React" in res["follow_up_question"] or "FastAPI" in res["follow_up_question"]


def test_follow_up_on_certification():
    text = "I recently finished a comprehensive course and certification in React and Redux."
    res = generate_adaptive_follow_up_heuristic(text, question="Tell me about your background", current_round="warmup")
    assert res["requires_deep_dive"] is True
    assert "course" in res["follow_up_question"].lower() or "certification" in res["follow_up_question"].lower()


def test_follow_up_on_react_technical_concept():
    text = "I mostly write frontend components in React with custom hooks."
    res = generate_adaptive_follow_up_heuristic(text, question="What frontend technologies do you prefer?", current_round="technical")
    assert res["requires_deep_dive"] is True
    assert "React" in res["follow_up_question"]
    assert "re-renders" in res["follow_up_question"] or "state" in res["follow_up_question"]
