export class MarketDataError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'MarketDataError';
    this.code = code;
  }
}

export class RateLimitExceededError extends MarketDataError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitExceededError';
  }
}

export class ProviderApiError extends MarketDataError {
  readonly statusCode: number;
  readonly providerCode: string;

  constructor(message: string, statusCode: number, providerCode: string) {
    super(message, 'PROVIDER_API_ERROR');
    this.name = 'ProviderApiError';
    this.statusCode = statusCode;
    this.providerCode = providerCode;
  }
}
