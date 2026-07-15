import type { Conversation } from '@/types/chat.types';
import { getAuthToken } from '@/services/authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * REST is used for bulk/initial data (conversation list, message history,
 * pagination) while Socket.IO is reserved for real-time events. Mixing both
 * over the socket works but makes caching, retries, and pagination harder.
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE_URL}/conversations`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load conversations: ${res.status}`);

  const data = await res.json();
  const conversationsData = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  return conversationsData.map((conversation: any) => {
    const id = conversation.id || conversation._id;
    return {
      id,
      isGroup: conversation.isGroup || false,
      name: conversation.name || 'Conversation',
      participantIds: Array.isArray(conversation.participantIds) ? conversation.participantIds : [],
      lastMessage: conversation.lastMessage,
      unreadCount: conversation.unreadCount || 0,
      senderName: conversation.senderName,
      receiverName: conversation.receiverName,
      participantName: conversation.participantName || conversation.name,
      yourName: conversation.yourName,
    } satisfies Conversation;
  });
}

export async function fetchMessageHistory(
  conversationId: string,
  cursor?: string,
): Promise<{ messages: unknown[]; nextCursor: string | null }> {
  const url = new URL(`${API_BASE_URL}/conversations/${conversationId}/messages`);
  if (cursor) url.searchParams.set('cursor', cursor);
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to load messages: ${res.status}`);
  return res.json();
}

export async function createConversation(
  participantIds: string[],
  name: string,
  isGroup: boolean,
): Promise<Conversation> {
  const res = await fetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantIds, name, isGroup }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create conversation: ${res.status}`);
  }

  const data = await res.json();
  
  // Handle different response structures
  // Could be: { id, ... } or { data: { id, ... } } or { data: { conversation: { id, ... } } }
  let conversationData = data;
  
  if (data.data) {
    conversationData = data.data.conversation || data.data;
  }
  
  // Support both _id and id
  const id = conversationData.id || conversationData._id;
  
  if (!id) {
    console.error('Invalid conversation response:', data);
    throw new Error('Invalid response from create conversation API: missing ID');
  }

  return {
    id,
    isGroup: conversationData.isGroup || false,
    name: conversationData.name || name,
    participantIds: conversationData.participantIds || participantIds,
    lastMessage: conversationData.lastMessage,
    unreadCount: conversationData.unreadCount || 0,
  };
}
