from src.services.characters import (
    INTERVIEWER_CHARACTERS,
    clean_spoken_text,
    get_character,
)
from src.services.visemes import generate_speech_visemes


def test_5_characters_configured():
    assert len(INTERVIEWER_CHARACTERS) == 5
    ids = set(INTERVIEWER_CHARACTERS.keys())
    assert ids == {"arjun", "rohan", "priya", "ananya", "kavita"}

    # 2 male, 3 female
    males = [c for c in INTERVIEWER_CHARACTERS.values() if c.gender == "male"]
    females = [c for c in INTERVIEWER_CHARACTERS.values() if c.gender == "female"]
    assert len(males) == 2
    assert len(females) == 3

    # Ages between 23 and 35
    for c in INTERVIEWER_CHARACTERS.values():
        assert 23 <= c.age <= 35
        assert c.voice_id_kokoro
        assert c.voice_id_edge
        assert c.avatar_model


def test_get_character_fallback():
    char = get_character("unknown_id")
    assert char.id == "priya"  # Default fallback


def test_clean_spoken_text():
    raw = "**Hello!** Here is a `tip`: - Point 1 \n* Point 2 😊"
    cleaned = clean_spoken_text(raw)
    assert "**" not in cleaned
    assert "`" not in cleaned
    assert "😊" not in cleaned
    assert "Hello!" in cleaned
    assert "Point 1" in cleaned


def test_generate_speech_visemes():
    text = "Tell me about your React project and architecture."
    visemes = generate_speech_visemes(text, duration_seconds=2.0)
    assert len(visemes) > 5
    assert visemes[0]["viseme"] == "silence"
    # Visemes contain jaw_open values
    assert any(v["jaw_open"] > 0 for v in visemes)
