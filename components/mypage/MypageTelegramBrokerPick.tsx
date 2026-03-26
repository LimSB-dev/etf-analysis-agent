"use client";

import { useTranslations } from "next-intl";
import {
  BROKER_DEEP_LINK_OPTIONS,
  MAX_QUICK_LINK_SELECTIONS,
} from "@/lib/broker-deep-links";

export type MypageTelegramBrokerPickPropsType = {
  telegramLinked: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
};

const brokerTestId = (id: string) => `test-mypage-broker-${id}`;

function brokerLabel(
  id: string,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (id) {
    case "naver":
      return t("brokerOption_naver");
    case "toss":
      return t("brokerOption_toss");
    case "mirae":
      return t("brokerOption_mirae");
    case "kiwoom":
      return t("brokerOption_kiwoom");
    case "kb":
      return t("brokerOption_kb");
    case "samsung":
      return t("brokerOption_samsung");
    case "hankook":
      return t("brokerOption_hankook");
    case "nh":
      return t("brokerOption_nh");
    case "shinhan":
      return t("brokerOption_shinhan");
    case "hana":
      return t("brokerOption_hana");
    default:
      return id;
  }
}

export const MypageTelegramBrokerPick = ({
  telegramLinked,
  selectedIds,
  onToggle,
  disabled,
}: MypageTelegramBrokerPickPropsType) => {
  const t = useTranslations("mypage");
  const sel = new Set(selectedIds);

  return (
    <section
      className="mt-5 rounded-lg border border-dashed border-gray-300 bg-white/60 p-4 dark:border-gray-600 dark:bg-gray-900/20"
      aria-labelledby="telegram-brokers-heading"
    >
      <h3
        id="telegram-brokers-heading"
        className="text-sm font-semibold text-gray-900 dark:text-gray-100"
      >
        {t("telegramBrokersTitle")}
      </h3>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
        {telegramLinked
          ? t("telegramBrokersHint")
          : t("telegramBrokersNeedLink")}
      </p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
        {t("telegramBrokersCount", {
          count: selectedIds.length,
          max: MAX_QUICK_LINK_SELECTIONS,
        })}
      </p>
      <fieldset
        disabled={disabled || !telegramLinked}
        className="mt-3 disabled:opacity-50"
      >
        <legend className="sr-only">{t("telegramBrokersTitle")}</legend>
        <div className="flex flex-wrap gap-2">
          {BROKER_DEEP_LINK_OPTIONS.map((opt) => {
            const checked = sel.has(opt.id);
            const label = brokerLabel(opt.id, t);
            return (
              <label
                key={opt.id}
                data-testid={brokerTestId(opt.id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  checked
                    ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200"
                    : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    onToggle(opt.id);
                  }}
                  className="sr-only"
                />
                <img
                  src={`/broker-app-icons/${opt.id}.png`}
                  alt=""
                  className="h-4 w-4 shrink-0 rounded-sm object-contain"
                />
                <span aria-hidden={true}>{checked ? "✓ " : ""}</span>
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
};
