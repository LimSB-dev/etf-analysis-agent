"use client"

interface SameIndexEtfComparisonEmptyProps {
  message: string
}

export const SameIndexEtfComparisonEmpty = ({
  message,
}: SameIndexEtfComparisonEmptyProps) => {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
      {message}
    </div>
  )
}
