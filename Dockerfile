# ── Stage 1: build the Vite app ──────────────────────────────────────────────
FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# VITE_CONVEX_URL points to the local self-hosted Convex backend via the
# reverse proxy (see docker-compose.yml / nginx.conf).
ARG VITE_CONVEX_URL
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL

# Regenerate Convex types locally (pure codegen, no deployment needed),
# then build the app. Fall back to plain vite build when the "build" script
# is absent from package.json.
RUN bunx convex codegen --typecheck=disable || bunx convex codegen
RUN bun run build || bunx vite build

# ── Stage 2: serve with nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
