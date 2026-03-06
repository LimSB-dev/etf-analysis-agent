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

/** 네이버 국내 ETF 시세·NAV 조회 (단일 종목) */
export async function getNaverDomesticEtf(code: string): Promise<EtfMarketData> {
  const map = await getNaverDomesticEtfBatch([code])
  return map.get(code) ?? { symbol: code, price: 0, prevClose: 0, nav: 0 }
}

/**
 * 네이버 국내 ETF 리스트 1회 조회 후 요청한 종목만 반환 (API 요청 1번으로 여러 ETF)
 */
export async function getNaverDomesticEtfBatch(codes: string[]): Promise<Map<string, EtfMarketData>> {
  const result = new Map<string, EtfMarketData>()
  for (const code of codes) {
    result.set(code, { symbol: code, price: 0, prevClose: 0, nav: 0 })
  }
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
    const etfList = (data?.result?.etfItemList ?? []) as Record<string, unknown>[]
    for (const code of codes) {
      const etfItem = etfList.find((item: Record<string, unknown>) => item.itemcode === code)
      if (!etfItem) continue
      const currentPrice = parsePrice(etfItem.nowVal ?? 0)
      const nav = parsePrice(etfItem.nav ?? 0)
      const changeRate = parsePrice(etfItem.changeRate ?? 0)
      const prevClose = changeRate !== 0 ? currentPrice / (1 + changeRate / 100) : currentPrice
      result.set(code, { symbol: code, price: currentPrice, prevClose: Math.round(prevClose), nav })
    }
  } catch (e) {
    console.error("Failed to fetch Naver ETF list:", e)
  }
  return result
}

/** 네이버 해외 지수/ETF 시세 조회 (응답 필드명 변동에 대응) */
export async function getNaverOverseas(symbol: string): Promise<MarketData> {
  try {
    const isIndex = INDEX_SYMBOLS.includes(symbol as (typeof INDEX_SYMBOLS)[number])
    const path = isIndex ? "worldstock/index" : "worldstock/etf"
    const url = `https://polling.finance.naver.com/api/realtime/${path}/${symbol}`
    const res = await fetch(url, { headers: UNCOMMON_HEADERS })
    if (!res.ok) return { symbol, price: 0, prevClose: 0 }
    const responseData = (await res.json()) as Record<string, unknown>
    const rawList = responseData.datas ?? responseData.data
    const data = Array.isArray(rawList) ? (rawList[0] as Record<string, unknown>) : (rawList as Record<string, unknown>)
    const priceRaw = data?.closePrice ?? data?.close_price ?? data?.lastPrice ?? data?.price ?? data?.currentPrice
    if (priceRaw == null || priceRaw === "") return { symbol, price: 0, prevClose: 0 }
    const currentPrice = parsePrice(priceRaw)
    const ratioRaw = data?.fluctuationsRatio ?? data?.fluctuations_ratio ?? data?.changeRate ?? data?.change_rate ?? 0
    const fluctuationRate = parsePrice(ratioRaw)
    const prevClose = fluctuationRate !== 0 ? currentPrice / (1 + fluctuationRate / 100) : currentPrice
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
