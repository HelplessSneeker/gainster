"use client"

import { useState } from "react"
import { useFetch } from "@/hooks/use-fetch"
import { getTrades } from "@/lib/api"
import { formatCurrency, formatDateTime } from "@/components/formatters"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

export function TradesTab() {
  const [offset, setOffset] = useState(0)
  const { data, error, isLoading } = useFetch(
    (signal) => getTrades(PAGE_SIZE, offset, signal),
    [offset],
  )

  if (error && !data) {
    return (
      <div role="status" aria-live="polite" className="py-12 text-center text-muted-foreground">
        Unable to connect to the API server. Start it with pnpm dev:api and refresh.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h2 data-slot="card-title" className="text-base leading-snug font-medium">Trade History</h2>
      </CardHeader>
      <CardContent>
        {isLoading && !data ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <TooltipProvider delay={300}>
            <div className="overflow-x-auto -mx-4 px-4">
            <Table>
              <caption className="sr-only">Trade history</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead className="hidden lg:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-mono tabular-nums">
                      {formatDateTime(trade.executedAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                          trade.side === "buy"
                            ? "bg-gain-muted text-gain"
                            : "bg-loss-muted text-loss",
                        )}
                      >
                        {trade.side}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {trade.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(trade.price)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(trade.quantity * trade.price)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          trade.signalSource !== "manual"
                            ? "bg-signal-ai-bg text-signal-ai-fg"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {trade.signalSource}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] text-muted-foreground">
                      {trade.notes ? (
                        <Tooltip>
                          <TooltipTrigger className="block max-w-full truncate text-left underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 cursor-help">
                            {trade.notes}
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {trade.notes}
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </TooltipProvider>

            {/* Pagination */}
            <nav aria-label="Trade history pagination" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}&ndash;
                {Math.min(offset + PAGE_SIZE, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  disabled={offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                  aria-label="Previous page of trades"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  disabled={offset + PAGE_SIZE >= data.total}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                  aria-label="Next page of trades"
                >
                  Next
                </Button>
              </div>
            </nav>
          </>
        ) : (
          <p role="status" aria-live="polite" className="py-6 text-center text-muted-foreground">
            No trades yet. Your trade history will appear here once you start trading.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
