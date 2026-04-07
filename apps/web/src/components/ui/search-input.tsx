"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  debounceMs?: number
  ref?: React.Ref<HTMLInputElement>
}

function SearchInput({
  value,
  onChange,
  onSearch,
  debounceMs = 300,
  placeholder = "Search...",
  className,
  ref,
  ...props
}: SearchInputProps) {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      onChange(next)

      if (onSearch) {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          onSearch(next)
        }, debounceMs)
      }
    },
    [onChange, onSearch, debounceMs]
  )

  const handleClear = React.useCallback(() => {
    onChange("")
    if (onSearch) {
      if (timerRef.current) clearTimeout(timerRef.current)
      onSearch("")
    }
  }, [onChange, onSearch])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={ref}
        type="text"
        role="searchbox"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex h-12 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export { SearchInput }
