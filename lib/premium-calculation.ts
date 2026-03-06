import type { MarketInputsType, CalculationResultType } from "@/lib/etf-calculator-types"

export function calculatePremiumResult(
  source: MarketInputsType,
): CalculationResultType | null {
  const etfCurrent = Number.parseFloat(source.etfCurrent)
  const nav = Number.parseFloat(source.nav)
  const qqqPrev = Number.parseFloat(source.qqqPrev)
  const qqqAfter = Number.parseFloat(source.qqqAfter)
  const fxPrev = Number.parseFloat(source.fxPrev)
  const fxNow = Number.parseFloat(source.fxNow)

  if (isNaN(etfCurrent) || etfCurrent <= 0 || isNaN(nav) || nav <= 0) {
    return null
  }

  const qqqReturn =
    !isNaN(qqqPrev) && !isNaN(qqqAfter) && qqqPrev > 0
      ? (qqqAfter - qqqPrev) / qqqPrev
      : 0
  const fxReturn =
    !isNaN(fxPrev) && !isNaN(fxNow) && fxPrev > 0 ? (fxNow - fxPrev) / fxPrev : 0
  const iNav = nav * (1 + qqqReturn) * (1 + fxReturn)
  const premium = ((etfCurrent - iNav) / iNav) * 100

  let signal: "BUY" | "SELL" | "HOLD" = "HOLD"
  if (premium >= 1) {
    signal = "SELL"
  } else if (premium <= -1) {
    signal = "BUY"
  }

  return {
    qqqReturn,
    fxReturn,
    etfFair: nav,
    iNav,
    premium,
    signal,
  }
}
