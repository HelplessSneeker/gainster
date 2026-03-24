import type { FastifyInstance } from 'fastify';
import { listPositionsHandler, getPositionSummaryHandler, getPositionHandler } from './handlers.js';

export default async function positionRoutes(fastify: FastifyInstance) {
  fastify.get('/', listPositionsHandler);
  fastify.get('/summary', getPositionSummaryHandler);
  fastify.get('/:symbol', getPositionHandler);
}
