/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@agentxchange/shared-types'],
  serverExternalPackages: ['unleash-client', 'ioredis', 'pino', 'pino-pretty'],
}

module.exports = nextConfig
