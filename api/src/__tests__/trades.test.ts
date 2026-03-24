import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers.js';

function makeTrade(overrides: Record<string, unknown> = {}) {
  return {
    symbol: 'AAPL',
    side: 'buy',
    quantity: 10,
    price: 150,
    executedAt: '2024-01-15T10:00:00Z',
    signalSource: 'manual',
    ...overrides,
  };
}

describe('/api/trades', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST / - buy trades', () => {
    it('creates a buy trade and returns 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: makeTrade(),
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.symbol).toBe('AAPL');
      expect(body.side).toBe('buy');
      expect(body.quantity).toBe(10);
      expect(body.price).toBe(150);
      expect(body.id).toBeDefined();
    });

    it('creates a position on first buy', async () => {
      const posResponse = await app.inject({
        method: 'GET',
        url: '/api/positions/AAPL',
      });

      expect(posResponse.statusCode).toBe(200);
      const pos = posResponse.json();
      expect(pos.symbol).toBe('AAPL');
      expect(pos.quantity).toBe(10);
      expect(pos.avgEntryPrice).toBe(150);
    });

    it('updates position with weighted average on second buy', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: makeTrade({ quantity: 10, price: 160, executedAt: '2024-01-16T10:00:00Z' }),
      });

      const posResponse = await app.inject({
        method: 'GET',
        url: '/api/positions/AAPL',
      });

      const pos = posResponse.json();
      expect(pos.quantity).toBe(20);
      // Weighted average: (10*150 + 10*160) / 20 = 155
      expect(pos.avgEntryPrice).toBe(155);
    });
  });

  describe('POST / - sell trades', () => {
    it('creates a sell trade and reduces position', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: makeTrade({
          side: 'sell',
          quantity: 5,
          price: 170,
          executedAt: '2024-01-17T10:00:00Z',
        }),
      });

      expect(response.statusCode).toBe(201);

      const posResponse = await app.inject({
        method: 'GET',
        url: '/api/positions/AAPL',
      });

      const pos = posResponse.json();
      expect(pos.quantity).toBe(15);
      // Average entry price should remain 155
      expect(pos.avgEntryPrice).toBe(155);
      // Unrealized PnL = (170 - 155) * 15 = 225
      expect(pos.unrealizedPnl).toBe(225);
    });

    it('returns 422 when selling more shares than held', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: makeTrade({
          side: 'sell',
          quantity: 100,
          price: 170,
          executedAt: '2024-01-18T10:00:00Z',
        }),
      });

      expect(response.statusCode).toBe(422);
      const body = response.json();
      expect(body.error).toContain('Cannot sell 100 shares');
      expect(body.error).toContain('only 15 held');
    });

    it('returns 422 when selling with no position at all', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: makeTrade({
          symbol: 'ZZZZ',
          side: 'sell',
          quantity: 1,
          price: 50,
          executedAt: '2024-01-18T10:00:00Z',
        }),
      });

      expect(response.statusCode).toBe(422);
      const body = response.json();
      expect(body.error).toContain('Cannot sell 1 shares');
      expect(body.error).toContain('only 0 held');
    });
  });

  describe('POST / - signal validation', () => {
    it('returns 400 when signalId references a non-existent signal', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: makeTrade({
          signalId: 99999,
          signalSource: 'ai',
          executedAt: '2024-01-19T10:00:00Z',
        }),
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Signal not found');
    });
  });

  describe('GET / - list trades', () => {
    it('returns paginated trades', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/trades',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.total).toBeDefined();
      expect(body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('filters by symbol', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/trades?symbol=AAPL',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.every((t: { symbol: string }) => t.symbol === 'AAPL')).toBe(true);
    });

    it('filters by side', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/trades?side=buy',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.every((t: { side: string }) => t.side === 'buy')).toBe(true);
    });

    it('supports pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/trades?limit=1&offset=0',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(1);
      expect(body.total).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GET /:id', () => {
    it('returns a trade by id', async () => {
      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/trades?limit=1',
      });
      const tradeId = listResponse.json().data[0].id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/trades/${tradeId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().id).toBe(tradeId);
    });

    it('returns 404 for non-existent trade', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/trades/99999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Trade not found');
    });
  });

  describe('validation', () => {
    it('returns 400 for missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: { symbol: 'AAPL' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');
    });

    it('returns 400 for invalid side value', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: makeTrade({ side: 'hold' }),
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');
    });

    it('returns 400 for negative quantity', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: makeTrade({ quantity: -5 }),
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');
    });

    it('returns 400 for invalid executedAt datetime', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: makeTrade({ executedAt: 'not-a-date' }),
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');
    });
  });
});
