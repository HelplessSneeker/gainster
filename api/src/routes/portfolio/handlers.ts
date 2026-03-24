import {
  listSnapshots,
  getLatestSnapshot,
  insertPortfolioSnapshot,
  getPositionSummary,
} from '@gainster/db';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '../../lib/types.js';
import { listSnapshotsQuerySchema } from './schemas.js';

export async function listSnapshotsHandler(request: FastifyRequest, reply: FastifyReply) {
  const query = listSnapshotsQuerySchema.parse(request.query);
  const result = listSnapshots(request.server.db, {
    startDate: query.startDate,
    endDate: query.endDate,
    limit: query.limit,
    offset: query.offset,
  });
  return reply.send(result);
}

export async function getCurrentSnapshotHandler(request: FastifyRequest, reply: FastifyReply) {
  const snapshot = getLatestSnapshot(request.server.db);
  if (!snapshot) {
    return reply.code(404).send({ error: 'No snapshots found', statusCode: 404 });
  }
  return reply.send(snapshot);
}

export async function createSnapshotHandler(request: FastifyRequest, reply: FastifyReply) {
  const db = request.server.db;
  const summary = getPositionSummary(db);

  const snapshot = insertPortfolioSnapshot(db, {
    timestamp: new Date().toISOString(),
    totalValue: summary.totalInvested + summary.totalUnrealizedPnl,
    cash: 0, // TODO: track cash balance
    invested: summary.totalInvested,
    unrealizedPnl: summary.totalUnrealizedPnl,
    realizedPnl: 0, // TODO: compute from closed trades
  });

  return reply.code(201).send(snapshot);
}
