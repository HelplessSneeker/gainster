export { createDb } from './client.js';
export type { DrizzleDb, CreateDbResult } from './client.js';
export { createConnection } from './connection.js';
export type { ConnectionOptions, ConnectionResult } from './connection.js';
export { migrate } from './migrate.js';
export { account } from './schema/index.js';
export type { Account, NewAccount } from './schema/index.js';
export { watchlist } from './schema/index.js';
export type { Watchlist, NewWatchlist } from './schema/index.js';
export { candles } from './schema/index.js';
export type { Candle, NewCandle } from './schema/index.js';
export { aiSignals } from './schema/index.js';
export type { AiSignal, NewAiSignal } from './schema/index.js';
export { trades } from './schema/index.js';
export type { Trade, NewTrade } from './schema/index.js';
export { positions } from './schema/index.js';
export type { Position, NewPosition } from './schema/index.js';
export { portfolioSnapshots } from './schema/index.js';
export type { PortfolioSnapshot, NewPortfolioSnapshot } from './schema/index.js';
export {
  getActiveWatchlistSymbols,
  upsertCandles,
  getCandleDatetimes,
  getCandles,
  getAllWatchlistItems,
  getWatchlistItemById,
  insertWatchlistItem,
  updateWatchlistItem,
  deleteWatchlistItem,
  insertTrade,
  getTradeById,
  listTrades,
  getTradesBySignalId,
  getAllPositions,
  getPositionBySymbol,
  upsertPosition,
  getPositionSummary,
  updatePositionPrice,
  insertPortfolioSnapshot,
  getLatestSnapshot,
  listSnapshots,
  listSignals,
  getSignalById,
  getAccount,
  ensureAccount,
} from './queries.js';
export type {
  UpsertCandlesResult,
  ListWatchlistOptions,
  GetCandlesOptions,
  PaginatedResult,
  ListTradesOptions,
  PositionSummary,
  ListSnapshotsOptions,
  ListSignalsOptions,
} from './queries.js';
