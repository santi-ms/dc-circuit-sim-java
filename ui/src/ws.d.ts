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
    scenario?: string;
    elapsedMs: number;
    x: number[];
};
export type WsPayload = StatusPayload | ResultPayload;
export declare class WsClient {
    private socket;
    private shouldReconnect;
    private listeners;
    connect(): void;
    disconnect(): void;
    subscribe(listener: Listener<WsPayload>): () => boolean;
}
export declare const wsClient: WsClient;
export {};
