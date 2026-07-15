import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage, Conversation } from '@/types/chat.types';

interface ChatState {
  conversations: Record<string, Conversation>;
  conversationOrder: string[];
  // Messages keyed by conversationId -> array of message ids, plus a flat message lookup.
  // Normalizing avoids storing message objects in multiple places and re-rendering
  // every list item when a single message changes.
  messagesByConversation: Record<string, string[]>;
  messagesById: Record<string, ChatMessage>;
  nextCursorByConversation: Record<string, string | null>;
  activeConversationId: string | null;
}

const initialState: ChatState = {
  conversations: {},
  conversationOrder: [],
  messagesByConversation: {},
  messagesById: {},
  nextCursorByConversation: {},
  activeConversationId: null,
};

function ensureConversation(state: ChatState, conversationId: string) {
  if (!state.conversations[conversationId]) {
    state.conversations[conversationId] = {
      id: conversationId,
      isGroup: false,
      name: 'Conversation',
      participantIds: [],
      unreadCount: 0,
    };
  }

  if (!state.conversationOrder.includes(conversationId)) {
    state.conversationOrder.push(conversationId);
  }

  if (!state.messagesByConversation[conversationId]) {
    state.messagesByConversation[conversationId] = [];
  }
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    conversationsLoaded(state, action: PayloadAction<Conversation[]>) {
      for (const convo of action.payload) {
        state.conversations[convo.id] = convo;
        if (!state.conversationOrder.includes(convo.id)) {
          state.conversationOrder.push(convo.id);
        }
        if (!state.messagesByConversation[convo.id]) {
          state.messagesByConversation[convo.id] = [];
        }
      }
    },

    activeConversationSet(state, action: PayloadAction<string>) {
      state.activeConversationId = action.payload;
      const convo = state.conversations[action.payload];
      if (convo) convo.unreadCount = 0;
    },

    // Optimistic send: message appears instantly with status "sending".
    messageQueued(state, action: PayloadAction<ChatMessage>) {
      const message = action.payload;
      ensureConversation(state, message.conversationId);
      state.messagesById[message.clientId] = message;
      const list = state.messagesByConversation[message.conversationId] ?? [];
      list.push(message.clientId);
      state.messagesByConversation[message.conversationId] = list;

      const convo = state.conversations[message.conversationId];
      if (convo) {
        convo.lastMessage = message;
      }
    },

    // Server confirms receipt: swap the optimistic clientId entry for the real message.
    messageAcknowledged(
      state,
      action: PayloadAction<{ clientId: string; message: ChatMessage }>,
    ) {
      const { clientId, message } = action.payload;
      delete state.messagesById[clientId];
      state.messagesById[message.id] = message;

      const list = state.messagesByConversation[message.conversationId];
      if (list) {
        const idx = list.indexOf(clientId);
        if (idx !== -1) list[idx] = message.id;
      }

      const convo = state.conversations[message.conversationId];
      if (convo) {
        convo.lastMessage = message;
      }
    },

    messageFailed(state, action: PayloadAction<{ clientId: string }>) {
      const msg = state.messagesById[action.payload.clientId];
      if (msg) msg.status = 'failed';
    },

    messageReceived(state, action: PayloadAction<ChatMessage>) {
      const message = action.payload;
      // Avoid duplicate insert if we somehow already have this id.
      if (state.messagesById[message.id]) return;

      ensureConversation(state, message.conversationId);
      state.messagesById[message.id] = message;
      const list = state.messagesByConversation[message.conversationId] ?? [];
      list.push(message.id);
      state.messagesByConversation[message.conversationId] = list;

      const convo = state.conversations[message.conversationId];
      if (convo) {
        convo.lastMessage = message;
        if (state.activeConversationId !== message.conversationId) {
          convo.unreadCount += 1;
        }
      }
    },

    // add to reducers block
    messagesMarkedRead(
      state,
      action: PayloadAction<{ conversationId: string; userId: string }>,
    ) {
      const { conversationId, userId } = action.payload;
      const ids = state.messagesByConversation[conversationId] ?? [];
      for (const id of ids) {
        const msg = state.messagesById[id];
        // A user's read event means "I've seen everything not authored by me"
        // — so mark every message in this conversation NOT sent by that reader.
        if (msg && msg.senderId !== userId && msg.status !== 'read') {
          msg.status = 'read';
        }
      }
    },

    messageUpdated(state, action: PayloadAction<ChatMessage>) {
      state.messagesById[action.payload.id] = action.payload;
    },

    messagesLoaded(
      state,
      action: PayloadAction<{
        conversationId: string;
        messages: ChatMessage[];
        nextCursor: string | null;
      }>,
    ) {
      const { conversationId, messages, nextCursor } = action.payload;

      ensureConversation(state, conversationId);

      const list = state.messagesByConversation[conversationId];

      // Preserve the API order exactly.
      // The backend returns the newest messages first for the initial history load,
      // and older pages when paginating, so we append newly loaded messages in the
      // order the server returns and keep the existing list intact.
      for (const message of messages) {
        if (!state.messagesById[message.id]) {
          state.messagesById[message.id] = message;
          list.push(message.id);
        }
      }

      // If the API returns the same cursor we already had, treat that as end
      // of history to avoid repeated identical fetches.
      const previousCursor = state.nextCursorByConversation[conversationId];
      if (nextCursor && previousCursor && nextCursor === previousCursor) {
        state.nextCursorByConversation[conversationId] = null;
      } else {
        state.nextCursorByConversation[conversationId] = nextCursor;
      }
    },

    messageStatusUpdated(state, action: PayloadAction<{ messageId: string; status: ChatMessage['status'] }>) {
      const msg = state.messagesById[action.payload.messageId];
      if (msg) msg.status = action.payload.status;
    },

    messagesBulkStatusUpdated(
      state,
      action: PayloadAction<{ messageIds: string[]; status: ChatMessage['status'] }>,
    ) {
      for (const id of action.payload.messageIds) {
        const msg = state.messagesById[id];
        if (msg) msg.status = action.payload.status;
      }
    },

    chatCleared: () => initialState,
  },
});

export const {
  conversationsLoaded,
  activeConversationSet,
  messageQueued,
  messageAcknowledged,
  messageFailed,
  messageReceived,
  messageUpdated,
  messagesLoaded,
  messagesMarkedRead,
  messageStatusUpdated,
  messagesBulkStatusUpdated,
  chatCleared
} = chatSlice.actions;

export default chatSlice.reducer;
