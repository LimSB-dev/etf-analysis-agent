"use client"

import { useTranslations } from "next-intl"
import { GITHUB_PROFILE_URL, CANARY_LAB_URL, CANARY_LAB_LABEL } from "@/lib/site-config"

export function Footer() {
  const t = useTranslations("footer")
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto px-4 sm:px-6 lg:px-8" role="contentinfo">
      <div className="max-w-6xl mx-auto border-t border-gray-200 dark:border-gray-800 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{t("copyright", { year })}</span>
          <span className="text-gray-300 dark:text-gray-600" aria-hidden>
            ·
          </span>
          <a
            href={CANARY_LAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
            aria-label={t("canaryLabBlog")}
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
            {t("githubProfile")}
          </a>
        </div>
      </div>
    </footer>
  )
}
