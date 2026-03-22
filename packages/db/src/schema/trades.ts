import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { aiSignals } from './ai-signals.js';

export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbol: text('symbol').notNull(),
  side: text('side').notNull(),
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
  executedAt: text('executed_at').notNull(),
  signalId: integer('signal_id').references(() => aiSignals.id),
  signalSource: text('signal_source').notNull(),
  notes: text('notes'),
});

export type Trade = InferSelectModel<typeof trades>;
export type NewTrade = InferInsertModel<typeof trades>;
