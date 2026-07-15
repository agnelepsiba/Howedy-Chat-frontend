import { ChatMessage, ChatUser, TypingState } from "./chat.types";

export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void;
  'message:updated': (message: ChatMessage) => void;
  'message:ack': (payload: { clientId: string; message: ChatMessage }) => void;
  'message:error': (payload: { clientId: string; reason: string }) => void;
  'message:statusUpdate': (payload: { messageId: string; status: string; updatedAt: string }) => void;
  'message:bulkStatusUpdate': (payload: {
    messageIds: string[];
    status: 'delivered' | 'read';
    conversationId: string;
  }) => void;
  'presence:update': (user: ChatUser) => void;
  'typing:update': (state: TypingState) => void;
  'conversation:read': (payload: { conversationId: string; userId: string }) => void;
  'conversation:update': (payload: { conversationId: string; message: ChatMessage; userId: string }) => void;
}

export interface ClientToServerEvents {
  'message:send': (payload: { clientId: string; conversationId: string; body: string }) => void;
  'message:updateStatus': (payload: { messageId: string; status: 'delivered' | 'read' }) => void;
  'typing:start': (payload: { conversationId: string }) => void;
  'typing:stop': (payload: { conversationId: string }) => void;
  'conversation:join': (payload: { conversationId: string }) => void;
  'conversation:leave': (payload: { conversationId: string }) => void;
  'conversation:markRead': (payload: { conversationId: string }) => void;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';