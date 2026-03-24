import {
  getAllWatchlistItems,
  getWatchlistItemById,
  insertWatchlistItem,
  updateWatchlistItem,
  deleteWatchlistItem,
} from '@gainster/db';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '../../lib/types.js';
import {
  createWatchlistSchema,
  listWatchlistQuerySchema,
  updateWatchlistSchema,
} from './schemas.js';
import { idParamSchema } from '../../lib/schemas.js';

export async function listWatchlist(request: FastifyRequest, reply: FastifyReply) {
  const query = listWatchlistQuerySchema.parse(request.query);
  const items = getAllWatchlistItems(request.server.db, {
    active: query.active,
  });
  return reply.send(items);
}

export async function getWatchlist(request: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(request.params);
  const item = getWatchlistItemById(request.server.db, id);
  if (!item) {
    return reply.code(404).send({ error: 'Watchlist item not found', statusCode: 404 });
  }
  return reply.send(item);
}

export async function createWatchlist(request: FastifyRequest, reply: FastifyReply) {
  const body = createWatchlistSchema.parse(request.body);
  const item = insertWatchlistItem(request.server.db, body);
  return reply.code(201).send(item);
}

export async function updateWatchlist(request: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(request.params);
  const body = updateWatchlistSchema.parse(request.body);
  const updates: { displayName?: string; isActive?: boolean } = {};
  if (body.displayName !== undefined) updates.displayName = body.displayName;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  const item = updateWatchlistItem(request.server.db, id, updates);
  if (!item) {
    return reply.code(404).send({ error: 'Watchlist item not found', statusCode: 404 });
  }
  return reply.send(item);
}

export async function deleteWatchlistHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(request.params);
  const deleted = deleteWatchlistItem(request.server.db, id);
  if (!deleted) {
    return reply.code(404).send({ error: 'Watchlist item not found', statusCode: 404 });
  }
  return reply.send({ deleted: true });
}
