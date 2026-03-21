import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    TWELVEDATA_API_KEY: z.ZodString;
    TWELVEDATA_RPM: z.ZodDefault<z.ZodNumber>;
    TWELVEDATA_BURST: z.ZodDefault<z.ZodNumber>;
    GAINSTER_DB_PATH: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    TWELVEDATA_API_KEY: string;
    TWELVEDATA_RPM: number;
    TWELVEDATA_BURST: number;
    GAINSTER_DB_PATH: string;
}, {
    TWELVEDATA_API_KEY: string;
    TWELVEDATA_RPM?: number | undefined;
    TWELVEDATA_BURST?: number | undefined;
    GAINSTER_DB_PATH?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
//# sourceMappingURL=schema.d.ts.map