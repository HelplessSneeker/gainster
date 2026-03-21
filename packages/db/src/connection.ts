import { resolve } from 'node:path';
import Database from 'better-sqlite3';

const DEFAULT_DB_PATH = 'gainster-db';

export interface ConnectionOptions {
  dbPath?: string;
}

export interface ConnectionResult {
  db: Database.Database;
  dbPath: string;
}

export function createConnection(options?: ConnectionOptions): ConnectionResult {
  const explicit = options?.dbPath;

  if (!explicit) {
    console.warn(
      `[db] WARNING: No dbPath provided — using default relative path '${DEFAULT_DB_PATH}'.` +
        ' Set GAINSTER_DB_PATH in .env or pass dbPath explicitly.',
    );
  }

  const raw = explicit ?? DEFAULT_DB_PATH;
  const dbPath = resolve(raw);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return { db, dbPath };
}
