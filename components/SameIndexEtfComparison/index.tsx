"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { fetchSameIndexEtfComparison } from "@/app/actions"
import type { Locale } from "@/lib/i18n/config"
import { SameIndexEtfComparisonLoading } from "./SameIndexEtfComparisonLoading"
import { SameIndexEtfComparisonError } from "./SameIndexEtfComparisonError"
import { SameIndexEtfComparisonEmpty } from "./SameIndexEtfComparisonEmpty"
import { SameIndexEtfComparisonHeader } from "./SameIndexEtfComparisonHeader"
import {
  SameIndexEtfComparisonTable,
  type ComparisonRowType,
} from "./SameIndexEtfComparisonTable"

const getSignal = (premium: number): "BUY" | "SELL" | "HOLD" => {
  if (premium >= 1) {
    return "SELL"
  }
  if (premium <= -1) {
    return "BUY"
  }
  return "HOLD"
}

export interface SameIndexEtfComparisonProps {
  indexSymbol: string
  indexName: string
  locale: Locale
}

export const SameIndexEtfComparison = ({
  indexSymbol,
  indexName,
  locale,
}: SameIndexEtfComparisonProps) => {
  const t = useTranslations()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ComparisonRowType[]>([])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchSameIndexEtfComparison(indexSymbol)
      const indexPrev = res.index.prevClose
      const indexPrice = res.index.price
      const fxPrev = res.fx.prevClose
      const fxNow = res.fx.price

      const indexReturn =
        indexPrev > 0 && indexPrice > 0
          ? (indexPrice - indexPrev) / indexPrev
          : 0
      const fxReturn =
        fxPrev > 0 && fxNow > 0 ? (fxNow - fxPrev) / fxPrev : 0

      const computed: ComparisonRowType[] = res.etfs
        .filter((r) => r.nav > 0 && r.price > 0)
        .map((r) => {
          const iNav = r.nav * (1 + indexReturn) * (1 + fxReturn)
          const premium = ((r.price - iNav) / iNav) * 100
          return {
            ...r,
            indexReturn,
            fxReturn,
            iNav,
            premium,
            signal: getSignal(premium),
          }
        })

      setRows(computed)
    } catch (e) {
      console.error("Same-index ETF comparison fetch failed", e)
      setError(t("fetchFailed"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [indexSymbol])

  const fmtKrw = (num: number) =>
    num.toLocaleString(locale === "ko" ? "ko-KR" : "en-US", {
      maximumFractionDigits: 0,
    })
  const fmtPct = (num: number) =>
    `${num >= 0 ? "+" : ""}${num.toLocaleString(
      locale === "ko" ? "ko-KR" : "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}%`
  const fmtGap = (num: number) =>
    `${num >= 0 ? "+" : ""}${num.toLocaleString(
      locale === "ko" ? "ko-KR" : "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      },
    )}`

  if (loading) {
    return <SameIndexEtfComparisonLoading message={t("fetchingData")} />
  }

  if (error) {
    return (
      <SameIndexEtfComparisonError
        message={error}
        retryLabel={t("autoFetchPrices")}
        onRetry={load}
      />
    )
  }

  if (rows.length === 0) {
    return (
      <SameIndexEtfComparisonEmpty message={t("sameIndexComparisonNoData")} />
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden">
      <SameIndexEtfComparisonHeader
        title={t("sameIndexComparisonTitle")}
        indexName={indexName}
        refreshLabel={t("autoFetchPrices")}
        onRefresh={load}
      />
      <SameIndexEtfComparisonTable
        rows={rows}
        tableTitle={t("sameIndexComparisonTitle")}
        etfNameLabel={t("sameIndexComparisonEtfName")}
        currentPriceLabel={t("currentPrice")}
        iNavLabel={t("sameIndexComparisonINav")}
        gapLabel={t("sameIndexComparisonGap")}
        currentPremiumLabel={t("currentPremium")}
        signalLabel={t("signal")}
        buyLabel={t("buyAction")}
        sellLabel={t("sellAction")}
        holdLabel={t("holdAction")}
        formatKrw={fmtKrw}
        formatPct={fmtPct}
        formatGap={fmtGap}
      />
      <p className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
        {t("sameIndexComparisonDisclaimer")}
      </p>
    </div>
  )
}
