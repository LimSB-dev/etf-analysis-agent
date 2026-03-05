"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Calculator,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ChevronDown,
  Globe,
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
import { PremiumHistoryChart } from "@/components/premium-history-chart"
import { StrategySimulation } from "@/components/strategy-simulation";

type CalculationResult = {
  qqqReturn: number;
  fxReturn: number;
  etfFair: number;
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
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleEtfChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const etf = ETF_OPTIONS.find((o) => o.id === e.target.value);
    if (etf) {
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
        if (performCalculation(newInputs)) {
          setHasCalculated(true);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        alert(t("fetchFailed"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const scrollToResult = () => {
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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

      // 데이터가 모두 있으면 자동으로 계산 실행 후 스크롤
      if (performCalculation(newInputs)) {
        setHasCalculated(true);
        scrollToResult();
      }
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

    // 1. Index Return (참고용)
    const qqqReturn = !isNaN(qqqPrev) && !isNaN(qqqAfter) && qqqPrev > 0 
      ? (qqqAfter - qqqPrev) / qqqPrev 
      : 0;

    // 2. FX Return (참고용)
    const fxReturn = !isNaN(fxPrev) && !isNaN(fxNow) && fxPrev > 0 
      ? (fxNow - fxPrev) / fxPrev 
      : 0;

    // 3. Premium/Discount (NAV 기준)
    const premium = ((etfCurrent - nav) / nav) * 100;

    // 4. Signal
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

      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Input Section */}
        <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t("marketDataInputs")}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="min-h-[44px] flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700 mt-1.5 flex-shrink-0"></span>
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                      {i === 1 && (
                        <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fetched Data Display (Read-Only) */}
            {inputs.etfPrev && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {/* Group 1: ETF Data */}
                <div className="space-y-3">
                  <h3 className="min-h-[44px] font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>{selectedEtf.name} ({selectedEtf.code}.KS)</span>
                  </h3>
                  <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t("prevClose")}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{fmtKrw(Number.parseFloat(inputs.etfPrev))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t("currentPrice")}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{fmtKrw(Number.parseFloat(inputs.etfCurrent))}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">NAV</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{fmtKrw(Number.parseFloat(inputs.nav))}</span>
                    </div>
                  </div>
                </div>

                {/* Group 2: Index Data */}
                <div className="space-y-3">
                  <h3 className="min-h-[44px] font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></span>
                    <span>{selectedEtf.indexName} (USD)</span>
                  </h3>
                  <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t("prevClose")}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{fmtUsd(Number.parseFloat(inputs.qqqPrev))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t("currentPrice")}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{fmtUsd(Number.parseFloat(inputs.qqqAfter))}</span>
                    </div>
                  </div>
                </div>

                {/* Group 3: FX Data */}
                <div className="space-y-3">
                  <h3 className="min-h-[44px] font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                    <span>{t("exchangeRate")} (KRW/USD)</span>
                  </h3>
                  <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t("prevClose")}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{fmt(Number.parseFloat(inputs.fxPrev))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t("currentPrice")}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{fmt(Number.parseFloat(inputs.fxNow))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section - Loading Skeleton */}
      {isLoading && !result && (
        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 animate-in fade-in duration-300">
          {/* Signal Header Skeleton */}
          <div className="rounded-xl p-6 mb-8 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column Skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && !isLoading && (
        <div
          ref={resultRef}
          className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
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
                {result.signal === "SELL" && (
                  <TrendingDown className="w-8 h-8" />
                )}
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
            {/* NAV-Based Calculation */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-gray-500" />
                {t("navBasedCalculation")}
              </h3>

              <div className="space-y-4 text-sm">
                {/* NAV (Official) */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-900/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      {t("officialNav")}
                    </span>
                    <span className="font-bold text-lg text-blue-700 dark:text-blue-300">
                      {fmtKrw(Math.round(result.etfFair))}
                    </span>
                  </div>
                  <div className="text-xs text-blue-800/70 dark:text-blue-200/70">
                    {t("navDescription")}
                  </div>
                </div>

                {/* Market Factors (Reference) */}
                {result.qqqReturn !== 0 && result.fxReturn !== 0 && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-2">
                        <span>
                          {selectedEtf.indexName.split(" ")[0]}{" "}
                          {t("indexReturn")}
                        </span>
                        <span>{fmtPct(result.qqqReturn)}</span>
                      </div>
                      <div className="font-mono text-xs text-gray-600 dark:text-gray-300">
                        ({fmtUsd(Number.parseFloat(inputs.qqqAfter))} -{" "}
                        {fmtUsd(Number.parseFloat(inputs.qqqPrev))}) /{" "}
                        {fmtUsd(Number.parseFloat(inputs.qqqPrev))}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-2">
                        <span>{t("fxReturn")}</span>
                        <span>{fmtPct(result.fxReturn)}</span>
                      </div>
                      <div className="font-mono text-xs text-gray-600 dark:text-gray-300">
                        ({fmt(Number.parseFloat(inputs.fxNow))} -{" "}
                        {fmt(Number.parseFloat(inputs.fxPrev))}) /{" "}
                        {fmt(Number.parseFloat(inputs.fxPrev))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-500" />
                {t("analysisSummary")}
              </h3>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                <div className="p-4 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">
                    NAV {t("netAssetValue")}
                  </span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    {fmtKrw(Math.round(result.etfFair))}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("currentMarketPrice")}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {fmtKrw(Number.parseFloat(inputs.etfCurrent))}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800/30">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("gap")}
                  </span>
                  <span
                    className={`font-semibold ${
                      Number.parseFloat(inputs.etfCurrent) > result.etfFair
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {fmtKrw(
                      Number.parseFloat(inputs.etfCurrent) -
                        Math.round(result.etfFair),
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {t("marketInsight")}
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    {t("officialNav")}: {fmtKrw(Math.round(result.etfFair))}
                  </li>
                  <li>
                    {t("currentMarketPrice")}: {fmtKrw(Number.parseFloat(inputs.etfCurrent))}
                  </li>
                  <li>
                    {result.premium > 0 ? t("tradingAtPremium") : t("tradingAtDiscount")}{" "}
                    <span
                      className={
                        result.premium > 0 ? "text-red-600" : "text-green-600"
                      }
                    >
                      {Math.abs(result.premium).toFixed(2)}%
                    </span>
                  </li>
                  {result.qqqReturn !== 0 && result.fxReturn !== 0 && (
                    <>
                      <li className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                        {t("reference")}: {selectedEtf.indexName.split(" ")[0]}{" "}
                        <span
                          className={
                            result.qqqReturn >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {result.qqqReturn >= 0 ? t("up") : t("down")}{" "}
                          {fmtPct(Math.abs(result.qqqReturn))}
                        </span>
                        , USD/KRW{" "}
                        <span
                          className={
                            result.fxReturn >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {result.fxReturn >= 0 ? t("up") : t("down")}{" "}
                          {fmtPct(Math.abs(result.fxReturn))}
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium History Chart - show after calculation */}
      {hasCalculated && result && (
        <PremiumHistoryChart
          etfId={selectedEtf.id}
          etfName={selectedEtf.name}
          currentPremium={result.premium}
          locale={locale}
        />
      )}

      {/* Strategy Simulation - show after calculation */}
      {hasCalculated && result && (
        <StrategySimulation
          etfId={selectedEtf.id}
          etfName={selectedEtf.name}
          locale={locale}
        />
      )}
    </div>
  );
}
