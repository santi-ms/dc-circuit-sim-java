export function connectWS(): WebSocket {
  const url = import.meta.env.DEV
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
    : (import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws')

  const socket = new WebSocket(url)
  socket.onerror = (event) => {
    console.error('WebSocket error', event)
  }
  return socket
}
