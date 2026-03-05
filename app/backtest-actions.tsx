"use server"

import { ETF_OPTIONS } from "@/lib/etf-options"

// --- Types ---
export interface BacktestTrade {
  buyDate: string
  buyPrice: number
  sellDate: string
  sellPrice: number
  returnPct: number
}

export interface EquityCurvePoint {
  date: string
  strategy: number // cumulative return %
  buyHold: number // cumulative return %
  signal?: "BUY" | "SELL" | null
}

export interface BacktestResult {
  trades: BacktestTrade[]
  equityCurve: EquityCurvePoint[]
  summary: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    avgTradeReturn: number
    maxTradeReturn: number
    minTradeReturn: number
    strategyReturn: number
    buyHoldReturn: number
    excessReturn: number // alpha
  }
  period: {
    startDate: string
    endDate: string
    totalDays: number
  }
}

// --- Internal chart data fetchers (reuse same APIs as actions.tsx) ---

const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  Referer: "https://m.stock.naver.com/",
  Accept: "application/json, text/plain, */*",
}

const parsePrice = (str: string | number): number => {
  if (typeof str === "number") return str
  return Number.parseFloat(str.replace(/,/g, ""))
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
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Sec-Fetch-Mode": "no-cors",
        Referer: `https://finance.naver.com/item/fchart.nhn?code=${code}`,
      },
    })
    if (!res.ok) throw new Error(`Naver Domestic Chart API error: ${res.status}`)
    const xml = await res.text()
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

async function getNaverOverseasChart(symbol: string, count = 60): Promise<ChartPoint[]> {
  try {
    // API typically supports up to 900 count
    const safeCount = Math.min(count, 900)
    const url = `https://api.stock.naver.com/chart/foreign/item/${symbol}?periodType=dayCandle&count=${safeCount}`
    const res = await fetch(url, {
      headers: {
        ...COMMON_HEADERS,
        Origin: "https://m.stock.naver.com",
      },
    })
    if (!res.ok) throw new Error(`Naver Overseas Chart API error: ${res.status}`)
    const data = await res.json()
    const items = Array.isArray(data) ? data : data?.priceInfos || data?.result || []
    if (!Array.isArray(items) || items.length === 0)
      throw new Error("Invalid overseas chart data format")
    return items
      .map((item: Record<string, unknown>) => {
        const dateRaw = (item.localDate || item.localTradedAt || item.date || "") as string
        const dateStr = dateRaw.includes("-")
          ? dateRaw.split("T")[0]
          : dateRaw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
        const closeRaw = item.closePrice ?? item.close ?? 0
        const close = typeof closeRaw === "number" ? closeRaw : parsePrice(String(closeRaw))
        return { date: dateStr, close }
      })
      .filter((p: ChartPoint) => p.date && p.close > 0)
  } catch (e) {
    console.error(`Failed to fetch overseas chart (${symbol}):`, e)
    return []
  }
}

async function getNaverFxChartPaginated(totalCount: number): Promise<ChartPoint[]> {
  const pageSize = 60
  const totalPages = Math.ceil(totalCount / pageSize)
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

  return allPoints.reverse() // oldest first
}

// --- Period mapping ---
type Period = "1m" | "3m" | "6m"

function getTradingDaysForPeriod(period: Period): number {
  switch (period) {
    case "1m":
      return 25
    case "3m":
      return 70
    case "6m":
      return 135
  }
}

// --- Main backtest function ---
export async function runBacktest(etfId: string, period: Period): Promise<BacktestResult> {
  const selectedEtf = ETF_OPTIONS.find((e) => e.id === etfId) || ETF_OPTIONS[0]
  const days = getTradingDaysForPeriod(period) + 5 // extra for prev-day calc

  const [etfChart, indexChart, fxChart] = await Promise.all([
    getNaverDomesticChart(selectedEtf.code, days),
    getNaverOverseasChart(selectedEtf.indexSymbol, days),
    getNaverFxChartPaginated(days),
  ])

  console.log(`[Backtest ${period}] Requested: ${days} days, Got - ETF: ${etfChart.length}, Index: ${indexChart.length}, FX: ${fxChart.length}`)

  // Build lookup maps by date
  const indexMap = new Map(indexChart.map((p) => [p.date, p.close]))
  const fxMap = new Map(fxChart.map((p) => [p.date, p.close]))

  // Calculate daily premium series
  interface DailyData {
    date: string
    etfClose: number
    premium: number
  }

  const dailyData: DailyData[] = []

  const findClosest = (
    map: Map<string, number>,
    targetDate: string,
  ): { prev: number; curr: number } | null => {
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

  for (let i = 1; i < etfChart.length; i++) {
    const today = etfChart[i]
    const yesterday = etfChart[i - 1]

    const indexData = findClosest(indexMap, today.date)
    const fxData = findClosest(fxMap, today.date)

    if (!indexData || !fxData) continue

    const indexReturn = (indexData.curr - indexData.prev) / indexData.prev
    const fxReturn = (fxData.curr - fxData.prev) / fxData.prev
    const fairValue = yesterday.close * (1 + indexReturn) * (1 + fxReturn)
    const premium = ((today.close - fairValue) / fairValue) * 100

    if (Math.abs(premium) < 15) {
      dailyData.push({
        date: today.date,
        etfClose: today.close,
        premium: Number(premium.toFixed(2)),
      })
    }
  }

  if (dailyData.length < 2) {
    return {
      trades: [],
      equityCurve: [],
      summary: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgTradeReturn: 0,
        maxTradeReturn: 0,
        minTradeReturn: 0,
        strategyReturn: 0,
        buyHoldReturn: 0,
        excessReturn: 0,
      },
      period: {
        startDate: "",
        endDate: "",
        totalDays: 0,
      },
    }
  }

  // --- Simulate ---
  const initialCapital = 10_000_000
  let cash = initialCapital
  let shares = 0
  let buyPrice = 0
  let buyDate = ""
  const trades: BacktestTrade[] = []
  const equityCurve: EquityCurvePoint[] = []

  const firstPrice = dailyData[0].etfClose

  for (let i = 0; i < dailyData.length; i++) {
    const day = dailyData[i]
    const signal =
      day.premium <= -1 ? "BUY" : day.premium >= 1 ? "SELL" : null

    let signalMark: "BUY" | "SELL" | null = null

    if (signal === "BUY" && shares === 0) {
      // Buy with all available cash
      shares = Math.floor(cash / day.etfClose)
      if (shares > 0) {
        buyPrice = day.etfClose
        buyDate = day.date
        cash = cash - shares * day.etfClose
        signalMark = "BUY"
      }
    } else if (signal === "SELL" && shares > 0) {
      // Sell all shares
      const proceeds = shares * day.etfClose
      const tradeReturn = ((day.etfClose - buyPrice) / buyPrice) * 100
      trades.push({
        buyDate,
        buyPrice,
        sellDate: day.date,
        sellPrice: day.etfClose,
        returnPct: Number(tradeReturn.toFixed(2)),
      })
      cash = cash + proceeds
      shares = 0
      signalMark = "SELL"
    }

    // Portfolio value
    const portfolioValue = cash + shares * day.etfClose
    const strategyReturn = ((portfolioValue - initialCapital) / initialCapital) * 100
    const buyHoldReturn = ((day.etfClose - firstPrice) / firstPrice) * 100

    equityCurve.push({
      date: day.date,
      strategy: Number(strategyReturn.toFixed(2)),
      buyHold: Number(buyHoldReturn.toFixed(2)),
      signal: signalMark,
    })
  }

  // Mark-to-market any open position
  const lastDay = dailyData[dailyData.length - 1]
  const finalPortfolioValue = cash + shares * lastDay.etfClose
  const strategyReturn = ((finalPortfolioValue - initialCapital) / initialCapital) * 100
  const buyHoldReturn = ((lastDay.etfClose - firstPrice) / firstPrice) * 100

  // Trade stats
  const completedReturns = trades.map((t) => t.returnPct)
  const winningTrades = completedReturns.filter((r) => r > 0).length
  const losingTrades = completedReturns.filter((r) => r <= 0).length

  return {
    trades,
    equityCurve,
    summary: {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winRate: trades.length > 0 ? Number(((winningTrades / trades.length) * 100).toFixed(1)) : 0,
      avgTradeReturn:
        trades.length > 0
          ? Number((completedReturns.reduce((a, b) => a + b, 0) / completedReturns.length).toFixed(2))
          : 0,
      maxTradeReturn: completedReturns.length > 0 ? Math.max(...completedReturns) : 0,
      minTradeReturn: completedReturns.length > 0 ? Math.min(...completedReturns) : 0,
      strategyReturn: Number(strategyReturn.toFixed(2)),
      buyHoldReturn: Number(buyHoldReturn.toFixed(2)),
      excessReturn: Number((strategyReturn - buyHoldReturn).toFixed(2)),
    },
    period: {
      startDate: dailyData[0].date,
      endDate: dailyData[dailyData.length - 1].date,
      totalDays: dailyData.length,
    },
  }
}
