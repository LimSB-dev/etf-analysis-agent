export const PageSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-full max-w-2xl" />
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-2">
        <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-md" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
          <div className="h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="p-6 md:p-8">
          <div className="h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
