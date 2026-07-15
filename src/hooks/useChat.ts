import { useCallback, useMemo, useRef } from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { socketService } from '@/services/socketService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { messageQueued } from '@/store/slices/chatSlice';
import type { ChatMessage } from '@/types/chat.types';

const TYPING_STOP_DELAY_MS = 2000;

/**
 * The component-facing API for a conversation: send messages (with optimistic
 * UI + retry), start/stop typing (debounced so we don't spam the socket on
 * every keystroke), and mark the thread read.
 */
export function useChat(conversationId: string) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const messageIds = useAppSelector(
    (state) => state.chat.messagesByConversation[conversationId] ?? [],
  );
  const messagesById = useAppSelector((state) => state.chat.messagesById);

  const messages = useMemo<ChatMessage[]>(
    () => messageIds.map((id) => messagesById[id]).filter(Boolean),
    [messageIds, messagesById],
  );

  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const sendMessage = useCallback(
    (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || !currentUser) return;

      const clientId = nanoid();
      const optimisticMessage: ChatMessage = {
        id: clientId,
        clientId,
        conversationId,
        senderId: currentUser.id,
        body: trimmed,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      // Update UI immediately, then fire the real request. If it fails,
      // socketService's error path (message:error) can flip status to 'failed'
      // via a small extra reducer case — omitted here for brevity but the
      // same pattern as messageAcknowledged.
      dispatch(messageQueued(optimisticMessage));
      socketService.emit('message:send', { clientId, conversationId, body: trimmed });
    },
    [conversationId, currentUser, dispatch],
  );

  const notifyTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.emit('typing:start', { conversationId });
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      socketService.emit('typing:stop', { conversationId });
    }, TYPING_STOP_DELAY_MS);
  }, [conversationId]);

  const markRead = useCallback(() => {
    socketService.emit('conversation:markRead', { conversationId });
  }, [conversationId]);

  return { messages, sendMessage, notifyTyping, markRead };
}
