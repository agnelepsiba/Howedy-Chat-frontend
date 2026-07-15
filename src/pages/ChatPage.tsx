// ChatPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { NewConversationModal } from '@/components/chat/NewConversationModal';
import { useSocket } from '@/hooks/useSocket';
import { useMessageReceive } from '@/hooks/useMessageReceive';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { activeConversationSet, conversationsLoaded } from '@/store/slices/chatSlice';
import { fetchConversations } from '@/services/chatApi';
import { getAllUsers, getAuthToken } from '@/services/authApi';
import { usersUpserted } from '@/store/slices/userSlice';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

  useSocket(currentUser ? getAuthToken() : null);
  useMessageReceive();

  useEffect(() => {
    fetchConversations().then((conversations) => {
      dispatch(conversationsLoaded(conversations));
    });
  }, [dispatch]);

  useEffect(() => {
    getAllUsers().then((users) => dispatch(usersUpserted(users)));
  }, [dispatch]);

  useEffect(() => {
    if (conversationId) dispatch(activeConversationSet(conversationId));
  }, [conversationId, dispatch]);

  const conversationIds = useAppSelector((state) => state.chat.conversationOrder);
  const isConversationsEmpty = conversationIds.length === 0;

  return (
    <div className="grid h-[100dvh] grid-cols-1 md:h-screen md:grid-cols-[320px_1fr]">
      <div
        className={`min-h-0 overflow-hidden border-r border-gray-200 md:block ${
          conversationId ? 'hidden' : 'block'
        }`}
      >
        <ConversationList
          activeConversationId={conversationId}
          onCreateConversation={() => setIsNewConversationOpen(true)}
        />
      </div>

      <div className={`min-h-0 min-w-0 ${conversationId ? 'block' : 'hidden md:block'}`}>
        {isConversationsEmpty ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 px-4 text-center">
            <p className="text-lg font-semibold text-gray-900">No conversations yet</p>
            <p className="max-w-sm text-sm text-gray-500">
              You don't have any conversations yet. Start a new chat to begin messaging.
            </p>
          </div>
        ) : conversationId ? (
          <ChatWindow conversationId={conversationId} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      <NewConversationModal
        isOpen={isNewConversationOpen}
        onClose={() => setIsNewConversationOpen(false)}
      />
    </div>
  );
}