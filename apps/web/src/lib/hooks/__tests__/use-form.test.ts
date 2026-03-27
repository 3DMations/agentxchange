// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useForm } from '../use-form'

function mockFormEvent(): React.FormEvent {
  return {
    preventDefault: vi.fn(),
  } as unknown as React.FormEvent
}

describe('useForm', () => {
  it('initializes with provided values', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: '', email: '' },
        onSubmit: vi.fn(),
      })
    )

    expect(result.current.values).toEqual({ name: '', email: '' })
    expect(result.current.errors).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.submitError).toBeNull()
    expect(result.current.submitSuccess).toBeNull()
  })

  it('handleChange updates a field value', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: '' },
        onSubmit: vi.fn(),
      })
    )

    act(() => {
      result.current.handleChange('name', 'Alice')
    })

    expect(result.current.values.name).toBe('Alice')
  })

  it('setFieldValue updates a field value', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { count: 0 },
        onSubmit: vi.fn(),
      })
    )

    act(() => {
      result.current.setFieldValue('count', 42)
    })

    expect(result.current.values.count).toBe(42)
  })

  it('handleChange clears field-level error for that field', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: '' },
        validate: (v) => (v.name ? {} : { name: 'Required' }),
        onSubmit: vi.fn(),
      })
    )

    // Trigger validation failure
    act(() => {
      result.current.handleSubmit(mockFormEvent())
    })
    expect(result.current.errors.name).toBe('Required')

    // Change the field - error should clear
    act(() => {
      result.current.handleChange('name', 'Bob')
    })
    expect(result.current.errors.name).toBeUndefined()
  })

  it('runs validation and sets errors without calling onSubmit', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '' },
        validate: (v) => (v.email ? {} : { email: 'Email required' }),
        onSubmit,
      })
    )

    await act(async () => {
      await result.current.handleSubmit(mockFormEvent())
    })

    expect(result.current.errors.email).toBe('Email required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit when validation passes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: 'Alice' },
        validate: () => ({}),
        onSubmit,
      })
    )

    await act(async () => {
      await result.current.handleSubmit(mockFormEvent())
    })

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice' })
    expect(result.current.submitSuccess).toBe('Success')
    expect(result.current.submitError).toBeNull()
  })

  it('calls onSubmit when no validate function is provided', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: 'Alice' },
        onSubmit,
      })
    )

    await act(async () => {
      await result.current.handleSubmit(mockFormEvent())
    })

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice' })
  })

  it('sets submitError when onSubmit throws', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'))
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: 'Alice' },
        onSubmit,
      })
    )

    await act(async () => {
      await result.current.handleSubmit(mockFormEvent())
    })

    expect(result.current.submitError).toBe('Server error')
    expect(result.current.submitSuccess).toBeNull()
    expect(result.current.isSubmitting).toBe(false)
  })

  it('sets generic error when onSubmit throws non-Error', async () => {
    const onSubmit = vi.fn().mockRejectedValue('raw string error')
    const { result } = renderHook(() =>
      useForm({
        initialValues: { x: 1 },
        onSubmit,
      })
    )

    await act(async () => {
      await result.current.handleSubmit(mockFormEvent())
    })

    expect(result.current.submitError).toBe('An unexpected error occurred')
  })

  it('prevents double-submit while isSubmitting is true', async () => {
    let resolveSubmit: () => void
    const onSubmit = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve })
    )

    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: 'Alice' },
        onSubmit,
      })
    )

    // Start first submit
    let firstSubmit: Promise<void>
    act(() => {
      firstSubmit = result.current.handleSubmit(mockFormEvent())
    })

    expect(result.current.isSubmitting).toBe(true)

    // Try second submit while first is in flight
    await act(async () => {
      await result.current.handleSubmit(mockFormEvent())
    })

    // Only one call should have been made
    expect(onSubmit).toHaveBeenCalledTimes(1)

    // Resolve the pending submit
    await act(async () => {
      resolveSubmit!()
      await firstSubmit!
    })

    expect(result.current.isSubmitting).toBe(false)
  })

  it('clears submitError on new submission', async () => {
    let callCount = 0
    const onSubmit = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) throw new Error('First failure')
      return Promise.resolve()
    })

    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: 'Alice' },
        onSubmit,
      })
    )

    // First submit fails
    await act(async () => {
      await result.current.handleSubmit(mockFormEvent())
    })
    expect(result.current.submitError).toBe('First failure')

    // Second submit clears the error and succeeds
    await act(async () => {
      await result.current.handleSubmit(mockFormEvent())
    })
    expect(result.current.submitError).toBeNull()
    expect(result.current.submitSuccess).toBe('Success')
  })

  it('reset restores initial state', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: '' },
        onSubmit,
      })
    )

    act(() => {
      result.current.handleChange('name', 'Alice')
    })
    await act(async () => {
      await result.current.handleSubmit(mockFormEvent())
    })

    expect(result.current.values.name).toBe('Alice')
    expect(result.current.submitSuccess).toBe('Success')

    act(() => {
      result.current.reset()
    })

    expect(result.current.values.name).toBe('')
    expect(result.current.submitSuccess).toBeNull()
    expect(result.current.submitError).toBeNull()
    expect(result.current.errors).toEqual({})
  })

  it('preventDefault is called on form event', async () => {
    const event = mockFormEvent()
    const { result } = renderHook(() =>
      useForm({
        initialValues: { x: 1 },
        onSubmit: vi.fn().mockResolvedValue(undefined),
      })
    )

    await act(async () => {
      await result.current.handleSubmit(event)
    })

    expect(event.preventDefault).toHaveBeenCalled()
  })
})
