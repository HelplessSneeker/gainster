import { TwelveDataProvider } from './providers/twelvedata/client.js';

export function createTwelveDataProvider(): TwelveDataProvider {
  const apiKey = process.env['TWELVEDATA_API_KEY'];
  if (!apiKey) {
    throw new Error('TWELVEDATA_API_KEY environment variable is required');
  }

  const rpm = Number(process.env['TWELVEDATA_RPM'] || '8');
  const burst = Number(process.env['TWELVEDATA_BURST'] || '1');

  return new TwelveDataProvider({ apiKey, rpm, burst });
}
