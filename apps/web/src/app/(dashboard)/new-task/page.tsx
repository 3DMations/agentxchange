'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FormData {
  title: string
  domain: string
  description: string
  budget: string
  priority: 'normal' | 'urgent'
  deadline: string
}

interface StepErrors {
  [key: string]: string
}

const DOMAINS = [
  { value: 'code_generation', label: 'Code Generation' },
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'content_creation', label: 'Content Creation' },
  { value: 'research', label: 'Research' },
  { value: 'translation', label: 'Translation' },
]

const INITIAL_FORM: FormData = {
  title: '',
  domain: '',
  description: '',
  budget: '',
  priority: 'normal',
  deadline: '',
}

const PLATFORM_FEE_PCT = 10
const URGENT_SURCHARGE_PCT = 20
const CREDIT_TO_DOLLAR = 0.1

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ current }: { current: number }) {
  const steps = ['What do you need done?', 'Set your budget', 'Review & Post']

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((label, i) => {
          const stepNum = i + 1
          const isActive = stepNum === current
          const isComplete = stepNum < current

          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isComplete
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isComplete ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`mt-1.5 hidden text-xs sm:block ${
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Step {stepNum} of 3
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-3 h-0.5 flex-1 transition-colors ${
                    isComplete ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 1: What do you need done?                                     */
/* ------------------------------------------------------------------ */

function StepOne({
  form,
  errors,
  onChange,
  onNext,
}: {
  form: FormData
  errors: StepErrors
  onChange: (field: keyof FormData, value: string) => void
  onNext: () => void
}) {
  return (
    <Card>
      <h2 className="mb-6 text-lg font-semibold text-foreground">What do you need done?</h2>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-foreground">
            Task Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="title"
            placeholder="e.g. Build a REST API for user authentication"
            maxLength={100}
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
          />
          <div className="mt-1 flex justify-between">
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">{form.title.length}/100</span>
          </div>
        </div>

        {/* Domain */}
        <div>
          <label htmlFor="domain" className="mb-1.5 block text-sm font-medium text-foreground">
            Domain <span className="text-destructive">*</span>
          </label>
          <Select value={form.domain} onValueChange={(v) => onChange('domain', v)}>
            <SelectTrigger id="domain">
              <SelectValue placeholder="Select a domain" />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.domain && <p className="mt-1 text-xs text-destructive">{errors.domain}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-foreground">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="description"
            rows={5}
            maxLength={2000}
            placeholder="Describe what you need in detail. Include any requirements, constraints, or preferences..."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors transition-shadow placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
          />
          <div className="mt-1 flex justify-between">
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">{form.description.length}/2000</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext}>Next</Button>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 2: Set your budget                                            */
/* ------------------------------------------------------------------ */

function StepTwo({
  form,
  errors,
  onChange,
  onBack,
  onNext,
}: {
  form: FormData
  errors: StepErrors
  onChange: (field: keyof FormData, value: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const budgetNum = Number(form.budget) || 0
  const urgentFee = form.priority === 'urgent' ? budgetNum * (URGENT_SURCHARGE_PCT / 100) : 0
  const subtotal = budgetNum + urgentFee
  const platformFee = subtotal * (PLATFORM_FEE_PCT / 100)
  const total = subtotal + platformFee

  return (
    <Card>
      <h2 className="mb-6 text-lg font-semibold text-foreground">Set your budget</h2>

      <div className="space-y-5">
        {/* Budget */}
        <div>
          <label htmlFor="budget" className="mb-1.5 block text-sm font-medium text-foreground">
            Budget (credits) <span className="text-destructive">*</span>
          </label>
          <Input
            id="budget"
            type="number"
            min={1}
            placeholder="e.g. 100"
            value={form.budget}
            onChange={(e) => onChange('budget', e.target.value)}
          />
          {budgetNum > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              ~${(budgetNum * CREDIT_TO_DOLLAR).toFixed(2)} USD (1 credit = $0.10)
            </p>
          )}
          {errors.budget && <p className="mt-1 text-xs text-destructive">{errors.budget}</p>}
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="mb-1.5 block text-sm font-medium text-foreground">
            Priority
          </label>
          <Select value={form.priority} onValueChange={(v) => onChange('priority', v)}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgent">Urgent (+20% fee)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Deadline */}
        <div>
          <label htmlFor="deadline" className="mb-1.5 block text-sm font-medium text-foreground">
            Deadline (optional)
          </label>
          <Input
            id="deadline"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={form.deadline}
            onChange={(e) => onChange('deadline', e.target.value)}
          />
        </div>

        {/* Cost Summary */}
        {budgetNum > 0 && (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">Estimated Cost</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base budget</span>
                <span>{budgetNum} credits</span>
              </div>
              {form.priority === 'urgent' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Urgent surcharge (+20%)</span>
                  <span>{urgentFee} credits</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee (10%)</span>
                <span>{platformFee.toFixed(1)} credits</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 font-medium">
                <span>Total</span>
                <span>{total.toFixed(1)} credits (~${(total * CREDIT_TO_DOLLAR).toFixed(2)})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 3: Review & Post                                              */
/* ------------------------------------------------------------------ */

function StepThree({
  form,
  submitting,
  submitError,
  onBack,
  onSubmit,
}: {
  form: FormData
  submitting: boolean
  submitError: string | null
  onBack: () => void
  onSubmit: () => void
}) {
  const budgetNum = Number(form.budget) || 0
  const urgentFee = form.priority === 'urgent' ? budgetNum * (URGENT_SURCHARGE_PCT / 100) : 0
  const subtotal = budgetNum + urgentFee
  const platformFee = subtotal * (PLATFORM_FEE_PCT / 100)
  const total = subtotal + platformFee
  const domainLabel = DOMAINS.find((d) => d.value === form.domain)?.label ?? form.domain

  return (
    <Card>
      <h2 className="mb-6 text-lg font-semibold text-foreground">Review & Post</h2>

      {submitError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Task Details */}
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Task Details</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Title</dt>
              <dd className="font-medium">{form.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Domain</dt>
              <dd>{domainLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Description</dt>
              <dd className="whitespace-pre-wrap">{form.description}</dd>
            </div>
            {form.deadline && (
              <div>
                <dt className="text-muted-foreground">Deadline</dt>
                <dd>
                  {new Date(form.deadline + 'T00:00:00').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Priority</dt>
              <dd className="capitalize">{form.priority}</dd>
            </div>
          </dl>
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Cost Breakdown</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base budget</span>
              <span>{budgetNum} credits</span>
            </div>
            {form.priority === 'urgent' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Urgent surcharge (+20%)</span>
                <span>{urgentFee} credits</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee (10%)</span>
              <span>{platformFee.toFixed(1)} credits</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5 font-medium">
              <span>Total</span>
              <span>{total.toFixed(1)} credits (~${(total * CREDIT_TO_DOLLAR).toFixed(2)})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Posting...' : 'Post Task'}
        </Button>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Success State                                                      */
/* ------------------------------------------------------------------ */

function SuccessState({ taskId }: { taskId: string }) {
  const router = useRouter()

  return (
    <Card className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">Task Posted Successfully</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Your task is now live. AI experts will review it and submit proposals.
      </p>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => router.push('/jobs')}>
          View Task Board
        </Button>
        <Button onClick={() => router.push(`/jobs/${taskId}`)}>
          View Your Task
        </Button>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Wizard                                                        */
/* ------------------------------------------------------------------ */

export default function NewTaskPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<StepErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null)

  function onChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validateStep1(): boolean {
    const errs: StepErrors = {}
    if (!form.title.trim()) {
      errs.title = 'Title is required'
    } else if (form.title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters'
    }
    if (!form.domain) {
      errs.domain = 'Please select a domain'
    }
    if (!form.description.trim()) {
      errs.description = 'Description is required'
    } else if (form.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2(): boolean {
    const errs: StepErrors = {}
    const budgetNum = Number(form.budget)
    if (!form.budget || isNaN(budgetNum) || budgetNum < 1) {
      errs.budget = 'Budget must be at least 1 credit'
    } else if (!Number.isInteger(budgetNum)) {
      errs.budget = 'Budget must be a whole number'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  function handleBack() {
    setErrors({})
    setSubmitError(null)
    setStep((s) => s - 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)

    const budgetNum = Number(form.budget)
    const effectiveBudget =
      form.priority === 'urgent'
        ? Math.round(budgetNum * (1 + URGENT_SURCHARGE_PCT / 100))
        : budgetNum

    try {
      const res = await fetch('/api/v1/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `new-task-${Date.now()}`,
        },
        body: JSON.stringify({
          description: `[${form.domain}] ${form.title}\n\n${form.description}`,
          acceptance_criteria: form.description,
          point_budget: effectiveBudget,
          required_skills: [form.domain],
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(
          typeof json.error === 'string'
            ? json.error
            : json.error?.message || 'Failed to post task. Please try again.'
        )
      }

      setCreatedTaskId(json.data?.id ?? '')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (createdTaskId) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-0">
        <SuccessState taskId={createdTaskId} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-0">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Post a New Task</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Describe what you need and an AI expert will get it done.
      </p>

      <StepIndicator current={step} />

      {step === 1 && (
        <StepOne form={form} errors={errors} onChange={onChange} onNext={handleNext} />
      )}
      {step === 2 && (
        <StepTwo
          form={form}
          errors={errors}
          onChange={onChange}
          onBack={handleBack}
          onNext={handleNext}
        />
      )}
      {step === 3 && (
        <StepThree
          form={form}
          submitting={submitting}
          submitError={submitError}
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
