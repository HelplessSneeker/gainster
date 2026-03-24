import { z } from 'zod';

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  statusCode: z.number(),
  details: z.unknown().optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const symbolSchema = z.string().min(1).max(10).toUpperCase();

export const symbolParamSchema = z.object({
  symbol: symbolSchema,
});

export const dateRangeSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const candleIntervalSchema = z.enum([
  '1min', '5min', '15min', '30min', '45min',
  '1h', '2h', '4h',
  '1day', '1week', '1month',
]);

export const booleanQueryParam = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

export type Pagination = z.infer<typeof paginationSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type CandleIntervalParam = z.infer<typeof candleIntervalSchema>;
