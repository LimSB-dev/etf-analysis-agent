"use client"

import Link from "next/link"

interface EtfCalculatorPageHeaderProps {
  pageTitle: string
  headerServiceDescription: string
}

export const EtfCalculatorPageHeader = ({
  pageTitle,
  headerServiceDescription,
}: EtfCalculatorPageHeaderProps) => {
  return (
    <header
      className="relative flex flex-row justify-between items-start gap-3 pb-2"
      role="banner"
      aria-label={pageTitle}
    >
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
    </header>
  )
}
