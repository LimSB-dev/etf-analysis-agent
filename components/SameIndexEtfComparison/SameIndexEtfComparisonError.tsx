"use client"

import { RefreshCw } from "lucide-react"

interface SameIndexEtfComparisonErrorProps {
  message: string
  retryLabel: string
  onRetry: () => void
}

export const SameIndexEtfComparisonError = ({
  message,
  retryLabel,
  onRetry,
}: SameIndexEtfComparisonErrorProps) => {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700"
      >
        <RefreshCw className="w-4 h-4" />
        {retryLabel}
      </button>
    </div>
  )
}
