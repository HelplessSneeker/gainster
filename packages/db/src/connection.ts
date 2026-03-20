import Database from 'better-sqlite3';

export interface ConnectionOptions {
  dbPath?: string;
}

export function createConnection(options?: ConnectionOptions): Database.Database {
  const dbPath = options?.dbPath ?? process.env['GAINSTER_DB_PATH'] ?? 'gainster-db';
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}
