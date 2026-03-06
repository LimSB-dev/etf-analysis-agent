"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import type { BacktestResult } from "@/app/backtest-actions"
import { StrategySimulationPerformanceChart } from "./StrategySimulationPerformanceChart"

interface StrategySimulationResultsProps {
  result: BacktestResult
  etfName: string
  labels: {
    strategyReturn: string
    buyHoldReturn: string
    excessReturn: string
    excessReturnTooltip: string
    performanceChart: string
    analysisPeriod: string
    totalDays: string
    strategy: string
    buyHold: string
    premium: string
    closingPrice: string
    totalTrades: string
    winRate: string
    avgReturn: string
    bestTrade: string
    worstTrade: string
    trades: string
    tradeHistory: string
    buyDate: string
    sellDate: string
    buyPrice: string
    sellPrice: string
    returnPct: string
    disclaimer: string
  }
  resultsRevealed: boolean
  showExcessTooltip: boolean
  onExcessTooltipChange: (show: boolean) => void
  showTrades: boolean
  onShowTradesChange: (show: boolean) => void
  fmtPct: (v: number) => string
  fmtKrw: (v: number) => string
}

export const StrategySimulationResults = ({
  result,
  etfName,
  labels,
  resultsRevealed,
  showExcessTooltip,
  onExcessTooltipChange,
  showTrades,
  onShowTradesChange,
  fmtPct,
  fmtKrw,
}: StrategySimulationResultsProps) => {
  return (
    <div
      className={`transition-opacity duration-200 ${
        resultsRevealed ? "opacity-100" : "opacity-0"
      }`}
      style={resultsRevealed ? undefined : { minHeight: "32rem" }}
    >
      <div className="px-6 pb-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {labels.strategyReturn}
              </span>
              <div
                className={`p-1.5 rounded-md ${
                  result.summary.strategyReturn >= 0
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                {result.summary.strategyReturn >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
            <div
              className={`text-3xl font-bold tracking-tight ${
                result.summary.strategyReturn >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {fmtPct(result.summary.strategyReturn)}
            </div>
          </div>

          <div className="rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {labels.buyHoldReturn}
              </span>
              <div
                className={`p-1.5 rounded-md ${
                  result.summary.buyHoldReturn >= 0
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                {result.summary.buyHoldReturn >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
            <div
              className={`text-3xl font-bold tracking-tight ${
                result.summary.buyHoldReturn >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {fmtPct(result.summary.buyHoldReturn)}
            </div>
          </div>

          <div
            className={`rounded-xl p-5 border relative ${
              result.summary.excessReturn >= 0
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50"
                : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm font-medium ${
                    result.summary.excessReturn >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {labels.excessReturn}
                </span>
                <button
                  type="button"
                  onMouseEnter={() => onExcessTooltipChange(true)}
                  onMouseLeave={() => onExcessTooltipChange(false)}
                  onClick={() => onExcessTooltipChange(!showExcessTooltip)}
                  className={`${
                    result.summary.excessReturn >= 0
                      ? "text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                      : "text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
                  } transition-colors`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showExcessTooltip && (
                  <div className="absolute left-0 right-0 top-full mt-2 w-full min-w-0 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl z-50 border border-gray-700 whitespace-normal">
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700 transform rotate-45" />
                    <p className="leading-relaxed">
                      {labels.excessReturnTooltip}
                    </p>
                  </div>
                )}
              </div>
              <div
                className={`p-1.5 rounded-md ${
                  result.summary.excessReturn >= 0
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "bg-amber-100 dark:bg-amber-900/30"
                }`}
              >
                {result.summary.excessReturn >= 0 ? (
                  <ArrowUpRight
                    className={`w-4 h-4 ${
                      result.summary.excessReturn >= 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
              </div>
            </div>
            <div
              className={`text-3xl font-bold tracking-tight ${
                result.summary.excessReturn >= 0
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {fmtPct(result.summary.excessReturn)}
            </div>
          </div>
        </div>
      </div>

      <StrategySimulationPerformanceChart
        equityCurve={result.equityCurve}
        periodStartDate={result.period.startDate}
        periodEndDate={result.period.endDate}
        totalDays={result.period.totalDays}
        etfName={etfName}
        labels={{
          performanceChart: labels.performanceChart,
          analysisPeriod: labels.analysisPeriod,
          totalDays: labels.totalDays,
          strategy: labels.strategy,
          buyHold: labels.buyHold,
          premium: labels.premium,
          closingPrice: labels.closingPrice,
        }}
        fmtPct={fmtPct}
        fmtKrw={fmtKrw}
      />

      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {labels.totalTrades}
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {result.summary.totalTrades}
              {labels.trades}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {labels.winRate}
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {result.summary.winRate}%
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {labels.avgReturn}
            </div>
            <div
              className={`text-lg font-bold ${
                result.summary.avgTradeReturn >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {fmtPct(result.summary.avgTradeReturn)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {labels.bestTrade}
            </div>
            <div className="text-lg font-bold text-green-600">
              {result.summary.maxTradeReturn !== 0
                ? fmtPct(result.summary.maxTradeReturn)
                : "-"}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center col-span-2 md:col-span-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {labels.worstTrade}
            </div>
            <div className="text-lg font-bold text-red-600">
              {result.summary.minTradeReturn !== 0
                ? fmtPct(result.summary.minTradeReturn)
                : "-"}
            </div>
          </div>
        </div>
      </div>

      {result.trades.length > 0 && (
        <div className="px-6 pb-4">
          <button
            type="button"
            onClick={() => onShowTradesChange(!showTrades)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {labels.tradeHistory} ({result.trades.length})
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                showTrades ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showTrades && (
            <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {labels.buyDate}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {labels.buyPrice}
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {labels.sellDate}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {labels.sellPrice}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {labels.returnPct}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {result.trades.map((trade, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-mono text-xs">
                          {trade.buyDate}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300 font-mono text-xs">
                          {fmtKrw(trade.buyPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-mono text-xs">
                          {trade.sellDate}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300 font-mono text-xs">
                          {fmtKrw(trade.sellPrice)}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-semibold font-mono text-xs ${
                            trade.returnPct >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {fmtPct(trade.returnPct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="px-6 pb-6">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {labels.disclaimer}
        </p>
      </div>
    </div>
  )
}
