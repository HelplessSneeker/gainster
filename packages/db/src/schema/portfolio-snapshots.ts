import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const portfolioSnapshots = sqliteTable('portfolio_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  totalValue: real('total_value').notNull(),
  cash: real('cash').notNull(),
  invested: real('invested').notNull(),
  unrealizedPnl: real('unrealized_pnl').notNull(),
  realizedPnl: real('realized_pnl').notNull(),
}, (table) => [
  index('portfolio_snapshots_timestamp_idx').on(table.timestamp),
]);

export type PortfolioSnapshot = InferSelectModel<typeof portfolioSnapshots>;
export type NewPortfolioSnapshot = InferInsertModel<typeof portfolioSnapshots>;
