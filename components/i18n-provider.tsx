"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { NextIntlClientProvider } from "next-intl"
import type { Locale } from "@/lib/i18n/config"
import {
  defaultLocale,
  isValidLocale,
  localeStorageKey,
} from "@/lib/i18n/config"

import koMessages from "@/messages/ko.json"
import enMessages from "@/messages/en.json"

const messagesMap: Record<Locale, typeof koMessages> = {
  ko: koMessages,
  en: enMessages,
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale
  try {
    const stored = localStorage.getItem(localeStorageKey)
    if (stored && isValidLocale(stored)) return stored
  } catch {
    // ignore
  }
  return defaultLocale
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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    setLocaleState(getStoredLocale())
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(localeStorageKey, next)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  const messages = messagesMap[locale]

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
