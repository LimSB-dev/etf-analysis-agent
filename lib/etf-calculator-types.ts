export type MarketInputsType = {
  etfPrev: string
  qqqPrev: string
  qqqAfter: string
  fxPrev: string
  fxNow: string
  etfCurrent: string
  nav: string
}

export type CalculationResultType = {
  qqqReturn: number
  fxReturn: number
  etfFair: number
  iNav: number
  premium: number
  signal: "BUY" | "SELL" | "HOLD"
}

export type ExtraTabType = "premium" | "strategy" | "compare" | null
