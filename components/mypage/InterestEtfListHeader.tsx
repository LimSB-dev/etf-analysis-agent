"use client";

import { useTranslations } from "next-intl";

export interface InterestEtfListHeaderPropsType {
  telegramLinked: boolean;
  onConnect: () => void;
  onUnlink: () => void;
  telegramLinkLoading: boolean;
  telegramUnlinkLoading: boolean;
  telegramLinkError: string | null;
}

const TELEGRAM_ICON_PATH =
  "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.14.121.1.155.234.171.33.015.096.034.313.02.483z";

export const InterestEtfListHeader = ({
  telegramLinked,
  onConnect,
  onUnlink,
  telegramLinkLoading,
  telegramUnlinkLoading,
  telegramLinkError,
}: InterestEtfListHeaderPropsType) => {
  const t = useTranslations("mypage");

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t("interestEtfList")}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t("description")}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {telegramLinked ? (
            <button
              type="button"
              onClick={onUnlink}
              disabled={telegramUnlinkLoading}
              aria-label={t("telegramUnlinkA11y")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {telegramUnlinkLoading ? "..." : t("telegramUnlink")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={telegramLinkLoading}
              aria-label={t("telegramAlertConnectA11y")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0088cc] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0077b5] disabled:opacity-50 dark:bg-[#229ED9] dark:hover:bg-[#1a8fc7]"
            >
              {telegramLinkLoading ? (
                t("telegramLinkRequesting")
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d={TELEGRAM_ICON_PATH} />
                  </svg>
                  {t("telegramSubscribe")}
                </>
              )}
            </button>
          )}
        </div>
        {telegramLinkError && (
          <p
            className="text-right text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {telegramLinkError === "Telegram bot not configured"
              ? t("telegramBotNotConfigured")
              : t("telegramLinkError")}
          </p>
        )}
      </div>
    </div>
  );
};
