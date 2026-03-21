import { upsertCandles as dbUpsertCandles } from '@gainster/db';
import type { DrizzleDb, NewCandle, UpsertCandlesResult } from '@gainster/db';
import type { Candle as MarketCandle, CandleInterval } from '@gainster/market-data';

function mapToNewCandles(
  marketCandles: readonly MarketCandle[],
  symbol: string,
  interval: CandleInterval,
): NewCandle[] {
  return marketCandles.map((c) => ({
    symbol,
    interval,
    datetime: c.datetime,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}

export function upsertCandles(
  db: DrizzleDb,
  marketCandles: readonly MarketCandle[],
  symbol: string,
  interval: CandleInterval,
): UpsertCandlesResult {
  const rows = mapToNewCandles(marketCandles, symbol, interval);
  return dbUpsertCandles(db, rows);
}
