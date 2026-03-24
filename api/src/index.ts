import { createDb, migrate, ensureAccount } from '@gainster/db';
import { loadEnv } from '@gainster/env';
import { createTwelveDataProvider } from '@gainster/market-data';
import { buildApp } from './app.js';
import { startCronJobs, stopCronJobs } from './cron/index.js';

const env = loadEnv();

const { db } = createDb({ dbPath: env.GAINSTER_DB_PATH });
migrate(db);
ensureAccount(db, env.INITIAL_CASH);

const marketData = createTwelveDataProvider({
  apiKey: env.TWELVEDATA_API_KEY,
  rpm: env.TWELVEDATA_RPM,
  burst: env.TWELVEDATA_BURST,
});

const app = await buildApp({ db, marketData });

startCronJobs({ db, marketData, log: app.log });

const port = env.API_PORT;
await app.listen({ port, host: '0.0.0.0' });

function shutdown() {
  app.log.info('Shutting down...');
  stopCronJobs();
  app.close().then(() => process.exit(0), () => process.exit(1));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
