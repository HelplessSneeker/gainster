import { getCandleDatetimes } from '@gainster/db';
import type { DrizzleDb } from '@gainster/db';
import type { CandleInterval } from '@gainster/market-data';
import * as log from './log.js';

const INTRADAY_INTERVALS: readonly string[] = [
  '1min', '5min', '15min', '30min', '45min', '1h', '2h', '4h',
];

const INTERVAL_MINUTES: Record<string, number> = {
  '1min': 1,
  '5min': 5,
  '15min': 15,
  '30min': 30,
  '45min': 45,
  '1h': 60,
  '2h': 120,
  '4h': 240,
};

const easternFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
});

function isMarketHours(utcDate: Date): boolean {
  const parts = easternFormat.formatToParts(utcDate);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const totalMinutes = hour * 60 + minute;
  return totalMinutes >= 570 && totalMinutes < 960; // 9:30 - 16:00
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function detectGaps(
  db: DrizzleDb,
  symbol: string,
  interval: CandleInterval,
): void {
  if (!INTRADAY_INTERVALS.includes(interval)) {
    return;
  }

  const expectedMinutes = INTERVAL_MINUTES[interval];
  if (expectedMinutes === undefined) {
    return;
  }

  const datetimes = getCandleDatetimes(db, symbol, interval);

  if (datetimes.length < 2) {
    return;
  }

  let gapCount = 0;

  for (let i = 1; i < datetimes.length; i++) {
    const prevDt = datetimes[i - 1]!;
    const currDt = datetimes[i]!;

    const prevDate = new Date(prevDt);
    const currDate = new Date(currDt);

    // Skip gaps across different calendar days (overnight/weekend)
    if (!sameCalendarDay(prevDate, currDate)) {
      continue;
    }

    // Only flag gaps where both endpoints are in market hours
    if (!isMarketHours(prevDate) || !isMarketHours(currDate)) {
      continue;
    }

    const diffMinutes = (currDate.getTime() - prevDate.getTime()) / (60 * 1000);
    // Allow 50% tolerance for irregular spacing
    if (diffMinutes > expectedMinutes * 1.5) {
      gapCount++;
      if (gapCount <= 10) {
        log.warn(
          `Gap: ${prevDt} → ${currDt} (${Math.round(diffMinutes)}min, expected ${expectedMinutes}min)`,
        );
      }
    }
  }

  if (gapCount > 10) {
    log.warn(`... and ${gapCount - 10} more gaps`);
  }

  if (gapCount > 0) {
    log.warn(`${symbol} ${interval}: ${gapCount} gap(s) detected during market hours`);
  }
}
