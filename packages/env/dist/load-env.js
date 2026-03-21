import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Walk up from this file until we find `pnpm-workspace.yaml`,
 * which marks the monorepo root.
 */
function findRootEnv() {
    let dir = dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 10; i++) {
        if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
            return resolve(dir, '.env');
        }
        const parent = dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return undefined;
}
/**
 * Reads a `.env` file and sets any missing keys on `process.env`.
 * Uses `??=` so existing env vars are never overwritten.
 */
export function loadEnvFile() {
    const envPath = findRootEnv();
    if (!envPath)
        return;
    let content;
    try {
        content = readFileSync(envPath, 'utf-8');
    }
    catch {
        return;
    }
    for (const line of content.split('\n')) {
        const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
        if (match) {
            const key = match[1];
            const value = match[2];
            process.env[key] ??= value;
        }
    }
}
//# sourceMappingURL=load-env.js.map