import { z } from 'zod';
import { paginationSchema, booleanQueryParam } from '../../lib/schemas.js';

export const listSignalsQuerySchema = z
  .object({
    symbol: z.string().toUpperCase().optional(),
    modelSource: z.string().optional(),
    actedOn: booleanQueryParam,
  })
  .merge(paginationSchema);
