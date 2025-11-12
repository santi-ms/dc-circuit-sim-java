type Listener<T> = (event: T) => void

type StatusPayload = {
  type: 'status'
  state: 'running' | 'done'
  scheduler: string
  count: number
}

type ResultPayload = {
  type: 'result'
  jobId: string
  method: string
  scheduler?: string
  scenario?: string
  elapsedMs: number
  waitingMs?: number
  turnaroundMs?: number
  residual?: number
  equations?: unknown
  x: number[]
}

export type WsPayload = StatusPayload | ResultPayload

function resolveWsUrl() {
  if (import.meta.env.DEV) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${window.location.host}/ws`
  }
  return import.meta.env.VITE_WS_URL ?? ''
}

export class WsClient {
  private socket: WebSocket | null = null
  private shouldReconnect = true
  private listeners = new Set<Listener<WsPayload>>()
  private reconnectDelay = 2000

  connect() {
    this.shouldReconnect = true
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return this.socket
    }

    const url = resolveWsUrl()
    const socket = new WebSocket(url)
    this.socket = socket

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data) as WsPayload
        this.listeners.forEach((listener) => listener(payload))
      } catch (error) {
        console.error('WebSocket parse error', error)
      }
    })

    socket.addEventListener('close', () => {
      this.socket = null
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectDelay)
      }
    })

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error', error)
      socket.close()
    })

    return socket
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  subscribe(listener: Listener<WsPayload>) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const wsClient = new WsClient()

export function connectWS() {
  return wsClient.connect()
}

