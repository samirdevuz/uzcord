# ── 1-bosqich: build ────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── 2-bosqich: ishga tushirish ──────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Root sifatida ishlatmaymiz
USER node

CMD ["node", "dist/index.js"]
