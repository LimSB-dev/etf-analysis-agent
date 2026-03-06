"use client"

import { useState, useEffect, useRef } from "react"
import { fetchPremiumHistory, type PremiumHistoryResult } from "@/app/actions"
import { useAppSelector } from "@/store/hooks"
import type { Locale } from "@/lib/i18n"
import { premiumChartTranslations } from "@/lib/i18n"
import { PremiumHistoryChartSkeleton } from "@/app/loading/PremiumHistoryChartSkeleton"
import { PremiumHistoryChartError } from "./PremiumHistoryChartError"
import { PremiumHistoryChartHeader } from "./PremiumHistoryChartHeader"
import { PremiumHistoryChartAreaChart } from "./PremiumHistoryChartAreaChart"
import { PremiumHistoryChartStats } from "./PremiumHistoryChartStats"

export interface PremiumHistoryChartProps {
  etfId: string
  etfName: string
  currentPremium?: number
  locale: Locale
}

const applyCurrentPremium = (
  prev: PremiumHistoryResult,
  premium: number,
): PremiumHistoryResult => {
  const updated = { ...prev, data: [...prev.data], stats: { ...prev.stats } }
  if (updated.data.length === 0) {
    return updated
  }
  const rounded = Number(premium.toFixed(2))
  updated.data[updated.data.length - 1] = {
    ...updated.data[updated.data.length - 1],
    premium: rounded,
  }
  updated.stats.current = rounded
  const premiums = updated.data.map((p) => p.premium)
  updated.stats.highest = Math.max(...premiums)
  updated.stats.lowest = Math.min(...premiums)
  updated.stats.average = Number(
    (premiums.reduce((a, b) => a + b, 0) / premiums.length).toFixed(2),
  )
  const range = updated.stats.highest - updated.stats.lowest
  updated.stats.percentile =
    range > 0
      ? Math.round(
          ((updated.stats.current - updated.stats.lowest) / range) * 100,
        )
      : 50
  return updated
}

export const PremiumHistoryChart = ({
  etfId,
  etfName,
  currentPremium,
  locale,
}: PremiumHistoryChartProps) => {
  const t = premiumChartTranslations[locale]
  const cached = useAppSelector((s) => s.etfCalculator.premiumHistoryByEtf?.[etfId])
  const [data, setData] = useState<PremiumHistoryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevPremiumRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (cached != null) {
      const final =
        currentPremium !== undefined && cached.data.length > 0
          ? applyCurrentPremium(cached, currentPremium)
          : cached
      setData(final)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    async function load() {
      try {
        const result = await fetchPremiumHistory(etfId)
        if (!cancelled) {
          const final =
            currentPremium !== undefined && result.data.length > 0
              ? applyCurrentPremium(result, currentPremium)
              : result
          setData(final)
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch premium history:", e)
          setError(t.loadError)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [etfId, cached, currentPremium, t.loadError])

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
      return applyCurrentPremium(prevData, currentPremium)
    })
  }, [currentPremium])

  const fmt = (num: number) => `${num > 0 ? "+" : ""}${num.toFixed(2)}%`

  if (isLoading) {
    return <PremiumHistoryChartSkeleton />
  }

  if (error || !data || data.data.length === 0) {
    return (
      <PremiumHistoryChartError
        title={t.title}
        message={error ?? t.noData}
      />
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <PremiumHistoryChartHeader
        title={t.title}
        etfName={etfName}
        last30Days={t.last30Days}
      />
      <div className="px-2 md:px-6 pt-4 pb-2">
        <PremiumHistoryChartAreaChart
          data={data.data}
          premiumLabel={t.premium}
          formatPremium={fmt}
        />
      </div>
      <PremiumHistoryChartStats stats={data.stats} t={t} formatPremium={fmt} />
    </div>
  )
}
