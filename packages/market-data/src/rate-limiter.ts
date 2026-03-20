export interface RateLimiterOptions {
  readonly rpm: number;
  readonly burst: number;
}

export interface RateLimiter {
  schedule<T>(fn: () => Promise<T>): Promise<T>;
}

interface QueueEntry {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { rpm, burst } = options;
  const minInterval = 60_000 / rpm;

  let lastDispatchTime = 0;
  let inFlight = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const queue: QueueEntry[] = [];

  function scheduleFlush(): void {
    if (timer !== null) return;
    if (queue.length === 0) return;

    const now = Date.now();
    const elapsed = now - lastDispatchTime;
    const delay = Math.max(0, minInterval - elapsed);

    timer = setTimeout(() => {
      timer = null;
      flush();
    }, delay);
  }

  function flush(): void {
    while (queue.length > 0 && inFlight < burst) {
      const entry = queue.shift()!;
      inFlight++;
      lastDispatchTime = Date.now();

      entry.fn().then(
        (value) => {
          inFlight--;
          entry.resolve(value);
          scheduleFlush();
        },
        (reason) => {
          inFlight--;
          entry.reject(reason);
          scheduleFlush();
        },
      );

      // Only dispatch one per interval — schedule next after delay
      if (queue.length > 0 && inFlight >= burst) {
        scheduleFlush();
        return;
      }
    }

    // If there are still items but we're at burst capacity, schedule
    if (queue.length > 0) {
      scheduleFlush();
    }
  }

  return {
    schedule<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        queue.push({
          fn: fn as () => Promise<unknown>,
          resolve: resolve as (value: unknown) => void,
          reject,
        });
        scheduleFlush();
      });
    },
  };
}
