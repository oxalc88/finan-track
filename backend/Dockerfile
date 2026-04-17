# Stage 1: type-check
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json biome.json knip.json ./
COPY src/ src/
RUN npx tsc --noEmit

# Stage 2: production
FROM node:22-alpine
RUN apk add --no-cache poppler-utils
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./
EXPOSE 7100
CMD ["node", "--import", "tsx", "src/api/index.ts"]
