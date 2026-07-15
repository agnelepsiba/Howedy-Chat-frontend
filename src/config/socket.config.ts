export const SOCKET_CONFIG = {
  url: import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000',
  path: import.meta.env.VITE_SOCKET_PATH || '/socket.io',
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  pingInterval: 120000, // 2 minutes
  pingTimeout: 7200000, // 2 hours
  transports: ['websocket', 'polling'] as string[],
};
