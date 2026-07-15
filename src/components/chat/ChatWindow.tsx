import { useEffect, useRef, useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { useChat } from '@/hooks/useChat';
import { useConversationJoin } from '@/hooks/useConversationJoin';
import { usePaginateMessages } from '@/hooks/usePaginateMessages';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { messagesLoaded } from '@/store/slices/chatSlice';
import { getMessages } from '@/services/messageApi';

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const dispatch = useAppDispatch();
  const { messages, sendMessage, notifyTyping, markRead } = useChat(conversationId);
  const currentUserId = useAppSelector((state) => state.user.currentUser?.id);
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(400);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  // Join/leave the conversation room on mount/unmount and when conversationId changes
  useConversationJoin(conversationId);

  // Hook for pagination support
  const { loadMore, isLoadingMore, hasMore } = usePaginateMessages(conversationId);

  // Load initial messages when conversation changes
  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoadingInitial(true);
      try {
        const { messages, nextCursor } = await getMessages(conversationId);
        dispatch(
          messagesLoaded({
            conversationId,
            messages,
            nextCursor,
          }),
        );
      } catch (error) {
        console.error('Failed to load initial messages:', error);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    loadInitialMessages();
  }, [conversationId, dispatch]);

  // Measure available height so the virtualized list fills the panel and
  // stays correct across window resizes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setListHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    markRead();
  }, [conversationId, markRead]);
  

  if (!currentUserId) return null;

  return (
    <div className="flex h-full flex-col">
      <ChatHeader conversationId={conversationId} />

      <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto">
        {isLoadingInitial ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading messages...</div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-4 py-2 text-sm text-blue-500 hover:text-blue-600 disabled:opacity-50"
                >
                  {isLoadingMore ? 'Loading...' : 'Load earlier messages'}
                </button>
              </div>
            )}
            <MessageList messages={messages} currentUserId={currentUserId} height={listHeight} />
          </>
        )}
      </div>

      <TypingIndicator conversationId={conversationId} />
      <MessageInput onSend={sendMessage} onTyping={notifyTyping} />
    </div>
  );
}
