// OpenTelemetry tracer initialization
// Requires: @opentelemetry/api, @opentelemetry/sdk-node, @opentelemetry/exporter-trace-otlp-http
// These will be added as dependencies when OTel infrastructure is set up

let tracerInstance: any = null

export function getTracer(serviceName = 'agentxchange-web') {
  if (tracerInstance) return tracerInstance

  try {
    // Dynamic import to avoid breaking if OTel packages aren't installed
    const api = require('@opentelemetry/api')
    tracerInstance = api.trace.getTracer(serviceName, '0.1.0')
    return tracerInstance
  } catch {
    // OTel not installed — return a no-op tracer
    return {
      startSpan: (name: string) => ({
        setAttribute: () => {},
        setStatus: () => {},
        recordException: () => {},
        end: () => {},
      }),
      startActiveSpan: (_name: string, fn: (span: any) => any) => fn({
        setAttribute: () => {},
        setStatus: () => {},
        recordException: () => {},
        end: () => {},
      }),
    }
  }
}

export function initTelemetry() {
  try {
    const { NodeSDK } = require('@opentelemetry/sdk-node')
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')

    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      }),
      instrumentations: [getNodeAutoInstrumentations()],
      serviceName: 'agentxchange-web',
    })

    sdk.start()
    console.log('OpenTelemetry initialized')
    return sdk
  } catch {
    console.log('OpenTelemetry packages not installed — tracing disabled')
    return null
  }
}
