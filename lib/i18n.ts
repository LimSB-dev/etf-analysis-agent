export type Locale = "ko" | "en";

export const translations = {
  ko: {
    // Page Title
    pageTitle: "ETF 프리미엄 분석 플랫폼",
    pageDescription:
      "한국 상장 미국 ETF의 프리미엄 추이, 매매 전략을 종합 분석합니다.",
    realtimeAlertTitle: "프리미엄 기준을 나에게 맞게 쓰고 싶으신가요?",
    realtimeAlertDesc: "실시간·매일 괴리율 알림은 텔레그램 채널에서 받을 수 있어요. 원하는 기능이 있으면 이슈에 작성하거나 메일로 요청해 주세요.",
    realtimeAlertCta: "기능 요청하기",
    alertRequestIssueTitle: "프리미엄 개인화 기능 요청",
    alertRequestIssueBody: "프리미엄 기준(매수/매도 임계값) 개인화 기능을 원합니다.\n\n희망하는 알람 방식:\n- [ ] 이메일\n- [ ] 모바일 앱 푸시\n- [ ] 카카오톡/텔레그램\n- [ ] 기타:",
    alertRequestEmailSubject: "프리미엄 개인화 기능 요청",
    alertRequestEmailBody: "프리미엄 기준 개인화 기능을 원합니다. 희망하는 알람 방식: 이메일 / 모바일 앱 푸시 / 카카오톡·텔레그램 / 기타",
    alertRequestViaIssue: "GitHub 이슈로 요청",
    alertRequestViaEmail: "메일로 요청",
    alertRequestJoinTelegram: "텔레그램 채널 참여",
    gitIssue: "GitHub 이슈",
    contactEmail: "메일 보내기",

    // Header
    premiumAnalysis: "프리미엄 분석",
    marketDataInputs: "시장 데이터 입력",
    fetchingData: "시세 조회 중...",
    autoFetchPrices: "실시간 시세 조회",
    selectEtf: "분석할 ETF 선택",
    baseIndex: "기초지수",
    dataProvidedByNaver: "데이터 제공 NAVER",

    // ETF Groups
    nasdaq100Group: "Nasdaq 100 추종",
    sp500Group: "S&P 500 추종",
    semiconductorGroup: "반도체 지수 추종",

    // Input Labels
    prevClose: "전일 종가",
    currentPrice: "현재가",
    priceAfterMarketClose: "장 마감 종가",
    lastClose: "최근 종가",
    prevRate: "전일 환율",
    currentRate: "현재 환율",
    exchangeRate: "환율",

    // Button
    calculateFairValue: "프리미엄 분석",

    // Signal
    signal: "신호",
    buyAction: "매수 신호",
    sellAction: "매도 신호",
    holdAction: "관망 신호",
    buySignalDesc:
      "ETF가 추정 가격 대비 저평가 상태입니다.\n프리미엄 ≤ -1% 구간입니다.",
    sellSignalDesc:
      "ETF가 추정 가격 대비 고평가 상태입니다.\n프리미엄 ≥ +1% 구간입니다.",
    holdSignalDesc:
      "ETF가 추정 가격 대비 적정 수준입니다.\n-1% < 프리미엄 < +1% 구간입니다.",
    currentPremium: "현재 프리미엄",

    // Calculation
    fairValueCalculation: "프리미엄 분석",
    fairValue: "추정 가격",
    indexReturn: "수익률",
    indexReturnDesc: "당일 지수 수익률",
    fxReturn: "환율 변동률",
    fxReturnDesc: "당일 환율 변동률",
    iNavCalculation: "iNAV 계산 과정",
    prevDay: "(전일)",
    iNavLabel: "(실시간 추정)",
    iNavTooltipTitle: "iNAV란?",
    iNavTooltipDesc: "실시간 추정 순자산가치로, 전일 NAV에 지수 변동률과 환율 변동률을 반영하여 실시간으로 계산됩니다.",
    realtimeEstimate: "실시간 추정",
    realtimeEstimatedPrice: "실시간 추정 가격",
    realtimeEstimatedFairPrice: "실시간 추정 가격",
    navBasedCalculation: "NAV 기준 계산",
    premiumFormula: "프리미엄 계산 공식",
    premiumFormulaText: "(ETF 현재가 - iNAV) / iNAV × 100",
    iNavFormulaDesc: "NAV × (1 + 지수 수익률) × (1 + 환율 변동률) = iNAV",
    officialNav: "공식 NAV",
    navDescription: "운용사가 공시한 순자산가치",

    // Summary
    analysisSummary: "분석 요약",
    currentMarketPrice: "현재 시장가",
    gap: "괴리",
    netAssetValue: "(순자산가치)",
    detailedAnalysis: "상세 분석 보기",
    fairPriceSummary: "추정 iNAV",
    fairPriceIs: "의 실시간 추정 가격은",
    fairPriceEnd: "입니다",
    iNavDisclaimer: "이 값은 전일 NAV, 기초 ETF 수익률, 환율 변동을 기반으로 계산된 실시간 추정 가격입니다.",
    navFuturesDisclaimer: "이 기준가는 선물 변동을 반영하지 않습니다.",

    // Optional tabs (재미 + 정보)
    premiumTrendTab: "프리미엄 추이",
    strategySimulationTab: "전략 시뮬레이션",

    // Market Insight
    marketInsight: "시장 인사이트",
    moved: "변동",
    up: "상승",
    down: "하락",
    shouldTradeAt: "에 거래되어야 합니다.",
    etfShouldTrade: "ETF는",
    tradingAtPremium: "NAV 대비 프리미엄",
    tradingAtDiscount: "NAV 대비 할인",
    reference: "참고",

    // Alerts
    someDataMissing:
      "주당 시장가격 또는 기준가(NAV)를 가져오지 못했습니다. 네트워크를 확인하거나 잠시 후 다시 조회해주세요. 필요하면 해당 값을 직접 입력할 수 있습니다.",
    fetchFailed:
      "시장 데이터를 가져오지 못했습니다. 다시 시도해주세요.",
    invalidInput: "모든 필드에 유효한 양수를 입력해주세요.",
  },
  en: {
    // Page Title
    pageTitle: "ETF Premium Analysis Platform",
    pageDescription:
      "Comprehensive analysis of premium trends and trading strategies for Korea-listed US ETFs.",
    realtimeAlertTitle: "Want to customize your premium thresholds?",
    realtimeAlertDesc: "Real-time and daily premium alerts are available in our Telegram channel. If you have a feature in mind, open an issue or contact us by email.",
    realtimeAlertCta: "Request feature",
    alertRequestIssueTitle: "Request: Premium customization",
    alertRequestIssueBody: "I would like personalized premium (buy/sell) threshold features.\n\nDesired alert methods:\n- [ ] Email\n- [ ] Mobile app push\n- [ ] KakaoTalk/Telegram\n- [ ] Other:",
    alertRequestEmailSubject: "Request: Premium customization",
    alertRequestEmailBody: "I would like personalized premium threshold features. Desired methods: Email / Mobile app push / KakaoTalk or Telegram / Other",
    alertRequestViaIssue: "Request via GitHub Issue",
    alertRequestViaEmail: "Request via Email",
    alertRequestJoinTelegram: "Join Telegram channel",
    gitIssue: "GitHub Issue",
    contactEmail: "Contact",

    // Header
    premiumAnalysis: "Real-Time Analysis",
    marketDataInputs: "Market Data Inputs",
    fetchingData: "Fetching Prices...",
    autoFetchPrices: "Fetch Latest Prices",
    selectEtf: "Select ETF to Analyze",
    baseIndex: "Base Index",
    dataProvidedByNaver: "Data provided by NAVER",

    // ETF Groups
    nasdaq100Group: "Nasdaq 100 Tracking",
    sp500Group: "S&P 500 Tracking",
    semiconductorGroup: "Semiconductor Index Tracking",

    // Input Labels
    prevClose: "Prev Close",
    currentPrice: "Current Price",
    priceAfterMarketClose: "Closing Price",
    lastClose: "Last Close",
    prevRate: "Prev Rate",
    currentRate: "Current Rate",
    exchangeRate: "Exchange Rate",

    // Button
    calculateFairValue: "Premium Analysis",

    // Signal
    signal: "Signal",
    buyAction: "Buy Signal",
    sellAction: "Sell Signal",
    holdAction: "Neutral Signal",
    buySignalDesc: "ETF is undervalued vs estimated price.\nPremium ≤ -1% zone.",
    sellSignalDesc:
      "ETF is overvalued vs estimated price.\nPremium ≥ +1% zone.",
    holdSignalDesc:
      "ETF is fairly valued vs estimated price.\n-1% < Premium < +1% zone.",
    currentPremium: "Current Premium",

    // Calculation
    fairValueCalculation: "Premium Analysis",
    fairValue: "Estimated Price",
    indexReturn: "Return",
    indexReturnDesc: "Daily index return",
    fxReturn: "FX Return",
    fxReturnDesc: "Daily FX change",
    iNavCalculation: "iNAV Calculation Process",
    prevDay: "(Prev Day)",
    iNavLabel: "(Real-time Est.)",
    iNavTooltipTitle: "What is iNAV?",
    iNavTooltipDesc: "Indicative NAV is the real-time estimated net asset value, calculated by applying index and FX changes to the previous day's NAV.",
    realtimeEstimate: "Real-time Estimate",
    realtimeEstimatedPrice: "Real-time Estimated Price",
    realtimeEstimatedFairPrice: "Real-time Estimated Price",
    navBasedCalculation: "NAV-Based Calculation",
    premiumFormula: "Premium Calculation Formula",
    premiumFormulaText: "(ETF Price - iNAV) / iNAV × 100",
    iNavFormulaDesc: "NAV × (1 + index return) × (1 + FX change) = iNAV",
    officialNav: "Official NAV",
    navDescription: "Net Asset Value published by fund manager",

    // Summary
    analysisSummary: "Analysis Summary",
    currentMarketPrice: "Current Market Price",
    gap: "Gap",
    netAssetValue: "(Net Asset Value)",
    detailedAnalysis: "Detailed Analysis",
    fairPriceSummary: "Estimated iNAV",
    fairPriceIs: "'s real-time estimated price is",
    fairPriceEnd: "",
    iNavDisclaimer: "This value is a real-time estimated price calculated based on previous day's NAV, underlying ETF returns, and FX changes.",
    navFuturesDisclaimer: "This reference price does not reflect futures movement.",

    // Optional tabs
    premiumTrendTab: "Premium Trend",
    strategySimulationTab: "Strategy Simulation",

    // Market Insight
    marketInsight: "Market Insight",
    moved: "moved",
    up: "up",
    down: "down",
    shouldTradeAt: "",
    etfShouldTrade: "ETF should trade at",
    tradingAtPremium: "Trading at Premium vs NAV",
    tradingAtDiscount: "Trading at Discount vs NAV",
    reference: "Reference",

    // Alerts
    someDataMissing:
      "Could not fetch market price or NAV. Check your connection or try again later. You can also enter the values manually if needed.",
    fetchFailed:
      "Failed to fetch market data. Please try again.",
    invalidInput: "Please enter valid positive numbers for all fields.",
  },
} as const;

export type TranslationKey = keyof typeof translations.ko;

// Premium History Chart translations
export const premiumChartTranslations = {
  ko: {
    title: "프리미엄 추이",
    last30Days: "최근 약 6개월",
    loading: "프리미엄 이력을 불러오는 중...",
    loadError: "프리미엄 이력을 불러오지 못했습니다.",
    noData: "프리미엄 이력 데이터가 없습니다.",
    premium: "프리미엄",
    currentPosition: "현재 프리미엄 위치",
    historicallyCheap: "역사적 저평가 구간",
    historicallyExpensive: "역사적 고평가 구간",
    historicallyNeutral: "중립 구간",
    cheap: "저평가",
    expensive: "고평가",
    current: "현재",
    average: "평균",
    highest: "최고",
    lowest: "최저",
    cheapInterpretation:
      "현재 프리미엄({premium})은 최근 기간 중 하위 {percentile}% 수준입니다.",
    expensiveInterpretation:
      "현재 프리미엄({premium})은 최근 기간 중 상위 {percentile}% 수준입니다.",
    neutralInterpretation:
      "현재 프리미엄({premium})은 최근 기간 중 {percentile}% 수준으로 중립 구간에 있습니다.",
  },
  en: {
    title: "Premium History",
    last30Days: "Last ~6 months",
    loading: "Loading premium history...",
    loadError: "Failed to load premium history.",
    noData: "No premium history data available.",
    premium: "Premium",
    currentPosition: "Current Premium Position",
    historicallyCheap: "Historically Cheap",
    historicallyExpensive: "Historically Expensive",
    historicallyNeutral: "Neutral Zone",
    cheap: "Cheap",
    expensive: "Expensive",
    current: "Current",
    average: "Average",
    highest: "Highest",
    lowest: "Lowest",
    cheapInterpretation:
      "Current premium ({premium}) is in the lower {percentile}% of the recent range.",
    expensiveInterpretation:
      "Current premium ({premium}) is in the upper {percentile}% of the recent range.",
    neutralInterpretation:
      "Current premium ({premium}) is at the {percentile}th percentile of the recent range.",
  },
} as const;
