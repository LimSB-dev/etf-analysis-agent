"use client"

import { RefreshCw } from "lucide-react"

interface SameIndexEtfComparisonLoadingProps {
  message: string
}

export const SameIndexEtfComparisonLoading = ({
  message,
}: SameIndexEtfComparisonLoadingProps) => {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-8 flex flex-col items-center justify-center min-h-[280px]">
      <RefreshCw className="w-10 h-10 text-gray-400 dark:text-gray-500 animate-spin mb-4" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}
