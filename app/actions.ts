"use server"

import { ETF_OPTIONS } from "@/lib/etf-options"

interface MarketData {
  symbol: string
  price: number
  prevClose: number
}

interface FetchResult {
  etf: MarketData
  index: MarketData
  fx: MarketData
}

const COMMON_HEADERS = {
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

// Helper to clean price strings (e.g., "105,000" -> 105000)
const parsePrice = (str: string | number): number => {
  if (typeof str === "number") return str
  return Number.parseFloat(str.replace(/,/g, ""))
}

async function getNaverDomestic(code: string): Promise<MarketData> {
  try {
    // Naver Mobile Internal API for Domestic Stocks
    const url = `https://m.stock.naver.com/api/stock/${code}/basic`
    const res = await fetch(url, { headers: COMMON_HEADERS, next: { revalidate: 10 } })

    if (!res.ok) throw new Error(`Naver Domestic API error: ${res.status}`)

    const data = await res.json()
    // Validating response structure
    if (!data || !data.closePrice) throw new Error("Invalid data format")

    const currentPrice = parsePrice(data.closePrice)
    // compareToPreviousClosePrice is absolute difference.
    // fluctuationsRatio is percentage.
    // We can calculate prev close safely:
    // If up (rise), prev = current - diff
    // If down (fall), prev = current + diff
    // But easier: prev = current / (1 + ratio/100)
    // Naver usually provides 'prevClosePrice' in some endpoints but let's check basic.
    // Actually 'basic' endpoint typically has minimal data.
    // Let's derive it for safety.
    const fluctuationRate = parsePrice(data.fluctuationsRatio) // e.g., 1.5 means 1.5%
    const prevClose = currentPrice / (1 + fluctuationRate / 100)

    return {
      symbol: code,
      price: currentPrice,
      prevClose: Math.round(prevClose), // KRW usually integer
    }
  } catch (e) {
    console.error(`Failed to fetch Naver Domestic (${code}):`, e)
    return { symbol: code, price: 0, prevClose: 0 }
  }
}

async function getNaverOverseas(symbol: string): Promise<MarketData> {
  try {
    // Naver Mobile Internal API for Overseas Stocks
    // symbol for QQQ is usually just 'QQQ' but endpoint needs 'NAS/QQQ'
    const url = `https://polling.finance.naver.com/api/realtime/worldstock/etf/${symbol}`
    const res = await fetch(url, { headers: UNCOMMON_HEADERS, next: { revalidate: 60 } })

    if (!res.ok) throw new Error(`Naver Overseas API error: ${res.status}`)

    const responseData = await res.json()
    const data = responseData.datas[0]

    console.log(data)

    if (!data || !data.closePrice) throw new Error("Invalid data format")

    const currentPrice = parsePrice(data.closePrice)
    const fluctuationRate = parsePrice(data.fluctuationsRatio)
    const prevClose = currentPrice / (1 + fluctuationRate / 100)

    return {
      symbol,
      price: currentPrice,
      prevClose: Number.parseFloat(prevClose.toFixed(2)), // USD has decimals
    }
  } catch (e) {
    console.error(`Failed to fetch Naver Overseas (${symbol}):`, e)
    return { symbol, price: 0, prevClose: 0 }
  }
}

async function getNaverFx(code = "FX_USDKRW"): Promise<MarketData> {
  try {
    // Naver Mobile FX API
    const url = `https://m.stock.naver.com/front-api/marketIndex/productDetail?category=exchange&reutersCode=${code}`
    const res = await fetch(url, { headers: COMMON_HEADERS, next: { revalidate: 60 } })

    if (!res.ok) throw new Error(`Naver FX API error: ${res.status}`)

    const data = await res.json()
    const result = data.result
    if (!result || !result.calcPrice) throw new Error("Invalid FX data format")

    const currentPrice = parsePrice(result.calcPrice)
    const fluctuationRate = parsePrice(result.fluctuationsRatio)
    const prevClose = currentPrice / (1 + fluctuationRate / 100)

    return {
      symbol: "USD/KRW",
      price: currentPrice,
      prevClose: Number.parseFloat(prevClose.toFixed(2)),
    }
  } catch (e) {
    console.error(`Failed to fetch Naver FX:`, e)
    return { symbol: "USD/KRW", price: 0, prevClose: 0 }
  }
}

export async function fetchMarketData(etfId?: string): Promise<FetchResult> {
  // 선택된 ETF 찾기 (기본값: TIGER 나스닥100)
  const selectedEtf = ETF_OPTIONS.find((e) => e.id === etfId) || ETF_OPTIONS[0]

  // Fetch in parallel for speed since Naver is usually faster/less strict than Yahoo
  const [etf, index, fx] = await Promise.all([
    getNaverDomestic(selectedEtf.code),
    getNaverOverseas(selectedEtf.indexSymbol),
    getNaverFx("FX_USDKRW"),
  ])

  return { etf, index, fx }
}
