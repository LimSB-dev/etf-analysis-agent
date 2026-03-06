export const StrategySimulationSkeleton = () => {
  return (
    <div className="min-h-[32rem] md:min-h-[36rem]">
      <div className="px-6 pb-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              </div>
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 pb-4">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
        <div className="h-72 md:h-80 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
      </div>
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
            >
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse mx-auto" />
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
