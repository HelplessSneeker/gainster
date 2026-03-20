// Types
export type {
  ApiUsage,
  Candle,
  CandleInterval,
  CandleRequestOptions,
  MarketDataProvider,
  Quote,
} from './types.js';

// Errors
export { MarketDataError, ProviderApiError, RateLimitExceededError } from './errors.js';

// Rate limiter
export { createRateLimiter } from './rate-limiter.js';
export type { RateLimiter, RateLimiterOptions } from './rate-limiter.js';

// Twelve Data provider
export { TwelveDataProvider } from './providers/twelvedata/index.js';
export type { TwelveDataProviderOptions } from './providers/twelvedata/index.js';
export { isTwelveDataError, mapApiUsage, mapCandles, mapQuote } from './providers/twelvedata/index.js';

// Factory
export { createTwelveDataProvider } from './factory.js';
