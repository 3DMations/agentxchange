// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { useMobileMenu } from './use-mobile-menu'

describe('useMobileMenu', () => {
  beforeEach(() => {
    // Reset body styles before each test
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.overflow = ''
  })

  it('starts with isOpen false', () => {
    const { result } = renderHook(() => useMobileMenu())
    expect(result.current.isOpen).toBe(false)
  })

  it('toggle flips isOpen from false to true and back', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('open sets isOpen to true, close sets isOpen to false', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('pressing Escape when open calls close', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('pressing Escape when closed does nothing', () => {
    const { result } = renderHook(() => useMobileMenu())
    expect(result.current.isOpen).toBe(false)

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('locks body scroll when open (position: fixed)', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.open()
    })

    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.left).toBe('0px')
    expect(document.body.style.right).toBe('0px')
  })

  it('restores body styles when closed', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.open()
    })
    expect(document.body.style.position).toBe('fixed')

    act(() => {
      result.current.close()
    })
    expect(document.body.style.position).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.top).toBe('')
    expect(document.body.style.left).toBe('')
    expect(document.body.style.right).toBe('')
  })

  it('cleans up body styles on unmount while open', () => {
    const { result, unmount } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.open()
    })
    expect(document.body.style.position).toBe('fixed')

    unmount()

    expect(document.body.style.position).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.top).toBe('')
    expect(document.body.style.left).toBe('')
    expect(document.body.style.right).toBe('')
  })
})
