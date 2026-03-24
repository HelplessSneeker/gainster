import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const account = sqliteTable('account', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cash: real('cash').notNull(),
  realizedPnl: real('realized_pnl').notNull().default(0),
  initialCash: real('initial_cash').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type Account = InferSelectModel<typeof account>;
export type NewAccount = InferInsertModel<typeof account>;
