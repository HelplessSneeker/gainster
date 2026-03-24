import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers.js';

describe('/api/positions', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('empty state', () => {
    it('GET / returns empty array when no positions exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/positions',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toEqual([]);
    });

    it('GET /summary returns zero summary when no positions exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/positions/summary',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.totalInvested).toBe(0);
      expect(body.totalUnrealizedPnl).toBe(0);
      expect(body.positionCount).toBe(0);
    });

    it('GET /:symbol returns 404 for non-existent position', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/positions/ZZZZ',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Position not found');
    });
  });

  describe('after trades', () => {
    beforeAll(async () => {
      // Create buy trades to establish positions
      await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: {
          symbol: 'AAPL',
          side: 'buy',
          quantity: 10,
          price: 150,
          executedAt: '2024-01-15T10:00:00Z',
          signalSource: 'manual',
        },
      });

      await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: {
          symbol: 'GOOG',
          side: 'buy',
          quantity: 5,
          price: 140,
          executedAt: '2024-01-15T11:00:00Z',
          signalSource: 'manual',
        },
      });
    });

    it('GET / lists all positions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/positions',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.length).toBe(2);
      const symbols = body.map((p: { symbol: string }) => p.symbol);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('GOOG');
    });

    it('GET /:symbol returns position details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/positions/AAPL',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.symbol).toBe('AAPL');
      expect(body.quantity).toBe(10);
      expect(body.avgEntryPrice).toBe(150);
    });

    it('GET /:symbol is case-insensitive (uppercased)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/positions/aapl',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().symbol).toBe('AAPL');
    });

    it('GET /summary returns correct aggregate values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/positions/summary',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      // AAPL: 10 * 150 = 1500, GOOG: 5 * 140 = 700
      expect(body.totalInvested).toBe(2200);
      expect(body.positionCount).toBe(2);
    });
  });
});
