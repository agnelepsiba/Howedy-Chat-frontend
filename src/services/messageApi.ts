import type { ChatMessage } from '@/types/chat.types';
import { getAuthToken } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMessages(
  conversationId: string,
  cursor?: string,
): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> {
  const url = new URL(`${API_BASE_URL}/conversations/${conversationId}/messages`);
  if (cursor) url.searchParams.set('cursor', cursor);

  const res = await fetch(url, {
    credentials: 'include',
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to load messages: ${res.status}`);
  }

  const data = await res.json();

  // Extract messages from response data.messages
  const messagesData = data.data?.messages || [];
  
  // Transform API messages (with _id) to ChatMessage format (with id)
  const messages: ChatMessage[] = Array.isArray(messagesData)
    ? messagesData.map((msg: any) => ({
        id: msg._id || msg.id,
        clientId: msg.clientId || '',
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        body: msg.body,
        createdAt: msg.createdAt,
        status: msg.status || 'sent',
        editedAt: msg.editedAt,
        senderName: msg.senderName,
        receiverName: msg.receiverName,
      }))
    : [];

  return {
    messages,
    nextCursor: data.data?.nextCursor || null,
  };
}

/**
 * Mark a conversation as read (HTTP REST)
 */
export async function markConversationAsRead(conversationId: string): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/markRead`,
    {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include',
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to mark conversation as read: ${res.status}`);
  }
}
