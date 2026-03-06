/**
 * 외부 API(네이버 금융 등) 호출 함수
 * - 캐시 레이어(lib/cache.ts)와 분리되어 있어, 캐시 미스 시에만 이 함수들이 실행됨
 */

import { ETF_OPTIONS, INDEX_SYMBOLS } from "@/lib/etf-options"

export interface MarketData {
  symbol: string
  price: number
  prevClose: number
}

export interface EtfMarketData extends MarketData {
  nav: number
}

export interface FetchResult {
  etf: EtfMarketData
  index: MarketData
  fx: MarketData
}

/** 차트/기타 네이버 API용 공통 헤더 (fetchers 내부 + actions 차트에서 사용) */
export const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  Referer: "https://m.stock.naver.com/",
  Accept: "application/json, text/plain, */*",
}

const UNCOMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  Referer: "https://polling.finance.naver.com/",
  Accept: "application/json, text/plain, */*",
}

/** 금액 문자열 정규화 (예: "105,000" → 105000) */
export function parsePrice(str: string | number): number {
  if (typeof str === "number") return str
  return Number.parseFloat(String(str).replace(/,/g, ""))
}

/** 네이버 국내 ETF 시세·NAV 조회 */
export async function getNaverDomesticEtf(code: string): Promise<EtfMarketData> {
  try {
    const url = "https://finance.naver.com/api/sise/etfItemList.nhn"
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://finance.naver.com/",
        Accept: "application/json",
      },
    })
    if (!res.ok) throw new Error(`Naver ETF API error: ${res.status}`)
    const data = await res.json()
    const etfList = data?.result?.etfItemList ?? []
    const etfItem = etfList.find((item: Record<string, unknown>) => item.itemcode === code)
    if (!etfItem) throw new Error(`ETF not found: ${code}`)
    const currentPrice = parsePrice(etfItem.nowVal ?? 0)
    const nav = parsePrice(etfItem.nav ?? 0)
    const changeRate = parsePrice(etfItem.changeRate ?? 0)
    const prevClose = changeRate !== 0 ? currentPrice / (1 + changeRate / 100) : currentPrice
    return { symbol: code, price: currentPrice, prevClose: Math.round(prevClose), nav }
  } catch (e) {
    console.error(`Failed to fetch Naver ETF (${code}):`, e)
    return { symbol: code, price: 0, prevClose: 0, nav: 0 }
  }
}

/** 네이버 해외 지수/ETF 시세 조회 */
export async function getNaverOverseas(symbol: string): Promise<MarketData> {
  try {
    const isIndex = INDEX_SYMBOLS.includes(symbol as (typeof INDEX_SYMBOLS)[number])
    const path = isIndex ? "worldstock/index" : "worldstock/etf"
    const url = `https://polling.finance.naver.com/api/realtime/${path}/${symbol}`
    const res = await fetch(url, { headers: UNCOMMON_HEADERS })
    if (!res.ok) throw new Error(`Naver Overseas API error: ${res.status}`)
    const responseData = await res.json()
    const data = responseData.datas?.[0]
    if (!data?.closePrice) throw new Error("Invalid data format")
    const currentPrice = parsePrice(data.closePrice)
    const fluctuationRate = parsePrice(data.fluctuationsRatio ?? 0)
    const prevClose = currentPrice / (1 + fluctuationRate / 100)
    return { symbol, price: currentPrice, prevClose: Number.parseFloat(prevClose.toFixed(2)) }
  } catch (e) {
    console.error(`Failed to fetch Naver Overseas (${symbol}):`, e)
    return { symbol, price: 0, prevClose: 0 }
  }
}

/** 네이버 환율(USD/KRW) 조회 */
export async function getNaverFx(code = "FX_USDKRW"): Promise<MarketData> {
  try {
    const url = `https://m.stock.naver.com/front-api/marketIndex/productDetail?category=exchange&reutersCode=${code}`
    const res = await fetch(url, { headers: COMMON_HEADERS })
    if (!res.ok) throw new Error(`Naver FX API error: ${res.status}`)
    const data = await res.json()
    const result = data.result
    if (!result?.calcPrice) throw new Error("Invalid FX data format")
    const currentPrice = parsePrice(result.calcPrice)
    const fluctuationRate = parsePrice(result.fluctuationsRatio ?? 0)
    const prevClose = currentPrice / (1 + fluctuationRate / 100)
    return { symbol: "USD/KRW", price: currentPrice, prevClose: Number.parseFloat(prevClose.toFixed(2)) }
  } catch (e) {
    console.error("Failed to fetch Naver FX:", e)
    return { symbol: "USD/KRW", price: 0, prevClose: 0 }
  }
}

/**
 * 캐시 없이 ETF 시세·지수·환율을 한 번에 조회 (외부 API 직접 호출)
 * - getCachedData의 fetcher로 사용하면 60초 TTL로 캐시됨
 */
export async function fetchMarketDataRaw(etfId: string): Promise<FetchResult> {
  const selectedEtf = ETF_OPTIONS.find((e) => e.id === etfId) ?? ETF_OPTIONS[0]
  const [etf, index, fx] = await Promise.all([
    getNaverDomesticEtf(selectedEtf.code),
    getNaverOverseas(selectedEtf.indexSymbol),
    getNaverFx("FX_USDKRW"),
  ])
  return { etf, index, fx }
}
