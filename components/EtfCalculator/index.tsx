"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  ChevronDown,
  Info,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLocaleState } from "@/components/I18nProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setShowSticky,
  setShowDetails,
  setIsKoreanMarketOpen,
  setUserThresholdsByEtf,
  setResult,
} from "@/store/etfCalculatorSlice";
import { DEFAULT_THRESHOLDS } from "@/store/etfCalculatorSlice";
import { fetchEtfDataThunk } from "@/store/etfCalculatorThunks";
import { calculatePremiumResult } from "@/lib/premium-calculation";
import {
  ETF_OPTIONS,
  INDEX_SYMBOL_NASDAQ100,
  INDEX_SYMBOL_SP500,
  INDEX_SYMBOL_SEMICONDUCTOR,
} from "@/lib/etf-options";
import { GITHUB_ISSUES_URL, TELEGRAM_CHANNEL_URL } from "@/lib/site-config";
import { EtfCalculatorStickySelector } from "./EtfCalculatorStickySelector";
import { EtfCalculatorDetailsAccordion } from "./EtfCalculatorDetailsAccordion";
import { EtfCalculatorExtraTabs } from "./EtfCalculatorExtraTabs";
import { EtfCalculatorAlertBanner } from "./EtfCalculatorAlertBanner";

export function EtfCalculator() {
  const t = useTranslations();
  const { locale } = useLocaleState();
  const dispatch = useAppDispatch();
  const etfSelectorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const selectedEtf = useAppSelector((s) => s.etfCalculator.selectedEtf);
  const inputs = useAppSelector((s) => s.etfCalculator.inputs);
  const result = useAppSelector((s) => s.etfCalculator.result);
  const isLoading = useAppSelector((s) => s.etfCalculator.isLoading);
  const showSticky = useAppSelector((s) => s.etfCalculator.showSticky);
  const showDetails = useAppSelector((s) => s.etfCalculator.showDetails);
  const extraTab = useAppSelector((s) => s.etfCalculator.extraTab);
  const isKoreanMarketOpen = useAppSelector(
    (s) => s.etfCalculator.isKoreanMarketOpen,
  );
  const userThresholdsByEtf = useAppSelector(
    (s) => s.etfCalculator.userThresholdsByEtf,
  );
  const thresholdsForSelected =
    selectedEtf != null
      ? userThresholdsByEtf[selectedEtf.id] ?? DEFAULT_THRESHOLDS
      : DEFAULT_THRESHOLDS;
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const sessionStatus = sessionResult?.status ?? "loading";

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      return;
    }
    fetch("/api/mypage/preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: { preferences?: Record<string, { buyPremiumThreshold: number; sellPremiumThreshold: number }> } | null) => {
          if (data?.preferences && Object.keys(data.preferences).length > 0) {
            const byEtf: Record<string, { buy: number; sell: number }> = {};
            for (const [etfId, p] of Object.entries(data.preferences)) {
              byEtf[etfId] = {
                buy: p.buyPremiumThreshold ?? -1,
                sell: p.sellPremiumThreshold ?? 1,
              };
            }
            dispatch(setUserThresholdsByEtf(byEtf));
          }
        },
      )
      .catch(() => {});
  }, [sessionStatus, dispatch]);

  useEffect(() => {
    if (!inputs.etfCurrent || !inputs.nav) {
      return;
    }
    const next = calculatePremiumResult(inputs, {
      buyThreshold: thresholdsForSelected.buy,
      sellThreshold: thresholdsForSelected.sell,
    });
    if (next) {
      dispatch(setResult(next));
    }
  }, [
    inputs,
    thresholdsForSelected.buy,
    thresholdsForSelected.sell,
    dispatch,
  ]);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const utcMin = now.getUTCMinutes();
      const utcDay = now.getUTCDay();
      const kstHour = (utcHour + 9) % 24;
      const dayOffset = utcHour + 9 >= 24 ? 1 : 0;
      const kstDay = (utcDay + dayOffset) % 7;
      const isWeekend = kstDay === 0 || kstDay === 6;
      if (isWeekend) {
        dispatch(setIsKoreanMarketOpen(false));
        return;
      }
      if (kstHour < 9 || kstHour > 15 || (kstHour === 15 && utcMin >= 30)) {
        dispatch(setIsKoreanMarketOpen(false));
        return;
      }
      dispatch(setIsKoreanMarketOpen(true));
    };
    const interval = setInterval(check, 60 * 1000);
    check();
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      if (etfSelectorRef.current && selectedEtf) {
        const rect = etfSelectorRef.current.getBoundingClientRect();
        dispatch(setShowSticky(rect.bottom < 0));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dispatch, selectedEtf]);

  const handleEtfChange = (etfId: string) => {
    dispatch(
      fetchEtfDataThunk({
        etfId,
        isRefetch: false,
        alertMissing: (key) => alert(t(key)),
        alertFailed: (key) => alert(t(key)),
      }),
    );
  };

  const handleFetchData = () => {
    if (!selectedEtf) return;
    dispatch(
      fetchEtfDataThunk({
        etfId: selectedEtf.id,
        isRefetch: true,
        alertMissing: (key) => alert(t(key)),
        alertFailed: (key) => alert(t(key)),
      }),
    );
  };

  const fmt = (num: number, decimals = 2) =>
    num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  const fmtKrw = (num: number) =>
    `₩${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const fmtPct = (num: number) => `${(num * 100).toFixed(2)}%`;
  const fmtNum = (num: number) =>
    num.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const optionsByGroup = [
    {
      label: t("nasdaq100Group"),
      etfs: ETF_OPTIONS.filter((e) => e.indexSymbol === INDEX_SYMBOL_NASDAQ100),
    },
    {
      label: t("sp500Group"),
      etfs: ETF_OPTIONS.filter((e) => e.indexSymbol === INDEX_SYMBOL_SP500),
    },
    {
      label: t("semiconductorGroup"),
      etfs: ETF_OPTIONS.filter(
        (e) => e.indexSymbol === INDEX_SYMBOL_SEMICONDUCTOR,
      ),
    },
  ];

  if (!selectedEtf) return null;

  return (
    <div className="space-y-6">
      <EtfCalculatorStickySelector
        optionsByGroup={optionsByGroup}
        onEtfChange={handleEtfChange}
      />

      <section
        className="bg-white dark:bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800"
        aria-labelledby="etf-premium-analysis-heading"
      >
        <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-row justify-between items-center gap-4">
                <h2
                  id="etf-premium-analysis-heading"
                  ref={etfSelectorRef}
                  className="text-lg font-bold text-gray-900 dark:text-gray-100"
                >
                  {t("premiumAnalysis")}
                </h2>
                <button
                  type="button"
                  onClick={handleFetchData}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  aria-label={isLoading ? t("fetchingData") : t("autoFetchPrices")}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  {isLoading ? t("fetchingData") : t("autoFetchPrices")}
                </button>
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="etf-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("selectEtf")}
              </label>
              <div className="relative">
                <select
                  id="etf-select"
                  value={selectedEtf.id}
                  onChange={(e) => handleEtfChange(e.target.value)}
                  className="w-full appearance-none rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label={t("selectEtf")}
                >
                  {optionsByGroup.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.etfs.map((etf) => (
                        <option key={`main-${etf.id}`} value={etf.id}>
                          {etf.name} ({etf.code})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t("baseIndex")}:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedEtf.indexName}
                </span>
                {" · "}
                {t("dataProvidedByNaver")}
              </p>
            </div>

            {isLoading && !inputs.etfPrev && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-5"
                    >
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
              </div>
            )}

            {inputs.etfPrev && (
              <div className="space-y-6">
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                    !isLoading ? "animate-in fade-in duration-200" : ""
                  }`}
                >
                  <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {selectedEtf.name} ({selectedEtf.code}.KS)
                      </h3>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {isKoreanMarketOpen
                          ? t("currentPrice")
                          : t("priceAfterMarketClose")}
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {fmtKrw(Number.parseFloat(inputs.etfCurrent))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-700 rounded-lg p-5 flex flex-col items-center text-center">
                    <div className="mb-3">
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
                            <div className="font-medium mb-1">
                              {t("iNavTooltipTitle")}
                            </div>
                            <div>{t("iNavTooltipDesc")}</div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
                          </div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {result
                          ? fmtKrw(Math.round(result.iNav))
                          : fmtKrw(Number.parseFloat(inputs.nav))}
                      </div>
                      <p
                        className="text-xs text-gray-500 dark:text-gray-400 mt-1.5"
                        aria-hidden="true"
                      >
                        {t("navFuturesDisclaimer")}
                      </p>
                    </div>
                  </div>
                </div>

                {result && (
                  <div
                    ref={resultRef}
                    className={`rounded-xl p-6 animate-in fade-in duration-200 border-2 ${
                      result.signal === "BUY"
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 dark:from-green-950/40 dark:to-emerald-950/40 dark:border-green-700"
                        : result.signal === "SELL"
                          ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-300 dark:from-red-950/40 dark:to-rose-950/40 dark:border-red-700"
                          : "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 dark:from-yellow-950/40 dark:to-orange-950/40 dark:border-yellow-700"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-8">
                        <div
                          className={`p-4 rounded-full ${
                            result.signal === "BUY"
                              ? "bg-green-500 text-white dark:bg-green-600"
                              : result.signal === "SELL"
                                ? "bg-red-500 text-white dark:bg-red-600"
                                : "bg-yellow-500 text-white dark:bg-yellow-600"
                          }`}
                        >
                          {result.signal === "BUY" && (
                            <TrendingUp className="w-8 h-8" />
                          )}
                          {result.signal === "SELL" && (
                            <TrendingDown className="w-8 h-8" />
                          )}
                          {result.signal === "HOLD" && (
                            <Minus className="w-8 h-8" />
                          )}
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
                        </div>
                      </div>
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
                        <p
                          className="text-xs text-gray-500 dark:text-gray-400 mt-1.5"
                          aria-hidden="true"
                        >
                          {t("premiumFormulaText")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(inputs.etfPrev || result || isLoading) && (
              <EtfCalculatorDetailsAccordion
                labels={{
                  detailedAnalysis: t("detailedAnalysis"),
                  iNavCalculation: t("iNavCalculation"),
                  officialNav: t("officialNav"),
                  prevDay: t("prevDay"),
                  indexReturn: t("indexReturn"),
                  indexReturnDesc: t("indexReturnDesc"),
                  fxReturn: t("fxReturn"),
                  fxReturnDesc: t("fxReturnDesc"),
                  analysisSummary: t("analysisSummary"),
                  realtimeEstimatedPrice: t("realtimeEstimatedPrice"),
                  currentMarketPrice: t("currentMarketPrice"),
                  gap: t("gap"),
                  fairPriceIs: t("fairPriceIs"),
                  fairPriceEnd: t("fairPriceEnd"),
                  iNavFormulaDesc: t("iNavFormulaDesc"),
                }}
                fmtKrw={fmtKrw}
                fmtPct={fmtPct}
                fmtNum={fmtNum}
              />
            )}
          </div>
        </div>
      </section>

      {(inputs.etfPrev || extraTab) && (
        <EtfCalculatorExtraTabs
          premiumTrendTab={t("premiumTrendTab")}
          strategySimulationTab={t("strategySimulationTab")}
          sameIndexComparisonTab={t("sameIndexComparisonTab")}
          extraTabsRegionLabel={t("extraTabsRegionLabel")}
          locale={locale}
        />
      )}

      {inputs.etfPrev && (
        <EtfCalculatorAlertBanner
          alertBannerSectionLabel={t("alertBannerSectionLabel")}
          telegramAlertTitle={t("telegramAlertTitle")}
          telegramAlertDesc={t("telegramAlertDesc")}
          featureRequestTitle={t("featureRequestTitle")}
          featureRequestDesc={t("featureRequestDesc")}
          alertRequestViaIssue={t("alertRequestViaIssue")}
          alertRequestViaEmail={t("alertRequestViaEmail")}
          alertRequestJoinTelegram={t("alertRequestJoinTelegram")}
          alertRequestEmailSubject={t("alertRequestEmailSubject")}
          alertRequestEmailBody={t("alertRequestEmailBody")}
          alertRequestIssueUrl={GITHUB_ISSUES_URL}
          telegramChannelUrl={TELEGRAM_CHANNEL_URL || undefined}
        />
      )}
    </div>
  );
}
