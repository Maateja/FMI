# Multi-stage production Dockerfile for FMI Web Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration and dependency manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/web/package.json ./apps/web/package.json

# Install all dependencies across workspace
RUN pnpm install --frozen-lockfile

# Copy web source files
COPY apps/web/ ./apps/web/

# Build shared types package then build web application
RUN pnpm --filter @fmi/shared-types build
RUN pnpm --filter web build

# Stage 2: Production Nginx Server
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173 80

CMD ["nginx", "-g", "daemon off;"]
