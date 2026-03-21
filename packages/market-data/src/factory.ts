import { TwelveDataProvider } from './providers/twelvedata/client.js';
import type { TwelveDataProviderOptions } from './providers/twelvedata/client.js';

export function createTwelveDataProvider(
  config: TwelveDataProviderOptions,
): TwelveDataProvider {
  return new TwelveDataProvider(config);
}
