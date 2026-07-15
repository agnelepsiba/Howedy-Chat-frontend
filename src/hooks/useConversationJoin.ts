import { useEffect } from 'react';
import { socketService } from '@/services/socketService';

/**
 * Hook to join a conversation on mount and leave on unmount.
 * This ensures the server knows which conversations this client is actively viewing,
 * so it can efficiently broadcast messages and presence updates only to relevant clients.
 *
 * CRITICAL: Waits for socket to be connected before joining to avoid silent failures.
 */
export function useConversationJoin(conversationId: string) {
  useEffect(() => {
    let isMounted = true;
    let joinTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const joinConversation = async () => {
      try {
        // Wait for socket to be ready (max 10 seconds)
        await socketService.waitForReady(10000);

        if (!isMounted) return;

        console.log(`[conversationJoin] Socket ready, joining conversation: ${conversationId}`);
        socketService.emit('conversation:join', { conversationId });
      } catch (error) {
        if (isMounted) {
          console.error(`[conversationJoin] Failed to join conversation: ${error}`);
          // Retry after delay
          joinTimeoutId = setTimeout(() => {
            if (isMounted) {
              console.log(`[conversationJoin] Retrying join for conversation: ${conversationId}`);
              void joinConversation();
            }
          }, 2000);
        }
      }
    };

    void joinConversation();

    // Leave the conversation room when component unmounts
    return () => {
      isMounted = false;
      if (joinTimeoutId) clearTimeout(joinTimeoutId);
      console.log(`[conversationJoin] Leaving conversation: ${conversationId}`);
      socketService.emit('conversation:leave', { conversationId });
    };
  }, [conversationId]);
}
