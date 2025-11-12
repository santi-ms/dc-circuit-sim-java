type ResultCardProps = {
    method: string;
    elapsedMs?: number;
    vector?: number[];
    state: 'idle' | 'running' | 'done';
};
export declare function ResultCard({ method, elapsedMs, vector, state }: ResultCardProps): import("react/jsx-runtime").JSX.Element;
export {};
