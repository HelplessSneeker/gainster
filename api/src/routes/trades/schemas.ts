import { z } from 'zod';
import { symbolSchema, paginationSchema } from '../../lib/schemas.js';

export const createTradeSchema = z.object({
  symbol: symbolSchema,
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive(),
  price: z.number().positive(),
  executedAt: z.string().datetime(),
  signalId: z.number().int().positive().optional(),
  signalSource: z.enum(['manual', 'ai']),
  notes: z.string().optional(),
});

export const listTradesQuerySchema = z
  .object({
    symbol: z.string().toUpperCase().optional(),
    side: z.enum(['buy', 'sell']).optional(),
  })
  .merge(paginationSchema);
