import type { FastifyInstance } from 'fastify';
import { listTradesHandler, getTradeHandler, createTradeHandler } from './handlers.js';

export default async function tradeRoutes(fastify: FastifyInstance) {
  fastify.get('/', listTradesHandler);
  fastify.get('/:id', getTradeHandler);
  fastify.post('/', createTradeHandler);
}
