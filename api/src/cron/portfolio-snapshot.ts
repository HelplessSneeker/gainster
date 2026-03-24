import {
  getAllPositions,
  getPositionSummary,
  updatePositionPrice,
  insertPortfolioSnapshot,
  getAccount,
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

  const acct = getAccount(db);
  if (!acct) {
    log.error('Account not initialized, skipping portfolio snapshot');
    return;
  }

  const allPositions = getAllPositions(db);

  for (const pos of allPositions) {
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
    totalValue: acct.cash + summary.totalInvested + summary.totalUnrealizedPnl,
    cash: acct.cash,
    invested: summary.totalInvested,
    unrealizedPnl: summary.totalUnrealizedPnl,
    realizedPnl: acct.realizedPnl,
  });

  log.info({ snapshotId: snapshot.id, totalValue: snapshot.totalValue }, 'Portfolio snapshot taken');
}
