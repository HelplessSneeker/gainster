import { readFileSync } from 'node:fs';
import { createDb, migrate, getActiveWatchlistSymbols } from '@gainster/db';
import { createTwelveDataProvider } from '@gainster/market-data';
import { parseBackfillArgs } from './lib/parse-args.js';
import { fetchCandles } from './lib/fetch-candles.js';
import { upsertCandles } from './lib/upsert-candles.js';
import { detectGaps } from './lib/detect-gaps.js';
import * as log from './lib/log.js';

// Load .env file if present (root first, then package root)
for (const base of ['../../../.env', '../../.env']) {
  try {
    const env = readFileSync(new URL(base, import.meta.url), 'utf-8');
    for (const line of env.split('\n')) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
      if (match) process.env[match[1]!] ??= match[2]!;
    }
  } catch {
    // No .env file at this location
  }
}

const args = parseBackfillArgs();

log.info(`Backfill starting — interval: ${args.interval}`);

// Initialize database and run migrations
const db = createDb();
migrate(db);

// Initialize market data provider
const provider = createTwelveDataProvider();

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
