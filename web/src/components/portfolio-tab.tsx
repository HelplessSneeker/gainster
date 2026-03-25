"use client"

import { lazy, Suspense } from "react"
import { useFetch } from "@/hooks/use-fetch"
import {
  getPortfolioSnapshots,
  getPositions,
} from "@/lib/api"
import type { PortfolioSnapshot } from "@/lib/api"
import { formatCurrency, formatSignedCurrency } from "@/components/formatters"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const EquityChart = lazy(() =>
  import("@/components/equity-chart").then((m) => ({ default: m.EquityChart }))
)
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { StaleDataAnnouncer } from "@/components/stale-data-announcer"

function trendFor(value: number): "up" | "down" | "neutral" {
  if (value > 0) return "up"
  if (value < 0) return "down"
  return "neutral"
}

interface PortfolioTabProps {
  portfolio: PortfolioSnapshot | null
  portfolioLoading: boolean
  portfolioError: Error | null
}

export function PortfolioTab({ portfolio, portfolioLoading, portfolioError }: PortfolioTabProps) {
  const snapshots = useFetch(
    (signal) => getPortfolioSnapshots(500, signal).then((r) => r.data),
    [],
  )
  const positions = useFetch((signal) => getPositions(signal), [], 60_000)

  if (portfolioError) {
    return (
      <div role="status" aria-live="polite" className="py-12 text-center text-muted-foreground">
        Unable to connect to the API server. Start it with pnpm dev:api and refresh.
      </div>
    )
  }

  const snap = portfolio

  return (
    <div className="space-y-6">
      <StaleDataAnnouncer error={positions.staleError} />
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {portfolioLoading && !snap ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card size="sm" key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))
        ) : snap ? (
          <>
            <StatCard
              title="Total Value"
              value={formatCurrency(snap.totalValue)}
            />
            <StatCard
              title="Cash"
              value={formatCurrency(snap.cash)}
            />
            <StatCard
              title="Unrealized P&L"
              value={formatSignedCurrency(snap.unrealizedPnl)}
              trend={trendFor(snap.unrealizedPnl)}
            />
            <StatCard
              title="Realized P&L"
              value={formatSignedCurrency(snap.realizedPnl)}
              trend={trendFor(snap.realizedPnl)}
            />
          </>
        ) : (
          <div role="status" aria-live="polite" className="col-span-full py-6 text-center text-muted-foreground">
            No portfolio data yet. Your portfolio summary will appear here as you start trading.
          </div>
        )}
      </div>

      {/* Equity curve */}
      <Card>
        <CardHeader>
          <h2 data-slot="card-title" className="text-base leading-snug font-medium">Equity Curve</h2>
        </CardHeader>
        <CardContent>
          {snapshots.isLoading && !snapshots.data ? (
            <Skeleton className="h-[300px] w-full" />
          ) : snapshots.data ? (
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <EquityChart data={snapshots.data} />
            </Suspense>
          ) : (
            <div role="status" aria-live="polite" className="flex h-[300px] items-center justify-center text-muted-foreground">
              No equity data to display yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open positions */}
      <Card>
        <CardHeader>
          <h2 data-slot="card-title" className="text-base leading-snug font-medium">Open Positions</h2>
        </CardHeader>
        <CardContent>
          {positions.isLoading && !positions.data ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : positions.data && positions.data.length > 0 ? (
            <Table>
              <caption className="sr-only">Open positions</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Avg Entry</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Unrealized P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.data.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell className="font-medium">{pos.symbol}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {pos.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(pos.avgEntryPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(pos.currentPrice)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono tabular-nums font-medium",
                        pos.unrealizedPnl > 0 && "text-gain",
                        pos.unrealizedPnl < 0 && "text-loss",
                      )}
                    >
                      {formatSignedCurrency(pos.unrealizedPnl)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p role="status" aria-live="polite" className="py-6 text-center text-muted-foreground">
              No open positions. Buy stocks to see them tracked here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
