"use client"

import { useEffect, useRef } from "react"
import type { Locale } from "@/lib/i18n/config"
import { strategySimulationTranslations } from "@/lib/strategy-simulation-i18n"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setStrategyEtfId,
  setPeriod,
  setBuyThreshold,
  setSellThreshold,
  setBuyInput,
  setSellInput,
  setShowTooltip,
  setShowExcessTooltip,
  setShowTrades,
  setResultsRevealed,
  setStrategyLoading,
} from "@/store/strategySimulationSlice"
import { runBacktestThunk } from "@/store/strategySimulationThunks"
import {
  selectStrategyResult,
  selectStrategyPremiumRange,
  selectStrategyInputMin,
  selectStrategyInputMax,
} from "@/store/strategySimulationSelectors"
import { StrategySimulationHeader } from "./StrategySimulationHeader"
import { StrategySimulationSettings } from "./StrategySimulationSettings"
import { StrategySimulationSkeleton } from "@/app/loading/StrategySimulationSkeleton"
import { StrategySimulationResults } from "./StrategySimulationResults"

export interface StrategySimulationProps {
  etfId: string
  etfName: string
  locale: Locale
}

export function StrategySimulation({
  etfId,
  etfName,
  locale,
}: StrategySimulationProps) {
  const dispatch = useAppDispatch()
  const prevEtfIdRef = useRef<string | null>(null)
  const runStartedForRef = useRef<string | null>(null)

  const labels = strategySimulationTranslations[locale]
  const period = useAppSelector((s) => s.strategySimulation.period)
  const isLoading = useAppSelector((s) => s.strategySimulation.isLoading)
  const buyThreshold = useAppSelector((s) => s.strategySimulation.buyThreshold)
  const sellThreshold = useAppSelector((s) => s.strategySimulation.sellThreshold)
  const result = useAppSelector(selectStrategyResult)
  const premiumRange = useAppSelector(selectStrategyPremiumRange)
  const inputMin = useAppSelector(selectStrategyInputMin)
  const inputMax = useAppSelector(selectStrategyInputMax)
  const showTooltip = useAppSelector((s) => s.strategySimulation.showTooltip)
  const showExcessTooltip = useAppSelector(
    (s) => s.strategySimulation.showExcessTooltip,
  )
  const showTrades = useAppSelector((s) => s.strategySimulation.showTrades)
  const resultsRevealed = useAppSelector(
    (s) => s.strategySimulation.resultsRevealed,
  )
  const autoRun = useAppSelector((s) => s.strategySimulation.autoRun)
  const resultsCache = useAppSelector((s) => s.strategySimulation.resultsCache)

  const periods = [
    { value: "1m" as const, label: labels.period1m },
    { value: "3m" as const, label: labels.period3m },
    { value: "6m" as const, label: labels.period6m },
  ]

  const getCacheKey = (p: typeof period, buy: number, sell: number) =>
    `${p}_${buy}_${sell}`

  const handleRun = () => {
    dispatch(
      runBacktestThunk({
        etfId,
        period,
        buyThreshold,
        sellThreshold,
      }),
    )
  }

  useEffect(() => {
    if (prevEtfIdRef.current !== etfId) {
      const hadAutoRun = autoRun
      dispatch(setStrategyEtfId(etfId))
      prevEtfIdRef.current = etfId
      if (hadAutoRun) {
        dispatch(setStrategyLoading(true))
        const timer = setTimeout(() => {
          dispatch(
            runBacktestThunk({
              etfId,
              period,
              buyThreshold,
              sellThreshold,
            }),
          )
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [
    etfId,
    period,
    buyThreshold,
    sellThreshold,
    autoRun,
    dispatch,
  ])

  useEffect(() => {
    const cacheKey = getCacheKey(period, buyThreshold, sellThreshold)
    if (!autoRun || resultsCache[cacheKey] || isLoading) {
      return
    }
    if (runStartedForRef.current === cacheKey) {
      return
    }
    runStartedForRef.current = cacheKey
    dispatch(
      runBacktestThunk({
        etfId,
        period,
        buyThreshold,
        sellThreshold,
      }),
    )
  }, [
    period,
    autoRun,
    resultsCache,
    isLoading,
    etfId,
    buyThreshold,
    sellThreshold,
    dispatch,
  ])

  useEffect(() => {
    if (!isLoading) {
      runStartedForRef.current = null
    }
  }, [isLoading])

  useEffect(() => {
    if (!isLoading && result && result.equityCurve.length > 0) {
      const id = requestAnimationFrame(() => {
        dispatch(setResultsRevealed(true))
      })
      return () => cancelAnimationFrame(id)
    }
    if (isLoading) {
      dispatch(setResultsRevealed(false))
    }
  }, [isLoading, result, dispatch])

  const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`
  const fmtKrw = (v: number) =>
    `${v.toLocaleString("ko-KR")}` + (locale === "ko" ? "원" : "")

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="p-6 pb-4">
        <div className="flex flex-col gap-4">
          <StrategySimulationHeader
            sectionTitle={labels.sectionTitle}
            sectionDesc={labels.sectionDesc}
            analysisMethod={labels.analysisMethod}
            analysisMethodTooltip={labels.analysisMethodTooltip}
            showTooltip={showTooltip}
            onTooltipChange={(v) => dispatch(setShowTooltip(v))}
          />
          <StrategySimulationSettings
            labels={{
              tradingStrategy: labels.tradingStrategy,
              buyWhen: labels.buyWhen,
              sellWhen: labels.sellWhen,
              premiumRangeHint: labels.premiumRangeHint,
              runSimulation: labels.runSimulation,
              running: labels.running,
            }}
            periods={periods}
            period={period}
            onPeriodChange={(p) => dispatch(setPeriod(p))}
            buyValue={buyThreshold}
            onBuyChange={(n) => {
              dispatch(setBuyThreshold(n))
              dispatch(setBuyInput(n.toString()))
            }}
            sellValue={sellThreshold}
            onSellChange={(n) => {
              dispatch(setSellThreshold(n))
              dispatch(setSellInput(n.toString()))
            }}
            inputMin={inputMin}
            inputMax={inputMax}
            premiumRange={premiumRange}
            isLoading={isLoading}
            onRun={handleRun}
          />
        </div>
      </div>

      {isLoading && <StrategySimulationSkeleton />}

      {result && result.equityCurve.length > 0 && !isLoading && (
        <StrategySimulationResults
          result={result}
          etfName={etfName}
          labels={labels}
          resultsRevealed={resultsRevealed}
          showExcessTooltip={showExcessTooltip}
          onExcessTooltipChange={(v) => dispatch(setShowExcessTooltip(v))}
          showTrades={showTrades}
          onShowTradesChange={(v) => dispatch(setShowTrades(v))}
          fmtPct={fmtPct}
          fmtKrw={fmtKrw}
        />
      )}

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
