import { parseArgs } from 'node:util';
import type { CandleInterval } from '@gainster/market-data';

const VALID_INTERVALS: readonly string[] = [
  '1min', '5min', '15min', '30min', '45min',
  '1h', '2h', '4h',
  '1day', '1week', '1month',
];

export interface BackfillArgs {
  readonly symbol: string | undefined;
  readonly interval: CandleInterval;
}

export function parseBackfillArgs(): BackfillArgs {
  // Strip leading '--' separators injected by pnpm when forwarding args
  const args = process.argv.slice(2).filter((a) => a !== '--');

  const { values } = parseArgs({
    args,
    options: {
      symbol: { type: 'string', short: 's' },
      interval: { type: 'string', short: 'i', default: '5min' },
    },
    strict: true,
  });

  const interval = values.interval ?? '5min';

  if (!VALID_INTERVALS.includes(interval)) {
    throw new Error(
      `Invalid interval "${interval}". Valid: ${VALID_INTERVALS.join(', ')}`,
    );
  }

  return {
    symbol: values.symbol,
    interval: interval as CandleInterval,
  };
}
