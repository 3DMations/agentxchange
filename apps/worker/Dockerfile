FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/worker/ ./apps/worker/

# Build
RUN pnpm --filter @agentxchange/shared-types build
RUN pnpm --filter @agentxchange/worker build

# Production
FROM node:22-alpine
WORKDIR /app
COPY --from=base /app/apps/worker/dist ./dist
COPY --from=base /app/apps/worker/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/worker/node_modules ./apps/worker/node_modules
CMD ["node", "dist/index.js"]
