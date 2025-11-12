export declare const api: {
    get: <T>(url: string) => Promise<T>;
    post: <T>(url: string, payload: unknown) => Promise<T>;
};
export type SolveResult = {
    jobId: string;
    method: string;
    elapsedMs: number;
    x: number[];
};
export type SolveResponse = {
    ok: boolean;
    results: SolveResult[];
};
export type MetricsResponse = {
    totalJobs: number;
    avgElapsedMs: number;
    avgCpuPct: number;
    avgMemMb: number;
    byMethod: Record<string, {
        count: number;
        avgElapsedMs: number;
        avgCpuPct: number;
        avgMemMb: number;
    }>;
    byScenario: Record<string, {
        count: number;
        avgElapsedMs: number;
        avgCpuPct: number;
        avgMemMb: number;
    }>;
};
export declare const fetchJobsCsv: () => Promise<string>;
