import type { FastifyInstance } from 'fastify';
import {
  listWatchlist,
  getWatchlist,
  createWatchlist,
  updateWatchlist,
  deleteWatchlistHandler,
} from './handlers.js';

export default async function watchlistRoutes(fastify: FastifyInstance) {
  fastify.get('/', listWatchlist);
  fastify.get('/:id', getWatchlist);
  fastify.post('/', createWatchlist);
  fastify.patch('/:id', updateWatchlist);
  fastify.delete('/:id', deleteWatchlistHandler);
}
