"use client"

import type { PayloadAction } from "@reduxjs/toolkit"
import { createSlice } from "@reduxjs/toolkit"
import type { BacktestResult } from "@/app/backtest-actions"

export type PeriodType = "1m" | "3m" | "6m"

export interface StrategySimulationStateType {
  currentEtfId: string | null
  period: PeriodType
  buyThreshold: number
  sellThreshold: number
  buyInput: string
  sellInput: string
  resultsCache: Record<string, BacktestResult | null>
  showTrades: boolean
  autoRun: boolean
  showTooltip: boolean
  showExcessTooltip: boolean
  premiumRangeByPeriod: Record<
    PeriodType,
    { min: number; max: number }
  >
  resultsRevealed: boolean
  isLoading: boolean
}

const initialPremiumRange = {
  "1m": { min: -50, max: 50 },
  "3m": { min: -50, max: 50 },
  "6m": { min: -50, max: 50 },
} as Record<PeriodType, { min: number; max: number }>

const initialState: StrategySimulationStateType = {
  currentEtfId: null,
  period: "3m",
  buyThreshold: -1,
  sellThreshold: 1,
  buyInput: "-1",
  sellInput: "1",
  resultsCache: {},
  showTrades: false,
  autoRun: true,
  showTooltip: false,
  showExcessTooltip: false,
  premiumRangeByPeriod: initialPremiumRange,
  resultsRevealed: false,
  isLoading: false,
}

const strategySimulationSlice = createSlice({
  name: "strategySimulation",
  initialState,
  reducers: {
    setStrategyEtfId: (state, action: PayloadAction<string | null>) => {
      const prev = state.currentEtfId
      state.currentEtfId = action.payload
      if (prev !== action.payload) {
        state.resultsCache = {}
        state.premiumRangeByPeriod = { ...initialPremiumRange }
        state.buyInput = state.buyThreshold.toString()
        state.sellInput = state.sellThreshold.toString()
      }
    },
    setPeriod: (state, action: PayloadAction<PeriodType>) => {
      state.period = action.payload
    },
    setBuyThreshold: (state, action: PayloadAction<number>) => {
      state.buyThreshold = action.payload
    },
    setSellThreshold: (state, action: PayloadAction<number>) => {
      state.sellThreshold = action.payload
    },
    setBuyInput: (state, action: PayloadAction<string>) => {
      state.buyInput = action.payload
    },
    setSellInput: (state, action: PayloadAction<string>) => {
      state.sellInput = action.payload
    },
    setResultsCacheEntry: (
      state,
      action: PayloadAction<{ key: string; value: BacktestResult | null }>,
    ) => {
      state.resultsCache[action.payload.key] = action.payload.value
    },
    setPremiumRangeForPeriod: (
      state,
      action: PayloadAction<{
        period: PeriodType
        min: number
        max: number
      }>,
    ) => {
      state.premiumRangeByPeriod[action.payload.period] = {
        min: action.payload.min,
        max: action.payload.max,
      }
    },
    setShowTrades: (state, action: PayloadAction<boolean>) => {
      state.showTrades = action.payload
    },
    setAutoRun: (state, action: PayloadAction<boolean>) => {
      state.autoRun = action.payload
    },
    setShowTooltip: (state, action: PayloadAction<boolean>) => {
      state.showTooltip = action.payload
    },
    setShowExcessTooltip: (state, action: PayloadAction<boolean>) => {
      state.showExcessTooltip = action.payload
    },
    setResultsRevealed: (state, action: PayloadAction<boolean>) => {
      state.resultsRevealed = action.payload
    },
    setStrategyLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    runBacktestFulfilled: (
      state,
      action: PayloadAction<{
        cacheKey: string
        period: PeriodType
        result: BacktestResult
      }>,
    ) => {
      state.resultsCache[action.payload.cacheKey] = action.payload.result
      state.premiumRangeByPeriod[action.payload.period] = {
        min: action.payload.result.period.premiumMin,
        max: action.payload.result.period.premiumMax,
      }
      state.isLoading = false
      state.resultsRevealed = false
      state.showTrades = false
      state.autoRun = true
    },
    runBacktestRejected: (state) => {
      state.isLoading = false
    },
    clearResultsCache: (state) => {
      state.resultsCache = {}
      state.premiumRangeByPeriod = { ...initialPremiumRange }
    },
  },
})

export const {
  setStrategyEtfId,
  setPeriod,
  setBuyThreshold,
  setSellThreshold,
  setBuyInput,
  setSellInput,
  setResultsCacheEntry,
  setPremiumRangeForPeriod,
  setShowTrades,
  setAutoRun,
  setShowTooltip,
  setShowExcessTooltip,
  setResultsRevealed,
  setStrategyLoading,
  runBacktestFulfilled,
  runBacktestRejected,
  clearResultsCache,
} = strategySimulationSlice.actions
export default strategySimulationSlice.reducer
