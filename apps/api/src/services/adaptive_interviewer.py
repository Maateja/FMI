"""
Adaptive Interviewer Engine for Freshers Mock Interview (FMI).

Provides active listening, signal extraction (projects, certifications, tech stack),
and dynamic follow-up questioning tailored to the candidate's answers and resume.
"""

import re
from typing import Any

# Curated tech stack keyword mapping
TECH_KEYWORDS: dict[str, str] = {
    "react native": "React Native",
    "react": "React",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "vue.js": "Vue",
    "vue": "Vue",
    "angular": "Angular",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "node": "Node.js",
    "express.js": "Express",
    "express": "Express",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "spring boot": "Spring Boot",
    "python": "Python",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "golang": "Go",
    "rust": "Rust",
    "c++": "C++",
    "java": "Java",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "mysql": "MySQL",
    "redis": "Redis",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "Google Cloud",
    "tailwind": "Tailwind CSS",
    "redux": "Redux",
    "zustand": "Zustand",
    "graphql": "GraphQL",
    "rest api": "REST APIs",
    "rest": "REST APIs",
    "git": "Git",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "Scikit-Learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
}

PROJECT_KEYWORDS: list[str] = [
    "built", "build", "building", "created", "create", "developed", "develop",
    "project", "projects", "designed", "implemented", "implement", "coded",
    "application", "app", "website", "system", "portfolio",
    "capstone", "hackathon", "cloned", "pipeline", "saas",
    "e-commerce", "ecommerce", "dashboard", "chat app", "microservice"
]

CERTIFICATION_KEYWORDS: list[str] = [
    "certification", "certified", "certifications", "certificate", "certificates",
    "course", "courses", "coursera", "udemy", "bootcamp", "training",
    "completed", "diploma", "credential", "specialization", "nptel", "freecodecamp",
    "meta front-end", "aws certified", "hacker rank", "hackerrank", "leetcode"
]


def extract_candidate_signals(answer: str) -> dict[str, Any]:
    """
    Extracts high-value signals from candidate speech:
    - Projects mentioned
    - Certifications / courses mentioned
    - Specific technologies mentioned
    """
    text = answer.lower()

    # Extract technologies
    detected_techs: list[str] = []
    # Match longest tech names first (e.g. 'react native' before 'react')
    sorted_tech_keys = sorted(TECH_KEYWORDS.keys(), key=len, reverse=True)
    temp_text = text
    for key in sorted_tech_keys:
        pattern = rf"\b{re.escape(key)}\b"
        if re.search(pattern, temp_text):
            formal_name = TECH_KEYWORDS[key]
            if formal_name not in detected_techs:
                detected_techs.append(formal_name)
            # Mask out already matched text to prevent duplicate sub-word matching
            temp_text = re.sub(pattern, " ", temp_text)

    # Extract projects
    detected_projects: list[str] = [
        kw for kw in PROJECT_KEYWORDS if re.search(rf"\b{re.escape(kw)}\b", text)
    ]

    # Extract certifications
    detected_certs: list[str] = [
        kw for kw in CERTIFICATION_KEYWORDS if re.search(rf"\b{re.escape(kw)}\b", text)
    ]

    return {
        "has_project": len(detected_projects) > 0,
        "has_certification": len(detected_certs) > 0,
        "technologies": detected_techs,
        "project_keywords": detected_projects,
        "cert_keywords": detected_certs,
    }


def generate_adaptive_follow_up_heuristic(
    answer: str,
    question: str,
    current_round: str = "technical",
    target_role: str = "Frontend Developer",
) -> dict[str, Any]:
    """
    Deterministic rule-based follow-up generator when offline or using fallback.
    Produces human-like, deep-probing interview follow-ups.
    """
    signals = extract_candidate_signals(answer)
    techs = signals["technologies"]
    has_proj = signals["has_project"]
    has_cert = signals["has_certification"]

    follow_up: str | None = None
    requires_deep_dive = False
    quality_score = 75

    # Case 1: Candidate mentions both a project and specific technologies
    if has_proj and techs:
        primary_tech = techs[0]
        secondary_tech = techs[1] if len(techs) > 1 else None
        tech_phrase = f"{primary_tech} and {secondary_tech}" if secondary_tech else primary_tech

        options = [
            f"You mentioned building that with {tech_phrase}. Why did you choose that specific tech stack over alternatives, and how did you architect the application?",
            f"That sounds like a great project. How did you structure the code and manage data flow using {primary_tech}, and what was the hardest technical challenge you solved?",
            f"Walking through your {primary_tech} project, what trade-offs did you encounter, and how did you test and measure its performance?",
        ]
        follow_up = options[0]
        requires_deep_dive = True
        quality_score = 85

    # Case 2: Candidate mentions a certification or online course
    elif has_cert:
        cert_tech = techs[0] if techs else "that domain"
        if cert_tech != "that domain":
            follow_up = (
                f"Congratulations on completing that course! What was the most rigorous hands-on assignment "
                f"you tackled with {cert_tech}, and how have you applied those learnings to your real-world projects?"
            )
        else:
            follow_up = (
                "That's great dedication to continuous learning. What was the most challenging technical concept "
                "covered in that certification course, and how did you practically implement it?"
            )
        requires_deep_dive = True
        quality_score = 80

    # Case 3: Candidate mentions a project without naming specific tech
    elif has_proj:
        follow_up = (
            "That sounds like an interesting project! How did you build it from the ground up, "
            "why did you choose your particular tech stack, and what was your individual contribution?"
        )
        requires_deep_dive = True
        quality_score = 80

    # Case 4: Candidate specifically mentions technologies without saying 'project'
    elif techs:
        primary_tech = techs[0]
        if "React" in primary_tech:
            follow_up = (
                "You mentioned React—how do you handle component state and side effects, "
                "and what strategies do you use to prevent unnecessary re-renders?"
            )
        elif "Node" in primary_tech or "Express" in primary_tech:
            follow_up = (
                f"Since you work with {primary_tech}, how do you manage asynchronous operations, "
                "error handling, and database connection pooling?"
            )
        elif "Python" in primary_tech:
            follow_up = (
                "You brought up Python—how do you approach memory management, generators, "
                "or optimizing compute-heavy tasks in production?"
            )
        elif "SQL" in primary_tech or "PostgreSQL" in primary_tech or "MongoDB" in primary_tech:
            follow_up = (
                f"Working with {primary_tech}, how do you structure schemas, index queries for high performance, "
                "and maintain data integrity?"
            )
        else:
            follow_up = (
                f"You brought up {primary_tech}. What are the primary trade-offs or limitations "
                "you have observed when working with it, and how did you handle them?"
            )
        requires_deep_dive = True
        quality_score = 78

    # Case 5: Warmup round where candidate introduced themselves
    elif current_round == "warmup":
        follow_up = (
            "Thank you for sharing your background! Could you highlight one technical project from your resume "
            "that you found most challenging or rewarding to build?"
        )
        requires_deep_dive = False
        quality_score = 80

    # Case 6: Short answer needing elaboration
    elif len(answer.split()) < 12:
        follow_up = "Could you walk me through a specific real-world example of how you applied that in practice?"
        requires_deep_dive = False
        quality_score = 60

    is_complete = not requires_deep_dive and len(answer.split()) >= 15

    return {
        "is_complete": is_complete,
        "requires_deep_dive": requires_deep_dive,
        "quality_score": quality_score,
        "follow_up_question": follow_up,
        "detected_topics": {
            "projects": signals["project_keywords"],
            "certifications": signals["cert_keywords"],
            "technologies": signals["technologies"],
        },
    }
