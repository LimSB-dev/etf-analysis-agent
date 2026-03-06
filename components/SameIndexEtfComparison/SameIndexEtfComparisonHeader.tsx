"use client"

import { BarChart3, RefreshCw } from "lucide-react"

interface SameIndexEtfComparisonHeaderProps {
  title: string
  indexName: string
  refreshLabel: string
  onRefresh: () => void
}

export const SameIndexEtfComparisonHeader = ({
  title,
  indexName,
  refreshLabel,
  onRefresh,
}: SameIndexEtfComparisonHeaderProps) => {
  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 justify-between w-full">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {title} · {indexName}
          </h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          {refreshLabel}
        </button>
      </div>
    </div>
  )
}
