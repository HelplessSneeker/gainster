import { z } from 'zod';
import { symbolSchema, booleanQueryParam } from '../../lib/schemas.js';

export const createWatchlistSchema = z.object({
  symbol: symbolSchema,
  exchange: z.string().min(1),
  displayName: z.string().min(1),
});

export const updateWatchlistSchema = z
  .object({
    displayName: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.displayName !== undefined || data.isActive !== undefined, {
    message: 'At least one field (displayName or isActive) must be provided',
  });

export const listWatchlistQuerySchema = z.object({
  active: booleanQueryParam,
});
