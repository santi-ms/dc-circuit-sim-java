type Listener<T> = (event: T) => void;
type StatusPayload = {
    type: 'status';
    state: 'running' | 'done';
    scheduler: string;
    count: number;
};
type ResultPayload = {
    type: 'result';
    jobId: string;
    method: string;
    scheduler?: string;
    scenario?: string;
    elapsedMs: number;
    waitingMs?: number;
    turnaroundMs?: number;
    residual?: number;
    equations?: unknown;
    x: number[];
};
export type WsPayload = StatusPayload | ResultPayload;
export declare class WsClient {
    private socket;
    private shouldReconnect;
    private listeners;
    connect(): WebSocket | null;
    disconnect(): void;
    subscribe(listener: Listener<WsPayload>): () => boolean;
}
export declare const wsClient: WsClient;
export declare function connectWS(): WebSocket | null;
export {};
