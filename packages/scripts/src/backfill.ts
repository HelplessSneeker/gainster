import { createDb, migrate, getActiveWatchlistSymbols } from '@gainster/db';
import { loadEnv } from '@gainster/env';
import { createTwelveDataProvider } from '@gainster/market-data';
import { parseBackfillArgs } from './lib/parse-args.js';
import { fetchCandles } from './lib/fetch-candles.js';
import { upsertCandles } from './lib/upsert-candles.js';
import { detectGaps } from './lib/detect-gaps.js';
import * as log from './lib/log.js';

const env = loadEnv();
const args = parseBackfillArgs();

log.info(`Backfill starting — interval: ${args.interval}`);

// Initialize database and run migrations
const { db, dbPath } = createDb({ dbPath: env.GAINSTER_DB_PATH });
migrate(db);
log.info(`Database: ${dbPath}`);

// Initialize market data provider
const provider = createTwelveDataProvider({
  apiKey: env.TWELVEDATA_API_KEY,
  rpm: env.TWELVEDATA_RPM,
  burst: env.TWELVEDATA_BURST,
});

// Resolve tickers
let symbols: string[];
if (args.symbol) {
  symbols = [args.symbol];
} else {
  symbols = getActiveWatchlistSymbols(db);

  if (symbols.length === 0) {
    log.error('No active tickers in watchlist. Use --symbol to specify one.');
    process.exit(1);
  }
}

log.info(`Tickers: ${symbols.join(', ')}`);

// Process each ticker
let totalInserted = 0;
let totalSkipped = 0;
const errors: Array<{ symbol: string; error: string }> = [];

for (const symbol of symbols) {
  try {
    log.info(`Fetching ${symbol} ${args.interval}...`);

    const marketCandles = await fetchCandles(provider, symbol, args.interval);
    log.info(`${symbol}: fetched ${marketCandles.length} candles`);

    const result = upsertCandles(db, marketCandles, symbol, args.interval);
    totalInserted += result.inserted;
    totalSkipped += result.skipped;

    log.success(
      `${symbol}: inserted ${result.inserted}, skipped ${result.skipped} duplicates`,
    );

    detectGaps(db, symbol, args.interval);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`${symbol}: ${message}`);
    errors.push({ symbol, error: message });
  }
}

// Summary
console.log('\n--- Summary ---');
log.info(`Tickers processed: ${symbols.length}`);
log.info(`Total inserted: ${totalInserted}`);
log.info(`Total skipped: ${totalSkipped}`);

if (errors.length > 0) {
  log.error(`Failures (${errors.length}):`);
  for (const e of errors) {
    log.error(`  ${e.symbol}: ${e.error}`);
  }
  process.exit(1);
}

log.success('Backfill complete');
