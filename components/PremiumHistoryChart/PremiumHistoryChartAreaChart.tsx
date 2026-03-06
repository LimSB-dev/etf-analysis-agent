"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PremiumHistoryResult } from "@/app/actions"

interface PremiumHistoryChartAreaChartProps {
  data: PremiumHistoryResult["data"]
  premiumLabel: string
  formatPremium: (num: number) => string
}

export const PremiumHistoryChartAreaChart = ({
  data,
  premiumLabel,
  formatPremium,
}: PremiumHistoryChartAreaChartProps) => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="premiumPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="premiumNegative" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(val: number) => `${val}%`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) {
                return null
              }
              const point = payload[0].payload as {
                date: string
                premium: number
              }
              return (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    {point.date}
                  </div>
                  <div
                    className={`font-semibold ${
                      point.premium >= 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {premiumLabel}: {formatPremium(point.premium)}
                  </div>
                </div>
              )
            }}
          />
          <ReferenceLine
            y={0}
            stroke="#6b7280"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <ReferenceLine
            y={1}
            stroke="#ef4444"
            strokeDasharray="2 4"
            strokeWidth={0.5}
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={-1}
            stroke="#22c55e"
            strokeDasharray="2 4"
            strokeWidth={0.5}
            strokeOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="premium"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#premiumPositive)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "#6366f1",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
