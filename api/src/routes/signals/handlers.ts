import { listSignals, getSignalById, getTradesBySignalId } from '@gainster/db';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '../../lib/types.js';
import { idParamSchema } from '../../lib/schemas.js';
import { listSignalsQuerySchema } from './schemas.js';

export async function listSignalsHandler(request: FastifyRequest, reply: FastifyReply) {
  const query = listSignalsQuerySchema.parse(request.query);
  const result = listSignals(request.server.db, {
    symbol: query.symbol,
    modelSource: query.modelSource,
    actedOn: query.actedOn,
    limit: query.limit,
    offset: query.offset,
  });
  return reply.send(result);
}

export async function getSignalHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(request.params);
  const signal = getSignalById(request.server.db, id);
  if (!signal) {
    return reply.code(404).send({ error: 'Signal not found', statusCode: 404 });
  }
  return reply.send(signal);
}

export async function getSignalTradesHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(request.params);
  const signal = getSignalById(request.server.db, id);
  if (!signal) {
    return reply.code(404).send({ error: 'Signal not found', statusCode: 404 });
  }
  const trades = getTradesBySignalId(request.server.db, id);
  return reply.send(trades);
}
