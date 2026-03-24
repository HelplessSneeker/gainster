import {
  insertTrade,
  getTradeById,
  listTrades,
  getSignalById,
  getPositionBySymbol,
  upsertPosition,
} from '@gainster/db';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '../../lib/types.js';
import { idParamSchema } from '../../lib/schemas.js';
import { createTradeSchema, listTradesQuerySchema } from './schemas.js';

export async function listTradesHandler(request: FastifyRequest, reply: FastifyReply) {
  const query = listTradesQuerySchema.parse(request.query);
  const result = listTrades(request.server.db, {
    symbol: query.symbol,
    side: query.side,
    limit: query.limit,
    offset: query.offset,
  });
  return reply.send(result);
}

export async function getTradeHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(request.params);
  const trade = getTradeById(request.server.db, id);
  if (!trade) {
    return reply.code(404).send({ error: 'Trade not found', statusCode: 404 });
  }
  return reply.send(trade);
}

export async function createTradeHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createTradeSchema.parse(request.body);
  const db = request.server.db;

  if (body.signalId !== undefined) {
    const signal = getSignalById(db, body.signalId);
    if (!signal) {
      return reply.code(400).send({ error: 'Signal not found', statusCode: 400 });
    }
  }

  if (body.side === 'sell') {
    const existing = getPositionBySymbol(db, body.symbol);
    const held = existing?.quantity ?? 0;
    if (body.quantity > held) {
      return reply.code(422).send({
        error: `Cannot sell ${body.quantity} shares — only ${held} held`,
        statusCode: 422,
      });
    }
  }

  const trade = db.transaction((tx) => {
    const inserted = insertTrade(tx, body);

    const existing = getPositionBySymbol(tx, body.symbol);
    if (body.side === 'buy') {
      const oldQty = existing?.quantity ?? 0;
      const oldAvg = existing?.avgEntryPrice ?? 0;
      const newQty = oldQty + body.quantity;
      const newAvg = newQty > 0
        ? (oldQty * oldAvg + body.quantity * body.price) / newQty
        : 0;
      upsertPosition(tx, {
        symbol: body.symbol,
        quantity: newQty,
        avgEntryPrice: newAvg,
        currentPrice: body.price,
        unrealizedPnl: 0,
      });
    } else {
      const oldQty = existing?.quantity ?? 0;
      const newQty = oldQty - body.quantity;
      const avgEntry = existing?.avgEntryPrice ?? body.price;
      upsertPosition(tx, {
        symbol: body.symbol,
        quantity: newQty,
        avgEntryPrice: avgEntry,
        currentPrice: body.price,
        unrealizedPnl: (body.price - avgEntry) * newQty,
      });
    }

    return inserted;
  });

  return reply.code(201).send(trade);
}
