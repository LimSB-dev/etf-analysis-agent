import { BarChart3 } from "lucide-react"

export const PremiumHistoryChartSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-gray-500 shrink-0" />
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="px-2 md:px-6 pt-4 pb-2">
        <div className="h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
      </div>
      <div className="p-6 pt-2">
        <div className="mb-6">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
          <div className="h-4 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="flex justify-between mt-2">
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center"
            >
              <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2 mx-auto animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
        <div className="mt-4 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    </div>
  )
}
