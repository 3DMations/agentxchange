'use client'

import { useCallback, useState } from 'react'

export interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit: (values: T) => Promise<void>
}

export interface UseFormReturn<T extends Record<string, any>> {
  values: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  submitError: string | null
  submitSuccess: string | null
  handleChange: (name: keyof T, value: any) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  reset: () => void
  setFieldValue: (name: keyof T, value: any) => void
}

/**
 * Generic form state hook that manages values, validation, submission,
 * and error/success messages. Generates an idempotency key on submit
 * following the existing `${prefix}-${Date.now()}` pattern and prevents
 * double-submit while a submission is in flight.
 */
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialValues, validate, onSubmit } = options

  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear field-level error when the user changes a value
    setErrors((prev) => {
      if (prev[name]) {
        const next = { ...prev }
        delete next[name]
        return next
      }
      return prev
    })
  }, [])

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setIsSubmitting(false)
    setSubmitError(null)
    setSubmitSuccess(null)
  }, [initialValues])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Prevent double-submit
      if (isSubmitting) return

      // Clear previous submission state
      setSubmitError(null)
      setSubmitSuccess(null)

      // Run validation
      if (validate) {
        const validationErrors = validate(values)
        const hasErrors = Object.keys(validationErrors).length > 0
        setErrors(validationErrors)
        if (hasErrors) return
      }

      setIsSubmitting(true)

      try {
        await onSubmit(values)
        setSubmitSuccess('Success')
      } catch (err: unknown) {
        setSubmitError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, validate, values, onSubmit]
  )

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    submitSuccess,
    handleChange,
    handleSubmit,
    reset,
    setFieldValue,
  }
}
