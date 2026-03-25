"use client"

import { useFetch } from "@/hooks/use-fetch"
import { getWatchlist, getCandles } from "@/lib/api"
import type { WatchlistItem, Candle } from "@/lib/api"
import { formatCurrency, formatNumber } from "@/components/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface WatchlistEntry {
  item: WatchlistItem
  candle: Candle | null
}

async function fetchWatchlistWithCandles(): Promise<WatchlistEntry[]> {
  const items = await getWatchlist(true)
  const entries = await Promise.all(
    items.map(async (item) => {
      try {
        const res = await getCandles(item.symbol, "1day", 1)
        return { item, candle: res.data[0] ?? null }
      } catch {
        return { item, candle: null }
      }
    }),
  )
  return entries
}

export function WatchlistTab() {
  const { data, error, isLoading } = useFetch(
    fetchWatchlistWithCandles,
    [],
    120_000,
  )

  if (error && !data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Cannot connect to API server. Make sure it is running on port 3001.
      </div>
    )
  }

  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
              <div className="mt-3 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No active watchlist items. Add symbols via the API to get started.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map(({ item, candle }) => {
        const isUp = candle ? candle.close >= candle.open : false
        return (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2">
                <span>{item.symbol}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {item.displayName}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candle ? (
                <>
                  <div
                    className={cn(
                      "text-2xl font-bold tabular-nums",
                      isUp ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {formatCurrency(candle.close)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div>
                      O{" "}
                      <span className="tabular-nums text-foreground">
                        {formatNumber(candle.open)}
                      </span>
                    </div>
                    <div>
                      H{" "}
                      <span className="tabular-nums text-foreground">
                        {formatNumber(candle.high)}
                      </span>
                    </div>
                    <div>
                      L{" "}
                      <span className="tabular-nums text-foreground">
                        {formatNumber(candle.low)}
                      </span>
                    </div>
                    <div>
                      V{" "}
                      <span className="tabular-nums text-foreground">
                        {formatNumber(candle.volume, 0)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No candle data</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
