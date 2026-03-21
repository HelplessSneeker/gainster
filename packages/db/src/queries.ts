import { and, asc, eq } from 'drizzle-orm';
import type { DrizzleDb } from './client.js';
import { candles } from './schema/candles.js';
import type { NewCandle } from './schema/candles.js';
import { watchlist } from './schema/watchlist.js';

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
