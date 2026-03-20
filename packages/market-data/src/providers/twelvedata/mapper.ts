import type { ApiUsage, Candle, Quote } from '../../types.js';

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an object`);
  }
}

function toNumber(value: unknown, field: string): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new Error(`Expected ${field} to be a finite number, got "${value}"`);
    }
    return n;
  }
  throw new Error(`Expected ${field} to be a number or numeric string, got ${typeof value}`);
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected ${field} to be a string, got ${typeof value}`);
  }
  return value;
}

export function isTwelveDataError(
  raw: unknown,
): raw is { status: 'error'; code: number; message: string } {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return obj['status'] === 'error' && typeof obj['code'] === 'number' && typeof obj['message'] === 'string';
}

export function mapQuote(raw: unknown): Quote {
  assertObject(raw, 'quote response');

  return {
    symbol: asString(raw['symbol'], 'symbol'),
    name: asString(raw['name'], 'name'),
    exchange: asString(raw['exchange'], 'exchange'),
    currency: asString(raw['currency'], 'currency'),
    price: toNumber(raw['close'], 'close'),
    open: toNumber(raw['open'], 'open'),
    high: toNumber(raw['high'], 'high'),
    low: toNumber(raw['low'], 'low'),
    previousClose: toNumber(raw['previous_close'], 'previous_close'),
    volume: toNumber(raw['volume'], 'volume'),
    change: toNumber(raw['change'], 'change'),
    changePercent: toNumber(raw['percent_change'], 'percent_change'),
    timestamp: asString(raw['datetime'], 'datetime'),
  };
}

export function mapCandles(raw: unknown): readonly Candle[] {
  assertObject(raw, 'time_series response');

  const values = raw['values'];
  if (!Array.isArray(values)) {
    throw new Error('Expected time_series response to have a "values" array');
  }

  return values.map((item: unknown, i: number) => {
    assertObject(item, `values[${String(i)}]`);
    return {
      datetime: asString(item['datetime'], `values[${String(i)}].datetime`),
      open: toNumber(item['open'], `values[${String(i)}].open`),
      high: toNumber(item['high'], `values[${String(i)}].high`),
      low: toNumber(item['low'], `values[${String(i)}].low`),
      close: toNumber(item['close'], `values[${String(i)}].close`),
      volume: toNumber(item['volume'], `values[${String(i)}].volume`),
    };
  });
}

export function mapApiUsage(raw: unknown): ApiUsage {
  assertObject(raw, 'api_usage response');

  const minuteUsed = toNumber(raw['current_usage'], 'current_usage');
  const minuteLimit = toNumber(raw['plan_limit'], 'plan_limit');
  const dailyUsed = toNumber(raw['daily_usage'], 'daily_usage');
  const dailyLimit = toNumber(raw['plan_daily_limit'], 'plan_daily_limit');

  return {
    timestamp: asString(raw['timestamp'], 'timestamp'),
    minuteUsed,
    minuteLimit,
    minuteRemaining: minuteLimit - minuteUsed,
    dailyUsed,
    dailyLimit,
    dailyRemaining: dailyLimit - dailyUsed,
  };
}
