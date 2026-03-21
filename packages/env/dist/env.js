import { loadEnvFile } from './load-env.js';
import { envSchema } from './schema.js';
/**
 * Loads the `.env` file (if present), validates `process.env` against
 * the schema, and returns a frozen, typed `Env` object.
 */
export function loadEnv() {
    loadEnvFile();
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const formatted = result.error.issues
            .map((i) => `  ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(`Environment validation failed:\n${formatted}`);
    }
    return Object.freeze(result.data);
}
//# sourceMappingURL=env.js.map