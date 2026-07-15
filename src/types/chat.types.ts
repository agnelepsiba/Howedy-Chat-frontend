export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface ChatMessage {
  id: string;
  clientId: string; // client-generated id for optimistic updates
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  status: MessageStatus;
  editedAt?: string;
  senderName?: string;
  receiverName?: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string;
  participantIds: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  senderName?: string;
  receiverName?: string;
  participantName?: string;
  yourName?: string;
}

export interface TypingState {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}
