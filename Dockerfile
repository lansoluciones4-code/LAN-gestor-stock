FROM node:20-alpine AS base

# --- Dependencies (incluye devDependencies: necesarias para el servicio "migrator") ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

# --- Runtime (imagen final del servicio "app": solo el output standalone) ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
