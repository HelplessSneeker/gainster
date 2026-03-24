import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers.js';

describe('/api/portfolio', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('empty state', () => {
    it('GET /current returns 404 when no snapshots exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/portfolio/current',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('No snapshots found');
    });

    it('GET /snapshots returns empty list when no snapshots exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/portfolio/snapshots',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe('snapshot creation and retrieval', () => {
    it('POST /snapshots creates a snapshot from current positions (empty)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/portfolio/snapshots',
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBeDefined();
      expect(body.timestamp).toBeDefined();
      expect(body.totalValue).toBe(100_000);
      expect(body.cash).toBe(100_000);
      expect(body.invested).toBe(0);
      expect(body.realizedPnl).toBe(0);
    });

    it('GET /current returns the latest snapshot', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/portfolio/current',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });

    it('GET /snapshots lists all snapshots', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/portfolio/snapshots',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(1);
      expect(body.total).toBe(1);
    });
  });

  describe('with positions', () => {
    beforeAll(async () => {
      // Create a buy trade to establish a position
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
    });

    it('POST /snapshots reflects current position values', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/portfolio/snapshots',
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      // AAPL: 10 shares at $150 = $1500 invested
      // Cash: $100,000 - $1,500 = $98,500
      // Total: $98,500 + $1,500 = $100,000
      expect(body.invested).toBe(1500);
      expect(body.cash).toBe(98_500);
      expect(body.totalValue).toBe(100_000);
    });

    it('GET /current returns the most recent snapshot', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/portfolio/current',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.invested).toBe(1500);
    });

    it('GET /snapshots supports pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/portfolio/snapshots?limit=1&offset=0',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(1);
      expect(body.total).toBe(2); // Two snapshots created total
    });

    it('GET /snapshots supports date range filtering', async () => {
      // Use a date range that won't match any snapshots
      const response = await app.inject({
        method: 'GET',
        url: '/api/portfolio/snapshots?startDate=2020-01-01&endDate=2020-12-31',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });
  });
});
