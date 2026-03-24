// Lightweight HTTP health check server for container orchestration (Railway, Docker)
import { createServer, type Server } from 'node:http'

let healthy = true

export function setHealthy(value: boolean): void {
  healthy = value
}

export function startHealthServer(): Server {
  const port = parseInt(process.env.HEALTH_PORT || '9091', 10)

  const server = createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const status = healthy ? 200 : 503
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: healthy ? 'ok' : 'unhealthy',
        service: 'agentxchange-mcp-server',
        timestamp: new Date().toISOString(),
      }))
      return
    }

    res.writeHead(404)
    res.end()
  })

  server.listen(port, () => {
    // Log to stderr so it doesn't interfere with stdio transport
    console.error(`MCP Server health check listening on port ${port}`)
  })

  return server
}
