"use client"

import Link from "next/link"
import { Globe } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

interface EtfCalculatorPageHeaderProps {
  pageTitle: string
  headerServiceDescription: string
  locale: string
  onLocaleToggle: () => void
}

export const EtfCalculatorPageHeader = ({
  pageTitle,
  headerServiceDescription,
  locale,
  onLocaleToggle,
}: EtfCalculatorPageHeaderProps) => {
  return (
    <div className="relative flex flex-row justify-between items-start gap-3 pb-2 ">
      <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
          {pageTitle}
        </h1>
        <Link
          href="/about"
          className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          aria-label={headerServiceDescription}
        >
          {headerServiceDescription}
        </Link>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <button
          type="button"
          onClick={onLocaleToggle}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0"
          aria-label={locale === "ko" ? "Switch to English" : "한국어로 전환"}
          title={locale === "ko" ? "English" : "한국어"}
        >
          <Globe className="w-2.5 h-2.5 opacity-80" />
          <span className="sr-only">{locale === "ko" ? "EN" : "KO"}</span>
        </button>
      </div>
    </div>
  )
}
