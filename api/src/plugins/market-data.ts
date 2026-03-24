import type { MarketDataProvider } from '@gainster/market-data';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import '../lib/types.js';

export interface MarketDataPluginOptions {
  marketData: MarketDataProvider;
}

async function marketDataPlugin(fastify: FastifyInstance, options: MarketDataPluginOptions) {
  fastify.decorate('marketData', options.marketData);
}

export default fp(marketDataPlugin, { name: 'market-data' });
