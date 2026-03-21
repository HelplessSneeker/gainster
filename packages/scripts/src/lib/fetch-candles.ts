import type { CandleInterval, Candle, MarketDataProvider } from '@gainster/market-data';

export async function fetchCandles(
  provider: MarketDataProvider,
  symbol: string,
  interval: CandleInterval,
): Promise<readonly Candle[]> {
  return provider.getCandles(symbol, interval, { outputSize: 5000 });
}
