import type { FastifyInstance } from 'fastify';
import { listSignalsHandler, getSignalHandler, getSignalTradesHandler } from './handlers.js';

export default async function signalRoutes(fastify: FastifyInstance) {
  fastify.get('/', listSignalsHandler);
  fastify.get('/:id', getSignalHandler);
  fastify.get('/:id/trades', getSignalTradesHandler);
}
