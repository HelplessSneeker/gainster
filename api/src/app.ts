import type { DrizzleDb } from '@gainster/db';
import type { MarketDataProvider } from '@gainster/market-data';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import dbPlugin from './plugins/db.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import marketDataPlugin from './plugins/market-data.js';
import healthRoutes from './routes/health.js';
import watchlistRoutes from './routes/watchlist/index.js';
import candleRoutes from './routes/candles/index.js';
import tradeRoutes from './routes/trades/index.js';
import positionRoutes from './routes/positions/index.js';
import portfolioRoutes from './routes/portfolio/index.js';
import signalRoutes from './routes/signals/index.js';

export interface AppOptions {
  db: DrizzleDb;
  marketData: MarketDataProvider;
}

export async function buildApp(options: AppOptions) {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(errorHandlerPlugin);
  await app.register(dbPlugin, { db: options.db });
  await app.register(marketDataPlugin, { marketData: options.marketData });

  await app.register(healthRoutes);
  await app.register(watchlistRoutes, { prefix: '/api/watchlist' });
  await app.register(candleRoutes, { prefix: '/api/candles' });
  await app.register(tradeRoutes, { prefix: '/api/trades' });
  await app.register(positionRoutes, { prefix: '/api/positions' });
  await app.register(portfolioRoutes, { prefix: '/api/portfolio' });
  await app.register(signalRoutes, { prefix: '/api/signals' });

  return app;
}
