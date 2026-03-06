"use client"

import { createAsyncThunk } from "@reduxjs/toolkit"
import { runBacktest } from "@/app/backtest-actions"
import type { PeriodType } from "./strategySimulationSlice"
import {
  runBacktestFulfilled,
  runBacktestRejected,
  setStrategyLoading,
  setResultsRevealed,
  setShowTrades,
  setAutoRun,
} from "./strategySimulationSlice"

const getCacheKey = (
  p: PeriodType,
  buy: number,
  sell: number,
) => `${p}_${buy}_${sell}`

export const runBacktestThunk = createAsyncThunk<
  void,
  {
    etfId: string
    period: PeriodType
    buyThreshold: number
    sellThreshold: number
  }
>(
  "strategySimulation/runBacktest",
  async (
    { etfId, period, buyThreshold, sellThreshold },
    { dispatch },
  ) => {
    dispatch(setResultsRevealed(false))
    dispatch(setStrategyLoading(true))
    dispatch(setShowTrades(false))
    dispatch(setAutoRun(true))

    try {
      const result = await runBacktest(
        etfId,
        period,
        buyThreshold,
        sellThreshold,
      )
      const cacheKey = getCacheKey(period, buyThreshold, sellThreshold)
      dispatch(
        runBacktestFulfilled({
          cacheKey,
          period,
          result,
        }),
      )
    } catch (e) {
      console.error("Backtest failed:", e)
      dispatch(runBacktestRejected())
    }
  },
)
