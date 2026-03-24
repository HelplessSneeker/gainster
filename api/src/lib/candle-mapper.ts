import type { NewCandle } from '@gainster/db';

interface MarketCandle {
  readonly datetime: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export function mapToNewCandles(
  candles: readonly MarketCandle[],
  symbol: string,
  interval: string,
): NewCandle[] {
  return candles.map((c) => ({
    symbol,
    interval,
    datetime: c.datetime,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}
