import { z } from 'zod';
import { symbolSchema, candleIntervalSchema, paginationSchema, dateRangeSchema } from '../../lib/schemas.js';

export const getCandlesParamSchema = z.object({
  symbol: symbolSchema,
});

export const getCandlesQuerySchema = z
  .object({
    interval: candleIntervalSchema,
  })
  .merge(dateRangeSchema)
  .merge(paginationSchema);

export const backfillBodySchema = z.object({
  symbol: symbolSchema,
  interval: candleIntervalSchema,
});
