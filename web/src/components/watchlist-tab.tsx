"use client"

import { useFetch } from "@/hooks/use-fetch"
import { getWatchlist, getLatestCandles } from "@/lib/api"
import type { WatchlistItem, Candle } from "@/lib/api"
import { formatCurrency, formatNumber, formatChange } from "@/components/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { StaleDataAnnouncer } from "@/components/stale-data-announcer"

interface WatchlistEntry {
  item: WatchlistItem
  candle: Candle | null
}

async function fetchWatchlistWithCandles(signal: AbortSignal): Promise<WatchlistEntry[]> {
  const items = await getWatchlist(true, signal)
  if (items.length === 0) return []

  const symbols = items.map((i) => i.symbol)
  const candles = await getLatestCandles(symbols, "1day", signal)
  const candleMap = new Map(candles.map((c) => [c.symbol, c]))

  return items.map((item) => ({
    item,
    candle: candleMap.get(item.symbol) ?? null,
  }))
}

export function WatchlistTab() {
  const { data, error, isLoading, staleError } = useFetch(
    fetchWatchlistWithCandles,
    [],
    120_000,
  )

  if (error && !data) {
    return (
      <div role="status" aria-live="polite" className="py-12 text-center text-muted-foreground">
        Unable to connect to the API server. Start it with pnpm dev:api and refresh.
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
      <div role="status" aria-live="polite" className="py-12 text-center text-muted-foreground">
        Your watchlist is empty. Add stock symbols to start tracking prices.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StaleDataAnnouncer error={staleError} />
      {data.map(({ item, candle }) => {
        const isUp = candle ? candle.close >= candle.open : false
        const changeText = candle ? formatChange(candle.open, candle.close) : null
        return (
          <Card
            key={item.id}
            aria-label={
              candle
                ? `${item.symbol}: ${formatCurrency(candle.close)}, ${isUp ? "gain" : "loss"} ${changeText}`
                : `${item.symbol}: price data unavailable`
            }
            className={candle
              ? isUp ? "bg-gain-muted" : "bg-loss-muted"
              : undefined
            }
          >
            <CardHeader>
              <CardTitle className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0">{item.symbol}</span>
                <span className="truncate text-sm font-normal text-muted-foreground">
                  {item.displayName}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candle ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-xl font-bold font-mono tabular-nums md:text-2xl",
                        isUp ? "text-gain" : "text-loss",
                      )}
                    >
                      {formatCurrency(candle.close)}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium font-mono tabular-nums",
                        isUp ? "text-gain" : "text-loss",
                      )}
                    >
                      {isUp ? "\u25B2" : "\u25BC"} {changeText}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div>
                      <abbr title="Open" className="no-underline">O</abbr>{" "}
                      <span className="font-mono tabular-nums text-foreground">
                        {formatNumber(candle.open)}
                      </span>
                    </div>
                    <div>
                      <abbr title="High" className="no-underline">H</abbr>{" "}
                      <span className="font-mono tabular-nums text-foreground">
                        {formatNumber(candle.high)}
                      </span>
                    </div>
                    <div>
                      <abbr title="Low" className="no-underline">L</abbr>{" "}
                      <span className="font-mono tabular-nums text-foreground">
                        {formatNumber(candle.low)}
                      </span>
                    </div>
                    <div>
                      <abbr title="Volume" className="no-underline">V</abbr>{" "}
                      <span className="font-mono tabular-nums text-foreground">
                        {formatNumber(candle.volume, 0)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Price data unavailable</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
