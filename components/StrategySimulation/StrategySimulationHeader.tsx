"use client"

import { Activity, Info } from "lucide-react"

interface StrategySimulationHeaderProps {
  sectionTitle: string
  sectionDesc: string
  analysisMethod: string
  analysisMethodTooltip: string
  showTooltip: boolean
  onTooltipChange: (show: boolean) => void
}

export const StrategySimulationHeader = ({
  sectionTitle,
  sectionDesc,
  analysisMethod,
  analysisMethodTooltip,
  showTooltip,
  onTooltipChange,
}: StrategySimulationHeaderProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {sectionTitle}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{sectionDesc}</p>
        <div className="flex items-center gap-1.5 mt-1 relative">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {analysisMethod}
          </p>
          <button
            type="button"
            onMouseEnter={() => onTooltipChange(true)}
            onMouseLeave={() => onTooltipChange(false)}
            onClick={() => onTooltipChange(!showTooltip)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          {showTooltip && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-96 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl z-10 border border-gray-700">
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700 transform rotate-45" />
              {analysisMethodTooltip}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
