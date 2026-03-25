import { getCandles, getLatestCandlesBySymbols, upsertCandles } from '@gainster/db';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '../../lib/types.js';
import { mapToNewCandles } from '../../lib/candle-mapper.js';
import { candleIntervalSchema } from '../../lib/schemas.js';
import { getCandlesParamSchema, getCandlesQuerySchema, latestCandlesQuerySchema, backfillBodySchema } from './schemas.js';

export async function listCandles(request: FastifyRequest, reply: FastifyReply) {
  const { symbol } = getCandlesParamSchema.parse(request.params);
  const query = getCandlesQuerySchema.parse(request.query);
  const result = getCandles(request.server.db, {
    symbol,
    interval: query.interval,
    startDate: query.startDate,
    endDate: query.endDate,
    limit: query.limit,
    offset: query.offset,
  });
  return reply.send(result);
}

export async function latestCandles(request: FastifyRequest, reply: FastifyReply) {
  const { symbols, interval } = latestCandlesQuerySchema.parse(request.query);
  const data = getLatestCandlesBySymbols(request.server.db, symbols, interval);
  return reply.send(data);
}

export async function triggerBackfill(request: FastifyRequest, reply: FastifyReply) {
  const { symbol, interval } = backfillBodySchema.parse(request.body);
  const marketCandles = await request.server.marketData.getCandles(
    symbol,
    interval,
    { outputSize: 5000 },
  );

  const result = upsertCandles(request.server.db, mapToNewCandles(marketCandles, symbol, interval));
  return reply.send(result);
}

export async function listIntervals(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(candleIntervalSchema.options);
}
