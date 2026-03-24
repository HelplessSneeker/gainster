import { getAllPositions, getPositionBySymbol, getPositionSummary } from '@gainster/db';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '../../lib/types.js';
import { symbolParamSchema } from './schemas.js';

export async function listPositionsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const items = getAllPositions(_request.server.db);
  return reply.send(items);
}

export async function getPositionSummaryHandler(request: FastifyRequest, reply: FastifyReply) {
  const summary = getPositionSummary(request.server.db);
  return reply.send(summary);
}

export async function getPositionHandler(request: FastifyRequest, reply: FastifyReply) {
  const { symbol } = symbolParamSchema.parse(request.params);
  const position = getPositionBySymbol(request.server.db, symbol);
  if (!position) {
    return reply.code(404).send({ error: 'Position not found', statusCode: 404 });
  }
  return reply.send(position);
}
