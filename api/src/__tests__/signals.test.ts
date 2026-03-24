import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestDb, createMockMarketData } from './helpers.js';
import { buildApp } from '../app.js';
import { aiSignals } from '@gainster/db/schema';

describe('/api/signals', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createTestDb>['db'];

  beforeAll(async () => {
    const testDb = createTestDb();
    db = testDb.db;
    const marketData = createMockMarketData();

    app = await buildApp({ db, marketData });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('empty state', () => {
    it('GET / returns empty list when no signals exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/signals',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('GET /:id returns 404 for non-existent signal', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/signals/99999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Signal not found');
    });

    it('GET /:id/trades returns 404 when signal does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/signals/99999/trades',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Signal not found');
    });
  });

  describe('with signals', () => {
    let signalId: number;

    beforeAll(() => {
      // Insert signals directly into the database since there's no POST endpoint
      const rows = db.insert(aiSignals).values([
        {
          symbol: 'AAPL',
          modelSource: 'openai',
          modelName: 'gpt-4',
          signal: 'buy',
          confidence: 0.85,
          reasoning: 'Strong momentum signals',
          promptHash: 'abc123',
          indicatorsSnapshot: '{}',
          actedOn: true,
        },
        {
          symbol: 'GOOG',
          modelSource: 'anthropic',
          modelName: 'claude-3',
          signal: 'hold',
          confidence: 0.6,
          reasoning: 'Mixed signals',
          promptHash: 'def456',
          indicatorsSnapshot: '{}',
          actedOn: false,
        },
        {
          symbol: 'AAPL',
          modelSource: 'openai',
          modelName: 'gpt-4',
          signal: 'sell',
          confidence: 0.75,
          reasoning: 'Overbought conditions',
          promptHash: 'ghi789',
          indicatorsSnapshot: '{}',
          actedOn: false,
        },
      ]).returning().all();
      signalId = rows[0]!.id;
    });

    it('GET / lists all signals', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/signals',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(3);
      expect(body.total).toBe(3);
    });

    it('GET / filters by symbol', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/signals?symbol=AAPL',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.every((s: { symbol: string }) => s.symbol === 'AAPL')).toBe(true);
      expect(body.data.length).toBe(2);
    });

    it('GET / filters by modelSource', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/signals?modelSource=anthropic',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(1);
      expect(body.data[0].modelSource).toBe('anthropic');
    });

    it('GET / filters by actedOn', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/signals?actedOn=true',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.every((s: { actedOn: boolean }) => s.actedOn === true)).toBe(true);
      expect(body.data.length).toBe(1);
    });

    it('GET / supports pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/signals?limit=2&offset=0',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(2);
      expect(body.total).toBe(3);
    });

    it('GET /:id returns signal by id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/signals/${signalId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(signalId);
      expect(body.symbol).toBe('AAPL');
      expect(body.modelSource).toBe('openai');
    });

    it('GET /:id/trades returns empty array when signal has no trades', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/signals/${signalId}/trades`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toEqual([]);
    });

    it('GET /:id/trades returns trades linked to a signal', async () => {
      // Create a trade linked to this signal
      await app.inject({
        method: 'POST',
        url: '/api/trades',
        payload: {
          symbol: 'AAPL',
          side: 'buy',
          quantity: 5,
          price: 150,
          executedAt: '2024-01-20T10:00:00Z',
          signalSource: 'ai',
          signalId,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/signals/${signalId}/trades`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.length).toBe(1);
      expect(body[0].signalId).toBe(signalId);
      expect(body[0].symbol).toBe('AAPL');
    });
  });
});
