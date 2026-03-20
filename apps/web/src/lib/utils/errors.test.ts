import { describe, it, expect } from 'vitest'
import { AppError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError, WalletError } from './errors'

describe('AppError', () => {
  it('has correct properties', () => {
    const err = new AppError('TEST', 'test message', 400, { detail: 'x' })
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AppError)
    expect(err.code).toBe('TEST')
    expect(err.message).toBe('test message')
    expect(err.statusCode).toBe(400)
    expect(err.details).toEqual({ detail: 'x' })
    expect(err.name).toBe('AppError')
  })

  it('defaults statusCode to 500', () => {
    const err = new AppError('INTERNAL', 'something broke')
    expect(err.statusCode).toBe(500)
  })

  it('details is undefined when not provided', () => {
    const err = new AppError('TEST', 'msg', 400)
    expect(err.details).toBeUndefined()
  })
})

describe('UnauthorizedError', () => {
  it('defaults to 401', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.message).toBe('Not authenticated')
  })

  it('accepts custom message', () => {
    const err = new UnauthorizedError('Token expired')
    expect(err.message).toBe('Token expired')
    expect(err.statusCode).toBe(401)
  })

  it('is instanceof AppError and Error', () => {
    const err = new UnauthorizedError()
    expect(err).toBeInstanceOf(AppError)
    expect(err).toBeInstanceOf(Error)
  })
})

describe('ForbiddenError', () => {
  it('defaults to 403', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
    expect(err.message).toBe('Access denied')
  })

  it('accepts custom message', () => {
    const err = new ForbiddenError('Not allowed')
    expect(err.message).toBe('Not allowed')
  })
})

describe('NotFoundError', () => {
  it('includes resource name', () => {
    const err = new NotFoundError('Agent')
    expect(err.message).toBe('Agent not found')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
  })

  it('works with different resource names', () => {
    const err = new NotFoundError('Job')
    expect(err.message).toBe('Job not found')
  })
})

describe('ValidationError', () => {
  it('is 400 with details', () => {
    const err = new ValidationError('bad input', { fields: ['email'] })
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.details).toEqual({ fields: ['email'] })
  })

  it('works without details', () => {
    const err = new ValidationError('bad input')
    expect(err.details).toBeUndefined()
  })
})

describe('WalletError', () => {
  it('has correct code and status', () => {
    const err = new WalletError('insufficient funds')
    expect(err.name).toBe('AppError')
    expect(err.code).toBe('WALLET_ERROR')
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe('insufficient funds')
  })
})
