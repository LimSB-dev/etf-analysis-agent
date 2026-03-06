"use server"

import { getCachedData } from "@/lib/cache"
import {
  COMMON_HEADERS,
  fetchMarketDataRaw,
  getNaverDomesticEtf,
  getNaverFx,
  getNaverOverseas,
  parsePrice,
  type FetchResult,
  type MarketData,
} from "@/lib/fetchers"
import { ETF_OPTIONS, INDEX_SYMBOLS, INDEX_CHART_FALLBACK, type EtfOption } from "@/lib/etf-options"

export type { FetchResult } from "@/lib/fetchers"

/** 시세 조회: KV 캐시(60초) 우선, 미스 시에만 외부 API 호출 후 저장 */
export async function fetchMarketData(etfId?: string): Promise<FetchResult> {
  const selectedEtf = ETF_OPTIONS.find((e) => e.id === etfId) ?? ETF_OPTIONS[0]
  const cacheKey = `etf:market:${selectedEtf.id}`
  return getCachedData(cacheKey, () => fetchMarketDataRaw(selectedEtf.id), 60)
}

/** 시세 + 프리미엄 추이 한 번에 조회 (ETF 변경 시 POST 1회로 줄이기 위함) */
export async function fetchMarketDataAndPremiumHistory(etfId: string): Promise<{
  marketData: FetchResult
  premiumHistory: PremiumHistoryResult
}> {
  const [marketData, premiumHistory] = await Promise.all([
    fetchMarketData(etfId),
    fetchPremiumHistory(etfId),
  ])
  return { marketData, premiumHistory }
}

export interface SameIndexEtfRowType {
  etf: EtfOption
  price: number
  prevClose: number
  nav: number
}

export interface SameIndexEtfComparisonResultType {
  index: MarketData
  fx: MarketData
  etfs: SameIndexEtfRowType[]
}

/** 같은 지수 추종 ETF 일괄 조회 (지수·환율 1회, 각 ETF 국내 시세 병렬) */
export async function fetchSameIndexEtfComparison(
  indexSymbol: string,
): Promise<SameIndexEtfComparisonResultType> {
  const sameIndexEtfs = ETF_OPTIONS.filter((e) => e.indexSymbol === indexSymbol)
  if (sameIndexEtfs.length === 0) {
    return { index: { symbol: indexSymbol, price: 0, prevClose: 0 }, fx: { symbol: "USD/KRW", price: 0, prevClose: 0 }, etfs: [] }
  }

  const [index, fx, ...etfResults] = await Promise.all([
    getNaverOverseas(indexSymbol),
    getNaverFx("FX_USDKRW"),
    ...sameIndexEtfs.map((etf) => getNaverDomesticEtf(etf.code)),
  ])

  const etfs: SameIndexEtfRowType[] = sameIndexEtfs.map((etf, i) => ({
    etf,
    price: etfResults[i].price,
    prevClose: etfResults[i].prevClose,
    nav: etfResults[i].nav,
  }))

  return { index, fx, etfs }
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
    // Naver fchart API supports up to ~900 count
    const safeCount = Math.min(count, 900)
    const url = `https://fchart.stock.naver.com/sise.nhn?symbol=${code}&timeframe=day&count=${safeCount}&requestType=0`
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Sec-Fetch-Mode": "no-cors",
        "Referer": `https://finance.naver.com/item/fchart.nhn?code=${code}`,
      },
    })
    if (!res.ok) throw new Error(`Naver Domestic Chart API error: ${res.status}`)
    const xml = await res.text()

    // Parse XML: <item data="20250301|85000|86000|84000|85500|1234567" />
    const items: ChartPoint[] = []
    const regex = /<item\s+data="([^"]+)"\s*\/>/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(xml)) !== null) {
      const parts = match[1].split("|")
      if (parts.length >= 5) {
        const dateStr = parts[0]
        const close = Number.parseInt(parts[4], 10)
        if (dateStr && close > 0) {
          items.push({
            date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
            close,
          })
        }
      }
    }
    return items
  } catch (e) {
    console.error(`Failed to fetch domestic chart (${code}):`, e)
    return []
  }
}

async function fetchOverseasChartOnce(path: string, symbol: string, safeCount: number): Promise<ChartPoint[]> {
  const url = `https://api.stock.naver.com/chart/${path}/${symbol}?periodType=dayCandle&count=${safeCount}`
  const res = await fetch(url, {
    headers: { ...COMMON_HEADERS, Origin: "https://m.stock.naver.com" },
  })
  if (!res.ok) return []
  const data = await res.json()
  const items = Array.isArray(data) ? data : (data?.priceInfos || data?.result || [])
  if (!Array.isArray(items) || items.length === 0) return []
  return items
    .map((item: Record<string, unknown>) => {
      const dateRaw = (item.localDate || item.localTradedAt || item.date || "") as string
      const dateStr = dateRaw.includes("-") ? dateRaw.split("T")[0] : dateRaw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
      const closeRaw = item.closePrice ?? item.close ?? 0
      const close = typeof closeRaw === "number" ? closeRaw : parsePrice(String(closeRaw))
      return { date: dateStr, close }
    })
    .filter((p: ChartPoint) => p.date && p.close > 0)
}

async function getNaverOverseasChart(symbol: string, count = 60): Promise<ChartPoint[]> {
  const safeCount = Math.min(count, 900)
  const isIndex = INDEX_SYMBOLS.includes(symbol as (typeof INDEX_SYMBOLS)[number])
  const path = isIndex ? "foreign/index" : "foreign/item"
  try {
    let points = await fetchOverseasChartOnce(path, symbol, safeCount)
    if (points.length === 0 && isIndex && symbol in INDEX_CHART_FALLBACK) {
      const fallbackSymbol = INDEX_CHART_FALLBACK[symbol as keyof typeof INDEX_CHART_FALLBACK]
      points = await fetchOverseasChartOnce("foreign/item", fallbackSymbol, safeCount)
    }
    return points
  } catch (e) {
    console.error(`Failed to fetch overseas chart (${symbol}):`, e)
    return []
  }
}

async function getNaverFxChart(count = 60): Promise<ChartPoint[]> {
  try {
    // For historical data, use pagination if count > 60
    if (count > 60) {
      const pageSize = 60
      const totalPages = Math.ceil(count / pageSize)
      const allPoints: ChartPoint[] = []

      for (let page = 1; page <= totalPages; page++) {
        try {
          const url = `https://api.stock.naver.com/marketindex/exchange/FX_USDKRW/prices?page=${page}&pageSize=${pageSize}`
          const res = await fetch(url, { headers: COMMON_HEADERS })
          if (!res.ok) break

          const json = await res.json()
          const data = Array.isArray(json) ? json : json?.result || json?.datas || []
          if (!Array.isArray(data) || data.length === 0) break

          const points = data
            .map((item: Record<string, unknown>) => {
              const dateRaw = (item.localTradedAt || item.date || item.localDate || "") as string
              const date = dateRaw.includes("T") ? dateRaw.split("T")[0] : dateRaw
              const closeRaw = item.closePrice ?? item.basePrice ?? item.tradedPrice ?? 0
              const close = typeof closeRaw === "number" ? closeRaw : parsePrice(String(closeRaw))
              return { date, close }
            })
            .filter((p: ChartPoint) => p.date && p.close > 0)

          allPoints.push(...points)
          if (data.length < pageSize) break
        } catch {
          break
        }
      }

      return allPoints.reverse()
    }

    // For count <= 60, single request
    const url = `https://api.stock.naver.com/marketindex/exchange/FX_USDKRW/prices?page=1&pageSize=${count}`
    const res = await fetch(url, { headers: COMMON_HEADERS })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[v0] FX chart failed (${res.status}):`, body.slice(0, 200))
      return []
    }

    const json = await res.json()
    console.log("[v0] FX chart raw sample:", JSON.stringify(json).slice(0, 500))

    const data = Array.isArray(json) ? json : json?.result || json?.datas || []
    if (!Array.isArray(data)) return []

    return data
      .map((item: Record<string, unknown>) => {
        const dateRaw = (item.localTradedAt || item.date || item.localDate || "") as string
        const date = dateRaw.includes("T") ? dateRaw.split("T")[0] : dateRaw
        const closeRaw = item.closePrice ?? item.basePrice ?? item.tradedPrice ?? 0
        const close = typeof closeRaw === "number" ? closeRaw : parsePrice(String(closeRaw))
        return { date, close }
      })
      .filter((p: ChartPoint) => p.date && p.close > 0)
      .reverse()
  } catch (e) {
    console.error("Failed to fetch FX chart:", e)
    return []
  }
}

export async function fetchPremiumHistory(etfId?: string): Promise<PremiumHistoryResult> {
  const selectedEtf = ETF_OPTIONS.find((e) => e.id === etfId) || ETF_OPTIONS[0]
  const days = 200 // fetch ~6-8 months of historical data

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
