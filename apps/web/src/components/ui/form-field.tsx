"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Input variant                                                             */
/* -------------------------------------------------------------------------- */

const inputVariants = cva(
  "flex w-full rounded-md border bg-background px-3 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      state: {
        default:
          "border-input focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500",
        error:
          "border-destructive focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive",
      },
      inputSize: {
        default: "h-12",
        sm: "h-9",
      },
    },
    defaultVariants: {
      state: "default",
      inputSize: "default",
    },
  }
)

/* -------------------------------------------------------------------------- */
/*  FormField wrapper                                                         */
/* -------------------------------------------------------------------------- */

export interface FormFieldProps {
  label?: string
  name: string
  error?: string
  helperText?: string
  required?: boolean
  children?: React.ReactNode
  className?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, name, error, helperText, required, children, className }, ref) => {
    const errorId = `${name}-error`
    const helperId = `${name}-helper`
    const describedBy = [
      error ? errorId : undefined,
      helperText && !error ? helperId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined

    return (
      <div ref={ref} className={cn("space-y-1.5", className)}>
        {label && (
          <label
            htmlFor={name}
            className="text-sm font-medium leading-none text-foreground"
          >
            {label}
            {required && (
              <span className="ml-0.5 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {children
          ? React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  id: name,
                  name,
                  "aria-invalid": error ? true : undefined,
                  "aria-describedby": describedBy,
                  "aria-required": required || undefined,
                })
              }
              return child
            })
          : null}

        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

/* -------------------------------------------------------------------------- */
/*  FormInput                                                                 */
/* -------------------------------------------------------------------------- */

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, state, inputSize, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ state, inputSize, className }))}
        {...props}
      />
    )
  }
)
FormInput.displayName = "FormInput"

/* -------------------------------------------------------------------------- */
/*  FormTextarea                                                              */
/* -------------------------------------------------------------------------- */

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  state?: "default" | "error"
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, state = "default", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          state === "error"
            ? "border-destructive focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive"
            : "border-input focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500",
          className
        )}
        {...props}
      />
    )
  }
)
FormTextarea.displayName = "FormTextarea"

/* -------------------------------------------------------------------------- */
/*  FormSelect                                                                */
/* -------------------------------------------------------------------------- */

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  state?: "default" | "error"
}

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, state = "default", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-12 w-full appearance-none rounded-md border bg-background px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          state === "error"
            ? "border-destructive focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive"
            : "border-input focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
FormSelect.displayName = "FormSelect"

export { FormField, FormInput, FormTextarea, FormSelect, inputVariants }
