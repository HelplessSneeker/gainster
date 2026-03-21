import { loadEnv } from '@gainster/env';
import { createDb } from '../src/index.js';
import { migrate } from '../src/migrate.js';

const env = loadEnv();
const { db, dbPath } = createDb({ dbPath: env.GAINSTER_DB_PATH });
migrate(db);
console.log(`Migrations applied successfully. Database: ${dbPath}`);
