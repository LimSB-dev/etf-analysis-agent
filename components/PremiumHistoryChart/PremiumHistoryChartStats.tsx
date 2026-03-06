"use client"

interface PremiumHistoryStatsType {
  current: number
  average: number
  highest: number
  lowest: number
  percentile: number
}

interface PremiumHistoryChartStatsProps {
  stats: PremiumHistoryStatsType
  t: {
    currentPosition: string
    cheap: string
    expensive: string
    current: string
    average: string
    highest: string
    lowest: string
    cheapInterpretation: string
    expensiveInterpretation: string
    neutralInterpretation: string
  }
  formatPremium: (num: number) => string
}

export const PremiumHistoryChartStats = ({
  stats,
  t,
  formatPremium,
}: PremiumHistoryChartStatsProps) => {
  const isCheap = stats.percentile <= 30
  const isExpensive = stats.percentile >= 70

  const interpretationText = isCheap
    ? t.cheapInterpretation
        .replace("{premium}", formatPremium(stats.current))
        .replace("{percentile}", `${stats.percentile}`)
    : isExpensive
      ? t.expensiveInterpretation
          .replace("{premium}", formatPremium(stats.current))
          .replace("{percentile}", `${stats.percentile}`)
      : t.neutralInterpretation
          .replace("{premium}", formatPremium(stats.current))
          .replace("{percentile}", `${stats.percentile}`)

  return (
    <div className="p-6 pt-2">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.currentPosition}
          </span>
        </div>
        <div className="relative">
          <div className="relative h-4 rounded-full bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 dark:from-green-900/40 dark:via-yellow-900/40 dark:to-red-900/40 overflow-hidden">
            <div
              className="absolute top-0 h-full w-1 bg-gray-900 dark:bg-gray-100 rounded-full shadow-lg"
              style={{
                left: `${Math.max(0, Math.min(100, stats.percentile))}%`,
                transform: "translateX(-50%)",
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {t.cheap}
            </span>
            <span />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              {t.expensive}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t.current}
          </div>
          <div
            className={`text-lg font-bold ${
              stats.current >= 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatPremium(stats.current)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t.average}
          </div>
          <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {formatPremium(stats.average)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t.highest}
          </div>
          <div className="text-lg font-bold text-red-600">
            {formatPremium(stats.highest)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t.lowest}
          </div>
          <div className="text-lg font-bold text-green-600">
            {formatPremium(stats.lowest)}
          </div>
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg p-4 text-sm ${
          isCheap
            ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
            : isExpensive
              ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
              : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200"
        }`}
      >
        <p className="whitespace-pre-line">{interpretationText}</p>
      </div>
    </div>
  )
}
