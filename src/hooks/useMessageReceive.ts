import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  messageAcknowledged,
  messageReceived,
  messageFailed,
  messageUpdated,
  messageStatusUpdated,
  messagesBulkStatusUpdated,
} from '@/store/slices/chatSlice';
import { presenceUpdated } from '@/store/slices/userSlice';
import { typingUpdated } from '@/store/slices/uiSlice';
import { socketService } from '@/services/socketService';
import type { ChatMessage, TypingState } from '@/types/chat.types';
import { store } from '@/store/store';

/**
 * Hook to listen for all incoming socket events: messages, presence, typing, read receipts
 * Call this once in ChatPage to set up all socket event listeners globally
 */
export function useMessageReceive() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Listen for message acknowledgments (server confirmed our message was saved)
    const handleAck = (data: { clientId: string; message: any }) => {
      dispatch(
        messageAcknowledged({
          clientId: data.clientId,
          message: {
            id: data.message.id || data.message._id,
            clientId: data.clientId,
            conversationId: data.message.conversationId,
            senderId: data.message.senderId,
            body: data.message.body,
            createdAt: data.message.createdAt,
            status: data.message.status || 'sent',
            senderName: data.message.senderName,
            receiverName: data.message.receiverName,
          },
        }),
      );
    };

    // Listen for new messages from others in the conversation
    const handleNewMessage = (message: any) => {
      const chatMessage = {
        id: message.id || message._id,
        clientId: message.clientId || '',
        conversationId: message.conversationId,
        senderId: message.senderId,
        body: message.body,
        createdAt: message.createdAt,
        status: message.status || 'sent',
        senderName: message.senderName,
        receiverName: message.receiverName,
      };
      dispatch(messageReceived(chatMessage));

      const state = store.getState();

      // If the conversation is currently active, mark it as read immediately.
      // This avoids emitting both 'delivered' and 'read' events at the same time.
      if (state.chat.activeConversationId === chatMessage.conversationId) {
        socketService.markConversationRead(chatMessage.conversationId);
      } else {
        // Only mark as delivered if the receiver is not currently looking at the chat.
        socketService.markMessageDelivered(chatMessage.id);
      }
    };

    const handleStatusUpdate = (payload: { messageId: string; status: string }) => {
      dispatch(messageStatusUpdated({ messageId: payload.messageId, status: payload.status as ChatMessage['status'] }));
    };

    const handleBulkStatusUpdate = (payload: { messageIds: string[]; status: string }) => {
      dispatch(messagesBulkStatusUpdated({ messageIds: payload.messageIds, status: payload.status as ChatMessage['status'] }));
    };

    // Listen for message send errors
    const handleError = (error: { clientId: string; reason: string }) => {
      console.error('❌ Message error:', error.reason);
      dispatch(
        messageFailed({
          clientId: error.clientId,
        }),
      );
    };

    // Listen for updated messages
    const handleMessageUpdated = (message: any) => {
      dispatch(
        messageUpdated({
          id: message.id || message._id,
          clientId: message.clientId || '',
          conversationId: message.conversationId,
          senderId: message.senderId,
          body: message.body,
          createdAt: message.createdAt,
          status: message.status || 'sent',
          senderName: message.senderName,
          receiverName: message.receiverName,
        }),
      );
    };

    // Listen for presence updates (user online/offline status)
    const handlePresenceUpdate = (user: any) => {
      dispatch(
        presenceUpdated({
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          isOnline: user.isOnline,
          lastSeenAt: user.lastSeenAt,
        }),
      );
    };

    // Listen for typing indicators (user is typing/stopped typing)
    const handleTypingUpdate = (state: TypingState) => {
      if (state.isTyping) {
        console.log(` ${state.userId} is typing in ${state.conversationId}`);
      }
      dispatch(typingUpdated(state));
    };


    const handleConversationRead = (payload: {
      conversationId: string;
      userId: string;
    }) => {
      const state = store.getState();

      const messageIdsToMarkRead =
        (state.chat.messagesByConversation[payload.conversationId] ?? [])
          .map(id => state.chat.messagesById[id])
          .filter(
            m =>
              m &&
              m.senderId !== payload.userId &&
              m.status !== 'read' &&
              m.status !== 'failed' &&
              m.status !== 'sending',
          )
          .map(m => m.id);

      if (messageIdsToMarkRead.length) {
        dispatch(
          messagesBulkStatusUpdated({
            messageIds: messageIdsToMarkRead,
            status: 'read',
          }),
        );
      }
    };

    socketService.on('message:ack', handleAck);
    socketService.on('message:new', handleNewMessage);
    socketService.on('message:updated', handleMessageUpdated);
    socketService.on('message:error', handleError);
    socketService.on('presence:update', handlePresenceUpdate);
    socketService.on('typing:update', handleTypingUpdate);
    socketService.on('conversation:read', handleConversationRead);
    socketService.on('message:statusUpdate', handleStatusUpdate);
    socketService.on('message:bulkStatusUpdate', handleBulkStatusUpdate);

    return () => {
      socketService.off('message:ack', handleAck);
      socketService.off('message:new', handleNewMessage);
      socketService.off('message:updated', handleMessageUpdated);
      socketService.off('message:error', handleError);
      socketService.off('presence:update', handlePresenceUpdate);
      socketService.off('typing:update', handleTypingUpdate);
      socketService.off('conversation:read', handleConversationRead);
      socketService.off('message:statusUpdate', handleStatusUpdate);
      socketService.off('message:bulkStatusUpdate', handleBulkStatusUpdate);
    };
  }, [dispatch]);
}