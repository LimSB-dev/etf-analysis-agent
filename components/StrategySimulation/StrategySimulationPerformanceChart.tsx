"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts"
import { BarChart3 } from "lucide-react"
import type { EquityCurvePoint } from "@/app/backtest-actions"

interface StrategySimulationPerformanceChartProps {
  equityCurve: EquityCurvePoint[]
  periodStartDate: string
  periodEndDate: string
  totalDays: number
  etfName: string
  labels: {
    performanceChart: string
    analysisPeriod: string
    totalDays: string
    strategy: string
    buyHold: string
    premium: string
    closingPrice: string
  }
  fmtPct: (v: number) => string
  fmtKrw: (v: number) => string
}

export const StrategySimulationPerformanceChart = ({
  equityCurve,
  periodStartDate,
  periodEndDate,
  totalDays,
  etfName,
  labels,
  fmtPct,
  fmtKrw,
}: StrategySimulationPerformanceChartProps) => {
  return (
    <div className="px-6 pb-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <BarChart3 className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {labels.performanceChart}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {etfName}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 w-full md:w-auto md:ml-2">
          {labels.analysisPeriod}: {periodStartDate} ~ {periodEndDate} (
          {totalDays} {labels.totalDays})
        </span>
      </div>
      <div className="h-72 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={equityCurve}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              className="dark:stroke-gray-800"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(val: string) => {
                const parts = val.split("-")
                return `${parts[1]}/${parts[2]}`
              }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(val: number) => `${val}%`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const point = payload[0].payload as EquityCurvePoint
                const hasPremium = typeof point.premium === "number"
                const hasPrice = typeof point.etfClose === "number"
                return (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg text-sm min-w-[12rem]">
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                      {point.date}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {hasPremium && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 shrink-0">
                            {labels.premium}:
                          </span>
                          <span
                            className={`font-semibold ${
                              point.premium! >= 0
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {fmtPct(point.premium!)}
                          </span>
                        </div>
                      )}
                      {hasPrice && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 shrink-0">
                            {labels.closingPrice}:
                          </span>
                          <span className="font-mono text-gray-700 dark:text-gray-300">
                            {fmtKrw(point.etfClose!)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {labels.strategy}:
                        </span>
                        <span
                          className={`font-semibold ${
                            point.strategy >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {fmtPct(point.strategy)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {labels.buyHold}:
                        </span>
                        <span
                          className={`font-semibold ${
                            point.buyHold >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {fmtPct(point.buyHold)}
                        </span>
                      </div>
                      {point.signal && (
                        <div
                          className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold inline-block w-fit ${
                            point.signal === "BUY"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          }`}
                        >
                          {point.signal}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="strategy"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#2563eb",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
            <Line
              type="monotone"
              dataKey="buyHold"
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#9ca3af",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
            {equityCurve
              .filter((p) => p.signal === "BUY")
              .map((p, idx) => (
                <ReferenceDot
                  key={`buy-${idx}`}
                  x={p.date}
                  y={p.strategy}
                  r={5}
                  fill="#22c55e"
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            {equityCurve
              .filter((p) => p.signal === "SELL")
              .map((p, idx) => (
                <ReferenceDot
                  key={`sell-${idx}`}
                  x={p.date}
                  y={p.strategy}
                  r={5}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-600 rounded" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {labels.strategy}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-0.5 bg-gray-400 rounded border-dashed"
            style={{ borderTop: "2px dashed #9ca3af", height: 0 }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {labels.buyHold}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">BUY</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">SELL</span>
        </div>
      </div>
    </div>
  )
}
