import { readFileSync } from 'node:fs';
import { createTwelveDataProvider } from '../src/index.js';

// Load .env file if present
try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
  for (const line of env.split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]!] ??= match[2]!;
  }
} catch {
  // No .env file — rely on environment
}

const provider = createTwelveDataProvider();

console.log('Fetching API usage...');
const usage = await provider.getApiUsage();
console.log('API Usage:', usage);

console.log('\nFetching AAPL quote...');
const quote = await provider.getQuote('AAPL');
console.log('AAPL Quote:', quote);
