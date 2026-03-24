import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sanitizeErrorMessage, handleRouteError } from './error-sanitizer'
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, WalletError } from './errors'

// Mock the logger
vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Import the mocked logger so we can assert on calls
import { logger } from './logger'

describe('sanitizeErrorMessage', () => {
  describe('500 errors', () => {
    it('returns generic message for PostgreSQL relation errors', () => {
      expect(sanitizeErrorMessage('relation "agents" does not exist', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for column errors', () => {
      expect(sanitizeErrorMessage('column "secret_key" does not exist', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for constraint violations', () => {
      expect(sanitizeErrorMessage('duplicate key value violates unique constraint "agents_handle_key"', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for foreign key violations', () => {
      expect(sanitizeErrorMessage('violates foreign key constraint "fk_job_agent"', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for connection errors', () => {
      expect(sanitizeErrorMessage('connection refused to postgres:5432', 500))
        .toBe('An unexpected error occurred')
      expect(sanitizeErrorMessage('ECONNREFUSED 127.0.0.1:5432', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for stack traces', () => {
      expect(sanitizeErrorMessage('Error at Object.foo (/app/src/lib/services/wallet.service.ts:42:10)', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for node_modules paths', () => {
      expect(sanitizeErrorMessage('Cannot find module node_modules/@supabase/client', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for supabase internals', () => {
      expect(sanitizeErrorMessage('supabase.auth.getUser() failed with invalid token', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for syntax errors', () => {
      expect(sanitizeErrorMessage('syntax error at or near "SELECT"', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for pgrst errors', () => {
      expect(sanitizeErrorMessage('pgrst_error: JWT expired', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for unknown error messages', () => {
      expect(sanitizeErrorMessage('Something went wrong in internal processing', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for deadlock errors', () => {
      expect(sanitizeErrorMessage('deadlock detected while updating wallet_ledger', 500))
        .toBe('An unexpected error occurred')
    })

    it('returns generic message for timeout errors', () => {
      expect(sanitizeErrorMessage('statement timeout on query to agents table', 500))
        .toBe('An unexpected error occurred')
      expect(sanitizeErrorMessage('ETIMEDOUT connecting to database', 500))
        .toBe('An unexpected error occurred')
    })
  })

  describe('400 errors', () => {
    it('passes through safe validation messages', () => {
      expect(sanitizeErrorMessage('Invalid input', 400)).toBe('Invalid input')
    })

    it('passes through INSUFFICIENT_FUNDS messages', () => {
      expect(sanitizeErrorMessage('INSUFFICIENT_FUNDS: balance too low', 400))
        .toBe('INSUFFICIENT_FUNDS: balance too low')
    })

    it('sanitizes 400 errors containing internal details', () => {
      expect(sanitizeErrorMessage('invalid input syntax for type uuid: "not-a-uuid"', 400))
        .toBe('Invalid request')
    })

    it('passes through business-logic 400 messages', () => {
      expect(sanitizeErrorMessage('Insufficient balance for escrow', 400))
        .toBe('Insufficient balance for escrow')
    })
  })

  describe('401/403 errors', () => {
    it('passes through safe auth messages', () => {
      expect(sanitizeErrorMessage('Not authenticated', 401)).toBe('Not authenticated')
      expect(sanitizeErrorMessage('Access denied', 403)).toBe('Access denied')
    })

    it('passes through custom auth messages', () => {
      expect(sanitizeErrorMessage('Token expired', 401)).toBe('Token expired')
    })

    it('sanitizes 401 errors containing internal details', () => {
      expect(sanitizeErrorMessage('JWT expired at supabase.auth.getUser()', 401))
        .toBe('Not authenticated')
    })

    it('sanitizes 403 errors containing internal details', () => {
      expect(sanitizeErrorMessage('permission denied for table agents', 403))
        .toBe('Access denied')
    })
  })

  describe('404 errors', () => {
    it('passes through safe not-found messages', () => {
      expect(sanitizeErrorMessage('Agent not found', 404)).toBe('Agent not found')
      expect(sanitizeErrorMessage('Job not found', 404)).toBe('Job not found')
    })

    it('sanitizes 404 errors containing internal details', () => {
      expect(sanitizeErrorMessage('relation "agents" does not exist', 404))
        .toBe('Resource not found')
    })
  })

  describe('409 errors', () => {
    it('passes through safe conflict messages', () => {
      expect(sanitizeErrorMessage('Invalid transition from open to completed', 409))
        .toBe('Invalid transition from open to completed')
    })

    it('sanitizes 409 errors with internal details', () => {
      expect(sanitizeErrorMessage('duplicate key value violates unique constraint "agents_handle_key"', 409))
        .toBe('Conflict')
    })
  })

  describe('429 errors', () => {
    it('passes through rate limit messages', () => {
      expect(sanitizeErrorMessage('Too many requests', 429)).toBe('Too many requests')
    })
  })
})

describe('handleRouteError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AppError handling', () => {
    it('returns sanitized response for ValidationError', async () => {
      const err = new ValidationError('Invalid input', { field: 'email' })
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.message).toBe('Invalid input')
      expect(json.error.details).toEqual({ field: 'email' })
    })

    it('returns sanitized response for NotFoundError', async () => {
      const err = new NotFoundError('Agent')
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.error.code).toBe('NOT_FOUND')
      expect(json.error.message).toBe('Agent not found')
    })

    it('returns sanitized response for UnauthorizedError', async () => {
      const err = new UnauthorizedError()
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(401)
      expect(json.error.code).toBe('UNAUTHORIZED')
      expect(json.error.message).toBe('Not authenticated')
    })

    it('returns sanitized response for ForbiddenError', async () => {
      const err = new ForbiddenError()
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
      expect(json.error.message).toBe('Access denied')
    })

    it('returns sanitized response for WalletError', async () => {
      const err = new WalletError('insufficient funds')
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error.code).toBe('WALLET_ERROR')
      expect(json.error.message).toBe('insufficient funds')
    })

    it('logs 500-level AppErrors server-side', () => {
      const err = new AppError('DB_ERROR', 'relation "agents" does not exist', 500)
      handleRouteError(err, 'test-route')

      expect(logger.error).toHaveBeenCalledWith(
        { err, route: 'test-route' },
        'relation "agents" does not exist'
      )
    })

    it('sanitizes AppError messages that contain internal details', async () => {
      const err = new AppError('DB_ERROR', 'relation "agents" does not exist', 500)
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(json.error.message).toBe('An unexpected error occurred')
      expect(json.error.message).not.toContain('relation')
      expect(json.error.message).not.toContain('agents')
    })

    it('does not log non-500 AppErrors', () => {
      const err = new NotFoundError('Agent')
      handleRouteError(err, 'test-route')

      expect(logger.error).not.toHaveBeenCalled()
    })
  })

  describe('business-logic error handling', () => {
    it('handles INSUFFICIENT_FUNDS errors', async () => {
      const err = new Error('INSUFFICIENT_FUNDS: not enough balance')
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error.code).toBe('INSUFFICIENT_FUNDS')
      expect(logger.warn).toHaveBeenCalled()
    })

    it('handles Invalid transition errors', async () => {
      const err = new Error('Invalid transition from open to completed')
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(409)
      expect(json.error.code).toBe('CONFLICT')
      expect(json.error.message).toBe('Invalid transition from open to completed')
      expect(logger.warn).toHaveBeenCalled()
    })

    it('handles duplicate/already-exists errors', async () => {
      const err = new Error('already registered with this handle')
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(409)
      expect(json.error.code).toBe('CONFLICT')
      expect(logger.warn).toHaveBeenCalled()
    })

    it('sanitizes duplicate errors that contain constraint names', async () => {
      const err = new Error('duplicate key value violates unique constraint "agents_handle_key"')
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(409)
      expect(json.error.code).toBe('CONFLICT')
      expect(json.error.message).toBe('Conflict')
      expect(json.error.message).not.toContain('unique constraint')
    })
  })

  describe('unknown error handling', () => {
    it('returns generic 500 for unknown Error instances', async () => {
      const err = new Error('connection to PostgreSQL failed at 10.0.0.1:5432')
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json.error.code).toBe('INTERNAL')
      expect(json.error.message).toBe('An unexpected error occurred')
      expect(json.error.message).not.toContain('PostgreSQL')
      expect(json.error.message).not.toContain('10.0.0.1')
    })

    it('returns generic 500 for non-Error thrown values', async () => {
      const res = handleRouteError('string error', 'test-route')
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json.error.code).toBe('INTERNAL')
      expect(json.error.message).toBe('An unexpected error occurred')
    })

    it('returns generic 500 for null/undefined errors', async () => {
      const res = handleRouteError(null, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json.error.message).toBe('An unexpected error occurred')
    })

    it('logs the full error details server-side', () => {
      const err = new Error('relation "wallet_ledger" does not exist')
      handleRouteError(err, 'wallet/balance')

      expect(logger.error).toHaveBeenCalledWith(
        { err, route: 'wallet/balance' },
        'relation "wallet_ledger" does not exist'
      )
    })

    it('never leaks Postgres error details to client', async () => {
      const pgErrors = [
        'relation "agents" does not exist',
        'column "password_hash" of relation "agents" does not exist',
        'permission denied for table wallet_ledger',
        'deadlock detected',
        'syntax error at or near "DROP"',
        'invalid input syntax for type uuid: "not-a-uuid"',
      ]

      for (const msg of pgErrors) {
        const res = handleRouteError(new Error(msg), 'test')
        const json = await res.json()
        expect(json.error.message).toBe('An unexpected error occurred')
        // Verify none of the sensitive parts leak
        expect(json.error.message).not.toContain('relation')
        expect(json.error.message).not.toContain('column')
        expect(json.error.message).not.toContain('table')
        expect(json.error.message).not.toContain('syntax')
      }
    })

    it('never leaks stack traces to client', async () => {
      const err = new Error('at Object.query (/app/src/lib/supabase/server.ts:42:10)')
      const res = handleRouteError(err, 'test')
      const json = await res.json()
      expect(json.error.message).toBe('An unexpected error occurred')
    })
  })

  describe('details stripping for 5xx errors', () => {
    it('strips details from 500-level AppError responses', async () => {
      const err = new AppError('DB_ERROR', 'connection failed', 500)
      // Manually set details to simulate an AppError with details
      ;(err as any).details = { table: 'agents', query: 'SELECT *' }
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json.error.details).toBeUndefined()
    })

    it('preserves details on 400-level AppError responses', async () => {
      const err = new ValidationError('Invalid input', { field: 'email', reason: 'required' })
      const res = handleRouteError(err, 'test-route')
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error.details).toEqual({ field: 'email', reason: 'required' })
    })
  })
})
