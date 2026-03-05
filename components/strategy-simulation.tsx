"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts"
import { Play, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3, Activity, Info } from "lucide-react"
import { runBacktest, type BacktestResult, type EquityCurvePoint } from "@/app/backtest-actions"
import type { Locale } from "@/lib/i18n/config"

const t = {
  ko: {
    sectionTitle: "전략 시뮬레이션",
    sectionDesc: "과거 데이터 기반으로 매매 신호 전략의 성과를 검증합니다",
    period1m: "1개월",
    period3m: "3개월",
    period6m: "약 6개월",
    runSimulation: "시뮬레이션 실행",
    running: "분석 중...",
    strategyReturn: "전략 수익률",
    buyHoldReturn: "단순 보유",
    excessReturn: "초과 수익",
    totalTrades: "총 거래",
    winRate: "승률",
    avgReturn: "평균 수익",
    bestTrade: "최고 수익",
    worstTrade: "최저 수익",
    trades: "회",
    performanceChart: "성과 비교 차트",
    strategy: "전략",
    buyHold: "단순 보유",
    noData: "시뮬레이션할 데이터가 부족합니다.",
    disclaimer: "이 결과는 추정 공정가치를 기반으로 한 과거 시뮬레이션이며 미래 수익을 보장하지 않습니다. 실제 거래 시에는 공식 NAV를 참고하세요.",
    tradeHistory: "거래 내역",
    buyDate: "매수일",
    sellDate: "매도일",
    buyPrice: "매수가",
    sellPrice: "매도가",
    returnPct: "수익률",
    noTrades: "해당 기간에 발생한 거래가 없습니다.",
    excessReturnTooltip: "초과 수익은 전략 수익률에서 단순 보유 수익률을 뺀 값입니다. 양수면 전략이 더 좋은 성과를, 음수면 단순 보유가 더 좋은 성과를 냈다는 의미입니다.",
    analysisMethod: "추정 공정가치 기반 시뮬레이션",
    analysisMethodTooltip: "이 시뮬레이션은 과거 지수/환율 데이터를 기반으로 ETF의 이론적 공정가치를 추정하여 프리미엄/디스카운트를 계산합니다. 실제 운용사 공시 NAV와는 차이가 있을 수 있으며, 과거 데이터이므로 미래 수익을 보장하지 않습니다.",
    analysisPeriod: "분석 기간",
    totalDays: "거래일",
    tradingStrategy: "매매 전략 설정",
    buyWhen: "매수",
    sellWhen: "매도",
    premiumBelow: "프리미엄",
    premiumAbove: "프리미엄",
    orLess: "이하",
    orMore: "이상",
  },
  en: {
    sectionTitle: "Strategy Simulation",
    sectionDesc: "Backtest the signal strategy with historical data",
    period1m: "1M",
    period3m: "3M",
    period6m: "~6M",
    runSimulation: "Run Simulation",
    running: "Analyzing...",
    strategyReturn: "Strategy Return",
    buyHoldReturn: "Buy & Hold",
    excessReturn: "Excess Return",
    totalTrades: "Total Trades",
    winRate: "Win Rate",
    avgReturn: "Avg Return",
    bestTrade: "Best Trade",
    worstTrade: "Worst Trade",
    trades: "",
    performanceChart: "Performance Comparison",
    strategy: "Strategy",
    buyHold: "Buy & Hold",
    noData: "Insufficient data for simulation.",
    disclaimer: "This is a historical simulation based on estimated fair value and does not guarantee future returns. Please refer to official NAV for actual trading.",
    tradeHistory: "Trade History",
    buyDate: "Buy Date",
    sellDate: "Sell Date",
    buyPrice: "Buy Price",
    sellPrice: "Sell Price",
    returnPct: "Return",
    noTrades: "No trades occurred in this period.",
    excessReturnTooltip: "Excess return is the strategy return minus buy & hold return. Positive means the strategy performed better, negative means buy & hold performed better.",
    analysisMethod: "Estimated Fair Value Based Simulation",
    analysisMethodTooltip: "This simulation estimates theoretical fair value based on historical index/FX data to calculate premium/discount. Actual NAV from fund companies may differ, and past results do not guarantee future returns.",
    analysisPeriod: "Analysis Period",
    totalDays: "Trading Days",
    tradingStrategy: "Trading Strategy",
    buyWhen: "Buy",
    sellWhen: "Sell",
    premiumBelow: "Premium ≤",
    premiumAbove: "Premium ≥",
    orLess: "",
    orMore: "",
  },
} as const

type Period = "1m" | "3m" | "6m"

interface StrategySimulationProps {
  etfId: string
  etfName: string
  locale: Locale
}

export function StrategySimulation({ etfId, etfName, locale }: StrategySimulationProps) {
  const labels = t[locale]
  const [period, setPeriod] = useState<Period>("3m")
  const [isLoading, setIsLoading] = useState(false)
  const [buyThreshold, setBuyThreshold] = useState(-1)
  const [sellThreshold, setSellThreshold] = useState(1)
  const [buyInput, setBuyInput] = useState("-1")
  const [sellInput, setSellInput] = useState("1")
  const [resultsCache, setResultsCache] = useState<Record<string, BacktestResult | null>>({})
  const [showTrades, setShowTrades] = useState(false)
  const [autoRun, setAutoRun] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showExcessTooltip, setShowExcessTooltip] = useState(false)
  const prevEtfIdRef = useRef<string>(etfId)

  const getCacheKey = (p: Period, buy: number, sell: number) => `${p}_${buy}_${sell}`
  const result = resultsCache[getCacheKey(period, buyThreshold, sellThreshold)]

  const periods: { value: Period; label: string }[] = [
    { value: "1m", label: labels.period1m },
    { value: "3m", label: labels.period3m },
    { value: "6m", label: labels.period6m },
  ]

  const handleRun = useCallback(async () => {
    setIsLoading(true)
    setShowTrades(false)
    setAutoRun(true)
    try {
      const data = await runBacktest(etfId, period, buyThreshold, sellThreshold)
      const cacheKey = getCacheKey(period, buyThreshold, sellThreshold)
      setResultsCache((prev) => ({
        ...prev,
        [cacheKey]: data,
      }))
    } catch (e) {
      console.error("Backtest failed:", e)
    } finally {
      setIsLoading(false)
    }
  }, [etfId, period, buyThreshold, sellThreshold])

  useEffect(() => {
    if (prevEtfIdRef.current !== etfId) {
      const hadAutoRun = autoRun
      setResultsCache({})
      setBuyInput(buyThreshold.toString())
      setSellInput(sellThreshold.toString())
      prevEtfIdRef.current = etfId
      
      if (hadAutoRun) {
        const timer = setTimeout(() => {
          setIsLoading(true)
          runBacktest(etfId, period, buyThreshold, sellThreshold)
            .then((data) => {
              const cacheKey = getCacheKey(period, buyThreshold, sellThreshold)
              setResultsCache((prev) => ({
                ...prev,
                [cacheKey]: data,
              }))
            })
            .catch((e) => {
              console.error("Backtest failed:", e)
            })
            .finally(() => {
              setIsLoading(false)
            })
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [etfId, period, buyThreshold, sellThreshold, autoRun])

  useEffect(() => {
    const cacheKey = getCacheKey(period, buyThreshold, sellThreshold)
    if (autoRun && !resultsCache[cacheKey] && !isLoading) {
      handleRun()
    }
  }, [period, autoRun, resultsCache, isLoading, handleRun])

  const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`
  const fmtKrw = (v: number) => `${v.toLocaleString("ko-KR")}` + (locale === "ko" ? "원" : "")

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {labels.sectionTitle}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {labels.sectionDesc}
              </p>
              <div className="flex items-center gap-1.5 mt-1 relative">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {labels.analysisMethod}
                </p>
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute left-0 top-full mt-2 w-72 sm:w-96 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl z-10 border border-gray-700">
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700 transform rotate-45" />
                    {labels.analysisMethodTooltip}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trading Strategy Settings - Compact inline */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 -mt-1">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              <span className="font-medium text-gray-600 dark:text-gray-300">{labels.tradingStrategy}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-700">—</span>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span className="text-gray-500 dark:text-gray-400">{labels.buyWhen} ≤</span>
              <input
                type="text"
                inputMode="decimal"
                value={buyInput}
                onChange={(e) => {
                  let val = e.target.value;
                  if (buyInput === "0" && val === "0-") {
                    val = "-";
                  }
                  if (val === "" || val === "-" || val === "-." || /^-?\d*\.?\d*$/.test(val)) {
                    setBuyInput(val);
                  }
                }}
                onBlur={() => {
                  const num = parseFloat(buyInput);
                  if (!isNaN(num)) {
                    setBuyThreshold(num);
                    setBuyInput(num.toString());
                  } else {
                    setBuyInput(buyThreshold.toString());
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="w-11 px-1.5 py-0.5 text-xs text-center font-mono font-semibold border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
              <span className="text-gray-500 dark:text-gray-400">%</span>
            </div>
            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
              <span className="text-gray-500 dark:text-gray-400">{labels.sellWhen} ≥</span>
              <input
                type="text"
                inputMode="decimal"
                value={sellInput}
                onChange={(e) => {
                  let val = e.target.value;
                  if (sellInput === "0" && val === "0-") {
                    val = "-";
                  }
                  if (val === "" || val === "-" || val === "-." || /^-?\d*\.?\d*$/.test(val)) {
                    setSellInput(val);
                  }
                }}
                onBlur={() => {
                  const num = parseFloat(sellInput);
                  if (!isNaN(num)) {
                    setSellThreshold(num);
                    setSellInput(num.toString());
                  } else {
                    setSellInput(sellThreshold.toString());
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="w-11 px-1.5 py-0.5 text-xs text-center font-mono font-semibold border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-red-700 dark:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
              <span className="text-gray-500 dark:text-gray-400">%</span>
            </div>
          </div>

          {/* Period selector + Run button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-1">
              {periods.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setPeriod(p.value)
                  }}
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
              onClick={handleRun}
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
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && !result && (
        <div className="animate-in fade-in duration-300">
          {/* Hero Stats Skeleton */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                  </div>
                  <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Chart Skeleton */}
          <div className="px-6 pb-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
            <div className="h-72 md:h-80 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
          </div>

          {/* Detail Stats Skeleton */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse mx-auto" />
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && result.equityCurve.length > 0 && !isLoading && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Hero Stats - Strategy vs Buy & Hold */}
          <div className="px-6 pb-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strategy Return */}
              <div className="rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {labels.strategyReturn}
                  </span>
                  <div className={`p-1.5 rounded-md ${result.summary.strategyReturn >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    {result.summary.strategyReturn >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
                <div className={`text-3xl font-bold tracking-tight ${result.summary.strategyReturn >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {fmtPct(result.summary.strategyReturn)}
                </div>
              </div>

              {/* Buy & Hold Return */}
              <div className="rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {labels.buyHoldReturn}
                  </span>
                  <div className={`p-1.5 rounded-md ${result.summary.buyHoldReturn >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    {result.summary.buyHoldReturn >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
                <div className={`text-3xl font-bold tracking-tight ${result.summary.buyHoldReturn >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {fmtPct(result.summary.buyHoldReturn)}
                </div>
              </div>

              {/* Excess Return (Alpha) */}
              <div className={`rounded-xl p-5 border relative ${
                result.summary.excessReturn >= 0
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50"
                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium ${
                      result.summary.excessReturn >= 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {labels.excessReturn}
                    </span>
                    <button
                      type="button"
                      onMouseEnter={() => setShowExcessTooltip(true)}
                      onMouseLeave={() => setShowExcessTooltip(false)}
                      onClick={() => setShowExcessTooltip(!showExcessTooltip)}
                      className={`${
                        result.summary.excessReturn >= 0
                          ? "text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                          : "text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
                      } transition-colors`}
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {showExcessTooltip && (
                      <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl z-10 border border-gray-700">
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700 transform rotate-45" />
                        {labels.excessReturnTooltip}
                      </div>
                    )}
                  </div>
                  <div className={`p-1.5 rounded-md ${
                    result.summary.excessReturn >= 0
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "bg-amber-100 dark:bg-amber-900/30"
                  }`}>
                    {result.summary.excessReturn >= 0 ? (
                      <ArrowUpRight className={`w-4 h-4 ${result.summary.excessReturn >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`} />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                </div>
                <div className={`text-3xl font-bold tracking-tight ${
                  result.summary.excessReturn >= 0
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}>
                  {fmtPct(result.summary.excessReturn)}
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {labels.performanceChart}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                {etfName}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 w-full md:w-auto md:ml-2">
                {labels.analysisPeriod}: {result.period.startDate} ~ {result.period.endDate} ({result.period.totalDays} {labels.totalDays})
              </span>
            </div>
            <div className="h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.equityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(val: string) => {
                      const parts = val.split("-")
                      return `${parts[1]}/${parts[2]}`
                    }}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(val: number) => `${val}%`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const point = payload[0].payload as EquityCurvePoint
                      return (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg text-sm">
                          <div className="text-gray-500 dark:text-gray-400 text-xs mb-2">{point.date}</div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                              <span className="text-gray-600 dark:text-gray-300">{labels.strategy}:</span>
                              <span className={`font-semibold ${point.strategy >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {fmtPct(point.strategy)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">{labels.buyHold}:</span>
                              <span className={`font-semibold ${point.buyHold >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {fmtPct(point.buyHold)}
                              </span>
                            </div>
                            {point.signal && (
                              <div className={`mt-1 px-2 py-0.5 rounded text-xs font-bold inline-block w-fit ${
                                point.signal === "BUY"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              }`}>
                                {point.signal}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="strategy"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="buyHold"
                    stroke="#9ca3af"
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={{ r: 4, fill: "#9ca3af", stroke: "#fff", strokeWidth: 2 }}
                  />
                  {/* BUY markers */}
                  {result.equityCurve
                    .filter((p) => p.signal === "BUY")
                    .map((p, idx) => (
                      <ReferenceDot
                        key={`buy-${idx}`}
                        x={p.date}
                        y={p.strategy}
                        r={5}
                        fill="#22c55e"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  {/* SELL markers */}
                  {result.equityCurve
                    .filter((p) => p.signal === "SELL")
                    .map((p, idx) => (
                      <ReferenceDot
                        key={`sell-${idx}`}
                        x={p.date}
                        y={p.strategy}
                        r={5}
                        fill="#ef4444"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-blue-600 rounded" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{labels.strategy}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-gray-400 rounded border-dashed" style={{ borderTop: "2px dashed #9ca3af", height: 0 }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{labels.buyHold}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">BUY</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">SELL</span>
              </div>
            </div>
          </div>

          {/* Detail Stats Grid */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{labels.totalTrades}</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {result.summary.totalTrades}{labels.trades}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{labels.winRate}</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {result.summary.winRate}%
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{labels.avgReturn}</div>
                <div className={`text-lg font-bold ${result.summary.avgTradeReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {fmtPct(result.summary.avgTradeReturn)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{labels.bestTrade}</div>
                <div className="text-lg font-bold text-green-600">
                  {result.summary.maxTradeReturn !== 0 ? fmtPct(result.summary.maxTradeReturn) : "-"}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center col-span-2 md:col-span-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{labels.worstTrade}</div>
                <div className="text-lg font-bold text-red-600">
                  {result.summary.minTradeReturn !== 0 ? fmtPct(result.summary.minTradeReturn) : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Trade History Toggle */}
          {result.trades.length > 0 && (
            <div className="px-6 pb-4">
              <button
                type="button"
                onClick={() => setShowTrades(!showTrades)}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {labels.tradeHistory} ({result.trades.length})
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showTrades ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
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
                            <td className={`px-4 py-2.5 text-right font-semibold font-mono text-xs ${
                              trade.returnPct >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
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

          {/* Disclaimer */}
          <div className="px-6 pb-6">
            <div className="rounded-lg px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              {labels.disclaimer}
            </div>
          </div>
        </div>
      )}

      {/* No data state */}
      {result && result.equityCurve.length === 0 && (
        <div className="px-6 pb-6">
          <div className="rounded-lg p-8 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
            {labels.noData}
          </div>
        </div>
      )}
    </div>
  )
}
