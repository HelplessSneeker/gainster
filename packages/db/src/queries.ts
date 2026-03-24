import { and, asc, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { DrizzleDb } from './client.js';
import { aiSignals } from './schema/ai-signals.js';
import type { AiSignal } from './schema/ai-signals.js';
import { candles } from './schema/candles.js';
import type { Candle, NewCandle } from './schema/candles.js';
import { portfolioSnapshots } from './schema/portfolio-snapshots.js';
import type { NewPortfolioSnapshot, PortfolioSnapshot } from './schema/portfolio-snapshots.js';
import { positions } from './schema/positions.js';
import type { NewPosition, Position } from './schema/positions.js';
import { trades } from './schema/trades.js';
import type { NewTrade, Trade } from './schema/trades.js';
import { watchlist } from './schema/watchlist.js';
import type { Watchlist, NewWatchlist } from './schema/watchlist.js';

export function getActiveWatchlistSymbols(db: DrizzleDb): string[] {
  const rows = db
    .select({ symbol: watchlist.symbol })
    .from(watchlist)
    .where(eq(watchlist.isActive, true))
    .all();
  return rows.map((r) => r.symbol);
}

export interface UpsertCandlesResult {
  readonly inserted: number;
  readonly skipped: number;
}

export function upsertCandles(
  db: DrizzleDb,
  rows: NewCandle[],
  batchSize: number = 500,
): UpsertCandlesResult {
  let totalInserted = 0;

  db.transaction((tx) => {
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const result = tx.insert(candles).values(batch).onConflictDoNothing().run();
      totalInserted += result.changes;
    }
  });

  return {
    inserted: totalInserted,
    skipped: rows.length - totalInserted,
  };
}

export function getCandleDatetimes(
  db: DrizzleDb,
  symbol: string,
  interval: string,
): string[] {
  const rows = db
    .select({ datetime: candles.datetime })
    .from(candles)
    .where(and(eq(candles.symbol, symbol), eq(candles.interval, interval)))
    .orderBy(asc(candles.datetime))
    .all();
  return rows.map((r) => r.datetime);
}

// ── Candle queries ──────────────────────────────────────────────────

export interface GetCandlesOptions {
  symbol: string;
  interval: string;
  startDate?: string | undefined;
  endDate?: string | undefined;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export function getCandles(
  db: DrizzleDb,
  options: GetCandlesOptions,
): PaginatedResult<Candle> {
  const conditions = [
    eq(candles.symbol, options.symbol),
    eq(candles.interval, options.interval),
  ];
  if (options.startDate !== undefined) {
    conditions.push(gte(candles.datetime, options.startDate));
  }
  if (options.endDate !== undefined) {
    conditions.push(lte(candles.datetime, options.endDate));
  }

  const where = and(...conditions);

  const data = db
    .select()
    .from(candles)
    .where(where)
    .orderBy(asc(candles.datetime))
    .limit(options.limit)
    .offset(options.offset)
    .all();

  const [countRow] = db
    .select({ count: count() })
    .from(candles)
    .where(where)
    .all();

  return { data, total: countRow?.count ?? 0 };
}

// ── Watchlist CRUD ──────────────────────────────────────────────────

export interface ListWatchlistOptions {
  active?: boolean | undefined;
}

export function getAllWatchlistItems(
  db: DrizzleDb,
  options: ListWatchlistOptions = {},
): Watchlist[] {
  const conditions = [];
  if (options.active !== undefined) {
    conditions.push(eq(watchlist.isActive, options.active));
  }
  return db
    .select()
    .from(watchlist)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .all();
}

export function getWatchlistItemById(
  db: DrizzleDb,
  id: number,
): Watchlist | undefined {
  return db
    .select()
    .from(watchlist)
    .where(eq(watchlist.id, id))
    .get();
}

export function insertWatchlistItem(
  db: DrizzleDb,
  item: NewWatchlist,
): Watchlist {
  const rows = db.insert(watchlist).values(item).returning().all();
  return rows[0]!;
}

export function updateWatchlistItem(
  db: DrizzleDb,
  id: number,
  updates: Partial<Pick<NewWatchlist, 'displayName' | 'isActive'>>,
): Watchlist | undefined {
  const rows = db
    .update(watchlist)
    .set({ ...updates, updatedAt: sql`(datetime('now'))` })
    .where(eq(watchlist.id, id))
    .returning()
    .all();
  return rows[0];
}

export function deleteWatchlistItem(
  db: DrizzleDb,
  id: number,
): boolean {
  const result = db
    .delete(watchlist)
    .where(eq(watchlist.id, id))
    .run();
  return result.changes > 0;
}

// ── Trades ──────────────────────────────────────────────────────────

export interface ListTradesOptions {
  symbol?: string | undefined;
  side?: string | undefined;
  limit: number;
  offset: number;
}

export function insertTrade(db: DrizzleDb, trade: NewTrade): Trade {
  const rows = db.insert(trades).values(trade).returning().all();
  return rows[0]!;
}

export function getTradeById(db: DrizzleDb, id: number): Trade | undefined {
  return db.select().from(trades).where(eq(trades.id, id)).get();
}

export function listTrades(
  db: DrizzleDb,
  options: ListTradesOptions,
): PaginatedResult<Trade> {
  const conditions = [];
  if (options.symbol !== undefined) {
    conditions.push(eq(trades.symbol, options.symbol));
  }
  if (options.side !== undefined) {
    conditions.push(eq(trades.side, options.side));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = db
    .select()
    .from(trades)
    .where(where)
    .orderBy(desc(trades.executedAt))
    .limit(options.limit)
    .offset(options.offset)
    .all();

  const [countRow] = db
    .select({ count: count() })
    .from(trades)
    .where(where)
    .all();

  return { data, total: countRow?.count ?? 0 };
}

export function getTradesBySignalId(db: DrizzleDb, signalId: number): Trade[] {
  return db
    .select()
    .from(trades)
    .where(eq(trades.signalId, signalId))
    .orderBy(desc(trades.executedAt))
    .all();
}

// ── Positions ───────────────────────────────────────────────────────

export function getAllPositions(db: DrizzleDb): Position[] {
  return db.select().from(positions).all();
}

export function getPositionBySymbol(
  db: DrizzleDb,
  symbol: string,
): Position | undefined {
  return db
    .select()
    .from(positions)
    .where(eq(positions.symbol, symbol))
    .get();
}

export function upsertPosition(db: DrizzleDb, position: NewPosition): Position {
  const rows = db
    .insert(positions)
    .values(position)
    .onConflictDoUpdate({
      target: positions.symbol,
      set: {
        quantity: sql`excluded.quantity`,
        avgEntryPrice: sql`excluded.avg_entry_price`,
        currentPrice: sql`excluded.current_price`,
        unrealizedPnl: sql`excluded.unrealized_pnl`,
        updatedAt: sql`(datetime('now'))`,
      },
    })
    .returning()
    .all();
  return rows[0]!;
}

export interface PositionSummary {
  totalInvested: number;
  totalUnrealizedPnl: number;
  positionCount: number;
}

export function getPositionSummary(db: DrizzleDb): PositionSummary {
  const [row] = db
    .select({
      totalInvested: sql<number>`coalesce(sum(${positions.quantity} * ${positions.avgEntryPrice}), 0)`,
      totalUnrealizedPnl: sql<number>`coalesce(sum(${positions.unrealizedPnl}), 0)`,
      positionCount: count(),
    })
    .from(positions)
    .all();

  return {
    totalInvested: row?.totalInvested ?? 0,
    totalUnrealizedPnl: row?.totalUnrealizedPnl ?? 0,
    positionCount: row?.positionCount ?? 0,
  };
}

export function updatePositionPrice(
  db: DrizzleDb,
  symbol: string,
  currentPrice: number,
): void {
  db.update(positions)
    .set({
      currentPrice,
      unrealizedPnl: sql`(${currentPrice} - ${positions.avgEntryPrice}) * ${positions.quantity}`,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(positions.symbol, symbol))
    .run();
}

// ── Portfolio Snapshots ─────────────────────────────────────────────

export function insertPortfolioSnapshot(
  db: DrizzleDb,
  snapshot: NewPortfolioSnapshot,
): PortfolioSnapshot {
  const rows = db
    .insert(portfolioSnapshots)
    .values(snapshot)
    .returning()
    .all();
  return rows[0]!;
}

export function getLatestSnapshot(db: DrizzleDb): PortfolioSnapshot | undefined {
  return db
    .select()
    .from(portfolioSnapshots)
    .orderBy(desc(portfolioSnapshots.timestamp))
    .limit(1)
    .get();
}

export interface ListSnapshotsOptions {
  startDate?: string | undefined;
  endDate?: string | undefined;
  limit: number;
  offset: number;
}

export function listSnapshots(
  db: DrizzleDb,
  options: ListSnapshotsOptions,
): PaginatedResult<PortfolioSnapshot> {
  const conditions = [];
  if (options.startDate !== undefined) {
    conditions.push(gte(portfolioSnapshots.timestamp, options.startDate));
  }
  if (options.endDate !== undefined) {
    conditions.push(lte(portfolioSnapshots.timestamp, options.endDate));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = db
    .select()
    .from(portfolioSnapshots)
    .where(where)
    .orderBy(asc(portfolioSnapshots.timestamp))
    .limit(options.limit)
    .offset(options.offset)
    .all();

  const [countRow] = db
    .select({ count: count() })
    .from(portfolioSnapshots)
    .where(where)
    .all();

  return { data, total: countRow?.count ?? 0 };
}

// ── AI Signals ──────────────────────────────────────────────────────

export interface ListSignalsOptions {
  symbol?: string | undefined;
  modelSource?: string | undefined;
  actedOn?: boolean | undefined;
  limit: number;
  offset: number;
}

export function listSignals(
  db: DrizzleDb,
  options: ListSignalsOptions,
): PaginatedResult<AiSignal> {
  const conditions = [];
  if (options.symbol !== undefined) {
    conditions.push(eq(aiSignals.symbol, options.symbol));
  }
  if (options.modelSource !== undefined) {
    conditions.push(eq(aiSignals.modelSource, options.modelSource));
  }
  if (options.actedOn !== undefined) {
    conditions.push(eq(aiSignals.actedOn, options.actedOn));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = db
    .select()
    .from(aiSignals)
    .where(where)
    .orderBy(desc(aiSignals.createdAt))
    .limit(options.limit)
    .offset(options.offset)
    .all();

  const [countRow] = db
    .select({ count: count() })
    .from(aiSignals)
    .where(where)
    .all();

  return { data, total: countRow?.count ?? 0 };
}

export function getSignalById(db: DrizzleDb, id: number): AiSignal | undefined {
  return db.select().from(aiSignals).where(eq(aiSignals.id, id)).get();
}
