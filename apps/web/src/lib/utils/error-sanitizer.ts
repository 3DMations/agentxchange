import { NextResponse } from 'next/server'
import type { ApiResponse } from '@agentxchange/shared-types'
import { AppError } from './errors'
import { apiError } from './api-response'
import { logger } from './logger'

/**
 * Patterns that indicate internal/infrastructure errors that should never
 * be exposed to API clients. These could leak table names, column names,
 * connection strings, stack traces, or other sensitive implementation details.
 */
const INTERNAL_ERROR_PATTERNS = [
  // PostgreSQL / Supabase errors
  /relation ".*" does not exist/i,
  /column ".*" (does not exist|of relation)/i,
  /duplicate key value violates unique constraint/i,
  /violates (foreign key|check|not-null) constraint/i,
  /permission denied for (table|schema|relation)/i,
  /current transaction is aborted/i,
  /deadlock detected/i,
  /connection (refused|terminated|reset)/i,
  /too many connections/i,
  /statement timeout/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ETIMEDOUT/i,
  // Stack traces and internal paths
  /at\s+\S+\s+\(.*:\d+:\d+\)/,
  /node_modules\//,
  /\.ts:\d+/,
  /\.js:\d+/,
  // Supabase internals
  /JWT (expired|malformed|invalid)/i,
  /pgrst_/i,
  /supabase/i,
  // Generic database internals
  /syntax error at or near/i,
  /unterminated/i,
  /invalid input syntax/i,
]

/**
 * Known safe error messages that can be forwarded to clients.
 * These are business-logic errors that don't leak implementation details.
 */
const SAFE_ERROR_MESSAGES: Set<string> = new Set([
  'Not authenticated',
  'Not authorized',
  'Access denied',
  'Token expired',
  'Invalid credentials',
  'Invalid input',
  'Invalid query',
  'Validation failed',
  'Resource not found',
  'Job ID required',
  'Not found',
  'Conflict',
  'Too many requests',
  'Feature disabled',
  'Service unavailable',
])

/**
 * Prefixes that indicate safe business-logic error messages.
 * These messages start with a known prefix and can be forwarded to clients.
 */
const SAFE_ERROR_PREFIXES = [
  'Invalid transition',
  'INSUFFICIENT_FUNDS',
  'Insufficient funds',
  'Insufficient balance',
  'already',
  'duplicate',
  'not found',
]

/**
 * Check if an error message contains patterns that indicate internal details.
 */
function containsInternalDetails(message: string): boolean {
  return INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * Check if an error message is a known safe business-logic error.
 */
function isSafeMessage(message: string): boolean {
  if (SAFE_ERROR_MESSAGES.has(message)) return true

  const lower = message.toLowerCase()
  return SAFE_ERROR_PREFIXES.some((prefix) => lower.startsWith(prefix.toLowerCase()))
}

/**
 * Sanitize an error message for client consumption.
 * Returns the original message if it's safe, or a generic message if it could leak internals.
 */
export function sanitizeErrorMessage(
  message: string,
  statusCode: number
): string {
  // Validation errors (400) with known safe messages pass through
  // 401/403 messages are generally safe (auth-related)
  if (statusCode === 401 || statusCode === 403) {
    // Even auth errors should be checked for internal leaks
    if (containsInternalDetails(message)) {
      return statusCode === 401 ? 'Not authenticated' : 'Access denied'
    }
    return message
  }

  // 404 errors are safe
  if (statusCode === 404) {
    if (containsInternalDetails(message)) {
      return 'Resource not found'
    }
    return message
  }

  // 409 conflict errors — check for safety
  if (statusCode === 409) {
    if (containsInternalDetails(message)) {
      return 'Conflict'
    }
    return message
  }

  // 400 errors — allow safe messages and validation details through
  if (statusCode === 400) {
    if (containsInternalDetails(message)) {
      return 'Invalid request'
    }
    return message
  }

  // 429 rate limit
  if (statusCode === 429) {
    return message
  }

  // 500+ errors — always return generic message.
  // Even if the message looks "safe", 500 errors should never expose details.
  if (statusCode >= 500) {
    return 'An unexpected error occurred'
  }

  return message
}

/**
 * Centralized error handler for API route catch blocks.
 * Logs the full error server-side, returns a sanitized response to the client.
 *
 * Handles:
 * - AppError subclasses (uses their code, message, statusCode, details)
 * - Known business errors (INSUFFICIENT_FUNDS, Invalid transition, duplicates)
 * - Unknown errors (logs full details, returns generic 500)
 */
export function handleRouteError(
  error: unknown,
  route: string
): NextResponse<ApiResponse<null>> {
  // AppError subclasses carry safe, intentional messages
  if (error instanceof AppError) {
    // Still sanitize in case an AppError was constructed with internal details
    const safeMessage = sanitizeErrorMessage(error.message, error.statusCode)

    if (error.statusCode >= 500) {
      logger.error({ err: error, route }, error.message)
    }

    return apiError(error.code, safeMessage, error.statusCode, error.details)
  }

  const rawMessage = error instanceof Error ? error.message : 'Unknown error'

  // Check for known business-logic error patterns
  if (rawMessage.includes('INSUFFICIENT_FUNDS')) {
    logger.warn({ err: error, route }, rawMessage)
    return apiError('INSUFFICIENT_FUNDS', sanitizeErrorMessage(rawMessage, 400), 400)
  }

  if (rawMessage.includes('Invalid transition')) {
    logger.warn({ err: error, route }, rawMessage)
    return apiError('CONFLICT', sanitizeErrorMessage(rawMessage, 409), 409)
  }

  if (rawMessage.includes('duplicate') || rawMessage.includes('already')) {
    logger.warn({ err: error, route }, rawMessage)
    const safeMessage = sanitizeErrorMessage(rawMessage, 409)
    return apiError('CONFLICT', safeMessage, 409)
  }

  // Default: log the full error, return sanitized 500
  logger.error({ err: error, route }, rawMessage)
  return apiError('INTERNAL', 'An unexpected error occurred', 500)
}
