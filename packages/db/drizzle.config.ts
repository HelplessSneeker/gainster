import { loadEnv } from '@gainster/env';
import { defineConfig } from 'drizzle-kit';

const env = loadEnv();

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.GAINSTER_DB_PATH,
  },
});
