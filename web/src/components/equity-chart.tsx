"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useMemo } from "react"
import { formatCurrency, formatDate } from "@/components/formatters"
import type { PortfolioSnapshot } from "@/lib/api"

const chartConfig = {
  totalValue: {
    label: "Total Value",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig

function describeChart(data: PortfolioSnapshot[]): string {
  const first = data[0]!
  const last = data[data.length - 1]!
  const values = data.map((d) => d.totalValue)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const trend = last.totalValue > first.totalValue ? "up" : last.totalValue < first.totalValue ? "down" : "flat"
  return `Equity curve from ${formatDate(first.timestamp)} to ${formatDate(last.timestamp)}, ${formatCurrency(min)} to ${formatCurrency(max)}, trending ${trend}`
}

interface EquityChartProps {
  data: PortfolioSnapshot[]
}

export function EquityChart({ data }: EquityChartProps) {
  const chartLabel = useMemo(() => data.length >= 2 ? describeChart(data) : null, [data])

  if (data.length < 2) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Not enough data to display chart. Check back after your next portfolio snapshot.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full" role="img" aria-label={chartLabel!}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="fillTotalValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-totalValue)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-totalValue)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="timestamp"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: string) => formatDate(v)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: number) => formatCurrency(v)}
          width={90}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const item = payload[0]
                if (!item) return ""
                return formatDate(
                  (item.payload as PortfolioSnapshot).timestamp,
                )
              }}
              formatter={(value) => formatCurrency(value as number)}
            />
          }
        />
        <Area
          dataKey="totalValue"
          type="monotone"
          fill="url(#fillTotalValue)"
          stroke="var(--color-totalValue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
