export interface Candle {
  readonly datetime: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface Quote {
  readonly symbol: string;
  readonly name: string;
  readonly exchange: string;
  readonly currency: string;
  readonly price: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly previousClose: number;
  readonly volume: number;
  readonly change: number;
  readonly changePercent: number;
  readonly timestamp: string;
}

export interface ApiUsage {
  readonly timestamp: string;
  readonly minuteUsed: number;
  readonly minuteLimit: number;
  readonly minuteRemaining: number;
  readonly dailyUsed: number;
  readonly dailyLimit: number;
  readonly dailyRemaining: number;
}

export type CandleInterval =
  | '1min'
  | '5min'
  | '15min'
  | '30min'
  | '45min'
  | '1h'
  | '2h'
  | '4h'
  | '1day'
  | '1week'
  | '1month';

export interface CandleRequestOptions {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly outputSize?: number;
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getCandles(
    symbol: string,
    interval: CandleInterval,
    options?: CandleRequestOptions,
  ): Promise<readonly Candle[]>;
  getApiUsage(): Promise<ApiUsage>;
}
