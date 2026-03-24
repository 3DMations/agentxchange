# AgentXchange MCP Server — Production Docker Image
# Multi-stage build for minimal image size

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

# Copy workspace files needed for dependency resolution
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install all dependencies (dev + prod) for the build stage
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/mcp-server/ ./apps/mcp-server/

# Build shared-types first (workspace dependency), then MCP server
RUN pnpm --filter @agentxchange/shared-types build
RUN pnpm --filter @agentxchange/mcp-server build

# --- Production stage ---
FROM node:22-alpine AS production

RUN apk add --no-cache tini dumb-init
WORKDIR /app

# Copy built output and production dependencies
COPY --from=base /app/apps/mcp-server/dist ./dist
COPY --from=base /app/apps/mcp-server/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

# Health check — MCP server exposes an HTTP health endpoint on port 9091
ENV HEALTH_PORT=9091
EXPOSE 9091

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9091/health || exit 1

# Use tini as PID 1 for proper signal forwarding
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/index.js"]
