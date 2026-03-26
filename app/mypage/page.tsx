"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useAppDispatch } from "@/store/hooks";
import { setUserThresholdsByEtf } from "@/store/etfCalculatorSlice";
import { ETF_OPTIONS } from "@/lib/etf-options";
import { InterestEtfListHeader } from "@/components/mypage/InterestEtfListHeader";
import { InterestEtfListView } from "@/components/mypage/InterestEtfListView";
import { InterestEtfListEdit } from "@/components/mypage/InterestEtfListEdit";
import { MypageFormActions } from "@/components/mypage/MypageFormActions";
import { MypageSkeleton } from "@/components/mypage/MypageSkeleton";
import { MypageTelegramBrokerPick } from "@/components/mypage/MypageTelegramBrokerPick";
import { MAX_QUICK_LINK_SELECTIONS } from "@/lib/broker-deep-links";

const DEFAULT_BUY = -1;
const DEFAULT_SELL = 1;

function areTelegramBrokerSelectionsEqual(
  initial: string[] | null,
  current: string[],
): boolean {
  if (initial === null) {
    return current.length === 0;
  }
  const a = [...initial].sort().join("\0");
  const b = [...current].sort().join("\0");
  return a === b;
}

type PreferencesByEtfType = Record<
  string,
  { buyPremiumThreshold: number; sellPremiumThreshold: number | null }
>;

export default function MypagePage() {
  const t = useTranslations("mypage");
  const router = useRouter();
  const pathname = usePathname();
  const sessionResult = useSession();
  const status = sessionResult?.status ?? "loading";
  const dispatch = useAppDispatch();

  const [preferences, setPreferences] = useState<PreferencesByEtfType>({});
  const [initialPreferences, setInitialPreferences] =
    useState<PreferencesByEtfType>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addFormEtfId, setAddFormEtfId] = useState("");
  const [addFormBuy, setAddFormBuy] = useState(DEFAULT_BUY);
  const [addFormSell, setAddFormSell] = useState(DEFAULT_SELL);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(false);
  const [telegramLinkError, setTelegramLinkError] = useState<string | null>(
    null,
  );
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUnlinkLoading, setTelegramUnlinkLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [telegramBrokerLinkIds, setTelegramBrokerLinkIds] = useState<string[]>(
    [],
  );
  const [initialTelegramBrokerLinkIds, setInitialTelegramBrokerLinkIds] =
    useState<string[] | null>(null);

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
        (
          data: {
            preferences?: PreferencesByEtfType;
            telegramLinked?: boolean;
            telegramBrokerLinkIds?: string[] | null;
          } | null,
        ) => {
          const next: PreferencesByEtfType = {};
          const raw = data?.preferences ?? {};
          for (const [etfId, p] of Object.entries(raw)) {
            if (
              etfId &&
              p &&
              typeof p.buyPremiumThreshold === "number" &&
              (p.sellPremiumThreshold === null ||
                typeof p.sellPremiumThreshold === "number")
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
          const rawBrokers = data?.telegramBrokerLinkIds;
          if (Array.isArray(rawBrokers)) {
            setInitialTelegramBrokerLinkIds([...rawBrokers]);
            setTelegramBrokerLinkIds([...rawBrokers]);
          } else {
            setInitialTelegramBrokerLinkIds(null);
            setTelegramBrokerLinkIds([]);
          }
        },
      )
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [status, router]);

  const preferencesDirty = useMemo(() => {
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

  const brokersDirty = useMemo(
    () =>
      !areTelegramBrokerSelectionsEqual(
        initialTelegramBrokerLinkIds,
        telegramBrokerLinkIds,
      ),
    [initialTelegramBrokerLinkIds, telegramBrokerLinkIds],
  );

  const hasUnsavedChanges = preferencesDirty || brokersDirty;

  useEffect(() => {
    if (!hasUnsavedChanges) {
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
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges || !pathname) {
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
  }, [hasUnsavedChanges, pathname, router, t]);

  const toggleTelegramBroker = useCallback((id: string) => {
    setTelegramBrokerLinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return [...next];
      }
      if (next.size >= MAX_QUICK_LINK_SELECTIONS) {
        return prev;
      }
      next.add(id);
      return [...next];
    });
  }, []);

  const setBuy = useCallback((etfId: string, value: number) => {
    setPreferences((prev) => {
      const prevSell = prev[etfId]?.sellPremiumThreshold;
      return {
        ...prev,
        [etfId]: {
          buyPremiumThreshold: value,
          sellPremiumThreshold:
            prevSell === null
              ? null
              : typeof prevSell === "number"
                ? prevSell
                : DEFAULT_SELL,
        },
      };
    });
  }, []);

  const setSell = useCallback((etfId: string, value: number | null) => {
    setPreferences((prev) => ({
      ...prev,
      [etfId]: {
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
      .then((data: { botStartUrl: string; botUsername?: string }) => {
        if (!data.botStartUrl) {
          return;
        }
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            typeof navigator !== "undefined" ? navigator.userAgent : "",
          );
        if (isMobile && data.botUsername) {
          const token = new URL(data.botStartUrl).searchParams.get("start");
          const telegramAppUrl = `tg://resolve?domain=${data.botUsername}${token ? `&start=${token}` : ""}`;
          window.location.href = telegramAppUrl;
        } else {
          window.open(data.botStartUrl, "_blank", "noopener,noreferrer");
        }
      })
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

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setMessage(null);
  }, []);

  const cancelEditing = useCallback(() => {
    setPreferences({ ...initialPreferences });
    if (initialTelegramBrokerLinkIds == null) {
      setTelegramBrokerLinkIds([]);
    } else {
      setTelegramBrokerLinkIds([...initialTelegramBrokerLinkIds]);
    }
    setValidationError(null);
    setAddFormEtfId("");
    setAddFormBuy(DEFAULT_BUY);
    setAddFormSell(DEFAULT_SELL);
    setAddFormError(null);
    setMessage(null);
    setIsEditing(false);
  }, [initialPreferences, initialTelegramBrokerLinkIds]);

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
      if (
        p.sellPremiumThreshold != null &&
        p.sellPremiumThreshold < 0
      ) {
        setValidationError(`validationSell:${etfId}`);
        return;
      }
    }
    if (status !== "authenticated") {
      return;
    }
    setSaving(true);
    const patchBody: {
      preferences: PreferencesByEtfType;
      telegramBrokerLinkIds?: string[];
    } = { preferences: { ...preferences } };
    if (
      !areTelegramBrokerSelectionsEqual(
        initialTelegramBrokerLinkIds,
        telegramBrokerLinkIds,
      )
    ) {
      patchBody.telegramBrokerLinkIds = telegramBrokerLinkIds;
    }
    fetch("/api/mypage/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error();
        }
        return res.json();
      })
      .then(
        (data: {
          preferences?: PreferencesByEtfType;
          telegramBrokerLinkIds?: string[] | null;
        }) => {
          const byEtf: Record<string, { buy: number; sell: number }> = {};
          const nextInitial: PreferencesByEtfType = {};
          for (const [etfId, p] of Object.entries(data.preferences ?? {})) {
            byEtf[etfId] = {
              buy: p.buyPremiumThreshold ?? DEFAULT_BUY,
              sell:
                p.sellPremiumThreshold == null
                  ? DEFAULT_SELL
                  : p.sellPremiumThreshold,
            };
            nextInitial[etfId] = {
              buyPremiumThreshold: p.buyPremiumThreshold ?? DEFAULT_BUY,
              sellPremiumThreshold:
                p.sellPremiumThreshold === null
                  ? null
                  : (p.sellPremiumThreshold ?? DEFAULT_SELL),
            };
          }
          dispatch(setUserThresholdsByEtf(byEtf));
          setInitialPreferences(nextInitial);
          const tb = data.telegramBrokerLinkIds;
          if (Array.isArray(tb)) {
            setInitialTelegramBrokerLinkIds([...tb]);
            setTelegramBrokerLinkIds([...tb]);
          } else {
            setInitialTelegramBrokerLinkIds(null);
            setTelegramBrokerLinkIds([]);
          }
          setMessage("saved");
          setIsEditing(false);
        },
      )
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
  const entriesWithName = orderedEntries.map(({ etfId, p }) => ({
    etfId,
    name: ETF_OPTIONS.find((o) => o.id === etfId)?.name ?? etfId,
    p,
  }));

  if (status === "loading" || loading) {
    return <MypageSkeleton />;
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8" role="main">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-700 dark:bg-gray-800/30 sm:p-6"
        noValidate
      >
        <InterestEtfListHeader
          telegramLinked={telegramLinked}
          onConnect={handleTelegramConnect}
          onUnlink={handleTelegramUnlink}
          telegramLinkLoading={telegramLinkLoading}
          telegramUnlinkLoading={telegramUnlinkLoading}
          telegramLinkError={telegramLinkError}
        />
        <MypageTelegramBrokerPick
          telegramLinked={telegramLinked}
          selectedIds={telegramBrokerLinkIds}
          onToggle={toggleTelegramBroker}
          disabled={saving}
        />
        <div className="mt-4">
          {!isEditing && (
            <InterestEtfListView entries={entriesWithName} />
          )}
          {isEditing && (
            <InterestEtfListEdit
              entries={entriesWithName}
              validationError={validationError}
              setBuy={(etfId: string, n: number) => {
                setBuy(etfId, n);
                setValidationError(null);
              }}
              setSell={(etfId: string, n: number | null) => {
                setSell(etfId, n);
                setValidationError(null);
              }}
              removeEtf={removeEtf}
              addFormEtfId={addFormEtfId}
              setAddFormEtfId={setAddFormEtfId}
              addFormBuy={addFormBuy}
              setAddFormBuy={setAddFormBuy}
              addFormSell={addFormSell}
              setAddFormSell={setAddFormSell}
              onAddFormErrorClear={() => setAddFormError(null)}
              onAddConfirm={handleAddConfirm}
              availableToAdd={availableToAdd.map((e) => ({ id: e.id, name: e.name }))}
              addFormError={addFormError}
              defaultBuy={DEFAULT_BUY}
              defaultSell={DEFAULT_SELL}
            />
          )}
        </div>

        {isEditing && addFormError && (
          <p
            className="mt-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {t(addFormError)}
          </p>
        )}

        <MypageFormActions
          isEditing={isEditing}
          hasUnsavedChanges={hasUnsavedChanges}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          saving={saving}
          message={message}
        />
      </form>
    </main>
  );
}
