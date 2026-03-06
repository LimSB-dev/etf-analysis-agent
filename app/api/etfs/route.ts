/**
 * 전체 ETF 데이터 단일 API (GET /api/etfs)
 * - KV 캐시(etf:all, TTL 30초) 적용. 캐시 히트 시 외부 API 호출 없이 반환
 * - 페이지에서 ETF 6~8개를 써도 요청은 1번만 발생
 */

import { getCachedData } from "@/lib/cache"
import { fetchAllMarketData } from "@/lib/fetchMarketData"
import { calculateFairValue } from "@/lib/calculateFairValue"
import { ETFS } from "@/lib/constants/etfs"

const CACHE_KEY = "etf:all"
const CACHE_TTL_SECONDS = 30

export interface EtfApiItemType {
  ticker: string
  name: string
  price: number
  fairValue: number
  premium: number
  signal: "BUY" | "SELL" | "HOLD"
  updatedAt: string
}

export async function GET() {
  const list = await getCachedData(
    CACHE_KEY,
    async () => {
      const { etfs, index, fx } = await fetchAllMarketData()
      const indexReturnNdx =
        index.NDX.prevClose > 0
          ? (index.NDX.price - index.NDX.prevClose) / index.NDX.prevClose
          : 0
      const indexReturnSpx =
        index.SPX.prevClose > 0
          ? (index.SPX.price - index.SPX.prevClose) / index.SPX.prevClose
          : 0
      const indexReturnSox =
        index.SOX.prevClose > 0
          ? (index.SOX.price - index.SOX.prevClose) / index.SOX.prevClose
          : 0
      const fxReturn =
        fx.prevClose > 0 ? (fx.price - fx.prevClose) / fx.prevClose : 0
      const indexReturns = {
        NDX: indexReturnNdx,
        SPX: indexReturnSpx,
        SOX: indexReturnSox,
      } as const
      const updatedAt = new Date().toISOString()
      return ETFS.map((etf): EtfApiItemType => {
        const data = etfs.get(etf.ticker)
        const price = data?.price ?? 0
        const prevClose = data?.prevClose ?? 0
        const idxRet = indexReturns[etf.indexSymbol]
        const { fairValue, premium, signal } = calculateFairValue(
          price,
          prevClose,
          idxRet,
          fxReturn,
        )
        return {
          ticker: etf.ticker,
          name: etf.name,
          price,
          fairValue: Math.round(fairValue),
          premium: Number.parseFloat(premium.toFixed(2)),
          signal,
          updatedAt,
        }
      })
    },
    CACHE_TTL_SECONDS,
  )
  return Response.json(list)
}
