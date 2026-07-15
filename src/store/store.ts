import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    user: userReducer,
    ui: uiReducer,
  },
  // Default middleware (thunk + serializability/immutability checks) is fine here;
  // all state is plain, serializable data — no class instances or Dates in the store.
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
