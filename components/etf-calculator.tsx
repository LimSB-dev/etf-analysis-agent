"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ChevronDown,
  Globe,
  Info,
} from "lucide-react";

type MarketInputs = {
  etfPrev: string;
  qqqPrev: string;
  qqqAfter: string;
  fxPrev: string;
  fxNow: string;
  etfCurrent: string;
  nav: string;
};
import { fetchMarketData } from "@/app/actions";
import { ETF_OPTIONS, type EtfOption } from "@/lib/etf-options";
import { useLocaleState } from "@/components/i18n-provider";

type CalculationResult = {
  qqqReturn: number;
  fxReturn: number;
  etfFair: number;
  iNav: number;
  premium: number;
  signal: "BUY" | "SELL" | "HOLD";
};

export function EtfCalculator() {
  const t = useTranslations();
  const { locale, setLocale } = useLocaleState();
  const [isLoading, setIsLoading] = useState(false);
  const pageTitle = t("pageTitle");
  const pageDescription = t("pageDescription");
  const [selectedEtf, setSelectedEtf] = useState<EtfOption>(ETF_OPTIONS[0]);
  const defaultInputs: MarketInputs = {
    etfPrev: "",
    qqqPrev: "",
    qqqAfter: "",
    fxPrev: "",
    fxNow: "",
    etfCurrent: "",
    nav: "",
  };

  const [inputs, setInputs] = useState<MarketInputs>(defaultInputs);

  const [result, setResult] = useState<CalculationResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const etfSelectorRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleEtfChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const etf = ETF_OPTIONS.find((o) => o.id === e.target.value);
    if (etf) {
      const savedScrollY = window.scrollY;
      
      setSelectedEtf(etf);
      setInputs(defaultInputs);
      setResult(null);
      
      setIsLoading(true);
      try {
        const data = await fetchMarketData(etf.id);

        if (
          data.etf.price === 0 ||
          data.index.price === 0 ||
          data.fx.price === 0
        ) {
          alert(t("someDataMissing"));
        }

        const newInputs = {
          ...defaultInputs,
          etfPrev:
            data.etf.prevClose > 0
              ? data.etf.prevClose.toString()
              : "",
          etfCurrent:
            data.etf.price > 0 ? data.etf.price.toString() : "",
          nav:
            data.etf.nav > 0 ? data.etf.nav.toString() : "",
          qqqPrev:
            data.index.prevClose > 0
              ? data.index.prevClose.toString()
              : "",
          qqqAfter:
            data.index.price > 0 ? data.index.price.toString() : "",
          fxPrev:
            data.fx.prevClose > 0 ? data.fx.prevClose.toString() : "",
          fxNow: data.fx.price > 0 ? data.fx.price.toString() : "",
        };

        setInputs(newInputs);
        performCalculation(newInputs);
      } catch (error) {
        console.error("Failed to fetch data", error);
        alert(t("fetchFailed"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (etfSelectorRef.current) {
        const rect = etfSelectorRef.current.getBoundingClientRect();
        setShowSticky(rect.bottom < 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFetchData = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const data = await fetchMarketData(selectedEtf.id);

      if (
        data.etf.price === 0 ||
        data.index.price === 0 ||
        data.fx.price === 0
      ) {
        alert(t("someDataMissing"));
      }

      const newInputs = {
        ...inputs,
        etfPrev:
          data.etf.prevClose > 0
            ? data.etf.prevClose.toString()
            : inputs.etfPrev,
        etfCurrent:
          data.etf.price > 0 ? data.etf.price.toString() : inputs.etfCurrent,
        nav:
          data.etf.nav > 0 ? data.etf.nav.toString() : inputs.nav,
        qqqPrev:
          data.index.prevClose > 0
            ? data.index.prevClose.toString()
            : inputs.qqqPrev,
        qqqAfter:
          data.index.price > 0 ? data.index.price.toString() : inputs.qqqAfter,
        fxPrev:
          data.fx.prevClose > 0 ? data.fx.prevClose.toString() : inputs.fxPrev,
        fxNow: data.fx.price > 0 ? data.fx.price.toString() : inputs.fxNow,
      };

      setInputs(newInputs);
      performCalculation(newInputs);
    } catch (error) {
      console.error("Failed to fetch data", error);
      alert(t("fetchFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const performCalculation = (data?: MarketInputs) => {
    const source = data || inputs;

    const etfCurrent = Number.parseFloat(source.etfCurrent);
    const nav = Number.parseFloat(source.nav);
    const qqqPrev = Number.parseFloat(source.qqqPrev);
    const qqqAfter = Number.parseFloat(source.qqqAfter);
    const fxPrev = Number.parseFloat(source.fxPrev);
    const fxNow = Number.parseFloat(source.fxNow);

    if (isNaN(etfCurrent) || etfCurrent <= 0 || isNaN(nav) || nav <= 0) {
      return false;
    }

    // 1. Index Return
    const qqqReturn = !isNaN(qqqPrev) && !isNaN(qqqAfter) && qqqPrev > 0 
      ? (qqqAfter - qqqPrev) / qqqPrev 
      : 0;

    // 2. FX Return
    const fxReturn = !isNaN(fxPrev) && !isNaN(fxNow) && fxPrev > 0 
      ? (fxNow - fxPrev) / fxPrev 
      : 0;

    // 3. Calculate iNAV (실시간 추정 순자산가치)
    // iNAV = 전일 NAV × (1 + 지수 수익률) × (1 + 환율 변동률)
    const iNav = nav * (1 + qqqReturn) * (1 + fxReturn);

    // 4. Premium/Discount (iNAV 기준)
    const premium = ((etfCurrent - iNav) / iNav) * 100;

    // 5. Signal
    let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
    if (premium >= 1) {
      signal = "SELL";
    } else if (premium <= -1) {
      signal = "BUY";
    }

    setResult({
      qqqReturn,
      fxReturn,
      etfFair: nav,
      iNav,
      premium,
      signal,
    });

    return true;
  };

  // Helper to format numbers
  const fmt = (num: number, decimals = 2) =>
    num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  const fmtPct = (num: number) => `${(num * 100).toFixed(2)}%`;
  const fmtKrw = (num: number) =>
    `₩${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const fmtNum = (num: number) =>
    num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtUsd = (num: number) =>
    `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Sticky ETF Selector - Dynamic Island Style with Glassmorphism */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 flex items-center gap-3 min-w-[300px] max-w-[90vw] group ${
          showSticky
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{
          top: showSticky ? "16px" : "-48px",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out, top 0.7s ease-out",
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: "100px",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Content */}
        <div className="flex-shrink-0 p-1.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
          <Calculator className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="relative flex-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-6" style={{ textShadow: "0 0.5px 1px rgba(255, 255, 255, 0.5)" }}>
            <span className="hidden sm:inline">{selectedEtf.name} ({selectedEtf.code})</span>
            <span className="sm:hidden">{selectedEtf.name}</span>
          </div>
          <select
            value={selectedEtf.id}
            onChange={handleEtfChange}
            disabled={isLoading}
            className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <optgroup label={t("nasdaq100Group")}>
              {ETF_OPTIONS.filter((e) => e.indexSymbol === "QQQ.O").map(
                (etf) => (
                  <option key={`sticky-${etf.id}`} value={etf.id}>
                    {etf.name} ({etf.code})
                  </option>
                ),
              )}
            </optgroup>
            <optgroup label={t("sp500Group")}>
              {ETF_OPTIONS.filter((e) => e.indexSymbol === "SPY").map(
                (etf) => (
                  <option key={`sticky-${etf.id}`} value={etf.id}>
                    {etf.name} ({etf.code})
                  </option>
                ),
              )}
            </optgroup>
            <optgroup label={t("semiconductorGroup")}>
              {ETF_OPTIONS.filter((e) => e.indexSymbol === "SOXX.O").map(
                (etf) => (
                  <option key={`sticky-${etf.id}`} value={etf.id}>
                    {etf.name} ({etf.code})
                  </option>
                ),
              )}
            </optgroup>
          </select>
          <ChevronDown className={`w-4 h-4 text-gray-700 dark:text-gray-300 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 ${isLoading ? "animate-pulse" : ""}`} />
        </div>
      </div>

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

      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800" style={{ scrollSnapAlign: "start" }}>
        {/* Input Section */}
        <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t("premiumAnalysis")}
                </h2>
                <button
                  type="button"
                  onClick={handleFetchData}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  {isLoading ? t("fetchingData") : t("autoFetchPrices")}
                </button>
              </div>
            </div>

            {/* ETF Selector */}
            <div className="relative" ref={etfSelectorRef}>
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
                    {ETF_OPTIONS.filter((e) => e.indexSymbol === "QQQ.O").map(
                      (etf) => (
                        <option key={`main-${etf.id}`} value={etf.id}>
                          {etf.name} ({etf.code})
                        </option>
                      ),
                    )}
                  </optgroup>
                  <optgroup label={t("sp500Group")}>
                    {ETF_OPTIONS.filter((e) => e.indexSymbol === "SPY").map(
                      (etf) => (
                        <option key={`main-${etf.id}`} value={etf.id}>
                          {etf.name} ({etf.code})
                        </option>
                      ),
                    )}
                  </optgroup>
                  <optgroup label={t("semiconductorGroup")}>
                    {ETF_OPTIONS.filter((e) => e.indexSymbol === "SOXX.O").map(
                      (etf) => (
                        <option key={`main-${etf.id}`} value={etf.id}>
                          {etf.name} ({etf.code})
                        </option>
                      ),
                    )}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t("baseIndex")}:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedEtf.indexName}
                </span>
              </p>
            </div>

            {/* Fetched Data Display (Read-Only) - Loading Skeleton */}
            {isLoading && !inputs.etfPrev && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3 justify-center">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="text-center">
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse mx-auto" />
                      <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fetched Data Display (Read-Only) */}
            {inputs.etfPrev && !isLoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                  {/* Group 1: ETF Current Price */}
                  <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                      <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {selectedEtf.name} ({selectedEtf.code}.KS)
                      </h3>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {t("currentPrice")}
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {fmtKrw(Number.parseFloat(inputs.etfCurrent))}
                      </div>
                    </div>
                  </div>

                  {/* Group 2: 실시간 추정 가격 */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-700 rounded-lg p-5">
                    <div className="mb-3 text-center">
                      <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {t("realtimeEstimatedFairPrice")}
                      </h3>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 flex items-center justify-center gap-1.5 group/sub">
                        <span>iNAV</span>
                        <div className="relative">
                          <Info className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/sub:block w-64 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg z-10">
                            <div className="font-medium mb-1">{t("iNavTooltipTitle")}</div>
                            <div>{t("iNavTooltipDesc")}</div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {result ? fmtKrw(Math.round(result.iNav)) : fmtKrw(Number.parseFloat(inputs.nav))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signal Card - 매수/매도/보유 (Loading) */}
                {isLoading && (
                  <div className="rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 animate-pulse">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-2">
                          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-xl px-8 py-5 border border-gray-200 dark:border-gray-700">
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 mx-auto" />
                        <div className="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Signal Card - 매수/매도/보유 */}
                {result && !isLoading && (
                  <div
                    ref={resultRef}
                    className={`rounded-xl p-6 animate-in fade-in duration-500 border-2 ${
                      result.signal === "BUY"
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 dark:from-green-950/40 dark:to-emerald-950/40 dark:border-green-700"
                        : result.signal === "SELL"
                          ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-300 dark:from-red-950/40 dark:to-rose-950/40 dark:border-red-700"
                          : "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 dark:from-yellow-950/40 dark:to-orange-950/40 dark:border-yellow-700"
                    }`}
                    style={{ scrollMarginTop: "80px" }}
                  >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* Signal Icon + Text */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-4 rounded-full ${
                            result.signal === "BUY"
                              ? "bg-green-500 text-white dark:bg-green-600"
                              : result.signal === "SELL"
                                ? "bg-red-500 text-white dark:bg-red-600"
                                : "bg-yellow-500 text-white dark:bg-yellow-600"
                          }`}
                        >
                          {result.signal === "BUY" && <TrendingUp className="w-8 h-8" />}
                          {result.signal === "SELL" && <TrendingDown className="w-8 h-8" />}
                          {result.signal === "HOLD" && <Minus className="w-8 h-8" />}
                        </div>
                        <div>
                          <div className="text-3xl md:text-4xl font-black mb-1">
                            {result.signal === "BUY" && (
                              <span className="text-green-600 dark:text-green-400">
                                {t("buyAction")}
                              </span>
                            )}
                            {result.signal === "SELL" && (
                              <span className="text-red-600 dark:text-red-400">
                                {t("sellAction")}
                              </span>
                            )}
                            {result.signal === "HOLD" && (
                              <span className="text-yellow-600 dark:text-yellow-400">
                                {t("holdAction")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line mb-3">
                            {result.signal === "BUY" && t("buySignalDesc")}
                            {result.signal === "SELL" && t("sellSignalDesc")}
                            {result.signal === "HOLD" && t("holdSignalDesc")}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                            {t("premiumFormulaText")}
                          </div>
                        </div>
                      </div>

                      {/* Premium Badge */}
                      <div className="text-center bg-white dark:bg-gray-900 rounded-xl px-8 py-5 shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {t("currentPremium")}
                        </div>
                        <div
                          className={`text-4xl md:text-5xl font-bold ${
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
                  </div>
                )}

                {/* Collapsible Details Section */}
                {result && (
                  <div className="mt-4 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowDetails(!showDetails)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {t("detailedAnalysis")}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                          showDetails ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showDetails && (
                      <div className="p-6 pt-0 border-t border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 items-stretch">
                          {/* Left: iNAV Calculation */}
                          <div className="flex flex-col space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-gray-500" />
                              {t("iNavCalculation")}
                            </h3>
                            <div className="grid grid-cols-1 gap-3 text-sm flex-1 auto-rows-fr">
                              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                                <span className="text-gray-600 dark:text-gray-400">
                                  ① {t("officialNav")} {t("prevDay")}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {fmtKrw(Math.round(result.etfFair))}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                                <span className="text-gray-600 dark:text-gray-400">
                                  ② {selectedEtf.indexName.split(" ")[0]} {t("indexReturn")} ({t("indexReturnDesc")})
                                </span>
                                <span className={`font-semibold shrink-0 ${result.qqqReturn >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                  {result.qqqReturn >= 0 ? "+" : ""}{fmtPct(result.qqqReturn)}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                                <span className="text-gray-600 dark:text-gray-400">
                                  ③ {t("fxReturn")} ({t("fxReturnDesc")})
                                </span>
                                <span className={`font-semibold shrink-0 ${result.fxReturn >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                  {result.fxReturn >= 0 ? "+" : ""}{fmtPct(result.fxReturn)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Premium Breakdown */}
                          <div className="flex flex-col space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Info className="w-4 h-4 text-gray-500" />
                              {t("analysisSummary")}
                            </h3>
                            <div className="grid grid-cols-1 gap-3 text-sm flex-1 auto-rows-fr">
                              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {t("realtimeEstimatedPrice")}
                                </span>
                                <span className="font-semibold text-blue-700 dark:text-blue-300">
                                  {fmtKrw(Math.round(result.iNav))}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {t("currentMarketPrice")}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {fmtKrw(Number.parseFloat(inputs.etfCurrent))}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {t("gap")}
                                </span>
                                <span
                                  className={`font-semibold shrink-0 ${
                                    Number.parseFloat(inputs.etfCurrent) > result.iNav
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-green-600 dark:text-green-400"
                                  }`}
                                >
                                  {fmtKrw(
                                    Number.parseFloat(inputs.etfCurrent) - Math.round(result.iNav)
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 합친 파란 영역: 결론 + 추정 가격 계산식 (전체 가로) */}
                        <div className="mt-6 w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-5 border-2 border-blue-200 dark:border-blue-800">
                          <div className="flex flex-col gap-4">
                            <div className="text-base text-gray-900 dark:text-gray-100">
                              <span className="font-medium">{selectedEtf.name}</span>
                              {t("fairPriceIs")}{" "}
                              <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                                {fmtKrw(Math.round(result.iNav))}
                              </span>
                              {t("fairPriceEnd")}
                            </div>
                            <div className="space-y-1.5">
                              <div className="text-xs text-blue-800/90 dark:text-blue-200/90 font-medium">
                                {t("iNavFormulaDesc")}
                              </div>
                              <div className="text-xs text-blue-800/80 dark:text-blue-200/80 font-mono">
                                {fmtNum(Math.round(result.etfFair))} × (1 + {result.qqqReturn >= 0 ? "+" : ""}{fmtPct(result.qqqReturn)}) × (1 + {result.fxReturn >= 0 ? "+" : ""}{fmtPct(result.fxReturn)}) = {fmtNum(Math.round(result.iNav))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
