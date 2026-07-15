import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getMessages } from '@/services/messageApi';
import { messagesLoaded } from '@/store/slices/chatSlice';

/**
 * Hook to load message history with pagination support.
 * Call this in MessageList to load older messages when user scrolls to the top.
 */
export function usePaginateMessages(conversationId: string) {
  const dispatch = useAppDispatch();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const nextCursor = useAppSelector(
    (state) => state.chat.nextCursorByConversation?.[conversationId] || null,
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const { messages, nextCursor: newCursor } = await getMessages(conversationId, nextCursor);
      
      if (messages.length > 0) {
        dispatch(
          messagesLoaded({
            conversationId,
            messages,
            nextCursor: newCursor,
          }),
        );
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, nextCursor, isLoadingMore, dispatch]);

  return { loadMore, isLoadingMore, hasMore: nextCursor !== null };
}
