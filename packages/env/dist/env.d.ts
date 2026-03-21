import type { Env } from './schema.js';
export type { Env };
/**
 * Loads the `.env` file (if present), validates `process.env` against
 * the schema, and returns a frozen, typed `Env` object.
 */
export declare function loadEnv(): Env;
//# sourceMappingURL=env.d.ts.map