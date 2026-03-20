import { createDb } from '../src/index.js';
import { migrate } from '../src/migrate.js';

const db = createDb();
migrate(db);
console.log('Migrations applied successfully.');
