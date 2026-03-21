import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createConnection } from './connection.js';
import type { ConnectionOptions } from './connection.js';
import * as schema from './schema/index.js';

export type DrizzleDb = BetterSQLite3Database<typeof schema>;

export interface CreateDbResult {
  db: DrizzleDb;
  dbPath: string;
}

export function createDb(options?: ConnectionOptions): CreateDbResult {
  const { db: connection, dbPath } = createConnection(options);
  const db = drizzle(connection, { schema });
  return { db, dbPath };
}
