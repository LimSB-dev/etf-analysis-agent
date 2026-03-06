"use client"

import { PremiumHistoryChart } from "@/components/PremiumHistoryChart"
import { SameIndexEtfComparison } from "@/components/SameIndexEtfComparison"
import { StrategySimulation } from "@/components/StrategySimulation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setExtraTab } from "@/store/etfCalculatorSlice"
import type { ExtraTabType } from "@/lib/etf-calculator-types"
import type { Locale } from "@/lib/i18n/config"

interface EtfCalculatorExtraTabsProps {
  premiumTrendTab: string
  strategySimulationTab: string
  sameIndexComparisonTab: string
  extraTabsRegionLabel: string
  locale: Locale
}

export const EtfCalculatorExtraTabs = ({
  premiumTrendTab,
  strategySimulationTab,
  sameIndexComparisonTab,
  extraTabsRegionLabel,
  locale,
}: EtfCalculatorExtraTabsProps) => {
  const dispatch = useAppDispatch()
  const extraTab = useAppSelector((s) => s.etfCalculator.extraTab)
  const selectedEtf = useAppSelector((s) => s.etfCalculator.selectedEtf)
  const result = useAppSelector((s) => s.etfCalculator.result)

  const setTab = (tab: ExtraTabType) => dispatch(setExtraTab(tab))

  const tabClass = (current: ExtraTabType) =>
    `inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      extraTab === current
        ? "bg-blue-600 text-white shadow-sm"
        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
    }`

  if (!selectedEtf) return null

  return (
    <section className="mt-8" aria-label={extraTabsRegionLabel}>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab(extraTab === "premium" ? null : "premium")}
          className={tabClass("premium")}
        >
          {premiumTrendTab}
        </button>
        <button
          type="button"
          onClick={() => setTab(extraTab === "strategy" ? null : "strategy")}
          className={tabClass("strategy")}
        >
          {strategySimulationTab}
        </button>
        <button
          type="button"
          onClick={() => setTab(extraTab === "compare" ? null : "compare")}
          className={tabClass("compare")}
        >
          {sameIndexComparisonTab}
        </button>
      </div>
      {extraTab === "premium" && (
        <PremiumHistoryChart
          key={selectedEtf.id}
          etfId={selectedEtf.id}
          etfName={selectedEtf.name}
          currentPremium={result?.premium}
          locale={locale}
        />
      )}
      {extraTab === "strategy" && (
        <StrategySimulation
          key={selectedEtf.id}
          etfId={selectedEtf.id}
          etfName={selectedEtf.name}
          locale={locale}
        />
      )}
      {extraTab === "compare" && (
        <SameIndexEtfComparison
          key={selectedEtf.indexSymbol}
          indexSymbol={selectedEtf.indexSymbol}
          indexName={selectedEtf.indexName}
          locale={locale}
        />
      )}
    </section>
  )
}
