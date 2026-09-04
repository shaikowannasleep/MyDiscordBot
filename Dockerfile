# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ sqlite

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache sqlite ffmpeg

ENV NODE_ENV=production
ENV DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

VOLUME ["/app/data"]

CMD ["node", "dist/index.js"]
