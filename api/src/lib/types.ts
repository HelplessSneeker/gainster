import type { DrizzleDb } from '@gainster/db';
import type { MarketDataProvider } from '@gainster/market-data';

declare module 'fastify' {
  interface FastifyInstance {
    db: DrizzleDb;
    marketData: MarketDataProvider;
  }
}
