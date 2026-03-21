import { loadEnv } from '@gainster/env';
import { createTwelveDataProvider } from '../src/index.js';

const env = loadEnv();

const provider = createTwelveDataProvider({
  apiKey: env.TWELVEDATA_API_KEY,
  rpm: env.TWELVEDATA_RPM,
  burst: env.TWELVEDATA_BURST,
});

console.log('Fetching API usage...');
const usage = await provider.getApiUsage();
console.log('API Usage:', usage);

console.log('\nFetching AAPL quote...');
const quote = await provider.getQuote('AAPL');
console.log('AAPL Quote:', quote);
