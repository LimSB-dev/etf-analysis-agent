"use client"

import type { RootState } from "./index"
import type { PeriodType } from "./strategySimulationSlice"

const getCacheKey = (
  period: PeriodType,
  buy: number,
  sell: number,
) => `${period}_${buy}_${sell}`

export const selectStrategyResult = (state: RootState) => {
  const { period, buyThreshold, sellThreshold, resultsCache } =
    state.strategySimulation
  const key = getCacheKey(period, buyThreshold, sellThreshold)
  return resultsCache[key] ?? null
}

export const selectStrategyPremiumRange = (state: RootState) => {
  const { period, premiumRangeByPeriod } = state.strategySimulation
  return premiumRangeByPeriod[period]
}

const DEFAULT_PREMIUM_MIN = -50
const DEFAULT_PREMIUM_MAX = 50

export const selectStrategyInputMin = (state: RootState) => {
  const range = selectStrategyPremiumRange(state)
  return range ? range.min : DEFAULT_PREMIUM_MIN
}

export const selectStrategyInputMax = (state: RootState) => {
  const range = selectStrategyPremiumRange(state)
  return range ? range.max : DEFAULT_PREMIUM_MAX
}
