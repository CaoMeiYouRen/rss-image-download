# Stage 1: Base (Node.js + pnpm)
# 固定到已修复 2026-10 安全公告的 Node 版本（CVE-2026-111497 等），
# 不使用 apk add nodejs，避免 Alpine 仓库滞后导致运行时仍为旧版本
FROM node:24.22.1-alpine AS nodejs

RUN if command -v corepack >/dev/null 2>&1; then \
      corepack enable && corepack prepare pnpm@11 --activate; \
    elif command -v npm >/dev/null 2>&1; then \
      npm install -g pnpm@11; \
    else \
      echo "corepack and npm are both unavailable"; \
      exit 1; \
    fi

# Stage 2: Builder
FROM nodejs AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++ && \
    python3 --version

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

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
FROM node:24.22.1-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Install curl/wget to download BaiduPCS-Go
# 运行时不需要 npm/corepack，移除以缩小镜像与攻击面
RUN apk update && apk add --no-cache curl unzip bash \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Download and Install BaiduPCS-Go
RUN wget "https://github.com/qjfoidnh/BaiduPCS-Go/releases/download/v4.0.2/BaiduPCS-Go-v4.0.2-linux-amd64.zip" \
    && unzip "BaiduPCS-Go-v4.0.2-linux-amd64.zip" \
    && mv "BaiduPCS-Go-v4.0.2-linux-amd64/BaiduPCS-Go" "/usr/bin/BaiduPCS-Go" \
    && rm -rf "BaiduPCS-Go-v4.0.2-linux-amd64*" \
    && BaiduPCS-Go -v

# Copy files from minifier and builder
COPY --from=docker-minifier /app /app

# Ensure data and public directories exist for volume mounting
RUN mkdir -p /app/data /app/public/data

# Volumes
VOLUME ["/app/data", "/app/public/data", "/app/rssConfig.yml"]

CMD ["node", "dist/index.mjs"]
