import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionStatus } from '@/types/socket.types';

interface UiState {
  connectionStatus: ConnectionStatus;
  // conversationId -> set of userIds currently typing (stored as array for serializability)
  typingByConversation: Record<string, string[]>;
}

const initialState: UiState = {
  connectionStatus: 'idle',
  typingByConversation: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    connectionStatusChanged(state, action: PayloadAction<ConnectionStatus>) {
      state.connectionStatus = action.payload;
    },
    typingUpdated(
      state,
      action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>,
    ) {
      const { conversationId, userId, isTyping } = action.payload;
      const current = state.typingByConversation[conversationId] ?? [];
      state.typingByConversation[conversationId] = isTyping
        ? Array.from(new Set([...current, userId]))
        : current.filter((id) => id !== userId);
    },
  },
});

export const { connectionStatusChanged, typingUpdated } = uiSlice.actions;
export default uiSlice.reducer;
