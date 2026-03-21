function timestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

export function info(message: string): void {
  console.log(`[${timestamp()}] ${message}`);
}

export function warn(message: string): void {
  console.warn(`[${timestamp()}] ⚠ ${message}`);
}

export function error(message: string): void {
  console.error(`[${timestamp()}] ✗ ${message}`);
}

export function success(message: string): void {
  console.log(`[${timestamp()}] ✓ ${message}`);
}
