import type { FastifyInstance } from 'fastify';
import type { MarketDataProvider } from '@gainster/market-data';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@gainster/db/schema';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildApp } from '../app.js';

export function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });

  // Resolve migrations folder from the @gainster/db package
  const dbPkgDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..', '..', '..', 'packages', 'db', 'drizzle',
  );
  migrate(db, { migrationsFolder: dbPkgDir });

  return { db, sqlite };
}

export function createMockMarketData(): MarketDataProvider {
  return {
    getQuote: async () => ({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      currency: 'USD',
      price: 150.0,
      open: 148.0,
      high: 151.0,
      low: 147.0,
      previousClose: 149.0,
      volume: 1000000,
      change: 1.0,
      changePercent: 0.67,
      timestamp: '2024-01-01T00:00:00Z',
    }),
    getCandles: async () => [
      {
        datetime: '2024-01-01',
        open: 148.0,
        high: 151.0,
        low: 147.0,
        close: 150.0,
        volume: 1000000,
      },
      {
        datetime: '2024-01-02',
        open: 150.0,
        high: 153.0,
        low: 149.0,
        close: 152.0,
        volume: 1100000,
      },
    ],
    getApiUsage: async () => ({
      timestamp: '2024-01-01T00:00:00Z',
      minuteUsed: 1,
      minuteLimit: 8,
      minuteRemaining: 7,
      dailyUsed: 10,
      dailyLimit: 800,
      dailyRemaining: 790,
    }),
  };
}

export async function createTestApp(overrides?: {
  marketData?: MarketDataProvider;
}): Promise<FastifyInstance> {
  const { db } = createTestDb();
  const marketData = overrides?.marketData ?? createMockMarketData();

  const app = await buildApp({ db, marketData });
  await app.ready();
  return app;
}
