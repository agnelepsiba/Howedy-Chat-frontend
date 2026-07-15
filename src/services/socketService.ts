import { io, type Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '@/config/socket.config';
import type {
  ClientToServerEvents,
  ConnectionStatus,
  ServerToClientEvents,
} from '@/types/socket.types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type StatusListener = (status: ConnectionStatus) => void;

class SocketService {
  private socket: TypedSocket | null = null;
  private status: ConnectionStatus = 'idle';
  private statusListeners = new Set<StatusListener>();

  connect(authToken: string): TypedSocket {
    if (this.socket?.connected) return this.socket;

    this.setStatus('connecting');

    this.socket = io(SOCKET_CONFIG.url, {
      path: SOCKET_CONFIG.path,
      auth: { token: authToken },
      reconnection: SOCKET_CONFIG.reconnection,
      reconnectionAttempts: SOCKET_CONFIG.reconnectionAttempts,
      reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
      reconnectionDelayMax: SOCKET_CONFIG.reconnectionDelayMax,
      pingInterval: SOCKET_CONFIG.pingInterval,
      pingTimeout: SOCKET_CONFIG.pingTimeout,
      transports: SOCKET_CONFIG.transports,
      autoConnect: true,
    } as any);

    this.socket.on('connect', () => {
      console.log('[socket] Connected to server');
      this.setStatus('connected');
    });

    this.socket.onAny((event, ...args) => {
      console.debug(`[socket] event:${event}`, args);
    });

    this.socket.onAnyOutgoing((event, ...args) => {
      console.debug(`[socket] emit:${event}`, args);
    });

    this.socket.on('disconnect', () => {
      console.log('[socket] Disconnected from server');
      this.setStatus('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[socket] Connection error:', error);
      this.setStatus('error');
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.setStatus('idle');
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  emit<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ): void {
    if (!this.socket?.connected) {
      console.warn(`[socket] cannot emit "${String(event)}" — not connected`);
      return;
    }
    this.socket.emit(event, ...args);
  }

  on<E extends keyof ServerToClientEvents>(event: E, handler: ServerToClientEvents[E]): void {
    this.socket?.on(event, handler as never);
  }

  off<E extends keyof ServerToClientEvents>(event: E, handler: ServerToClientEvents[E]): void {
    this.socket?.off(event, handler as never);
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isReady(): boolean {
    return this.status === 'connected' && this.socket?.connected === true;
  }

  waitForReady(timeoutMs: number = 5000): Promise<TypedSocket> {
    return new Promise((resolve, reject) => {
      if (this.isReady()) {
        resolve(this.socket!);
        return;
      }

      const handleConnected = () => {
        cleanup();
        resolve(this.socket!);
      };

      const handleError = () => {
        cleanup();
        reject(new Error('Socket connection failed'));
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Socket connection timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);
        this.socket?.off('connect', handleConnected);
        this.socket?.off('connect_error', handleError);
      };

      this.socket?.once('connect', handleConnected);
      this.socket?.once('connect_error', handleError);
    });
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  // ---- Convenience wrappers for the typed client→server events ----

  joinConversation(conversationId: string): void {
    this.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.emit('conversation:leave', { conversationId });
  }

  sendMessage(payload: { clientId: string; conversationId: string; body: string }): void {
    this.emit('message:send', payload);
  }

  startTyping(conversationId: string): void {
    this.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.emit('typing:stop', { conversationId });
  }

  markConversationRead(conversationId: string): void {
    this.emit('conversation:markRead', { conversationId });
  }

  markMessageDelivered(messageId: string): void {
    this.emit('message:updateStatus', { messageId, status: 'delivered' });
  }
}

export const socketService = new SocketService();