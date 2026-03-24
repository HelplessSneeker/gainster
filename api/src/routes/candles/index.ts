import type { FastifyInstance } from 'fastify';
import { listCandles, triggerBackfill, listIntervals } from './handlers.js';

export default async function candleRoutes(fastify: FastifyInstance) {
  fastify.get('/intervals', listIntervals);
  fastify.get('/:symbol', listCandles);
  fastify.post('/backfill', triggerBackfill);
}
