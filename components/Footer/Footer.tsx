"use client"

import { useTranslations } from "next-intl"
import { Globe } from "lucide-react"
import { GITHUB_PROFILE_URL, CANARY_LAB_URL, CANARY_LAB_LABEL } from "@/lib/site-config"
import { useLocaleState } from "@/components/I18nProvider"
import { ThemeToggle } from "@/components/ThemeToggle"

export function Footer() {
  const tFooter = useTranslations("footer")
  const t = useTranslations()
  const { locale, setLocale } = useLocaleState()
  const year = new Date().getFullYear()
  const localeSwitchAriaLabel =
    locale === "ko" ? t("localeSwitchToEn") : t("localeSwitchToKo")

  return (
    <footer className="mt-auto px-4 sm:px-6 lg:px-8" role="contentinfo">
      <div className="max-w-6xl mx-auto border-t border-gray-200 dark:border-gray-800 py-6">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>{tFooter("copyright", { year })}</span>
            <span className="text-gray-300 dark:text-gray-600" aria-hidden>
              ·
            </span>
            <a
              href={CANARY_LAB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
              aria-label={tFooter("canaryLabBlog")}
            >
              {CANARY_LAB_LABEL}
            </a>
            <span className="text-gray-300 dark:text-gray-600" aria-hidden>
              ·
            </span>
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
            >
              {tFooter("githubProfile")}
            </a>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0"
              aria-label={localeSwitchAriaLabel}
            >
              <Globe className="w-2.5 h-2.5 opacity-80" />
              <span className="sr-only">{localeSwitchAriaLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
