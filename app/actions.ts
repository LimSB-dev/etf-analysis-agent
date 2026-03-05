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

// --- Historical Premium Data ---

export interface PremiumHistoryPoint {
  date: string
  premium: number
}

export interface PremiumHistoryResult {
  data: PremiumHistoryPoint[]
  stats: {
    highest: number
    lowest: number
    average: number
    current: number
    percentile: number // 0-100, where 0 = lowest in range
  }
}

interface ChartPoint {
  date: string
  close: number
}

async function getNaverDomesticChart(code: string, count = 60): Promise<ChartPoint[]> {
  try {
    const url = `https://m.stock.naver.com/api/stock/${code}/price?pageSize=${count}&page=1`
    const res = await fetch(url, { headers: COMMON_HEADERS, next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`Naver Domestic Chart API error: ${res.status}`)
    const data = await res.json()

    if (!Array.isArray(data)) throw new Error("Invalid chart data format")

    return data.map((item: { localTradedAt: string; closePrice: string }) => ({
      date: item.localTradedAt?.split("T")[0] || "",
      close: parsePrice(item.closePrice),
    })).filter((p: ChartPoint) => p.date && p.close > 0).reverse()
  } catch (e) {
    console.error(`Failed to fetch domestic chart (${code}):`, e)
    return []
  }
}

async function getNaverOverseasChart(symbol: string, count = 60): Promise<ChartPoint[]> {
  try {
    const url = `https://api.stock.naver.com/chart/foreign/item/${symbol}?periodType=dayCandle&range=${count}`
    const res = await fetch(url, { headers: COMMON_HEADERS, next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`Naver Overseas Chart API error: ${res.status}`)
    const data = await res.json()

    if (!Array.isArray(data)) throw new Error("Invalid overseas chart data format")

    return data.map((item: { localDate: string; closePrice: string | number }) => ({
      date: typeof item.localDate === "string"
        ? item.localDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
        : "",
      close: typeof item.closePrice === "number" ? item.closePrice : parsePrice(item.closePrice),
    })).filter((p: ChartPoint) => p.date && p.close > 0)
  } catch (e) {
    console.error(`Failed to fetch overseas chart (${symbol}):`, e)
    return []
  }
}

async function getNaverFxChart(count = 60): Promise<ChartPoint[]> {
  try {
    const url = `https://m.stock.naver.com/front-api/chart/marketIndex?category=exchange&reutersCode=FX_USDKRW&periodType=day&range=${count}`
    const res = await fetch(url, { headers: COMMON_HEADERS, next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`Naver FX Chart API error: ${res.status}`)
    const json = await res.json()
    const data = json.result || []

    if (!Array.isArray(data)) throw new Error("Invalid FX chart data format")

    return data.map((item: { localTradedAt: string; closePrice: string | number }) => ({
      date: item.localTradedAt?.split("T")[0] || "",
      close: typeof item.closePrice === "number" ? item.closePrice : parsePrice(item.closePrice),
    })).filter((p: ChartPoint) => p.date && p.close > 0)
  } catch (e) {
    console.error(`Failed to fetch FX chart:`, e)
    return []
  }
}

export async function fetchPremiumHistory(etfId?: string): Promise<PremiumHistoryResult> {
  const selectedEtf = ETF_OPTIONS.find((e) => e.id === etfId) || ETF_OPTIONS[0]
  const days = 65 // fetch extra for prev-day calculations

  const [etfChart, indexChart, fxChart] = await Promise.all([
    getNaverDomesticChart(selectedEtf.code, days),
    getNaverOverseasChart(selectedEtf.indexSymbol, days),
    getNaverFxChart(days),
  ])

  console.log("[v0] etfChart length:", etfChart.length, "indexChart length:", indexChart.length, "fxChart length:", fxChart.length)

  // Build lookup maps by date
  const indexMap = new Map(indexChart.map((p) => [p.date, p.close]))
  const fxMap = new Map(fxChart.map((p) => [p.date, p.close]))

  // Calculate premium for each ETF trading day
  const premiumData: PremiumHistoryPoint[] = []

  for (let i = 1; i < etfChart.length; i++) {
    const today = etfChart[i]
    const yesterday = etfChart[i - 1]

    // Find closest matching dates for index and FX
    // Korean ETF trades on KRX open days. Index/FX dates may not match exactly.
    // Use the most recent available data point on or before the ETF date.
    const findClosest = (map: Map<string, number>, targetDate: string): { prev: number; curr: number } | null => {
      const dates = [...map.keys()].sort()
      let currVal = 0
      let prevVal = 0

      for (const d of dates) {
        if (d <= targetDate) currVal = map.get(d)!
        if (d < targetDate) prevVal = map.get(d)!
      }
      if (currVal === 0 || prevVal === 0) return null
      return { prev: prevVal, curr: currVal }
    }

    const indexData = findClosest(indexMap, today.date)
    const fxData = findClosest(fxMap, today.date)

    if (!indexData || !fxData) continue

    const indexReturn = (indexData.curr - indexData.prev) / indexData.prev
    const fxReturn = (fxData.curr - fxData.prev) / fxData.prev

    const fairValue = yesterday.close * (1 + indexReturn) * (1 + fxReturn)
    const premium = ((today.close - fairValue) / fairValue) * 100

    // Filter out unreasonable values (likely data alignment issues)
    if (Math.abs(premium) < 15) {
      premiumData.push({
        date: today.date,
        premium: Number(premium.toFixed(2)),
      })
    }
  }

  // Calculate stats
  const premiums = premiumData.map((p) => p.premium)
  const highest = premiums.length > 0 ? Math.max(...premiums) : 0
  const lowest = premiums.length > 0 ? Math.min(...premiums) : 0
  const average = premiums.length > 0 ? premiums.reduce((a, b) => a + b, 0) / premiums.length : 0
  const current = premiums.length > 0 ? premiums[premiums.length - 1] : 0

  // Calculate percentile position (0 = at lowest, 100 = at highest)
  const range = highest - lowest
  const percentile = range > 0 ? ((current - lowest) / range) * 100 : 50

  return {
    data: premiumData,
    stats: {
      highest: Number(highest.toFixed(2)),
      lowest: Number(lowest.toFixed(2)),
      average: Number(average.toFixed(2)),
      current: Number(current.toFixed(2)),
      percentile: Math.round(percentile),
    },
  }
}
