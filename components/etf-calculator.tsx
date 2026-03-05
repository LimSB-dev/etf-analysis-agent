"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Calculator, Info, TrendingUp, TrendingDown, Minus, RefreshCw, ChevronDown, Globe } from "lucide-react"
import { fetchMarketData } from "@/app/actions"
import { ETF_OPTIONS, type EtfOption } from "@/lib/etf-options"
import { useLocaleState } from "@/components/i18n-provider"

type CalculationResult = {
  qqqReturn: number
  fxReturn: number
  etfFair: number
  premium: number
  signal: "BUY" | "SELL" | "HOLD"
}

export function EtfCalculator() {
  const t = useTranslations()
  const { locale, setLocale } = useLocaleState()
  const [isLoading, setIsLoading] = useState(false)
  const pageTitle = t("pageTitle")
  const pageDescription = t("pageDescription")
  const [selectedEtf, setSelectedEtf] = useState<EtfOption>(ETF_OPTIONS[0])
  const [inputs, setInputs] = useState({
    etfPrev: "",
    qqqPrev: "",
    qqqAfter: "",
    fxPrev: "",
    fxNow: "",
    etfCurrent: "",
  })

  const [result, setResult] = useState<CalculationResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const handleEtfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const etf = ETF_OPTIONS.find((o) => o.id === e.target.value)
    if (etf) {
      setSelectedEtf(etf)
      setInputs({
        etfPrev: "",
        qqqPrev: "",
        qqqAfter: "",
        fxPrev: "",
        fxNow: "",
        etfCurrent: "",
      })
      setResult(null)
    }
  }

  const scrollToResult = () => {
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const handleFetchData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchMarketData(selectedEtf.id)

      if (data.etf.price === 0 || data.index.price === 0 || data.fx.price === 0) {
        alert(t("someDataMissing"))
      }

      const newInputs = {
        ...inputs,
        etfPrev: data.etf.prevClose > 0 ? data.etf.prevClose.toString() : inputs.etfPrev,
        etfCurrent: data.etf.price > 0 ? data.etf.price.toString() : inputs.etfCurrent,
        qqqPrev: data.index.prevClose > 0 ? data.index.prevClose.toString() : inputs.qqqPrev,
        qqqAfter: data.index.price > 0 ? data.index.price.toString() : inputs.qqqAfter,
        fxPrev: data.fx.prevClose > 0 ? data.fx.prevClose.toString() : inputs.fxPrev,
        fxNow: data.fx.price > 0 ? data.fx.price.toString() : inputs.fxNow,
      }

      setInputs(newInputs)

      // 데이터가 모두 있으면 자동으로 계산 실행 후 스크롤
      if (performCalculation(newInputs)) {
        scrollToResult()
      }
    } catch (error) {
      console.error("Failed to fetch data", error)
      alert(t("fetchFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setInputs((prev) => ({ ...prev, [name]: value }))
  }

  const performCalculation = (data?: {
    etfPrev: string
    qqqPrev: string
    qqqAfter: string
    fxPrev: string
    fxNow: string
    etfCurrent: string
  }) => {
    const source = data || inputs

    const etfPrev = Number.parseFloat(source.etfPrev)
    const qqqPrev = Number.parseFloat(source.qqqPrev)
    const qqqAfter = Number.parseFloat(source.qqqAfter)
    const fxPrev = Number.parseFloat(source.fxPrev)
    const fxNow = Number.parseFloat(source.fxNow)
    const etfCurrent = Number.parseFloat(source.etfCurrent)

    if ([etfPrev, qqqPrev, qqqAfter, fxPrev, fxNow, etfCurrent].some((val) => isNaN(val) || val <= 0)) {
      return false
    }

    // 1. Index Return
    const qqqReturn = (qqqAfter - qqqPrev) / qqqPrev

    // 2. FX Return
    const fxReturn = (fxNow - fxPrev) / fxPrev

    // 3. Fair Value
    const etfFair = etfPrev * (1 + qqqReturn) * (1 + fxReturn)

    // 4. Premium/Discount
    const premium = ((etfCurrent - etfFair) / etfFair) * 100

    // 5. Signal
    let signal: "BUY" | "SELL" | "HOLD" = "HOLD"
    if (premium >= 1) signal = "SELL"
    else if (premium <= -1) signal = "BUY"

    setResult({
      qqqReturn,
      fxReturn,
      etfFair,
      premium,
      signal,
    })

    return true
  }

  const calculate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!performCalculation()) {
      alert(t("invalidInput"))
    }
  }

  // Helper to format numbers
  const fmt = (num: number, decimals = 2) =>
    num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const fmtPct = (num: number) => `${(num * 100).toFixed(2)}%`
  const fmtKrw = (num: number) => `₩${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const fmtUsd = (num: number) =>
    `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="text-center">
        <div className="flex justify-center items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            {pageTitle}
          </h1>
          <button
            type="button"
            onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Globe className="w-3 h-3" />
            {locale === "ko" ? "EN" : "KO"}
          </button>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {pageDescription}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Input Section */}
        <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <form onSubmit={calculate} className="space-y-6">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("marketDataInputs")}</h2>
                <button
                  type="button"
                  onClick={handleFetchData}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? t("fetchingData") : t("autoFetchPrices")}
                </button>
              </div>
            </div>

            {/* ETF Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("selectEtf")}
              </label>
              <div className="relative">
                <select
                  value={selectedEtf.id}
                  onChange={handleEtfChange}
                  className="w-full appearance-none rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <optgroup label={t("nasdaq100Group")}>
                    {ETF_OPTIONS.filter((e) => e.indexSymbol === "QQQ.O").map((etf) => (
                      <option key={etf.id} value={etf.id}>
                        {etf.name} ({etf.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t("sp500Group")}>
                    {ETF_OPTIONS.filter((e) => e.indexSymbol === "SPY").map((etf) => (
                      <option key={etf.id} value={etf.id}>
                        {etf.name} ({etf.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t("semiconductorGroup")}>
                    {ETF_OPTIONS.filter((e) => e.indexSymbol === "SOXX.O").map((etf) => (
                      <option key={etf.id} value={etf.id}>
                        {etf.name} ({etf.code})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t("baseIndex")}: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedEtf.indexName}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Group 1: ETF Data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
                  {selectedEtf.name} <br />
                  ({selectedEtf.code}.KS)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("prevClose")} (ETF_prev)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="etfPrev"
                      value={inputs.etfPrev}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 85000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("currentPrice")} (ETF_current)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="etfCurrent"
                      value={inputs.etfCurrent}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 86500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Index Data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mt-2"></span>
                  {selectedEtf.indexName} <br />
                  (USD)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("prevClose")} (Index_prev)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="qqqPrev"
                      value={inputs.qqqPrev}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., 420.50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("lastClose")} (Index_after)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="qqqAfter"
                      value={inputs.qqqAfter}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., 425.20"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: FX Data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-2"></span>
                  {t("exchangeRate")} <br />
                  (KRW/USD)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("prevRate")} (FX_prev)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="fxPrev"
                      value={inputs.fxPrev}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 1350.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("currentRate")} (FX_now)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="fxNow"
                      value={inputs.fxNow}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 1355.50"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200 w-full md:w-auto transition-colors"
              >
                <Calculator className="w-4 h-4" />
                {t("calculateFairValue")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div ref={resultRef} className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Signal Header */}
          <div
            className={`rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-2 ${
              result.signal === "BUY"
                ? "bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/50"
                : result.signal === "SELL"
                  ? "bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/50"
                  : "bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  result.signal === "BUY"
                    ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                    : result.signal === "SELL"
                      ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
                }`}
              >
                {result.signal === "BUY" && <TrendingUp className="w-8 h-8" />}
                {result.signal === "SELL" && <TrendingDown className="w-8 h-8" />}
                {result.signal === "HOLD" && <Minus className="w-8 h-8" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t("signal")}: {result.signal}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {result.signal === "BUY" && t("buySignalDesc")}
                  {result.signal === "SELL" && t("sellSignalDesc")}
                  {result.signal === "HOLD" && t("holdSignalDesc")}
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {t("currentPremium")}
              </div>
              <div
                className={`text-3xl font-bold ${
                  result.premium > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {result.premium > 0 ? "+" : ""}
                {fmt(result.premium)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Fair Value Calculation */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-gray-500" />
                {t("fairValueCalculation")}
              </h3>

              <div className="space-y-4 text-sm">
                {/* Index Step */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-2">
                    <span>1. {selectedEtf.indexName.split(" ")[0]} {t("indexReturn")}</span>
                    <span>{fmtPct(result.qqqReturn)}</span>
                  </div>
                  <div className="font-mono text-xs text-gray-600 dark:text-gray-300">
                    ({fmtUsd(Number.parseFloat(inputs.qqqAfter))} - {fmtUsd(Number.parseFloat(inputs.qqqPrev))}) /{" "}
                    {fmtUsd(Number.parseFloat(inputs.qqqPrev))}
                  </div>
                </div>

                {/* FX Step */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-2">
                    <span>2. {t("fxReturn")}</span>
                    <span>{fmtPct(result.fxReturn)}</span>
                  </div>
                  <div className="font-mono text-xs text-gray-600 dark:text-gray-300">
                    ({fmt(Number.parseFloat(inputs.fxNow))} - {fmt(Number.parseFloat(inputs.fxPrev))}) /{" "}
                    {fmt(Number.parseFloat(inputs.fxPrev))}
                  </div>
                </div>

                {/* Final Formula */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-900 dark:text-blue-100">3. {t("fairValue")}</span>
                    <span className="font-bold text-lg text-blue-700 dark:text-blue-300">
                      {fmtKrw(Math.round(result.etfFair))}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-blue-800/70 dark:text-blue-200/70">
                    ETF_prev × (1 + Index%) × (1 + FX%)
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-500" />
                {t("analysisSummary")}
              </h3>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t("fairValue")}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {fmtKrw(Math.round(result.etfFair))}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t("currentMarketPrice")}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {fmtKrw(Number.parseFloat(inputs.etfCurrent))}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800/30">
                  <span className="text-gray-600 dark:text-gray-400">{t("gap")}</span>
                  <span
                    className={`font-semibold ${
                      result.etfFair > Number.parseFloat(inputs.etfCurrent)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {fmtKrw(Number.parseFloat(inputs.etfCurrent) - Math.round(result.etfFair))}
                  </span>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t("marketInsight")}</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    {selectedEtf.indexName.split(" ")[0]} {t("moved")}{" "}
                    <span className={result.qqqReturn >= 0 ? "text-green-600" : "text-red-600"}>
                      {result.qqqReturn >= 0 ? t("up") : t("down")} {fmtPct(Math.abs(result.qqqReturn))}
                    </span>
                  </li>
                  <li>
                    USD/KRW {t("moved")}{" "}
                    <span className={result.fxReturn >= 0 ? "text-green-600" : "text-red-600"}>
                      {result.fxReturn >= 0 ? t("up") : t("down")} {fmtPct(Math.abs(result.fxReturn))}
                    </span>
                  </li>
                  <li>
                    {t("etfShouldTrade")} {fmtKrw(Math.round(result.etfFair))}{t("shouldTradeAt")}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 안내문 */}
          <div className="mt-8 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-900 dark:text-amber-200">
            <p className="font-medium mb-2">{t("noticeTitle")}</p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("noticeLine1")}
              <br />
              {t("noticeLine2")}
              <br />
              {t("noticeLine3")}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
