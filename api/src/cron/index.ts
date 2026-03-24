import type { DrizzleDb } from '@gainster/db';
import type { MarketDataProvider } from '@gainster/market-data';
import type { FastifyBaseLogger } from 'fastify';
import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { pollCandles } from './candle-poll.js';
import { takePortfolioSnapshot } from './portfolio-snapshot.js';

export interface CronConfig {
  db: DrizzleDb;
  marketData: MarketDataProvider;
  log: FastifyBaseLogger;
}

const tasks: ScheduledTask[] = [];

function guarded(name: string, log: FastifyBaseLogger, fn: () => Promise<void>): () => void {
  let running = false;
  return () => {
    if (running) {
      log.warn('Skipping %s — previous run still active', name);
      return;
    }
    running = true;
    fn().catch((err) => log.error({ err }, '%s failed', name)).finally(() => { running = false; });
  };
}

export function startCronJobs(config: CronConfig): void {
  const { log } = config;
  const timezone = 'Europe/Vienna';

  // Stop any existing tasks to prevent duplicates
  stopCronJobs();

  const candlePoll = cron.schedule(
    '*/5 15-22 * * 1-5',
    guarded('candle-poll', log, () => pollCandles(config)),
    { timezone },
  );
  tasks.push(candlePoll);

  const portfolioSnapshot = cron.schedule(
    '0 22 * * 1-5',
    guarded('portfolio-snapshot', log, () => takePortfolioSnapshot(config)),
    { timezone },
  );
  tasks.push(portfolioSnapshot);

  log.info('Cron jobs started (timezone: %s)', timezone);
}

export function stopCronJobs(): void {
  for (const task of tasks) {
    task.stop();
  }
  tasks.length = 0;
}
