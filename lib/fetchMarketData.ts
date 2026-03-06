/**
 * 전체 ETF 시세를 한 번에 조회 (외부 API 호출 최소화)
 * - 국내 ETF: 네이버 etfItemList 1회
 * - 기초지수(NDX/SPX/SOX)·환율: 각 1회
 */

import { getNaverDomesticEtfBatch, getNaverFx, getNaverOverseas } from "@/lib/fetchers"
import type { EtfMarketData } from "@/lib/fetchers"
import { ETFS } from "@/lib/constants/etfs"

export interface IndexPricesType {
  NDX: { price: number; prevClose: number }
  SPX: { price: number; prevClose: number }
  SOX: { price: number; prevClose: number }
}

export interface AllMarketDataResultType {
  etfs: Map<string, EtfMarketData>
  index: IndexPricesType
  fx: { price: number; prevClose: number }
}

/** 전체 ETF + 지수 + 환율 한 번에 수집 (캐시 레이어에서 1회만 호출) */
export async function fetchAllMarketData(): Promise<AllMarketDataResultType> {
  const tickers = ETFS.map((e) => e.ticker)
  const [etfMap, ndx, spx, sox, fx] = await Promise.all([
    getNaverDomesticEtfBatch(tickers),
    getNaverOverseas("NDX"),
    getNaverOverseas("SPX"),
    getNaverOverseas("SOX"),
    getNaverFx("FX_USDKRW"),
  ])
  return {
    etfs: etfMap,
    index: {
      NDX: { price: ndx.price, prevClose: ndx.prevClose },
      SPX: { price: spx.price, prevClose: spx.prevClose },
      SOX: { price: sox.price, prevClose: sox.prevClose },
    },
    fx: { price: fx.price, prevClose: fx.prevClose },
  }
}
