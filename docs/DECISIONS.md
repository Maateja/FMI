# Architecture Decision Records (ADRs) - Freshers Mock Interview (FMI)

## ADR 001: Monorepo Structure & Service Boundaries
- **Status**: Accepted
- **Context**: FMI consists of a client application (React + Vite), a backend API service (FastAPI), a real-time voice agent worker (LiveKit Agents), and shared database schemas/infrastructure.
- **Decision**: Organize the project into a lightweight monorepo:
  - `apps/web`: React 19, TypeScript strict, Vite, Tailwind CSS, shadcn/ui.
  - `apps/api`: FastAPI (async), Supabase integration, ARQ queue producer.
  - `apps/agent`: LiveKit Agents Python worker with swappable STT/LLM/TTS providers.
  - `supabase/`: Migrations, seed data, and RLS test scripts.
  - `infra/`: Docker Compose and LiveKit configuration.
- **Consequences**: Enables shared type contracts, centralized local development via `docker compose`, and isolated deployments for frontend (Vercel/Cloudflare Pages) and backend/agent (Railway/Render/VM).

---

## ADR 002: Zero-Cost Development AI Stack with Provider Abstraction
- **Status**: Accepted
- **Context**: The project requires a near-$0 cost local development build while retaining the capability to easily switch to paid enterprise providers (Deepgram, Claude, ElevenLabs, Cartesia) without touching core business logic.
- **Decision**: Define strict abstract base classes (`STTProvider`, `LLMProvider`, `TTSProvider`) in `apps/agent/src/providers/base.py`.
  - STT: Default to Groq Whisper (`whisper-large-v3-turbo`) with fallback to local `faster-whisper`.
  - LLM: Default to Gemini 2.0 Flash (free tier) with fallback to Groq Llama 3.3 70B.
  - TTS: Default to Kokoro via Docker-hosted OpenAI-compatible endpoint with fallback to Piper.
  - VAD: Silero VAD embedded in the LiveKit worker.
- **Consequences**: Clean separation of vendor-specific APIs. Switching providers only requires updating environment variables.

---

## ADR 003: Client-Side Body Language Processing (Privacy First)
- **Status**: Accepted
- **Context**: The interview evaluates eye contact, head-pose stability, and posture. Uploading raw video streams to the server presents significant bandwidth, compute, and privacy overhead.
- **Decision**: Run MediaPipe Tasks Vision (`FaceLandmarker` and `PoseLandmarker`) entirely client-side in the browser via a Web Worker. Aggregate metrics into 5-second summary JSON batches and send to FastAPI.
- **Consequences**: Zero raw video data leaves the user's browser, ensuring strict GDPR/privacy compliance, near-zero server GPU load, and minimal network bandwidth.

---

## ADR 004: Dual-Engine Live Captions Architecture
- **Status**: Accepted
- **Context**: Users expect instantaneous visual feedback of their spoken words under the Aurora orb, but browser Web Speech API accuracy varies and is unsupported on some browsers (Firefox, older Safari).
- **Decision**:
  - Primary UI visual: Browser Web Speech API for immediate sub-second visual rendering while speaking.
  - Fallback & Ground Truth: LiveKit agent streams Whisper transcript chunks via WebRTC data channel. The finalized Whisper transcript with word-level timestamps is saved to the database as the sole source of truth for scoring and evaluation.
  - In addition, the system includes an automatic fallback to Whisper-chunk captions on unsupported browsers like Safari and Firefox.
- **Consequences**: Instantaneous visual feedback in supported browsers, graceful degradation on unsupported browsers, and consistent, high-accuracy scoring based on Whisper.

---

## ADR 005: Dual-Mode Auth (Supabase JWT with Local Development Fallback)
- **Status**: Accepted
- **Context**: Local development and automated testing must function both with a live Supabase project and in completely offline/mocked environments without blocking onboarding or CI.
- **Decision**: 
  - Standard path: Supabase Auth (Email/Password + Google OAuth) issues JWTs with `sub`, `email`, and `user_metadata`.
  - Dev/Mock path: Frontend `authStore` provides an instant demo login mode that crafts a client-side JWT signed with the dev secret. FastAPI's `decode_supabase_jwt` verifies signatures while allowing unverified decoding in `development` mode if secret keys are unset.
- **Consequences**: Seamless zero-friction local testing, zero secret leaking, and 100% adherence to production security standards when deployed.

---

## ADR 006: Monorepo Type Safety & Package Boundary Enforcement
- **Status**: Accepted
- **Context**: Shared contracts (Orb state, Interview status, Turns, Metrics) need to stay strictly synchronized between backend and frontend without drift.
- **Decision**:
  - `packages/shared-types`: Strict TypeScript package referenced across workspace projects via `workspace:*`.
  - Python typing: Python 3.11+ with Pydantic v2 schemas and strict mypy verification on both API and Agent services.
- **Consequences**: Zero `any` in TypeScript, 100% type-hinted Python modules, early compile-time catch of breaking schema modifications.
