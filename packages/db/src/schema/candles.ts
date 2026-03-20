import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const candles = sqliteTable('candles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbol: text('symbol').notNull(),
  interval: text('interval').notNull(),
  datetime: text('datetime').notNull(),
  open: real('open').notNull(),
  high: real('high').notNull(),
  low: real('low').notNull(),
  close: real('close').notNull(),
  volume: integer('volume').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex('candles_symbol_interval_datetime_idx').on(table.symbol, table.interval, table.datetime),
]);

export type Candle = InferSelectModel<typeof candles>;
export type NewCandle = InferInsertModel<typeof candles>;
