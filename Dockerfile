# Stage 1: Base (Node.js + pnpm)
FROM caomeiyouren/alpine-nodejs:latest AS nodejs

# Stage 2: Builder
FROM nodejs AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++ && \
    python3 --version

COPY package.json pnpm-lock.yaml .npmrc ./

RUN pnpm i --frozen-lockfile

COPY . .

RUN pnpm run build

# Stage 3: Minifier (Analyze dependencies)
FROM nodejs AS docker-minifier

WORKDIR /app

RUN pnpm add @vercel/nft@0.24.4 fs-extra@11.2.0 --save-prod

COPY --from=builder /app /app

RUN export PROJECT_ROOT=/app/ && \
    node /app/scripts/minify-docker.cjs && \
    rm -rf /app/node_modules /app/scripts && \
    mv /app/app-minimal/node_modules /app/ && \
    rm -rf /app/app-minimal

# Stage 4: Production Runtime
FROM caomeiyouren/alpine-nodejs-minimize:latest AS runtime

ENV NODE_ENV production
WORKDIR /app

# Install curl/wget to download BaiduPCS-Go
RUN apk update && apk add --no-cache curl unzip bash

# Download and Install BaiduPCS-Go
RUN wget "https://github.com/qjfoidnh/BaiduPCS-Go/releases/download/v4.0.0/BaiduPCS-Go-v4.0.0-linux-amd64.zip" \
    && unzip "BaiduPCS-Go-v4.0.0-linux-amd64.zip" \
    && mv "BaiduPCS-Go-v4.0.0-linux-amd64/BaiduPCS-Go" "/usr/bin/BaiduPCS-Go" \
    && rm -rf "BaiduPCS-Go-v4.0.0-linux-amd64*" \
    && BaiduPCS-Go -v

# Copy files from minifier and builder
COPY --from=docker-minifier /app /app

# Ensure data and public directories exist for volume mounting
RUN mkdir -p /app/data /app/public/data

# Volumes
VOLUME ["/app/data", "/app/public/data", "/app/rssConfig.yml"]

CMD ["node", "dist/index.mjs"]
