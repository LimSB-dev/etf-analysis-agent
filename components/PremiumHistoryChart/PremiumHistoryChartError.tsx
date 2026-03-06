"use client"

import { BarChart3 } from "lucide-react"

interface PremiumHistoryChartErrorProps {
  title: string
  message: string
}

export const PremiumHistoryChartError = ({
  title,
  message,
}: PremiumHistoryChartErrorProps) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
      <div className="flex items-center justify-center h-32 text-sm text-gray-500">
        {message}
      </div>
    </div>
  )
}
