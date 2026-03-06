"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { SameIndexEtfRowType } from "@/app/actions"

export type ComparisonRowType = SameIndexEtfRowType & {
  indexReturn: number
  fxReturn: number
  iNav: number
  premium: number
  signal: "BUY" | "SELL" | "HOLD"
}

interface SameIndexEtfComparisonTableProps {
  rows: ComparisonRowType[]
  tableTitle: string
  etfNameLabel: string
  currentPriceLabel: string
  iNavLabel: string
  gapLabel: string
  currentPremiumLabel: string
  signalLabel: string
  buyLabel: string
  sellLabel: string
  holdLabel: string
  formatKrw: (num: number) => string
  formatPct: (num: number) => string
  formatGap: (num: number) => string
}

export const SameIndexEtfComparisonTable = ({
  rows,
  tableTitle,
  etfNameLabel,
  currentPriceLabel,
  iNavLabel,
  gapLabel,
  currentPremiumLabel,
  signalLabel,
  buyLabel,
  sellLabel,
  holdLabel,
  formatKrw,
  formatPct,
  formatGap,
}: SameIndexEtfComparisonTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-sm"
        role="table"
        aria-label={tableTitle}
      >
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-gray-600 dark:text-gray-400">
            <th className="px-4 py-3 font-medium">{etfNameLabel}</th>
            <th className="px-4 py-3 font-medium text-right">
              {currentPriceLabel}
            </th>
            <th className="px-4 py-3 font-medium text-right">{iNavLabel}</th>
            <th className="px-4 py-3 font-medium text-right">{gapLabel}</th>
            <th className="px-4 py-3 font-medium text-right">
              {currentPremiumLabel}
            </th>
            <th className="px-4 py-3 font-medium text-center">{signalLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.etf.id}
              className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
            >
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                {row.etf.name} ({row.etf.code})
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                ₩{formatKrw(row.price)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-blue-600 dark:text-blue-400">
                ₩{formatKrw(Math.round(row.iNav))}
              </td>
              <td
                className={`px-4 py-3 text-right tabular-nums ${
                  Math.round(row.price) - Math.round(row.iNav) > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {formatGap(Math.round(row.price) - Math.round(row.iNav))}
              </td>
              <td
                className={`px-4 py-3 text-right tabular-nums font-medium ${
                  row.premium > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {formatPct(row.premium)}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    row.signal === "BUY"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : row.signal === "SELL"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  {row.signal === "BUY" && (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  {row.signal === "SELL" && (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {row.signal === "HOLD" && <Minus className="w-3.5 h-3.5" />}
                  {row.signal === "BUY" && buyLabel}
                  {row.signal === "SELL" && sellLabel}
                  {row.signal === "HOLD" && holdLabel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
