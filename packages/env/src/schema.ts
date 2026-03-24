import { z } from 'zod';

export const envSchema = z.object({
  TWELVEDATA_API_KEY: z.string().min(1),
  TWELVEDATA_RPM: z.coerce.number().int().positive().default(8),
  TWELVEDATA_BURST: z.coerce.number().int().positive().default(1),
  GAINSTER_DB_PATH: z.string().default('gainster-db'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  INITIAL_CASH: z.coerce.number().positive().default(100_000),
});

export type Env = z.infer<typeof envSchema>;
