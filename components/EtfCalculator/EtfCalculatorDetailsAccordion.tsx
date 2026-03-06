"use client"

import { Calculator, ChevronDown, Info } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setShowDetails } from "@/store/etfCalculatorSlice"

interface EtfCalculatorDetailsAccordionProps {
  labels: {
    detailedAnalysis: string
    iNavCalculation: string
    officialNav: string
    prevDay: string
    indexReturn: string
    indexReturnDesc: string
    fxReturn: string
    fxReturnDesc: string
    analysisSummary: string
    realtimeEstimatedPrice: string
    currentMarketPrice: string
    gap: string
    fairPriceIs: string
    fairPriceEnd: string
    iNavFormulaDesc: string
  }
  fmtKrw: (n: number) => string
  fmtPct: (n: number) => string
  fmtNum: (n: number) => string
}

export const EtfCalculatorDetailsAccordion = ({
  labels,
  fmtKrw,
  fmtPct,
  fmtNum,
}: EtfCalculatorDetailsAccordionProps) => {
  const dispatch = useAppDispatch()
  const showDetails = useAppSelector((s) => s.etfCalculator.showDetails)
  const result = useAppSelector((s) => s.etfCalculator.result)
  const inputs = useAppSelector((s) => s.etfCalculator.inputs)
  const selectedEtf = useAppSelector((s) => s.etfCalculator.selectedEtf)

  if (!selectedEtf) return null

  return (
    <div className="mt-4 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => dispatch(setShowDetails(!showDetails))}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {labels.detailedAnalysis}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
            showDetails ? "rotate-180" : ""
          }`}
        />
      </button>

      {showDetails && (
        <div className="p-6 pt-0 border-t border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300 min-h-[420px]">
          {result ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 items-stretch">
                <div className="flex flex-col space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-gray-500" />
                    {labels.iNavCalculation}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm flex-1 auto-rows-fr">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                      <span className="text-gray-600 dark:text-gray-400">
                        ① {labels.officialNav} {labels.prevDay}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {fmtKrw(Math.round(result.etfFair))}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                      <span className="text-gray-600 dark:text-gray-400">
                        ② {selectedEtf.indexName.split(" ")[0]}{" "}
                        {labels.indexReturn} ({labels.indexReturnDesc})
                      </span>
                      <span
                        className={`font-semibold shrink-0 ${
                          result.qqqReturn >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {result.qqqReturn >= 0 ? "+" : ""}
                        {fmtPct(result.qqqReturn)}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                      <span className="text-gray-600 dark:text-gray-400">
                        ③ {labels.fxReturn} ({labels.fxReturnDesc})
                      </span>
                      <span
                        className={`font-semibold shrink-0 ${
                          result.fxReturn >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {result.fxReturn >= 0 ? "+" : ""}
                        {fmtPct(result.fxReturn)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-500" />
                    {labels.analysisSummary}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm flex-1 auto-rows-fr">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                      <span className="text-gray-600 dark:text-gray-400">
                        {labels.realtimeEstimatedPrice}
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        {fmtKrw(Math.round(result.iNav))}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                      <span className="text-gray-600 dark:text-gray-400">
                        {labels.currentMarketPrice}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {fmtKrw(Number.parseFloat(inputs.etfCurrent))}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center min-h-[52px]">
                      <span className="text-gray-600 dark:text-gray-400">
                        {labels.gap}
                      </span>
                      <span
                        className={`font-semibold shrink-0 ${
                          Number.parseFloat(inputs.etfCurrent) > result.iNav
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {fmtKrw(
                          Number.parseFloat(inputs.etfCurrent) -
                            Math.round(result.iNav),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-5 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex flex-col gap-4">
                  <div className="text-base text-gray-900 dark:text-gray-100">
                    <span className="font-medium">{selectedEtf.name}</span>{" "}
                    {labels.fairPriceIs}{" "}
                    <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                      {fmtKrw(Math.round(result.iNav))}
                    </span>{" "}
                    {labels.fairPriceEnd}
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-blue-800/80 dark:text-blue-200/80 font-mono">
                      {labels.iNavFormulaDesc}
                    </div>
                    <div className="text-xs text-blue-800/80 dark:text-blue-200/80 font-mono">
                      {fmtNum(Math.round(result.etfFair))} × (1 +{" "}
                      {result.qqqReturn >= 0 ? "+" : ""}
                      {fmtPct(result.qqqReturn)}) × (1 +{" "}
                      {result.fxReturn >= 0 ? "+" : ""}
                      {fmtPct(result.fxReturn)}) ={" "}
                      {fmtNum(Math.round(result.iNav))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 items-stretch">
                <div className="flex flex-col space-y-4">
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg h-[52px] animate-pulse"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col space-y-4">
                  <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg h-[52px] animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div
                className="mt-6 w-full h-24 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse"
                aria-hidden
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
