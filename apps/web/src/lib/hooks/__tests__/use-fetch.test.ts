// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useFetch } from '../use-fetch'

describe('useFetch', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  function mockFetchSuccess(data: any) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data, error: null, meta: {} }),
    })
  }

  function mockFetchApiError(message: string, status = 400) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () =>
        Promise.resolve({
          data: null,
          error: { code: 'ERROR', message },
          meta: {},
        }),
    })
  }

  function mockFetchNetworkError() {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
  }

  it('fetches data immediately by default', async () => {
    mockFetchSuccess([{ id: '1' }])

    const { result } = renderHook(() => useFetch('/api/v1/test'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual([{ id: '1' }])
    expect(result.current.error).toBeNull()
  })

  it('does not fetch when immediate is false', async () => {
    mockFetchSuccess([])

    const { result } = renderHook(() =>
      useFetch('/api/v1/test', { immediate: false })
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('handles API error responses', async () => {
    mockFetchApiError('Not found', 404)

    const { result } = renderHook(() => useFetch('/api/v1/test'))

    // Error path also retries, so wait longer
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 6000 }
    )

    expect(result.current.error).toBe('Request failed (404)')
    expect(result.current.data).toBeNull()
  })

  it('handles API error in response body (json.error as string)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ data: null, error: 'Something went wrong' }),
    })

    const { result } = renderHook(() => useFetch('/api/v1/test'))

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 6000 }
    )

    expect(result.current.error).toBe('Something went wrong')
  })

  it('retries once on network failure then succeeds', async () => {
    let callCount = 0
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.reject(new TypeError('Failed to fetch'))
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { recovered: true }, error: null }),
      })
    })

    const { result } = renderHook(() => useFetch('/api/v1/test'))

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 6000 }
    )

    expect(callCount).toBe(2)
    expect(result.current.data).toEqual({ recovered: true })
    expect(result.current.error).toBeNull()
  })

  it('sets error after all retries exhausted', async () => {
    mockFetchNetworkError()

    const { result } = renderHook(() => useFetch('/api/v1/test'))

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 6000 }
    )

    expect(result.current.error).toBe('Failed to fetch')
    expect(result.current.data).toBeNull()
    // 1 initial + 1 retry = 2 calls
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('applies transform function to data', async () => {
    mockFetchSuccess([1, 2, 3])

    const { result } = renderHook(() =>
      useFetch<number>('/api/v1/test', {
        transform: (data: number[]) => data.reduce((a, b) => a + b, 0),
      })
    )

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )

    expect(result.current.data).toBe(6)
  })

  it('refetch triggers a new request', async () => {
    let callCount = 0
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ data: { count: callCount }, error: null }),
      })
    })

    const { result } = renderHook(() => useFetch('/api/v1/test'))

    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 1 })
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toEqual({ count: 2 })
  })

  it('aborts request on unmount', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')

    // Use a fetch that never resolves to simulate in-flight request
    global.fetch = vi.fn().mockImplementation(
      () => new Promise(() => {})
    )

    const { unmount } = renderHook(() => useFetch('/api/v1/test'))

    unmount()

    expect(abortSpy).toHaveBeenCalled()
    abortSpy.mockRestore()
  })

  it('handles abort error gracefully during fetch', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new DOMException('The operation was aborted.', 'AbortError')
      return Promise.reject(err)
    })

    const { result } = renderHook(() => useFetch('/api/v1/test'))

    // Give some time for the fetch to process
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    // AbortError should not set an error message
    expect(result.current.error).toBeNull()
  })

  it('refetches when URL changes', async () => {
    mockFetchSuccess({ url: 'first' })

    const { result, rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: '/api/v1/first' } }
    )

    await waitFor(() => {
      expect(result.current.data).toEqual({ url: 'first' })
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { url: 'second' }, error: null }),
    })

    rerender({ url: '/api/v1/second' })

    await waitFor(() => {
      expect(result.current.data).toEqual({ url: 'second' })
    })
  })
})
