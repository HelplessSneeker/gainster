import { getActiveWatchlistSymbols, upsertCandles } from '@gainster/db';
import type { DrizzleDb } from '@gainster/db';
import type { CandleInterval, MarketDataProvider } from '@gainster/market-data';
import type { FastifyBaseLogger } from 'fastify';
import { mapToNewCandles } from '../lib/candle-mapper.js';
import { isMarketOpen } from './market-status.js';

const POLL_INTERVAL: CandleInterval = '5min';

export interface CandlePollConfig {
  db: DrizzleDb;
  marketData: MarketDataProvider;
  log: FastifyBaseLogger;
}

export async function pollCandles(config: CandlePollConfig): Promise<void> {
  const { db, marketData, log } = config;

  if (!isMarketOpen()) {
    log.info('Market closed, skipping candle poll');
    return;
  }

  const symbols = getActiveWatchlistSymbols(db);
  if (symbols.length === 0) {
    log.info('No active watchlist symbols, skipping candle poll');
    return;
  }

  log.info({ symbolCount: symbols.length }, 'Starting candle poll');

  for (const symbol of symbols) {
    try {
      const candles = await marketData.getCandles(symbol, POLL_INTERVAL, { outputSize: 12 });
      const result = upsertCandles(db, mapToNewCandles(candles, symbol, POLL_INTERVAL));
      log.info({ symbol, inserted: result.inserted, skipped: result.skipped }, 'Polled candles');
    } catch (err) {
      log.error({ symbol, err }, 'Failed to poll candles');
    }
  }
}
