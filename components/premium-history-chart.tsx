"use client"

import { useState, useEffect, useRef } from "react"
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { fetchPremiumHistory, type PremiumHistoryResult } from "@/app/actions"
import type { Locale } from "@/lib/i18n"
import { premiumChartTranslations } from "@/lib/i18n"

interface PremiumHistoryChartProps {
  etfId: string
  etfName: string
  currentPremium?: number
  locale: Locale
}

export function PremiumHistoryChart({ etfId, etfName, currentPremium, locale }: PremiumHistoryChartProps) {
  const t = premiumChartTranslations[locale]
  const [data, setData] = useState<PremiumHistoryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevPremiumRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchPremiumHistory(etfId)
        if (!cancelled) {
          setData(result)
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch premium history:", e)
          setError(t.loadError)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [etfId, t.loadError])

  useEffect(() => {
    if (!data || currentPremium === undefined || data.data.length === 0) {
      return
    }
    
    if (prevPremiumRef.current === currentPremium) {
      return
    }
    
    prevPremiumRef.current = currentPremium
    
    setData((prevData) => {
      if (!prevData) {
        return prevData
      }
      
      const updatedData = { ...prevData }
      updatedData.data = [...prevData.data]
      updatedData.data[updatedData.data.length - 1] = {
        ...updatedData.data[updatedData.data.length - 1],
        premium: Number(currentPremium.toFixed(2))
      }
      updatedData.stats = { ...prevData.stats }
      updatedData.stats.current = Number(currentPremium.toFixed(2))
      const premiums = updatedData.data.map((p) => p.premium)
      updatedData.stats.highest = Math.max(...premiums)
      updatedData.stats.lowest = Math.min(...premiums)
      updatedData.stats.average = Number((premiums.reduce((a, b) => a + b, 0) / premiums.length).toFixed(2))
      const range = updatedData.stats.highest - updatedData.stats.lowest
      updatedData.stats.percentile = range > 0 ? Math.round(((updatedData.stats.current - updatedData.stats.lowest) / range) * 100) : 50
      return updatedData
    })
  }, [currentPremium])

  const fmt = (num: number) => `${num > 0 ? "+" : ""}${num.toFixed(2)}%`

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.title}</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t.loading}</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data || data.data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.title}</h3>
        </div>
        <div className="flex items-center justify-center h-32 text-sm text-gray-500">
          {error || t.noData}
        </div>
      </div>
    )
  }

  const { stats } = data

  // Determine if current premium is historically cheap
  const isCheap = stats.percentile <= 30
  const isExpensive = stats.percentile >= 70

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.title}</h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {etfName} &middot; {t.last30Days}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 md:px-6 pt-4 pb-2">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="premiumPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="premiumNegative" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickFormatter={(val: string) => {
                  const parts = val.split("-")
                  return `${parts[1]}/${parts[2]}`
                }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickFormatter={(val: number) => `${val}%`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const point = payload[0].payload as { date: string; premium: number }
                  return (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
                      <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">{point.date}</div>
                      <div className={`font-semibold ${point.premium >= 0 ? "text-red-600" : "text-green-600"}`}>
                        {t.premium}: {fmt(point.premium)}
                      </div>
                    </div>
                  )
                }}
              />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="2 4" strokeWidth={0.5} strokeOpacity={0.5} />
              <ReferenceLine y={-1} stroke="#22c55e" strokeDasharray="2 4" strokeWidth={0.5} strokeOpacity={0.5} />
              <Area
                type="monotone"
                dataKey="premium"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#premiumPositive)"
                dot={false}
                activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 pt-2">
        {/* Current Position Bar */}
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
                style={{ left: `${Math.max(0, Math.min(100, stats.percentile))}%`, transform: "translateX(-50%)" }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">{t.cheap}</span>
              <span className={`text-sm font-medium ${isCheap ? "text-green-600" : isExpensive ? "text-red-600" : "text-yellow-600"}`}>
                {isCheap ? t.historicallyCheap : isExpensive ? t.historicallyExpensive : t.historicallyNeutral}
              </span>
              <span className="text-sm font-medium text-red-700 dark:text-red-400">{t.expensive}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.current}</div>
            <div className={`text-lg font-bold ${stats.current >= 0 ? "text-red-600" : "text-green-600"}`}>
              {fmt(stats.current)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.average}</div>
            <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
              {fmt(stats.average)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.highest}</div>
            <div className="text-lg font-bold text-red-600">
              {fmt(stats.highest)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.lowest}</div>
            <div className="text-lg font-bold text-green-600">
              {fmt(stats.lowest)}
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className={`mt-4 rounded-lg p-4 flex items-start gap-3 text-sm ${
          isCheap
            ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
            : isExpensive
              ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
              : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200"
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            {isCheap && <TrendingDown className="w-5 h-5" />}
            {isExpensive && <TrendingUp className="w-5 h-5" />}
            {!isCheap && !isExpensive && <Minus className="w-5 h-5" />}
          </div>
          <p>{isCheap
            ? t.cheapInterpretation
              .replace("{premium}", fmt(stats.current))
              .replace("{percentile}", `${stats.percentile}`)
            : isExpensive
              ? t.expensiveInterpretation
                .replace("{premium}", fmt(stats.current))
                .replace("{percentile}", `${stats.percentile}`)
              : t.neutralInterpretation
                .replace("{premium}", fmt(stats.current))
                .replace("{percentile}", `${stats.percentile}`)}</p>
        </div>
      </div>
    </div>
  )
}
