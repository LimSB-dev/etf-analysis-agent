"use client"

import type { PayloadAction } from "@reduxjs/toolkit"
import { createSlice } from "@reduxjs/toolkit"
import { ETF_OPTIONS, type EtfOption } from "@/lib/etf-options"
import type {
  MarketInputsType,
  CalculationResultType,
  ExtraTabType,
} from "@/lib/etf-calculator-types"
import type { PremiumHistoryResult } from "@/app/actions"

export interface UserThresholdsType {
  buy: number
  sell: number
}

export const DEFAULT_THRESHOLDS: UserThresholdsType = { buy: -1, sell: 1 }

const DEFAULT_INPUTS: MarketInputsType = {
  etfPrev: "",
  qqqPrev: "",
  qqqAfter: "",
  fxPrev: "",
  fxNow: "",
  etfCurrent: "",
  nav: "",
}

export interface EtfCalculatorStateType {
  selectedEtf: EtfOption | null
  inputs: MarketInputsType
  result: CalculationResultType | null
  isLoading: boolean
  showSticky: boolean
  showDetails: boolean
  extraTab: ExtraTabType
  isKoreanMarketOpen: boolean
  /** ETF별 프리미엄 추이 캐시 */
  premiumHistoryByEtf: Record<string, PremiumHistoryResult>
  /** ETF별 매수/매도 신호 기준 % (미설정 시 -1, 1) */
  userThresholdsByEtf: Record<string, UserThresholdsType>
}

const initialState: EtfCalculatorStateType = {
  selectedEtf: ETF_OPTIONS[0],
  inputs: DEFAULT_INPUTS,
  result: null,
  isLoading: false,
  showSticky: false,
  showDetails: false,
  extraTab: null,
  isKoreanMarketOpen: true,
  premiumHistoryByEtf: {},
  userThresholdsByEtf: {},
}

const etfCalculatorSlice = createSlice({
  name: "etfCalculator",
  initialState,
  reducers: {
    setSelectedEtf: (state, action: PayloadAction<EtfOption>) => {
      state.selectedEtf = action.payload
    },
    setInputs: (state, action: PayloadAction<MarketInputsType>) => {
      state.inputs = action.payload
    },
    setResult: (state, action: PayloadAction<CalculationResultType | null>) => {
      state.result = action.payload
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setShowSticky: (state, action: PayloadAction<boolean>) => {
      state.showSticky = action.payload
    },
    setShowDetails: (state, action: PayloadAction<boolean>) => {
      state.showDetails = action.payload
    },
    setExtraTab: (state, action: PayloadAction<ExtraTabType>) => {
      state.extraTab = action.payload
    },
    setIsKoreanMarketOpen: (state, action: PayloadAction<boolean>) => {
      state.isKoreanMarketOpen = action.payload
    },
    resetOnEtfChange: (
      state,
      action: PayloadAction<{ etf: EtfOption; inputs: MarketInputsType }>,
    ) => {
      state.selectedEtf = action.payload.etf
      state.inputs = action.payload.inputs
      state.result = null
      state.isLoading = true
    },
    setPremiumHistoryForEtf: (
      state,
      action: PayloadAction<{ etfId: string; data: PremiumHistoryResult | null }>,
    ) => {
      if (action.payload.data === null) {
        delete state.premiumHistoryByEtf[action.payload.etfId]
      } else {
        state.premiumHistoryByEtf[action.payload.etfId] = action.payload.data
      }
    },
    setUserThresholdsByEtf: (
      state,
      action: PayloadAction<Record<string, UserThresholdsType>>,
    ) => {
      state.userThresholdsByEtf = action.payload
    },
  },
})

export const {
  setSelectedEtf,
  setInputs,
  setResult,
  setIsLoading,
  setShowSticky,
  setShowDetails,
  setExtraTab,
  setIsKoreanMarketOpen,
  resetOnEtfChange,
  setPremiumHistoryForEtf,
  setUserThresholdsByEtf,
} = etfCalculatorSlice.actions
export default etfCalculatorSlice.reducer
