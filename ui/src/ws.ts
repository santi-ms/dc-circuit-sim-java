export class WsClient {
  private socket: WebSocket | null = null
  private shouldReconnect = true
  private listeners = new Set<Listener<WsPayload>>()

  connect() {
    this.shouldReconnect = true
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return
    }
  }
}

