import type { FastifyInstance } from 'fastify';
import { listCandles, latestCandles, triggerBackfill, listIntervals } from './handlers.js';

export default async function candleRoutes(fastify: FastifyInstance) {
  fastify.get('/intervals', listIntervals);
  fastify.get('/latest', latestCandles);
  fastify.get('/:symbol', listCandles);
  fastify.post('/backfill', triggerBackfill);
}
