# Production Deployment & Hardening Guide - Freshers Mock Interview (FMI)

This guide documents the end-to-end production deployment architecture, security hardening policies, infrastructure sizing, environment variables, and operational runbooks for the FMI platform.

---

## 1. System Architecture Overview

```
                                      [ Internet / User Browsers ]
                                                    │
                                     HTTPS / WSS (Port 443)
                                                    ▼
                             [ Cloudflare / Reverse Proxy (Nginx / Caddy) ]
                                 ├── SSL/TLS Termination
                                 ├── OWASP Security Headers & CSP
                                 └── Edge DDoS & Sliding Window Rate Limiting
                                                    │
                 ┌──────────────────────────────────┼──────────────────────────────────┐
                 │                                  │                                  │
                 ▼                                  ▼                                  ▼
      [ Web App (React 19) ]              [ API Gateway / FastAPI ]         [ LiveKit Media Server ]
      - Hosted: Vercel / Cloudflare       - Python 3.13 / Uvicorn           - WebRTC Signaling: 7880
      - Client MediaPipe Landmarking      - Security & RateLimit Middleware - TCP Fallback: 7881
      - Web Speech Live Captions          - Turn & Usage State Machines     - UDP Media: 7882/udp
                 │                                  │                                  │
                 │                                  ▼                                  │
                 │                      [ Redis 7 (ARQ Queue) ]                        │
                 │                      - Report Generation Jobs                       │
                 │                                  │                                  │
                 │                                  ▼                                  │
                 │                      [ LiveKit Agent Worker ] ◄─────────────────────┘
                 │                      - Silero VAD Interruption
                 │                      - Groq Whisper Large v3 STT
                 │                      - Gemini 2.0 Flash LLM
                 │                      - Kokoro TTS (FastAPI Docker)
                 │                                  │
                 ▼                                  ▼
      [ Supabase Managed Postgres (12 Tables with Strict Row Level Security) ]
      - Supabase Auth (JWT ES256 / HS256)
      - Profiles, User Roles, Question Bank, Interviews, Turns, Metrics, Reports
```

---

## 2. Infrastructure Sizing & Compute Requirements

| Component | Minimum Dev Spec | Recommended Production Spec | Hosting Target | Notes |
|-----------|------------------|-----------------------------|----------------|-------|
| **Web Frontend** | 1 vCPU, 512 MB RAM | Serverless CDN Edge | Vercel / Cloudflare Pages / AWS S3+CloudFront | Static bundle with Nginx fallback |
| **API Backend** | 1 vCPU, 1 GB RAM | 2 vCPU, 4 GB RAM | Railway / Render / Fly.io / AWS ECS | Horizontal autoscale based on CPU/reqs |
| **Agent Worker** | 1 vCPU, 1 GB RAM | 2 vCPU, 4 GB RAM | Dedicated VM / ECS / Fly.io Machines | One worker handles ~10-15 concurrent calls |
| **LiveKit Server** | 1 vCPU, 1 GB RAM | 4 vCPU, 8 GB RAM (or LiveKit Cloud) | LiveKit Cloud (Free tier / Pro) or CVO Droplet | Requires public UDP ports (7882) |
| **Kokoro TTS** | 2 vCPU, 2 GB RAM | 2 vCPU, 4 GB RAM (CPU) or 1 T4 GPU | Docker container on VM or Modal / Replicate | Docker image: `ghcr.io/remsky/kokoro-fastapi-cpu` |
| **Redis** | 0.5 vCPU, 256 MB | 1 vCPU, 1 GB RAM | Upstash Redis / Managed Redis 7 | Persistent AOF enabled |
| **PostgreSQL** | Supabase Free | Supabase Pro / AWS RDS PostgreSQL 16 | Supabase Managed | RLS enforced on all tables |

---

## 3. Environment Variables Matrix

All secret credentials must be managed via secret stores (e.g. Doppler, AWS Secrets Manager, GitHub Secrets). Never commit plaintext secrets to source control.

### API (`apps/api/.env`)
| Variable | Required in Prod | Default / Example | Purpose |
|----------|------------------|-------------------|---------|
| `ENVIRONMENT` | Yes | `production` | Enables strict CORS and structured JSON logging |
| `API_V1_PREFIX` | No | `/api/v1` | URL routing prefix |
| `SUPABASE_URL` | Yes | `https://xxxx.supabase.co` | Supabase API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJ...` | Bypasses RLS for admin/service operations |
| `SUPABASE_JWT_SECRET` | Yes | `secret...` | Verifies incoming user JWT tokens |
| `LIVEKIT_URL` | Yes | `wss://livekit.yourdomain.com` | LiveKit server endpoint |
| `LIVEKIT_API_KEY` | Yes | `API...` | LiveKit room generation API key |
| `LIVEKIT_API_SECRET` | Yes | `secret...` | LiveKit room generation API secret |
| `REDIS_URL` | Yes | `redis://default:xxx@redis:6379/0` | ARQ background job queue |
| `RATE_LIMIT_PER_MINUTE` | No | `200` | Sliding window request rate limit |

### Agent (`apps/agent/.env`)
| Variable | Required in Prod | Default / Example | Purpose |
|----------|------------------|-------------------|---------|
| `LIVEKIT_URL` | Yes | `wss://livekit.yourdomain.com` | LiveKit server connection |
| `LIVEKIT_API_KEY` | Yes | `API...` | Agent authentication key |
| `LIVEKIT_API_SECRET` | Yes | `secret...` | Agent authentication secret |
| `STT_PROVIDER` | No | `groq` | Voice recognition provider (`groq`) |
| `GROQ_API_KEY` | Yes | `gsk_...` | Groq Whisper STT API key |
| `LLM_PROVIDER` | No | `gemini` | Interviewer brain provider (`gemini`) |
| `GEMINI_API_KEY` | Yes | `AIza...` | Google Gemini API key |
| `TTS_PROVIDER` | No | `kokoro` | Speech synthesis provider (`kokoro`) |
| `KOKORO_API_URL` | Yes | `http://kokoro:8880/v1` | Kokoro TTS OpenAI-compatible endpoint |
| `KOKORO_VOICE` | No | `af_heart` | Voice timbre identifier |

### Web (`apps/web/.env.production`)
| Variable | Required in Prod | Default / Example | Purpose |
|----------|------------------|-------------------|---------|
| `VITE_API_BASE_URL` | Yes | `https://api.yourdomain.com/api/v1` | Public API gateway base URL |
| `VITE_LIVEKIT_WS_URL` | Yes | `wss://livekit.yourdomain.com` | Public LiveKit WebRTC signaling endpoint |
| `VITE_SUPABASE_URL` | Yes | `https://xxxx.supabase.co` | Supabase Client URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | `eyJ...` | Supabase Public Anon Key |

---

## 4. Security Hardening Policies

The application incorporates multi-layer defense-in-depth:

### 1. OWASP Security Headers (Enforced via `SecurityHeadersMiddleware`)
- **Content-Security-Policy (CSP)**: Restricts script, object, frame, and connect origins.
- **Strict-Transport-Security (HSTS)**: `max-age=31536000; includeSubDomains; preload`.
- **X-Content-Type-Options**: `nosniff` preventing MIME-type confusion attacks.
- **X-Frame-Options**: `DENY` preventing clickjacking.
- **Referrer-Policy**: `strict-origin-when-cross-origin`.
- **Permissions-Policy**: Restricts camera and microphone access to the interview room application only.

### 2. Rate Limiting (`RateLimitMiddleware`)
- Sliding window in-memory (and Redis-backed in multi-instance setups) limiting requests to **200 requests/minute/IP**.
- Returns `429 Too Many Requests` with `Retry-After: 60`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` headers.

### 3. Row Level Security (RLS) Verification
- All 12 PostgreSQL tables (`profiles`, `user_roles`, `interview_templates`, `question_bank`, `interviews`, `interview_turns`, `body_metrics`, `reports`, `resources`, `report_resources`, `consents`, `usage_limits`) have RLS enabled.
- Cross-tenant access is prohibited at the database engine level.
- Automated verification script: `python supabase/tests/verify_rls.py`.

### 4. Client-Side Vision Privacy Guarantee (ADR 003)
- MediaPipe Face & Pose models execute 100% inside the candidate's browser.
- **Zero video frames or raw images are streamed or stored on backend servers.**
- Only aggregated numeric metrics (eye contact %, posture stability %, head nodding count) are sent as lightweight JSON batches.

---

## 5. LiveKit Server & WebRTC Firewall Configuration

For production WebRTC streaming:
1. **Firewall Port Openings**:
   - `TCP 7880`: WebSocket and HTTP signaling
   - `TCP 7881`: WebRTC TCP fallback (for strict corporate firewalls)
   - `UDP 7882`: Primary WebRTC audio/video media transmission
2. **STUN / TURN Servers**:
   - In production NAT environments, configure Coturn or LiveKit Cloud's embedded TURN servers so candidates behind symmetric NATs connect without packet drop.

---

## 6. Docker Container Orchestration

### Multi-Container Stack (`infra/docker-compose.yml`)
To build and start the entire stack locally or on a single production host:

```bash
# 1. Build all images
docker compose -f infra/docker-compose.yml build

# 2. Start services in background
docker compose -f infra/docker-compose.yml up -d

# 3. View service status
docker compose -f infra/docker-compose.yml ps

# 4. Stream service logs
docker compose -f infra/docker-compose.yml logs -f api agent
```

---

## 7. CI/CD Deployment Pipeline

A complete GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every pull request and push to `main`:
1. **Frontend Lint & Test**: `eslint`, `tsc --noEmit`, `vitest run`, `vite build`.
2. **API Backend Checks**: `ruff check`, `mypy src`, `pytest -v`.
3. **Agent Worker Checks**: `ruff check`, `mypy src`, `pytest -v`.
4. **Database RLS Verification**: `python supabase/tests/verify_rls.py`.
5. **Docker Build Validation**: Builds `apps/api/Dockerfile`, `apps/agent/Dockerfile`, and `apps/web/Dockerfile`.

---

## 8. Healthchecks, Monitoring & Observability

- **API Liveness Probe**: `GET /health` → Returns `{"status": "healthy", "service": "fmi-api", "version": "0.1.0"}`
- **API Readiness Probe**: `GET /ready` → Verifies Supabase DB connectivity and Redis availability
- **Structured JSON Logging**: In production, all logs use `structlog` with ISO timestamps, log levels, request IDs, and context dictionaries.
- **Sentry Integration**: Configure `SENTRY_DSN` in `apps/api` and `apps/web` for unhandled exception tracking.
