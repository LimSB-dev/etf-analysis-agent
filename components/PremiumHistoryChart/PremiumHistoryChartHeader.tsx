"use client"

import { BarChart3 } from "lucide-react"

interface PremiumHistoryChartHeaderProps {
  title: string
  etfName: string
  last30Days: string
}

export const PremiumHistoryChartHeader = ({
  title,
  etfName,
  last30Days,
}: PremiumHistoryChartHeaderProps) => {
  return (
    <div className="p-6 pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {etfName} &middot; {last30Days}
        </span>
      </div>
    </div>
  )
}
