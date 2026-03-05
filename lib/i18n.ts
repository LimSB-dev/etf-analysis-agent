export type Locale = "ko" | "en"

export const translations = {
  ko: {
    // Page Title
    pageTitle: "ETF 적정가 계산기",
    pageDescription: "한국 상장 미국 ETF의 적정가를 계산하고 매수/매도 신호를 확인하세요.",
    
    // Header
    marketDataInputs: "시장 데이터 입력",
    fetchingData: "데이터 가져오는 중...",
    autoFetchPrices: "가격 자동 가져오기",
    selectEtf: "분석할 ETF 선택",
    baseIndex: "기초지수",
    
    // ETF Groups
    nasdaq100Group: "Nasdaq 100 추종",
    sp500Group: "S&P 500 추종",
    semiconductorGroup: "반도체 지수 추종",
    
    // Input Labels
    prevClose: "전일 종가",
    currentPrice: "현재가",
    lastClose: "최근 종가",
    prevRate: "전일 환율",
    currentRate: "현재 환율",
    exchangeRate: "환율",
    
    // Button
    calculateFairValue: "적정가 계산",
    
    // Signal
    signal: "신호",
    buySignalDesc: "ETF가 저평가 상태입니다 (프리미엄 ≤ -1%). 좋은 매수 시점입니다.",
    sellSignalDesc: "ETF가 고평가 상태입니다 (프리미엄 ≥ +1%). 차익 실현을 고려하세요.",
    holdSignalDesc: "ETF가 적정가 수준입니다 (-1% < 프리미엄 < +1%). 현재 포지션을 유지하세요.",
    currentPremium: "현재 프리미엄",
    
    // Calculation
    fairValueCalculation: "적정가 계산",
    fairValue: "적정가",
    indexReturn: "수익률",
    fxReturn: "환율 변동률",
    
    // Summary
    analysisSummary: "분석 요약",
    currentMarketPrice: "현재 시장가",
    gap: "괴리",
    
    // Market Insight
    marketInsight: "시장 인사이트",
    moved: "변동",
    up: "상승",
    down: "하락",
    shouldTradeAt: "에 거래되어야 합니다.",
    etfShouldTrade: "ETF는",
    
    // Alerts
    someDataMissing: "일부 데이터를 자동으로 가져올 수 없습니다. 누락된 값을 직접 입력해주세요.",
    fetchFailed: "시장 데이터를 가져오지 못했습니다. 다시 시도하거나 직접 입력해주세요.",
    invalidInput: "모든 필드에 유효한 양수를 입력해주세요.",
  },
  en: {
    // Page Title
    pageTitle: "ETF Fair Value Calculator",
    pageDescription: "Calculate fair value of Korea-listed US ETFs and get buy/sell signals.",
    
    // Header
    marketDataInputs: "Market Data Inputs",
    fetchingData: "Fetching Data...",
    autoFetchPrices: "Auto-Fetch Prices",
    selectEtf: "Select ETF to Analyze",
    baseIndex: "Base Index",
    
    // ETF Groups
    nasdaq100Group: "Nasdaq 100 Tracking",
    sp500Group: "S&P 500 Tracking",
    semiconductorGroup: "Semiconductor Index Tracking",
    
    // Input Labels
    prevClose: "Prev Close",
    currentPrice: "Current Price",
    lastClose: "Last Close",
    prevRate: "Prev Rate",
    currentRate: "Current Rate",
    exchangeRate: "Exchange Rate",
    
    // Button
    calculateFairValue: "Calculate Fair Value",
    
    // Signal
    signal: "Signal",
    buySignalDesc: "ETF is undervalued (Premium ≤ -1%). Good entry point.",
    sellSignalDesc: "ETF is overvalued (Premium ≥ +1%). Consider taking profits.",
    holdSignalDesc: "ETF is fairly valued (-1% < Premium < +1%). Hold current position.",
    currentPremium: "Current Premium",
    
    // Calculation
    fairValueCalculation: "Fair Value Calculation",
    fairValue: "Fair Value",
    indexReturn: "Return",
    fxReturn: "FX Return",
    
    // Summary
    analysisSummary: "Analysis Summary",
    currentMarketPrice: "Current Market Price",
    gap: "Gap",
    
    // Market Insight
    marketInsight: "Market Insight",
    moved: "moved",
    up: "up",
    down: "down",
    shouldTradeAt: "",
    etfShouldTrade: "ETF should trade at",
    
    // Alerts
    someDataMissing: "Some data could not be fetched automatically. Please enter the missing values manually.",
    fetchFailed: "Failed to fetch market data. Please try again or enter manually.",
    invalidInput: "Please enter valid positive numbers for all fields.",
  },
} as const

export type TranslationKey = keyof typeof translations.ko
