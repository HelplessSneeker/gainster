"use client"

import { useFetch } from "@/hooks/use-fetch"
import {
  getPortfolioSnapshots,
  getPositions,
} from "@/lib/api"
import type { PortfolioSnapshot } from "@/lib/api"
import { formatCurrency } from "@/components/formatters"
import { StatCard } from "@/components/stat-card"
import { EquityChart } from "@/components/equity-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    () => getPortfolioSnapshots(500).then((r) => r.data),
    [],
  )
  const positions = useFetch(getPositions, [], 60_000)

  if (portfolioError) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Cannot connect to API server. Make sure it is running on port 3001.
      </div>
    )
  }

  const snap = portfolio

  return (
    <div className="space-y-6">
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
              value={formatCurrency(snap.unrealizedPnl)}
              trend={trendFor(snap.unrealizedPnl)}
            />
            <StatCard
              title="Realized P&L"
              value={formatCurrency(snap.realizedPnl)}
              trend={trendFor(snap.realizedPnl)}
            />
          </>
        ) : (
          <div className="col-span-full py-6 text-center text-muted-foreground">
            No portfolio snapshots yet. Create one via POST /api/portfolio/snapshots.
          </div>
        )}
      </div>

      {/* Equity curve */}
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshots.isLoading && !snapshots.data ? (
            <Skeleton className="h-[300px] w-full" />
          ) : snapshots.data ? (
            <EquityChart data={snapshots.data} />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No snapshot data available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open positions */}
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
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
                    <TableCell className="text-right tabular-nums">
                      {pos.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(pos.avgEntryPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(pos.currentPrice)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        pos.unrealizedPnl > 0 && "text-green-600",
                        pos.unrealizedPnl < 0 && "text-red-600",
                      )}
                    >
                      {formatCurrency(pos.unrealizedPnl)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-muted-foreground">
              No open positions.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
