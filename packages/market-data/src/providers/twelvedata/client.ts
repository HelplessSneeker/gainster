import { ProviderApiError } from '../../errors.js';
import { createRateLimiter } from '../../rate-limiter.js';
import type { RateLimiter } from '../../rate-limiter.js';
import type {
  ApiUsage,
  Candle,
  CandleInterval,
  CandleRequestOptions,
  MarketDataProvider,
  Quote,
} from '../../types.js';
import { isTwelveDataError, mapApiUsage, mapCandles, mapQuote } from './mapper.js';

export interface TwelveDataProviderOptions {
  readonly apiKey: string;
  readonly rpm?: number;
  readonly burst?: number;
  readonly baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.twelvedata.com';

export class TwelveDataProvider implements MarketDataProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly limiter: RateLimiter;

  constructor(options: TwelveDataProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.limiter = createRateLimiter({
      rpm: options.rpm ?? 8,
      burst: options.burst ?? 1,
    });
  }

  async getQuote(symbol: string): Promise<Quote> {
    const data = await this.request('/quote', { symbol });
    return mapQuote(data);
  }

  async getCandles(
    symbol: string,
    interval: CandleInterval,
    options?: CandleRequestOptions,
  ): Promise<readonly Candle[]> {
    const params: Record<string, string> = { symbol, interval };
    if (options?.startDate !== undefined) params['start_date'] = options.startDate;
    if (options?.endDate !== undefined) params['end_date'] = options.endDate;
    if (options?.outputSize !== undefined) params['outputsize'] = String(options.outputSize);

    const data = await this.request('/time_series', params);
    return mapCandles(data);
  }

  async getApiUsage(): Promise<ApiUsage> {
    const data = await this.request('/api_usage', {});
    return mapApiUsage(data);
  }

  private async request(
    path: string,
    params: Record<string, string>,
  ): Promise<unknown> {
    const url = new URL(path, this.baseUrl);
    url.searchParams.set('apikey', this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return this.limiter.schedule(async () => {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new ProviderApiError(
          `Twelve Data API returned HTTP ${String(response.status)}`,
          response.status,
          String(response.status),
        );
      }

      const body: unknown = await response.json();

      if (isTwelveDataError(body)) {
        throw new ProviderApiError(
          body.message,
          200,
          String(body.code),
        );
      }

      return body;
    });
  }
}
