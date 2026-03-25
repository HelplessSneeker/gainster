const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

// --- Types ---

export interface WatchlistItem {
  id: number
  symbol: string
  exchange: string
  displayName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Candle {
  id: number
  symbol: string
  interval: string
  datetime: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  createdAt: string
}

export interface Trade {
  id: number
  symbol: string
  side: string
  quantity: number
  price: number
  executedAt: string
  signalId: number | null
  signalSource: string
  notes: string | null
}

export interface Position {
  id: number
  symbol: string
  quantity: number
  avgEntryPrice: number
  currentPrice: number
  unrealizedPnl: number
  updatedAt: string
}

export interface PositionSummary {
  totalInvested: number
  totalUnrealizedPnl: number
  positionCount: number
}

export interface PortfolioSnapshot {
  id: number
  timestamp: string
  totalValue: number
  cash: number
  invested: number
  unrealizedPnl: number
  realizedPnl: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
}

// --- Fetcher ---

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// --- API functions ---

export function getWatchlist(active?: boolean): Promise<WatchlistItem[]> {
  const params = active !== undefined ? `?active=${active}` : ""
  return fetchApi<WatchlistItem[]>(`/api/watchlist${params}`)
}

export function getCandles(
  symbol: string,
  interval = "1day",
  limit = 50,
): Promise<PaginatedResponse<Candle>> {
  return fetchApi<PaginatedResponse<Candle>>(
    `/api/candles/${encodeURIComponent(symbol)}?interval=${interval}&limit=${limit}`,
  )
}

export function getTrades(
  limit = 50,
  offset = 0,
): Promise<PaginatedResponse<Trade>> {
  return fetchApi<PaginatedResponse<Trade>>(
    `/api/trades?limit=${limit}&offset=${offset}`,
  )
}

export function getPositions(): Promise<Position[]> {
  return fetchApi<Position[]>("/api/positions")
}

export function getPositionSummary(): Promise<PositionSummary> {
  return fetchApi<PositionSummary>("/api/positions/summary")
}

export async function getPortfolioCurrent(): Promise<PortfolioSnapshot | null> {
  const res = await fetch(`${API_BASE}/api/portfolio/current`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<PortfolioSnapshot>
}

export function getPortfolioSnapshots(
  limit = 500,
): Promise<PaginatedResponse<PortfolioSnapshot>> {
  return fetchApi<PaginatedResponse<PortfolioSnapshot>>(
    `/api/portfolio/snapshots?limit=${limit}`,
  )
}
