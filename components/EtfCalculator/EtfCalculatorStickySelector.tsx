"use client"

import { Calculator, ChevronDown } from "lucide-react"
import type { EtfOption } from "@/lib/etf-options"
import { useAppSelector } from "@/store/hooks"

interface EtfCalculatorStickySelectorProps {
  optionsByGroup: { label: string; etfs: EtfOption[] }[]
  onEtfChange: (etfId: string) => void
}

export const EtfCalculatorStickySelector = ({
  optionsByGroup,
  onEtfChange,
}: EtfCalculatorStickySelectorProps) => {
  const showSticky = useAppSelector((s) => s.etfCalculator.showSticky)
  const selectedEtf = useAppSelector((s) => s.etfCalculator.selectedEtf)
  const isLoading = useAppSelector((s) => s.etfCalculator.isLoading)

  if (!selectedEtf) return null

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 flex items-center gap-3 min-w-[300px] max-w-[90vw] group ${
        showSticky
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
      }`}
      style={{
        top: showSticky ? "16px" : "-48px",
        transition:
          "opacity 0.7s ease-out, transform 0.7s ease-out, top 0.7s ease-out",
        background: "rgba(255, 255, 255, 0.2)",
        borderRadius: "100px",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
    >
      <div className="flex-shrink-0 p-1.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
        <Calculator className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="relative flex-1">
        <div
          className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-6"
          style={{ textShadow: "0 0.5px 1px rgba(255, 255, 255, 0.5)" }}
        >
          <span className="hidden sm:inline">
            {selectedEtf.name} ({selectedEtf.code})
          </span>
          <span className="sm:hidden">{selectedEtf.name}</span>
        </div>
        <select
          value={selectedEtf.id}
          onChange={(e) => onEtfChange(e.target.value)}
          disabled={isLoading}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {optionsByGroup.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.etfs.map((etf) => (
                <option key={`sticky-${etf.id}`} value={etf.id}>
                  {etf.name} ({etf.code})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          className={`w-4 h-4 text-gray-700 dark:text-gray-300 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 ${
            isLoading ? "animate-pulse" : ""
          }`}
        />
      </div>
    </div>
  )
}
