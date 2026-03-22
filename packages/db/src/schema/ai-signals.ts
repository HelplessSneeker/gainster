import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const aiSignals = sqliteTable('ai_signals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbol: text('symbol').notNull(),
  modelSource: text('model_source').notNull(),
  modelName: text('model_name').notNull(),
  signal: text('signal').notNull(),
  confidence: real('confidence').notNull(),
  reasoning: text('reasoning').notNull(),
  promptHash: text('prompt_hash').notNull(),
  indicatorsSnapshot: text('indicators_snapshot').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  actedOn: integer('acted_on', { mode: 'boolean' }).notNull().default(false),
});

export type AiSignal = InferSelectModel<typeof aiSignals>;
export type NewAiSignal = InferInsertModel<typeof aiSignals>;
