import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MarketDataProvider } from '@gainster/market-data';
import { RateLimitExceededError, MarketDataError } from '@gainster/market-data';
import { createTestApp, createMockMarketData } from './helpers.js';

describe('/api/candles', () => {
  let app: FastifyInstance;
  let mockMarketData: MarketDataProvider;

  beforeAll(async () => {
    mockMarketData = createMockMarketData();
    app = await createTestApp({ marketData: mockMarketData });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /intervals', () => {
    it('returns an array of interval strings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/candles/intervals',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toContain('1day');
      expect(body).toContain('1min');
      expect(body).toContain('1h');
      expect(body).toContain('1week');
      expect(body).toContain('1month');
    });
  });

  describe('POST /backfill', () => {
    it('calls marketData provider and inserts candles', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/candles/backfill',
        payload: {
          symbol: 'AAPL',
          interval: '1day',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.inserted).toBe(2);
      expect(body.skipped).toBe(0);
    });

    it('skips already-existing candles on repeat backfill', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/candles/backfill',
        payload: {
          symbol: 'AAPL',
          interval: '1day',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.inserted).toBe(0);
      expect(body.skipped).toBe(2);
    });

    it('returns 400 for invalid interval', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/candles/backfill',
        payload: {
          symbol: 'AAPL',
          interval: 'invalid',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');
    });
  });

  describe('GET /:symbol', () => {
    it('returns candles with pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/candles/AAPL?interval=1day',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.total).toBeDefined();
      expect(body.data.length).toBe(2);
      expect(body.total).toBe(2);
    });

    it('returns empty result for symbol with no candles', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/candles/ZZZZ?interval=1day',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('supports pagination with limit and offset', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/candles/AAPL?interval=1day&limit=1&offset=0',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(1);
      expect(body.total).toBe(2);

      // Second page
      const page2 = await app.inject({
        method: 'GET',
        url: '/api/candles/AAPL?interval=1day&limit=1&offset=1',
      });
      const body2 = page2.json();
      expect(body2.data.length).toBe(1);
      expect(body2.data[0].datetime).not.toBe(body.data[0].datetime);
    });

    it('supports date range filtering', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/candles/AAPL?interval=1day&startDate=2024-01-02&endDate=2024-01-02',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(1);
      expect(body.data[0].datetime).toBe('2024-01-02');
    });

    it('symbol is case-insensitive (uppercased)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/candles/aapl?interval=1day',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(2);
    });
  });

  describe('error handling', () => {
    it('returns 429 when marketData throws RateLimitExceededError', async () => {
      const rateLimitedMarketData: MarketDataProvider = {
        ...createMockMarketData(),
        getCandles: async () => {
          throw new RateLimitExceededError('Too many requests');
        },
      };

      const errorApp = await createTestApp({ marketData: rateLimitedMarketData });

      const response = await errorApp.inject({
        method: 'POST',
        url: '/api/candles/backfill',
        payload: { symbol: 'AAPL', interval: '1day' },
      });

      expect(response.statusCode).toBe(429);
      expect(response.json().statusCode).toBe(429);

      await errorApp.close();
    });

    it('returns 502 when marketData throws MarketDataError', async () => {
      const brokenMarketData: MarketDataProvider = {
        ...createMockMarketData(),
        getCandles: async () => {
          throw new MarketDataError('Upstream provider failure', 'PROVIDER_ERROR');
        },
      };

      const errorApp = await createTestApp({ marketData: brokenMarketData });

      const response = await errorApp.inject({
        method: 'POST',
        url: '/api/candles/backfill',
        payload: { symbol: 'AAPL', interval: '1day' },
      });

      expect(response.statusCode).toBe(502);
      expect(response.json().statusCode).toBe(502);

      await errorApp.close();
    });
  });
});
