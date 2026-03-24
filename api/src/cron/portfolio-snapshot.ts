import {
  getAllPositions,
  getPositionSummary,
  updatePositionPrice,
  insertPortfolioSnapshot,
} from '@gainster/db';
import type { DrizzleDb } from '@gainster/db';
import type { MarketDataProvider } from '@gainster/market-data';
import type { FastifyBaseLogger } from 'fastify';

export interface SnapshotConfig {
  db: DrizzleDb;
  marketData: MarketDataProvider;
  log: FastifyBaseLogger;
}

export async function takePortfolioSnapshot(config: SnapshotConfig): Promise<void> {
  const { db, marketData, log } = config;

  const allPositions = getAllPositions(db);
  if (allPositions.length === 0) {
    log.info('No positions, skipping portfolio snapshot');
    return;
  }

  for (const pos of allPositions) {
    if (pos.quantity <= 0) continue;
    try {
      const quote = await marketData.getQuote(pos.symbol);
      updatePositionPrice(db, pos.symbol, quote.price);
    } catch (err) {
      log.error({ symbol: pos.symbol, err }, 'Failed to fetch quote for position');
    }
  }

  const summary = getPositionSummary(db);

  const snapshot = insertPortfolioSnapshot(db, {
    timestamp: new Date().toISOString(),
    totalValue: summary.totalInvested + summary.totalUnrealizedPnl,
    cash: 0, // TODO: track cash balance
    invested: summary.totalInvested,
    unrealizedPnl: summary.totalUnrealizedPnl,
    realizedPnl: 0, // TODO: compute from closed trades
  });

  log.info({ snapshotId: snapshot.id, totalValue: snapshot.totalValue }, 'Portfolio snapshot taken');
}
