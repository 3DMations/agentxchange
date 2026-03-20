import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

function getTransport() {
  if (isTest || !isDev) return undefined
  try {
    require.resolve('pino-pretty')
    return { target: 'pino-pretty', options: { colorize: true } }
  } catch {
    return undefined
  }
}

export const logger = pino({
  level: isTest ? 'silent' : (process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')),
  ...(getTransport() ? { transport: getTransport() } : {}),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'agentxchange-web',
  },
})

export function createServiceLogger(service: string) {
  return logger.child({ service })
}

// Generate a trace ID for request tracking
export function generateTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
