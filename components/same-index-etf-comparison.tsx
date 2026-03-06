"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart3 } from "lucide-react";
import { fetchSameIndexEtfComparison, type SameIndexEtfRowType } from "@/app/actions";
import type { Locale } from "@/lib/i18n/config";

type ComparisonRowType = SameIndexEtfRowType & {
  indexReturn: number;
  fxReturn: number;
  iNav: number;
  premium: number;
  signal: "BUY" | "SELL" | "HOLD";
};

const getSignal = (premium: number): "BUY" | "SELL" | "HOLD" => {
  if (premium >= 1) return "SELL";
  if (premium <= -1) return "BUY";
  return "HOLD";
};

export const SameIndexEtfComparison = ({
  indexSymbol,
  indexName,
  locale,
}: {
  indexSymbol: string;
  indexName: string;
  locale: Locale;
}) => {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ComparisonRowType[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSameIndexEtfComparison(indexSymbol);
      const indexPrev = res.index.prevClose;
      const indexPrice = res.index.price;
      const fxPrev = res.fx.prevClose;
      const fxNow = res.fx.price;

      const indexReturn =
        indexPrev > 0 && indexPrice > 0 ? (indexPrice - indexPrev) / indexPrev : 0;
      const fxReturn = fxPrev > 0 && fxNow > 0 ? (fxNow - fxPrev) / fxPrev : 0;

      const computed: ComparisonRowType[] = res.etfs
        .filter((r) => r.nav > 0 && r.price > 0)
        .map((r) => {
          const iNav = r.nav * (1 + indexReturn) * (1 + fxReturn);
          const premium = ((r.price - iNav) / iNav) * 100;
          return {
            ...r,
            indexReturn,
            fxReturn,
            iNav,
            premium,
            signal: getSignal(premium),
          };
        });

      setRows(computed);
    } catch (e) {
      console.error("Same-index ETF comparison fetch failed", e);
      setError(t("fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [indexSymbol]);

  const fmtKrw = (num: number) =>
    num.toLocaleString(locale === "ko" ? "ko-KR" : "en-US", { maximumFractionDigits: 0 });
  const fmtPct = (num: number) =>
    `${num >= 0 ? "+" : ""}${num.toLocaleString(locale === "ko" ? "ko-KR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-8 flex flex-col items-center justify-center min-h-[280px]">
        <RefreshCw className="w-10 h-10 text-gray-400 dark:text-gray-500 animate-spin mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("fetchingData")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" />
          {t("autoFetchPrices")}
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        {t("sameIndexComparisonNoData")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 justify-between w-full">
          <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {t("sameIndexComparisonTitle")} · {indexName}
          </h3>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <RefreshCw className="w-4 h-4" />
            {t("autoFetchPrices")}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label={t("sameIndexComparisonTitle")}>
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-gray-600 dark:text-gray-400">
              <th className="px-4 py-3 font-medium">{t("sameIndexComparisonEtfName")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("currentPrice")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("sameIndexComparisonNav")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("sameIndexComparisonINav")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("currentPremium")}</th>
              <th className="px-4 py-3 font-medium text-center">{t("signal")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.etf.id}
                className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {row.etf.name} ({row.etf.code})
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  ₩{fmtKrw(row.price)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                  ₩{fmtKrw(row.nav)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-blue-600 dark:text-blue-400">
                  ₩{fmtKrw(Math.round(row.iNav))}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums font-medium ${
                    row.premium > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {fmtPct(row.premium)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      row.signal === "BUY"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : row.signal === "SELL"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {row.signal === "BUY" && <TrendingUp className="w-3.5 h-3.5" />}
                    {row.signal === "SELL" && <TrendingDown className="w-3.5 h-3.5" />}
                    {row.signal === "HOLD" && <Minus className="w-3.5 h-3.5" />}
                    {row.signal === "BUY" && t("buyAction")}
                    {row.signal === "SELL" && t("sellAction")}
                    {row.signal === "HOLD" && t("holdAction")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
        {t("sameIndexComparisonDisclaimer")}
      </p>
    </div>
  );
};
