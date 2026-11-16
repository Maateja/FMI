# FMI (Freshers Mock Interview)

An AI-powered voice interview platform designed for college freshers to practice realistic technical and behavioral interviews.

## Core Features
- **Aurora Orb**: Audio-reactive WebGL/Canvas visualizer representing the AI interviewer's mental state (`idle`, `speaking`, `listening`, `thinking`).
- **Low-Latency Voice Loop**: Realtime WebRTC audio via LiveKit, Silero VAD, Groq Whisper STT, Gemini LLM brain, and Kokoro TTS.
- **Adaptive Questioning**: Dynamic follow-up probing tailored to response depth and completeness.
- **Privacy-Preserving Body Language Analysis**: Browser-side MediaPipe Face and Pose landmarking; zero video frames leave the device.
- **Comprehensive Evaluation**: Structured scoring across communication, technical accuracy, and non-verbal cues, mapped to personalized learning resources and downloadable as a PDF.

---

## Monorepo Architecture

```
fmi/
├── apps/
│   ├── web/               # React 19 + TypeScript (strict) + Vite + Tailwind + shadcn/ui
│   ├── api/               # FastAPI async backend + Supabase + ARQ producer
│   └── agent/             # LiveKit Agent Worker with Provider Abstraction (STT/LLM/TTS)
├── packages/
│   └── shared-types/      # Strict TypeScript shared data contracts
├── supabase/
│   ├── migrations/        # PostgreSQL schema with Row Level Security (RLS) on all 12 tables
│   ├── seed.sql           # 40+ questions (HR + Frontend + Backend + Data/ML) & 20 resources
│   └── tests/             # RLS verification test suite (User A vs User B isolation)
├── infra/
│   ├── docker-compose.yml # Orchestration: web, api, agent, redis, livekit, kokoro
│   └── livekit.yaml       # LiveKit server WebRTC/signaling configuration
└── docs/
    └── DECISIONS.md       # Architecture Decision Records (ADRs)
```

---

## Getting Started

### Prerequisites
- Node.js 20+ & pnpm (`npm install -g pnpm`)
- Python 3.11+ & uv (`pip install uv` or standalone installer)
- Docker & Docker Compose (for local containerized stack)

### 1. Install Dependencies
```bash
# Install Node & Workspace packages
pnpm install

# Build shared types
pnpm --filter @fmi/shared-types build

# Install Python API dependencies
cd apps/api
uv sync --extra dev
cd ../..
```

### 2. Run Tests & Type Checks
```bash
# Frontend type check & tests
pnpm --filter web typecheck
pnpm --filter web test:run

# Backend API tests, linter & type checks
cd apps/api
uv run ruff check .
uv run mypy src
uv run pytest -v
cd ../..

# Agent worker tests & linter
cd apps/agent
..\api\.venv\Scripts\ruff check .
..\api\.venv\Scripts\mypy src
..\api\.venv\Scripts\pytest -v
cd ../..

# RLS & Database Schema verification
python supabase/tests/verify_rls.py
```

### 3. Run Development Servers
```bash
# Run web frontend (http://localhost:5173)
pnpm dev

# Run FastAPI backend (http://localhost:8000)
cd apps/api
uv run uvicorn src.main:app --reload --port 8000
```

---

## Roadmap & Status
- [x] **Phase 0: Plan** - System architecture, monorepo blueprint, env vars catalog, risk register.
- [x] **Phase 1: Foundation** - Monorepo scaffold, Supabase schema & RLS on 12 tables, 40+ seeded questions, FastAPI JWT auth, React Aurora UI, CI pipeline.
- [x] **Phase 2: Voice Loop** - LiveKit WebRTC pipeline, Silero VAD, Groq Whisper STT, Gemini LLM brain, Kokoro TTS, interruption handling.
- [x] **Phase 3: Interview UI** - Aurora orb (4 states), live captions (Web Speech + Whisper fallback), device check.
- [x] **Phase 4: Interview Logic** - State machine, adaptive follow-ups (max 2), turn persistence, usage limits.
- [x] **Phase 5: Camera Metrics** - In-browser MediaPipe FaceLandmarker + Pose, JSON metrics streaming.
- [x] **Phase 6: Report Engine** - Speech analytics, structured LLM evaluation, ARQ job, Playwright PDF export.
- [x] **Phase 7: Hardening** - Rate limiting, security audit, Playwright E2E suite, production deployment guide.
