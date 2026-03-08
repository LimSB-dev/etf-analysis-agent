"use client"

import { BarChart3, Play, TrendingDown, TrendingUp } from "lucide-react"
import type { PeriodType } from "@/store/strategySimulationSlice"
import { ThresholdPercentInput } from "@/components/shared"

interface PeriodOption {
  value: PeriodType
  label: string
}

interface StrategySimulationSettingsProps {
  labels: {
    tradingStrategy: string
    buyWhen: string
    sellWhen: string
    premiumRangeHint: string
    runSimulation: string
    running: string
  }
  periods: PeriodOption[]
  period: PeriodType
  onPeriodChange: (p: PeriodType) => void
  buyValue: number
  onBuyChange: (n: number) => void
  sellValue: number
  onSellChange: (n: number) => void
  inputMin: number
  inputMax: number
  premiumRange: { min: number; max: number } | undefined
  isLoading: boolean
  onRun: () => void
}

export const StrategySimulationSettings = ({
  labels,
  periods,
  period,
  onPeriodChange,
  buyValue,
  onBuyChange,
  sellValue,
  onSellChange,
  inputMin,
  inputMax,
  premiumRange,
  isLoading,
  onRun,
}: StrategySimulationSettingsProps) => {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 -mt-1">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {labels.tradingStrategy}
          </span>
        </div>
        <span className="text-gray-300 dark:text-gray-700">—</span>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
          <span className="text-gray-500 dark:text-gray-400">{labels.buyWhen} ≤</span>
          <ThresholdPercentInput
            value={buyValue}
            onChange={onBuyChange}
            min={inputMin}
            max={inputMax}
            variant="buy"
            size="compact"
            unitLabel="%"
            className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
          />
        </div>
        <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
          <span className="text-gray-500 dark:text-gray-400">{labels.sellWhen} ≥</span>
          <ThresholdPercentInput
            value={sellValue}
            onChange={onSellChange}
            min={inputMin}
            max={inputMax}
            variant="sell"
            size="compact"
            unitLabel="%"
            className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
          />
        </div>
      </div>
      {premiumRange && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" role="note">
          {labels.premiumRangeHint}: {premiumRange.min}% ~ {premiumRange.max}%
        </p>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-1">
          {periods.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onPeriodChange(p.value)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                period === p.value
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 w-[12rem] px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isLoading ? labels.running : labels.runSimulation}
        </button>
      </div>
    </>
  )
}
