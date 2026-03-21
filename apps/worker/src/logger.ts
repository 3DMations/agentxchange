// Structured logger for worker process
import pino from 'pino'

export const logger = pino({
  name: 'agentxchange-worker',
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
})
