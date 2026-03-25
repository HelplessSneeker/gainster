"use client"

import { useState } from "react"
import { useFetch } from "@/hooks/use-fetch"
import { getTrades } from "@/lib/api"
import { formatCurrency, formatDateTime } from "@/components/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

export function TradesTab() {
  const [offset, setOffset] = useState(0)
  const { data, error, isLoading } = useFetch(
    () => getTrades(PAGE_SIZE, offset),
    [offset],
  )

  if (error && !data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Cannot connect to API server. Make sure it is running on port 3001.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="tabular-nums">
                      {formatDateTime(trade.executedAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase",
                          trade.side === "buy"
                            ? "text-green-600"
                            : "text-red-600",
                        )}
                      >
                        {trade.side}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {trade.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(trade.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(trade.quantity * trade.price)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          trade.signalSource !== "manual"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {trade.signalSource}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {trade.notes ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}&ndash;
                {Math.min(offset + PAGE_SIZE, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + PAGE_SIZE >= data.total}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-muted-foreground">
            No trades yet. Execute trades via the API to see them here.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
