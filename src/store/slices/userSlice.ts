// src/store/slices/userSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatUser } from '@/types/chat.types';

interface UserState {
  currentUser: ChatUser | null;
  usersById: Record<string, ChatUser>;
}

const initialState: UserState = {
  currentUser: null,
  usersById: {},
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    currentUserSet(state, action: PayloadAction<ChatUser>) {
      state.currentUser = action.payload;
      state.usersById[action.payload.id] = action.payload;
    },
    usersUpserted(state, action: PayloadAction<ChatUser[]>) {
      for (const user of action.payload) {
        state.usersById[user.id] = user;
      }
    },
    presenceUpdated(state, action: PayloadAction<ChatUser>) {
      const existing = state.usersById[action.payload.id];
      state.usersById[action.payload.id] = { ...existing, ...action.payload };
    },
    currentUserCleared(state) {
      state.currentUser = null;
    },
  },
});

export const { currentUserSet, usersUpserted, presenceUpdated, currentUserCleared } = userSlice.actions;
export default userSlice.reducer;