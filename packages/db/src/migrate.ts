import { migrate as drizzleMigrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { DrizzleDb } from './client.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function migrate(db: DrizzleDb): void {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(currentDir, '..', 'drizzle');
  drizzleMigrate(db, { migrationsFolder });
}
