"use client"

import { useFetch } from "@/hooks/use-fetch"
import { getPortfolioCurrent } from "@/lib/api"
import { formatCurrency } from "@/components/formatters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PortfolioTab } from "@/components/portfolio-tab"
import { WatchlistTab } from "@/components/watchlist-tab"
import { TradesTab } from "@/components/trades-tab"
import { StaleDataAnnouncer } from "@/components/stale-data-announcer"

export function DashboardShell() {
  const portfolio = useFetch((signal) => getPortfolioCurrent(signal), [], 60_000)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
      <StaleDataAnnouncer error={portfolio.staleError} />
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Gainster</h1>
        {portfolio.data && (
          <span className="text-sm font-mono tabular-nums text-muted-foreground">
            Portfolio: {formatCurrency(portfolio.data.totalValue)}
          </span>
        )}
      </header>

      <Tabs defaultValue="portfolio">
        <TabsList className="w-full min-h-11 sm:min-h-0">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>
        <TabsContent value="portfolio" className="mt-4">
          <PortfolioTab
            portfolio={portfolio.data}
            portfolioLoading={portfolio.isLoading}
            portfolioError={portfolio.error}
          />
        </TabsContent>
        <TabsContent value="watchlist" className="mt-4">
          <WatchlistTab />
        </TabsContent>
        <TabsContent value="trades" className="mt-4">
          <TradesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
