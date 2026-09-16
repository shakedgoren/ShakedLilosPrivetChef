# BITE & TELL · Express API
# Build context = repository root (needed because the server imports mobile/src/data).
# Railway: railway.toml sets dockerfilePath = server/Dockerfile. Do not set Root Directory to server/.

FROM node:22-bookworm-slim

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
COPY server/prisma ./server/prisma
COPY server/prisma-pg ./server/prisma-pg
COPY server/scripts ./server/scripts

WORKDIR /app/server
RUN npm ci

WORKDIR /app
COPY mobile/src/data ./mobile/src/data
COPY mobile/src/order ./mobile/src/order
COPY server ./server

WORKDIR /app/server
RUN node scripts/db-mode.mjs generate-pg \
  && mkdir -p uploads/avatars

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

# Railway also probes GET /health (see railway.toml). This is for docker run / other hosts.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Release: prisma migrate deploy (Postgres) then the API.
CMD ["npm", "run", "start:prod"]
