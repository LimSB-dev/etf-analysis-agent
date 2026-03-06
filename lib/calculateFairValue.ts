/**
 * 적정가·프리미엄·매매 신호 계산
 * - 적정가 = ETF 전일종가 × (1 + 기초지수 수익률) × (1 + 환율 변동률)
 * - 프리미엄 = (현재가 - 적정가) / 적정가 × 100
 * - BUY: 프리미엄 ≤ -1%, SELL: ≥ +1%, HOLD: 그 외
 */

export type SignalType = "BUY" | "SELL" | "HOLD"

export interface FairValueResultType {
  fairValue: number
  premium: number
  signal: SignalType
}

/**
 * 단일 ETF에 대한 적정가·프리미엄·신호 계산
 * @param price 현재가
 * @param prevClose ETF 전일 종가 (적정가 산출 기준)
 * @param indexReturn 기초지수 수익률 (예: (NDX현재 - NDX전일) / NDX전일)
 * @param fxReturn 환율 변동률 (예: (현재환율 - 전일환율) / 전일환율)
 */
export function calculateFairValue(
  price: number,
  prevClose: number,
  indexReturn: number,
  fxReturn: number,
): FairValueResultType {
  const fairValue = prevClose * (1 + indexReturn) * (1 + fxReturn)
  const premium = fairValue > 0 ? ((price - fairValue) / fairValue) * 100 : 0
  let signal: SignalType = "HOLD"
  if (premium <= -1) {
    signal = "BUY"
  } else if (premium >= 1) {
    signal = "SELL"
  }
  return { fairValue, premium, signal }
}
