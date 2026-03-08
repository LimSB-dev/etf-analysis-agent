/**
 * 적정가·프리미엄·매매 신호 계산
 * - 적정가 = ETF 전일종가 × (1 + 기초지수 수익률) × (1 + 환율 변동률)
 * - 프리미엄 = (현재가 - 적정가) / 적정가 × 100
 * - BUY: 프리미엄 ≤ buyThreshold(%), SELL: ≥ sellThreshold(%), HOLD: 그 외
 */

export type SignalType = "BUY" | "SELL" | "HOLD"

export interface FairValueResultType {
  fairValue: number
  premium: number
  signal: SignalType
}

export interface FairValueThresholdsType {
  buyThreshold?: number
  sellThreshold?: number
}

const DEFAULT_BUY = -1
const DEFAULT_SELL = 1

/**
 * 단일 ETF에 대한 적정가·프리미엄·신호 계산
 * @param price 현재가
 * @param prevClose ETF 전일 종가 (적정가 산출 기준)
 * @param indexReturn 기초지수 수익률
 * @param fxReturn 환율 변동률
 * @param thresholds 매수/매도 기준 % (미지정 시 -1%, 1%)
 */
export function calculateFairValue(
  price: number,
  prevClose: number,
  indexReturn: number,
  fxReturn: number,
  thresholds: FairValueThresholdsType = {},
): FairValueResultType {
  const fairValue = prevClose * (1 + indexReturn) * (1 + fxReturn)
  const premium = fairValue > 0 ? ((price - fairValue) / fairValue) * 100 : 0
  const buyT = thresholds.buyThreshold ?? DEFAULT_BUY
  const sellT = thresholds.sellThreshold ?? DEFAULT_SELL
  let signal: SignalType = "HOLD"
  if (premium <= buyT) {
    signal = "BUY"
  } else if (premium >= sellT) {
    signal = "SELL"
  }
  return { fairValue, premium, signal }
}
