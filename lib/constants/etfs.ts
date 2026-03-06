/**
 * API용 ETF 목록 상수
 * - /api/etfs 에서 한 번에 조회하는 ETF 목록
 * - ticker: 네이버 종목코드, name: 표시명, indexSymbol: 기초지수(NDX/SPX/SOX)
 */

export interface EtfConstantType {
  ticker: string
  name: string
  indexSymbol: "NDX" | "SPX" | "SOX"
}

export const ETFS: EtfConstantType[] = [
  { ticker: "133690", name: "TIGER 미국나스닥100", indexSymbol: "NDX" },
  { ticker: "379810", name: "KODEX 미국나스닥100TR", indexSymbol: "NDX" },
  { ticker: "367380", name: "ACE 미국나스닥100", indexSymbol: "NDX" },
  { ticker: "360750", name: "TIGER 미국S&P500", indexSymbol: "SPX" },
  { ticker: "379800", name: "KODEX 미국S&P500TR", indexSymbol: "SPX" },
  { ticker: "360200", name: "ACE 미국S&P500", indexSymbol: "SPX" },
  { ticker: "381180", name: "TIGER 미국필라델피아반도체나스닥", indexSymbol: "SOX" },
  { ticker: "390390", name: "KODEX 미국반도체MV", indexSymbol: "SOX" },
  { ticker: "480040", name: "ACE 미국반도체커버드콜(합성)", indexSymbol: "SOX" },
]
