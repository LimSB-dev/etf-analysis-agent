"use client";

import { useTranslations } from "next-intl";
import type { InterestEtfEntryType } from "./types";

export interface InterestEtfListViewPropsType {
  entries: InterestEtfEntryType[];
}

export const InterestEtfListView = ({
  entries,
}: InterestEtfListViewPropsType) => {
  const t = useTranslations("mypage");

  return (
    <>
      <ul className="space-y-3 sm:hidden" role="list">
        {entries.length === 0 ? (
          <li className="rounded-lg border border-gray-200 bg-gray-50/50 py-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400">
            {t("emptyMessage")}
          </li>
        ) : (
          entries.map(({ etfId, name, p }) => (
            <li
              key={etfId}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {name}
              </p>
              <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
                <span className="text-green-600 dark:text-green-400">
                  {t("buyThresholdLabel")}: {p.buyPremiumThreshold}
                  {t("unitPercent")}
                </span>
                <span className="text-gray-400 dark:text-gray-500" aria-hidden>
                  ·
                </span>
                <span className="text-red-600 dark:text-red-400">
                  {t("sellThresholdLabel")}:{" "}
                  {p.sellPremiumThreshold === null
                    ? t("sellThresholdNone")
                    : `${p.sellPremiumThreshold >= 0 ? "+" : ""}${p.sellPremiumThreshold}${t("unitPercent")}`}
                </span>
              </p>
            </li>
          ))
        )}
      </ul>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full table-fixed text-left text-sm" role="grid">
          <caption className="sr-only">{t("tableCaption")}</caption>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              <th
                scope="col"
                className="w-[50%] min-w-0 py-2 pr-4 font-medium text-gray-700 dark:text-gray-300"
              >
                {t("etfColumn")}
              </th>
              <th
                scope="col"
                className="w-[25%] min-w-0 py-2 pr-4 font-medium text-green-700 dark:text-green-400"
              >
                {t("buyThresholdLabel")}
              </th>
              <th
                scope="col"
                className="w-[25%] min-w-0 py-2 pr-4 font-medium text-red-700 dark:text-red-400"
              >
                {t("sellThresholdLabel")}
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="py-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  {t("emptyMessage")}
                </td>
              </tr>
            ) : (
              entries.map(({ etfId, name, p }) => (
                <tr
                  key={etfId}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                    {name}
                  </td>
                  <td className="py-3 pr-4 font-medium text-green-700 dark:text-green-400">
                    {p.buyPremiumThreshold}
                    {t("unitPercent")}
                  </td>
                  <td className="py-3 pr-4 font-medium text-red-700 dark:text-red-400">
                    {p.sellPremiumThreshold === null
                      ? t("sellThresholdNone")
                      : `${p.sellPremiumThreshold >= 0 ? "+" : ""}${p.sellPremiumThreshold}${t("unitPercent")}`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
