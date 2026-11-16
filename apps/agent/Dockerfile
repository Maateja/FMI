# Dockerfile for FMI LiveKit Voice Agent Worker
FROM python:3.13-slim AS base

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install runtime and audio system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    ffmpeg \
    libasound2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency manifests
COPY pyproject.toml ./

# Install agent dependencies
RUN uv pip install --system -e .

# Copy agent source code
COPY src/ ./src/

CMD ["python", "-m", "src.main", "start"]
