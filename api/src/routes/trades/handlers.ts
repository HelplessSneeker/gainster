import {
  insertTrade,
  getTradeById,
  listTrades,
  getSignalById,
  getPositionBySymbol,
  upsertPosition,
  getAccount,
} from '@gainster/db';
import type { Trade } from '@gainster/db';
import { account } from '@gainster/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '../../lib/types.js';
import { idParamSchema } from '../../lib/schemas.js';
import { createTradeSchema, listTradesQuerySchema } from './schemas.js';

type TradeResult =
  | { ok: true; trade: Trade }
  | { ok: false; error: string; statusCode: number };

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

  const result: TradeResult = db.transaction((tx) => {
    const acct = getAccount(tx);
    if (!acct) {
      return { ok: false, error: 'Account not initialized', statusCode: 500 };
    }

    const cost = body.quantity * body.price;

    if (body.side === 'buy') {
      if (cost > acct.cash) {
        return {
          ok: false,
          error: `Insufficient cash — need $${cost.toFixed(2)} but only $${acct.cash.toFixed(2)} available`,
          statusCode: 422,
        };
      }
    }

    const existing = getPositionBySymbol(tx, body.symbol);

    if (body.side === 'sell') {
      const held = existing?.quantity ?? 0;
      if (body.quantity > held) {
        return {
          ok: false,
          error: `Cannot sell ${body.quantity} shares — only ${held} held`,
          statusCode: 422,
        };
      }
    }

    const inserted = insertTrade(tx, body);

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
      // Deduct cash
      tx.update(account)
        .set({
          cash: sql`${account.cash} - ${cost}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(account.id, 1))
        .run();
    } else {
      const oldQty = existing?.quantity ?? 0;
      const newQty = oldQty - body.quantity;
      const avgEntry = existing?.avgEntryPrice ?? body.price;
      const realizedPnl = (body.price - avgEntry) * body.quantity;
      upsertPosition(tx, {
        symbol: body.symbol,
        quantity: newQty,
        avgEntryPrice: avgEntry,
        currentPrice: body.price,
        unrealizedPnl: (body.price - avgEntry) * newQty,
      });
      // Add proceeds and realized P&L
      tx.update(account)
        .set({
          cash: sql`${account.cash} + ${cost}`,
          realizedPnl: sql`${account.realizedPnl} + ${realizedPnl}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(account.id, 1))
        .run();
    }

    return { ok: true, trade: inserted };
  });

  if (!result.ok) {
    return reply.code(result.statusCode).send({
      error: result.error,
      statusCode: result.statusCode,
    });
  }

  return reply.code(201).send(result.trade);
}
