// ETF와 기초지수 매핑 (기초지수는 실제 지수 심볼 사용: NDX, SPX, SOX)
export interface EtfOption {
  id: string
  name: string
  code: string // 네이버 국내 종목 코드
  indexSymbol: string // 기초지수 심볼 (실제 지수: NDX, SPX, SOX)
  indexName: string
  ksdFund?: string
}

/** 지수 심볼 목록 (ETF가 아닌 실제 지수 → API 경로 worldstock/index 사용) */
export const INDEX_SYMBOLS = ["NDX", "SPX", "SOX"] as const
export const INDEX_SYMBOL_NASDAQ100 = "NDX"
export const INDEX_SYMBOL_SP500 = "SPX"
export const INDEX_SYMBOL_SEMICONDUCTOR = "SOX"

/** 지수 차트 API가 빈 데이터일 때 사용할 대응 ETF 심볼 (프리미엄 추이·백테스트용) */
export const INDEX_CHART_FALLBACK: Record<(typeof INDEX_SYMBOLS)[number], string> = {
  NDX: "QQQ.O",
  SPX: "SPY",
  SOX: "SOXX.O",
}

export const ETF_OPTIONS: EtfOption[] = [
  // 나스닥 100 추종 (기초지수: Nasdaq 100 Index = NDX)
  { id: "tiger-nas100", name: "TIGER 미국나스닥100", code: "133690", indexSymbol: "NDX", indexName: "Nasdaq 100", ksdFund: "KR7133690008" },
  { id: "kodex-nas100", name: "KODEX 미국나스닥100TR", code: "379810", indexSymbol: "NDX", indexName: "Nasdaq 100" },
  { id: "ace-nas100", name: "ACE 미국나스닥100", code: "367380", indexSymbol: "NDX", indexName: "Nasdaq 100" },
  // S&P 500 추종 (기초지수: S&P 500 Index = SPX)
  { id: "tiger-sp500", name: "TIGER 미국S&P500", code: "360750", indexSymbol: "SPX", indexName: "S&P 500" },
  { id: "kodex-sp500", name: "KODEX 미국S&P500TR", code: "379800", indexSymbol: "SPX", indexName: "S&P 500" },
  { id: "ace-sp500", name: "ACE 미국S&P500", code: "360200", indexSymbol: "SPX", indexName: "S&P 500" },
  // 필라델피아 반도체 추종 (기초지수: PHLX Semiconductor Index = SOX)
  { id: "tiger-soxx", name: "TIGER 미국필라델피아반도체나스닥", code: "381180", indexSymbol: "SOX", indexName: "Philadelphia Semiconductor" },
  { id: "kodex-soxx", name: "KODEX 미국반도체MV", code: "390390", indexSymbol: "SOX", indexName: "Philadelphia Semiconductor" },
  { id: "ace-soxx", name: "ACE 미국반도체커버드콜(합성)", code: "480040", indexSymbol: "SOX", indexName: "Philadelphia Semiconductor" },
]
