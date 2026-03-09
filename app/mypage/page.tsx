"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useAppDispatch } from "@/store/hooks";
import { setUserThresholdsByEtf } from "@/store/etfCalculatorSlice";
import { ETF_OPTIONS } from "@/lib/etf-options";
import { Plus, X } from "lucide-react";
import { ThresholdPercentInput } from "@/components/shared";

const DEFAULT_BUY = -1;
const DEFAULT_SELL = 1;

type PreferencesByEtfType = Record<
  string,
  { buyPremiumThreshold: number; sellPremiumThreshold: number }
>;

export default function MypagePage() {
  const t = useTranslations("mypage");
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const dispatch = useAppDispatch();

  const [preferences, setPreferences] = useState<PreferencesByEtfType>({});
  const [initialPreferences, setInitialPreferences] =
    useState<PreferencesByEtfType>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormEtfId, setAddFormEtfId] = useState("");
  const [addFormBuy, setAddFormBuy] = useState(DEFAULT_BUY);
  const [addFormSell, setAddFormSell] = useState(DEFAULT_SELL);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(false);
  const [telegramLinkError, setTelegramLinkError] = useState<string | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUnlinkLoading, setTelegramUnlinkLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }
    if (status !== "authenticated") {
      return;
    }
    fetch("/api/mypage/preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: {
          preferences?: PreferencesByEtfType;
          telegramLinked?: boolean;
        } | null) => {
          const next: PreferencesByEtfType = {};
          const raw = data?.preferences ?? {};
          for (const [etfId, p] of Object.entries(raw)) {
            if (
              etfId &&
              p &&
              typeof p.buyPremiumThreshold === "number" &&
              typeof p.sellPremiumThreshold === "number"
            ) {
              next[etfId] = {
                buyPremiumThreshold: p.buyPremiumThreshold,
                sellPremiumThreshold: p.sellPremiumThreshold,
              };
            }
          }
          setPreferences(next);
          setInitialPreferences(next);
          setTelegramLinked(Boolean(data?.telegramLinked));
        },
      )
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [status, router]);

  const isDirty = useMemo(() => {
    const a = preferences;
    const b = initialPreferences;
    const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const id of ids) {
      const pa = a[id];
      const pb = b[id];
      if (!pa || !pb) {
        return true;
      }
      if (
        pa.buyPremiumThreshold !== pb.buyPremiumThreshold ||
        pa.sellPremiumThreshold !== pb.sellPremiumThreshold
      ) {
        return true;
      }
    }
    return false;
  }, [preferences, initialPreferences]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty || !pathname) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const anchor = (target as Element).closest?.("a");
      if (!anchor || !anchor.href) {
        return;
      }
      try {
        const url = new URL(anchor.href);
        if (url.origin !== window.location.origin) {
          return;
        }
        const nextPath = url.pathname;
        if (nextPath === pathname) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        const msg = t("unsavedChangesConfirm");
        if (window.confirm(msg)) {
          router.push(anchor.href);
        }
      } catch {
        // ignore invalid URL
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty, pathname, router, t]);

  const setBuy = useCallback((etfId: string, value: number) => {
    setPreferences((prev) => ({
      ...prev,
      [etfId]: {
        ...prev[etfId],
        buyPremiumThreshold: value,
        sellPremiumThreshold:
          typeof prev[etfId]?.sellPremiumThreshold === "number"
            ? prev[etfId].sellPremiumThreshold
            : DEFAULT_SELL,
      },
    }));
  }, []);

  const setSell = useCallback((etfId: string, value: number) => {
    setPreferences((prev) => ({
      ...prev,
      [etfId]: {
        ...prev[etfId],
        buyPremiumThreshold:
          typeof prev[etfId]?.buyPremiumThreshold === "number"
            ? prev[etfId].buyPremiumThreshold
            : DEFAULT_BUY,
        sellPremiumThreshold: value,
      },
    }));
  }, []);

  const addEtfWithValues = useCallback(
    (etfId: string, buy: number, sell: number) => {
      if (!etfId || preferences[etfId] != null) {
        return false;
      }
      setPreferences((prev) => ({
        ...prev,
        [etfId]: {
          buyPremiumThreshold: buy,
          sellPremiumThreshold: sell,
        },
      }));
      return true;
    },
    [preferences],
  );

  const handleAddConfirm = useCallback(() => {
    setAddFormError(null);
    if (!addFormEtfId) {
      setAddFormError("selectEtfFirst");
      return;
    }
    if (addFormBuy > 0) {
      setAddFormError("validationBuy");
      return;
    }
    if (addFormSell < 0) {
      setAddFormError("validationSell");
      return;
    }
    const added = addEtfWithValues(addFormEtfId, addFormBuy, addFormSell);
    if (added) {
      setAddFormEtfId("");
      setAddFormBuy(DEFAULT_BUY);
      setAddFormSell(DEFAULT_SELL);
    }
  }, [addFormEtfId, addFormBuy, addFormSell, addEtfWithValues, preferences]);

  const handleTelegramConnect = useCallback(() => {
    setTelegramLinkError(null);
    setTelegramLinkLoading(true);
    fetch("/api/mypage/telegram-link", { method: "POST" })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data: { error?: string }) => {
            throw new Error(data.error ?? "request_failed");
          });
        }
        return res.json();
      })
      .then(
        (data: { botStartUrl: string; botUsername?: string }) => {
          if (!data.botStartUrl) {
            return;
          }
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            typeof navigator !== "undefined" ? navigator.userAgent : "",
          );
          if (isMobile && data.botUsername) {
            const token = new URL(data.botStartUrl).searchParams.get("start");
            const telegramAppUrl = `tg://resolve?domain=${data.botUsername}${token ? `&start=${token}` : ""}`;
            window.location.href = telegramAppUrl;
          } else {
            window.open(data.botStartUrl, "_blank", "noopener,noreferrer");
          }
        },
      )
      .catch((err) => {
        setTelegramLinkError(
          err instanceof Error ? err.message : t("telegramLinkError"),
        );
      })
      .finally(() => {
        setTelegramLinkLoading(false);
      });
  }, [t]);

  const handleTelegramUnlink = useCallback(() => {
    setTelegramLinkError(null);
    setTelegramUnlinkLoading(true);
    fetch("/api/mypage/telegram-unlink", { method: "POST" })
      .then((res) => {
        if (!res.ok) {
          throw new Error();
        }
        return res.json();
      })
      .then(() => {
        setTelegramLinked(false);
      })
      .catch(() => {
        setTelegramLinkError(t("telegramUnlinkFailed"));
      })
      .finally(() => {
        setTelegramUnlinkLoading(false);
      });
  }, [t]);

  const removeEtf = useCallback((etfId: string) => {
    setPreferences((prev) => {
      const next = { ...prev };
      delete next[etfId];
      return next;
    });
    setValidationError(null);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setMessage(null);
    const entries = Object.entries(preferences);
    for (const [etfId, p] of entries) {
      if (p.buyPremiumThreshold > 0) {
        setValidationError(`validationBuy:${etfId}`);
        return;
      }
      if (p.sellPremiumThreshold < 0) {
        setValidationError(`validationSell:${etfId}`);
        return;
      }
    }
    if (status !== "authenticated") {
      return;
    }
    setSaving(true);
    fetch("/api/mypage/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { ...preferences } }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error();
        }
        return res.json();
      })
      .then((data: { preferences?: PreferencesByEtfType }) => {
        const byEtf: Record<string, { buy: number; sell: number }> = {};
        const nextInitial: PreferencesByEtfType = {};
        for (const [etfId, p] of Object.entries(data.preferences ?? {})) {
          byEtf[etfId] = {
            buy: p.buyPremiumThreshold ?? DEFAULT_BUY,
            sell: p.sellPremiumThreshold ?? DEFAULT_SELL,
          };
          nextInitial[etfId] = {
            buyPremiumThreshold: p.buyPremiumThreshold ?? DEFAULT_BUY,
            sellPremiumThreshold: p.sellPremiumThreshold ?? DEFAULT_SELL,
          };
        }
        dispatch(setUserThresholdsByEtf(byEtf));
        setInitialPreferences(nextInitial);
        setMessage("saved");
      })
      .catch(() => {
        setMessage("error");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const subscribedIds = Object.keys(preferences);
  const availableToAdd = ETF_OPTIONS.filter(
    (e) => !subscribedIds.includes(e.id),
  );
  const orderedEntries = subscribedIds
    .map((id) => ({ etfId: id, p: preferences[id]! }))
    .filter(({ p }) => p != null);

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-12">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </main>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8" role="main">
      <section
        className="mb-8 rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-700 dark:bg-gray-800/30 sm:p-6"
        aria-labelledby="subscription-section-heading"
      >
        <h2
          id="subscription-section-heading"
          className="text-base font-semibold text-gray-900 dark:text-gray-100"
        >
          {t("subscriptionSectionTitle")}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t("subscriptionSectionDesc")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {telegramLinked ? (
            <p
              className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200"
              role="status"
            >
              <span aria-hidden>✓</span>
              {t("telegramLinked")}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleTelegramConnect}
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
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.14.121.1.155.234.171.33.015.096.034.313.02.483z" />
                </svg>
                {t("telegramOpenButton")}
              </>
            )}
          </button>
          {telegramLinked && (
            <button
              type="button"
              onClick={handleTelegramUnlink}
              disabled={telegramUnlinkLoading}
              aria-label={t("telegramUnlinkA11y")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {telegramUnlinkLoading ? "..." : t("telegramUnlink")}
            </button>
          )}
        </div>
        <ol className="mt-4 list-none space-y-1.5 text-sm text-gray-600 dark:text-gray-300" aria-label={t("telegramStepsA11y")}>
          <li>{t("telegramStep1")}</li>
          <li>{t("telegramStep2")}</li>
        </ol>
        {telegramLinkError && (
          <p
            className="mt-3 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {telegramLinkError === "Telegram bot not configured"
              ? t("telegramBotNotConfigured")
              : t("telegramLinkError")}
          </p>
        )}
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-700 dark:bg-gray-800/30 sm:p-6"
        noValidate
      >
        <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          {t("interestEtfList")}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t("description")}
        </p>
        <div className="mt-2 overflow-x-auto">
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
              {orderedEntries.length === 0 && !showAddForm ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-4 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t("emptyMessage")}
                  </td>
                </tr>
              ) : null}
              {orderedEntries.map(({ etfId, p }) => {
                const etf = ETF_OPTIONS.find((o) => o.id === etfId);
                const name = etf?.name ?? etfId;
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
                          setValidationError(null);
                        }}
                        min={-20}
                        max={0}
                        variant="buy"
                        fallbackWhenInvalid={DEFAULT_BUY}
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
                          setValidationError(null);
                        }}
                        min={0}
                        max={20}
                        variant="sell"
                        fallbackWhenInvalid={DEFAULT_SELL}
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
                        className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {showAddForm && (
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="min-w-0 py-3 pr-10">
                    <select
                      id="add-etf-select"
                      value={addFormEtfId}
                      onChange={(e) => {
                        setAddFormEtfId(e.target.value);
                        setAddFormError(null);
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
                        setAddFormError(null);
                      }}
                      min={-20}
                      max={0}
                      variant="buy"
                      fallbackWhenInvalid={DEFAULT_BUY}
                      size="default"
                      unitLabel={t("unitPercent")}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <ThresholdPercentInput
                      value={addFormSell}
                      onChange={(n) => {
                        setAddFormSell(n);
                        setAddFormError(null);
                      }}
                      min={0}
                      max={20}
                      variant="sell"
                      fallbackWhenInvalid={DEFAULT_SELL}
                      size="default"
                      unitLabel={t("unitPercent")}
                    />
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddConfirm();
                        setShowAddForm(false);
                      }}
                      className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!showAddForm && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddForm((prev) => !prev);
                setAddFormError(null);
                if (!showAddForm) {
                  setAddFormEtfId("");
                  setAddFormBuy(DEFAULT_BUY);
                  setAddFormSell(DEFAULT_SELL);
                }
              }}
              disabled={availableToAdd.length === 0}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
              aria-expanded={showAddForm}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("addEtf")}
            </button>
            {showAddForm && addFormError && (
              <p
                className="mt-2 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {t(addFormError)}
              </p>
            )}
          </div>
        )}

        {message === "saved" && (
          <p
            className="mt-4 text-sm text-green-600 dark:text-green-400"
            role="status"
            aria-live="polite"
          >
            {t("saved")}
          </p>
        )}
        {message === "error" && (
          <p
            className="mt-4 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {t("saveFailed")}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || orderedEntries.length === 0}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {saving ? "..." : t("save")}
        </button>
      </form>
    </main>
  );
}
