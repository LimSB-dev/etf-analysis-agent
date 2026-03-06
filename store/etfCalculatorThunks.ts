"use client"

import { createAsyncThunk } from "@reduxjs/toolkit"
import { fetchMarketData } from "@/app/actions"
import { ETF_OPTIONS } from "@/lib/etf-options"
import type { MarketInputsType } from "@/lib/etf-calculator-types"
import { calculatePremiumResult } from "@/lib/premium-calculation"
import {
  setInputs,
  setResult,
  setIsLoading,
  setSelectedEtf,
} from "./etfCalculatorSlice"
import type { AppDispatch, RootState } from "./index"

const DEFAULT_INPUTS: MarketInputsType = {
  etfPrev: "",
  qqqPrev: "",
  qqqAfter: "",
  fxPrev: "",
  fxNow: "",
  etfCurrent: "",
  nav: "",
}

export const fetchEtfDataThunk = createAsyncThunk<
  void,
  { etfId: string; isRefetch: boolean; alertMissing: (msg: string) => void; alertFailed: (msg: string) => void },
  { state: RootState; dispatch: AppDispatch }
>(
  "etfCalculator/fetchData",
  async (
    { etfId, isRefetch, alertMissing, alertFailed },
    { getState, dispatch },
  ) => {
    const etf = ETF_OPTIONS.find((o) => o.id === etfId)
    if (!etf) return

    if (!isRefetch) {
      dispatch(setSelectedEtf(etf))
      dispatch(setInputs(DEFAULT_INPUTS))
      dispatch(setResult(null))
    }
    dispatch(setIsLoading(true))

    try {
      const data = await fetchMarketData(etfId)
      if (data.etf.price === 0 || data.etf.nav === 0) {
        alertMissing("someDataMissing")
      }

      const currentInputs = getState().etfCalculator.inputs
      const newInputs: MarketInputsType = isRefetch
        ? {
            ...currentInputs,
            etfPrev:
              data.etf.prevClose > 0
                ? data.etf.prevClose.toString()
                : currentInputs.etfPrev,
            etfCurrent:
              data.etf.price > 0 ? data.etf.price.toString() : currentInputs.etfCurrent,
            nav: data.etf.nav > 0 ? data.etf.nav.toString() : currentInputs.nav,
            qqqPrev:
              data.index.prevClose > 0
                ? data.index.prevClose.toString()
                : currentInputs.qqqPrev,
            qqqAfter:
              data.index.price > 0
                ? data.index.price.toString()
                : currentInputs.qqqAfter,
            fxPrev:
              data.fx.prevClose > 0
                ? data.fx.prevClose.toString()
                : currentInputs.fxPrev,
            fxNow:
              data.fx.price > 0 ? data.fx.price.toString() : currentInputs.fxNow,
          }
        : {
            ...DEFAULT_INPUTS,
            etfPrev: data.etf.prevClose > 0 ? data.etf.prevClose.toString() : "",
            etfCurrent: data.etf.price > 0 ? data.etf.price.toString() : "",
            nav: data.etf.nav > 0 ? data.etf.nav.toString() : "",
            qqqPrev:
              data.index.prevClose > 0 ? data.index.prevClose.toString() : "",
            qqqAfter: data.index.price > 0 ? data.index.price.toString() : "",
            fxPrev: data.fx.prevClose > 0 ? data.fx.prevClose.toString() : "",
            fxNow: data.fx.price > 0 ? data.fx.price.toString() : "",
          }

      dispatch(setInputs(newInputs))
      const result = calculatePremiumResult(newInputs)
      dispatch(setResult(result))
    } catch (error) {
      console.error("Failed to fetch data", error)
      alertFailed("fetchFailed")
    } finally {
      dispatch(setIsLoading(false))
    }
  },
)
