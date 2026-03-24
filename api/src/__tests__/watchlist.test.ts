import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers.js';

describe('/api/watchlist', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('empty state', () => {
    it('GET / returns an empty array when no items exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/watchlist',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toEqual([]);
    });
  });

  describe('CRUD cycle', () => {
    let createdId: number;

    it('POST / creates a watchlist item and returns 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/watchlist',
        payload: {
          symbol: 'AAPL',
          exchange: 'NASDAQ',
          displayName: 'Apple Inc.',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.symbol).toBe('AAPL');
      expect(body.exchange).toBe('NASDAQ');
      expect(body.displayName).toBe('Apple Inc.');
      expect(body.isActive).toBe(true);
      expect(body.id).toBeDefined();
      createdId = body.id;
    });

    it('GET /:id returns the created item', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/watchlist/${createdId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(createdId);
      expect(body.symbol).toBe('AAPL');
    });

    it('GET / lists all items', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/watchlist',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /:id updates displayName', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/watchlist/${createdId}`,
        payload: { displayName: 'Apple Inc. Updated' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.displayName).toBe('Apple Inc. Updated');
      expect(body.id).toBe(createdId);
    });

    it('PATCH /:id updates isActive', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/watchlist/${createdId}`,
        payload: { isActive: false },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.isActive).toBe(false);
    });

    it('DELETE /:id deletes the item', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/watchlist/${createdId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.deleted).toBe(true);
    });

    it('GET /:id returns 404 after deletion', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/watchlist/${createdId}`,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Watchlist item not found');
      expect(body.statusCode).toBe(404);
    });
  });

  describe('filtering', () => {
    it('filters by active=true', async () => {
      // Create two items
      await app.inject({
        method: 'POST',
        url: '/api/watchlist',
        payload: { symbol: 'GOOG', exchange: 'NASDAQ', displayName: 'Alphabet' },
      });
      const msftResponse = await app.inject({
        method: 'POST',
        url: '/api/watchlist',
        payload: { symbol: 'MSFT', exchange: 'NASDAQ', displayName: 'Microsoft' },
      });
      const msftId = msftResponse.json().id;

      // Deactivate MSFT
      await app.inject({
        method: 'PATCH',
        url: `/api/watchlist/${msftId}`,
        payload: { isActive: false },
      });

      // Filter active only
      const activeResponse = await app.inject({
        method: 'GET',
        url: '/api/watchlist?active=true',
      });
      expect(activeResponse.statusCode).toBe(200);
      const activeItems = activeResponse.json();
      expect(activeItems.every((item: { isActive: boolean }) => item.isActive === true)).toBe(true);

      // Filter inactive only
      const inactiveResponse = await app.inject({
        method: 'GET',
        url: '/api/watchlist?active=false',
      });
      expect(inactiveResponse.statusCode).toBe(200);
      const inactiveItems = inactiveResponse.json();
      expect(inactiveItems.every((item: { isActive: boolean }) => item.isActive === false)).toBe(true);
      expect(inactiveItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('GET /:id with non-existent id returns 404', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/watchlist/99999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Watchlist item not found');
    });

    it('PATCH /:id with no fields returns 400 validation error', async () => {
      // Create an item first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/watchlist',
        payload: { symbol: 'TSLA', exchange: 'NASDAQ', displayName: 'Tesla' },
      });
      const id = createResponse.json().id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/watchlist/${id}`,
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe('Validation failed');
    });

    it('PATCH /:id with non-existent id returns 404', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/watchlist/99999',
        payload: { displayName: 'Nothing' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('DELETE /:id with non-existent id returns 404', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/watchlist/99999',
      });

      expect(response.statusCode).toBe(404);
    });

    it('rejects duplicate symbols with 409', async () => {
      const first = await app.inject({
        method: 'POST',
        url: '/api/watchlist',
        payload: { symbol: 'DUP', exchange: 'NYSE', displayName: 'Dup 1' },
      });
      const second = await app.inject({
        method: 'POST',
        url: '/api/watchlist',
        payload: { symbol: 'DUP', exchange: 'NYSE', displayName: 'Dup 2' },
      });

      expect(first.statusCode).toBe(201);
      expect(second.statusCode).toBe(409);
      expect(second.json().error).toContain('already on the watchlist');
    });

    it('POST / with missing required fields returns 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/watchlist',
        payload: { symbol: 'AAPL' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');
    });

    it('symbol is uppercased automatically', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/watchlist',
        payload: { symbol: 'aapl', exchange: 'NASDAQ', displayName: 'Apple' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().symbol).toBe('AAPL');
    });
  });
});
