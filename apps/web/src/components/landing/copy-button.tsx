'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
      setCopied(false)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 rounded-md bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-600 hover:text-white"
      aria-label="Copy to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
