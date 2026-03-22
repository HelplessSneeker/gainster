import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const positions = sqliteTable('positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbol: text('symbol').notNull(),
  quantity: real('quantity').notNull(),
  avgEntryPrice: real('avg_entry_price').notNull(),
  currentPrice: real('current_price').notNull(),
  unrealizedPnl: real('unrealized_pnl').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex('positions_symbol_idx').on(table.symbol),
]);

export type Position = InferSelectModel<typeof positions>;
export type NewPosition = InferInsertModel<typeof positions>;
