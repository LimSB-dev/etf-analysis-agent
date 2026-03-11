"use client";

import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { ThresholdPercentInput } from "@/components/shared";
import type { InterestEtfEntryType } from "./types";

export interface InterestEtfListEditPropsType {
  entries: InterestEtfEntryType[];
  validationError: string | null;
  setBuy: (etfId: string, value: number) => void;
  setSell: (etfId: string, value: number) => void;
  removeEtf: (etfId: string) => void;
  addFormEtfId: string;
  setAddFormEtfId: (v: string) => void;
  addFormBuy: number;
  setAddFormBuy: (v: number) => void;
  addFormSell: number;
  setAddFormSell: (v: number) => void;
  onAddFormErrorClear: () => void;
  onAddConfirm: () => void;
  availableToAdd: { id: string; name: string }[];
  addFormError: string | null;
  defaultBuy: number;
  defaultSell: number;
}

export const InterestEtfListEdit = ({
  entries,
  validationError,
  setBuy,
  setSell,
  removeEtf,
  addFormEtfId,
  setAddFormEtfId,
  addFormBuy,
  setAddFormBuy,
  addFormSell,
  setAddFormSell,
  onAddFormErrorClear,
  onAddConfirm,
  availableToAdd,
  addFormError,
  defaultBuy,
  defaultSell,
}: InterestEtfListEditPropsType) => {
  const t = useTranslations("mypage");

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {entries.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50/50 py-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400">
            {t("emptyMessage")}
          </p>
        ) : null}
        {entries.map(({ etfId, name, p }) => {
          const buyErr = validationError === `validationBuy:${etfId}`;
          const sellErr = validationError === `validationSell:${etfId}`;
          return (
            <div
              key={etfId}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 font-medium text-gray-900 dark:text-gray-100">
                  {name}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    removeEtf(etfId);
                  }}
                  title={t("removeSubscription")}
                  aria-label={t("removeSubscriptionA11y")}
                  className="shrink-0 rounded p-1.5 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={`buy-mobile-${etfId}`}
                    className="mb-0.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {t("buyThresholdLabel")}
                  </label>
                  <ThresholdPercentInput
                    id={`buy-mobile-${etfId}`}
                    value={p.buyPremiumThreshold}
                    onChange={(n) => {
                      setBuy(etfId, n);
                    }}
                    min={-20}
                    max={0}
                    variant="buy"
                    fallbackWhenInvalid={defaultBuy}
                    size="default"
                    unitLabel={t("unitPercent")}
                    aria-invalid={buyErr}
                    aria-describedby={
                      buyErr ? `buy-error-mobile-${etfId}` : undefined
                    }
                  />
                  {buyErr && (
                    <p
                      id={`buy-error-mobile-${etfId}`}
                      className="mt-0.5 text-xs text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {t("validationBuy")}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={`sell-mobile-${etfId}`}
                    className="mb-0.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {t("sellThresholdLabel")}
                  </label>
                  <ThresholdPercentInput
                    id={`sell-mobile-${etfId}`}
                    value={p.sellPremiumThreshold}
                    onChange={(n) => {
                      setSell(etfId, n);
                    }}
                    min={0}
                    max={20}
                    variant="sell"
                    fallbackWhenInvalid={defaultSell}
                    size="default"
                    unitLabel={t("unitPercent")}
                    aria-invalid={sellErr}
                    aria-describedby={
                      sellErr ? `sell-error-mobile-${etfId}` : undefined
                    }
                  />
                  {sellErr && (
                    <p
                      id={`sell-error-mobile-${etfId}`}
                      className="mt-0.5 text-xs text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {t("validationSell")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-3 dark:border-gray-600 dark:bg-gray-800/30">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("addEtf")}
          </p>
          <div className="mb-3 flex items-center gap-2">
            <select
              id="add-etf-select-mobile"
              value={addFormEtfId}
              onChange={(e) => {
                setAddFormEtfId(e.target.value);
                onAddFormErrorClear();
              }}
              aria-label={t("addEtfPlaceholder")}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">{t("addEtfPlaceholder")}</option>
              {availableToAdd.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onAddConfirm}
              aria-label={t("addEtf")}
              title={t("addEtf")}
              className="shrink-0 rounded p-1.5 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="add-buy-mobile"
                className="mb-0.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {t("buyThresholdLabel")}
              </label>
              <ThresholdPercentInput
                id="add-buy-mobile"
                value={addFormBuy}
                onChange={(n) => {
                  setAddFormBuy(n);
                  onAddFormErrorClear();
                }}
                min={-20}
                max={0}
                variant="buy"
                fallbackWhenInvalid={defaultBuy}
                size="default"
                unitLabel={t("unitPercent")}
              />
            </div>
            <div>
              <label
                htmlFor="add-sell-mobile"
                className="mb-0.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {t("sellThresholdLabel")}
              </label>
              <ThresholdPercentInput
                id="add-sell-mobile"
                value={addFormSell}
                onChange={(n) => {
                  setAddFormSell(n);
                  onAddFormErrorClear();
                }}
                min={0}
                max={20}
                variant="sell"
                fallbackWhenInvalid={defaultSell}
                size="default"
                unitLabel={t("unitPercent")}
              />
            </div>
          </div>
        </div>
      </div>
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
                className="w-[20%] min-w-0 py-2 pr-4 font-medium text-gray-700 dark:text-gray-300"
              >
                {t("buyThresholdLabel")}
              </th>
              <th
                scope="col"
                className="w-[20%] min-w-0 py-2 pr-4 font-medium text-gray-700 dark:text-gray-300"
              >
                {t("sellThresholdLabel")}
              </th>
              <th
                scope="col"
                className="w-[10%] min-w-0 py-2 font-medium text-gray-700 dark:text-gray-300"
              >
                <span className="sr-only">{t("removeSubscription")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  {t("emptyMessage")}
                </td>
              </tr>
            ) : null}
            {entries.map(({ etfId, name, p }) => {
              const buyErr = validationError === `validationBuy:${etfId}`;
              const sellErr = validationError === `validationSell:${etfId}`;
              return (
                <tr
                  key={etfId}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                    {name}
                  </td>
                  <td className="py-3 pr-4">
                    <ThresholdPercentInput
                      id={`buy-${etfId}`}
                      value={p.buyPremiumThreshold}
                      onChange={(n) => {
                        setBuy(etfId, n);
                      }}
                      min={-20}
                      max={0}
                      variant="buy"
                      fallbackWhenInvalid={defaultBuy}
                      size="default"
                      unitLabel={t("unitPercent")}
                      aria-invalid={buyErr}
                      aria-describedby={
                        buyErr ? `buy-error-${etfId}` : undefined
                      }
                    />
                    {buyErr && (
                      <p
                        id={`buy-error-${etfId}`}
                        className="mt-1 text-xs text-red-600 dark:text-red-400"
                        role="alert"
                      >
                        {t("validationBuy")}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <ThresholdPercentInput
                      id={`sell-${etfId}`}
                      value={p.sellPremiumThreshold}
                      onChange={(n) => {
                        setSell(etfId, n);
                      }}
                      min={0}
                      max={20}
                      variant="sell"
                      fallbackWhenInvalid={defaultSell}
                      size="default"
                      unitLabel={t("unitPercent")}
                      aria-invalid={sellErr}
                      aria-describedby={
                        sellErr ? `sell-error-${etfId}` : undefined
                      }
                    />
                    {sellErr && (
                      <p
                        id={`sell-error-${etfId}`}
                        className="mt-1 text-xs text-red-600 dark:text-red-400"
                        role="alert"
                      >
                        {t("validationSell")}
                      </p>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => {
                        removeEtf(etfId);
                      }}
                      title={t("removeSubscription")}
                      aria-label={t("removeSubscriptionA11y")}
                      className="rounded p-1.5 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="min-w-0 py-3 pr-10">
                <select
                  id="add-etf-select"
                  value={addFormEtfId}
                  onChange={(e) => {
                    setAddFormEtfId(e.target.value);
                    onAddFormErrorClear();
                  }}
                  aria-label={t("addEtfPlaceholder")}
                  className="w-full min-w-30 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">{t("addEtfPlaceholder")}</option>
                  {availableToAdd.map((etf) => (
                    <option key={etf.id} value={etf.id}>
                      {etf.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 pr-4">
                <ThresholdPercentInput
                  value={addFormBuy}
                  onChange={(n) => {
                    setAddFormBuy(n);
                    onAddFormErrorClear();
                  }}
                  min={-20}
                  max={0}
                  variant="buy"
                  fallbackWhenInvalid={defaultBuy}
                  size="default"
                  unitLabel={t("unitPercent")}
                />
              </td>
              <td className="py-3 pr-4">
                <ThresholdPercentInput
                  value={addFormSell}
                  onChange={(n) => {
                    setAddFormSell(n);
                    onAddFormErrorClear();
                  }}
                  min={0}
                  max={20}
                  variant="sell"
                  fallbackWhenInvalid={defaultSell}
                  size="default"
                  unitLabel={t("unitPercent")}
                />
              </td>
              <td className="py-3">
                <button
                  type="button"
                  onClick={onAddConfirm}
                  title={t("addEtf")}
                  aria-label={t("addEtf")}
                  className="rounded p-1.5 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};
