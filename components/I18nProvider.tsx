"use client"

import type { ReactNode } from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useSession } from "next-auth/react"
import { NextIntlClientProvider } from "next-intl"
import type { Locale } from "@/lib/i18n/config"
import {
  defaultLocale,
  getDetectedLocale,
  isValidLocale,
  localeStorageKey,
} from "@/lib/i18n/config"

import koMessages from "@/messages/ko.json"
import enMessages from "@/messages/en.json"

const messagesMap: Record<Locale, typeof koMessages> = {
  ko: koMessages,
  en: enMessages,
}

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(localeStorageKey)
    if (stored && isValidLocale(stored)) return stored
  } catch {
    // ignore
  }
  return null
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocaleState(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocaleState must be used within I18nProvider")
  }
  return ctx
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = getStoredLocale()
    if (stored) {
      setLocaleState(stored)
    } else {
      const detected = getDetectedLocale()
      setLocaleState(detected)
      try {
        localStorage.setItem(localeStorageKey, detected)
      } catch {
        // ignore
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || status !== "authenticated" || !session?.user?.id) return
    fetch("/api/mypage/preferences", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { locale?: string | null } | null) => {
        if (data?.locale && isValidLocale(data.locale)) {
          setLocaleState(data.locale)
          try {
            localStorage.setItem(localeStorageKey, data.locale)
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {})
  }, [hydrated, status, session?.user?.id])

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next)
      try {
        localStorage.setItem(localeStorageKey, next)
      } catch {
        // ignore
      }
      if (status === "authenticated") {
        fetch("/api/mypage/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ locale: next }),
        }).catch(() => {})
      }
    },
    [status],
  )

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  const messages = messagesMap[locale]

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="Asia/Seoul"
        now={new Date()}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
