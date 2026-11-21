"""
Viseme & Lip-Sync Timing Generator for 3D Avatars.

Maps spoken text to ARKit / Oculus blendshape weights and timestamps
for real-time jaw and lip synchronization in Three.js and TalkingHead.
"""

import re
from typing import Any

# Standard Oculus/ARKit Viseme Set
VISEME_MAP = {
    "a": "viseme_aa",
    "e": "viseme_E",
    "i": "viseme_I",
    "o": "viseme_O",
    "u": "viseme_U",
    "p": "viseme_PP",
    "b": "viseme_PP",
    "m": "viseme_PP",
    "f": "viseme_FF",
    "v": "viseme_FF",
    "t": "viseme_TH",
    "d": "viseme_TH",
    "s": "viseme_SS",
    "z": "viseme_SS",
}


def generate_speech_visemes(
    spoken_text: str, duration_seconds: float = 2.5
) -> list[dict[str, Any]]:
    """
    Generates time-stamped viseme keyframes for 3D human lip sync.
    Distributes phonemes evenly across the duration of spoken speech.
    """
    words = re.findall(r"\b\w+\b", spoken_text.lower())
    if not words:
        return []

    keyframes: list[dict[str, Any]] = []
    # Add initial neutral rest pose
    keyframes.append({"time_ms": 0, "viseme": "silence", "jaw_open": 0.0, "mouth_smile": 0.1})

    # Estimate word duration
    total_words = len(words)
    word_duration_ms = (duration_seconds * 1000.0) / max(total_words, 1)

    current_time_ms = 50.0

    for word in words:
        char_duration_ms = word_duration_ms / max(len(word), 1)
        for char in word:
            viseme = VISEME_MAP.get(char, "viseme_aa")
            is_vowel = char in "aeiou"
            jaw_open = 0.65 if is_vowel else 0.25

            keyframes.append({
                "time_ms": round(current_time_ms, 1),
                "viseme": viseme,
                "jaw_open": round(jaw_open, 2),
                "mouth_smile": 0.15,
                "char": char,
            })
            current_time_ms += char_duration_ms

        # Small inter-word pause
        current_time_ms += 40.0
        keyframes.append({
            "time_ms": round(current_time_ms, 1),
            "viseme": "silence",
            "jaw_open": 0.05,
            "mouth_smile": 0.1,
        })

    # Ending neutral mouth pose
    keyframes.append({
        "time_ms": round(max(current_time_ms, duration_seconds * 1000.0), 1),
        "viseme": "silence",
        "jaw_open": 0.0,
        "mouth_smile": 0.1,
    })

    return keyframes
