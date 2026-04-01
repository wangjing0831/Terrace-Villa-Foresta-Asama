# ---- Stage 1: Build ----
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_BASE_PATH: /test for test env, empty for prod (must be declared in builder stage)
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---- Stage 2: Production ----
FROM public.ecr.aws/docker/library/node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# TEST_MODE: injected at build time for test deployments (cicd-test.yml)
ARG TEST_MODE
ENV TEST_MODE=$TEST_MODE

# NEXT_PUBLIC_BASE_PATH: /test for test env, empty for prod
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

# Copy built artifacts
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Data directory (JSON files, uploads)
COPY --from=builder /app/data ./data

EXPOSE 80

ENV PORT=80
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
