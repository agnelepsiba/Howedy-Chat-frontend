# Howdy Chat

A production-ready real-time chat module built with React 19, TypeScript, Socket.IO,
Redux Toolkit, React Router, and Tailwind CSS.

## Architecture

```
src/
├── types/            Shared TypeScript contracts (chat domain + socket events)
├── config/           Environment-driven config (socket URL, timeouts)
├── services/
│   ├── socketService.ts   Singleton Socket.IO wrapper — owns the one connection
│   └── chatApi.ts         REST client for bulk/initial data (history, conversation list)
├── store/
│   ├── slices/        chatSlice (normalized messages/conversations), userSlice
│   │                   (presence), uiSlice (connection status, typing)
│   └── hooks.ts        Typed useAppDispatch / useAppSelector
├── hooks/
│   ├── useSocket.ts    Connects socket ↔ Redux (mounted once at the top of ChatPage)
│   ├── useChat.ts       Component-facing API: sendMessage, notifyTyping, markRead
│   └── useDebounce.ts
├── components/
│   ├── chat/           ChatWindow, MessageList (virtualized), MessageItem, MessageInput,
│   │                    TypingIndicator, ChatHeader
│   ├── sidebar/         ConversationList, ConversationItem
│   └── common/          Avatar, OnlineBadge
├── pages/               LoginPage, ChatPage
└── routes/               AppRoutes (route guard for auth)
```

### Key design decisions

- **One socket connection for the app's lifetime.** `socketService` is a singleton;
  `useSocket` mounts once and forwards every server event into Redux. Components never
  touch the socket directly to *receive* data — they read Redux state, which keeps
  data flow one-directional and testable.
- **Normalized Redux state.** Messages are stored as `messagesById` +
  `messagesByConversation: id[]`, not nested arrays of objects. This means one message
  update doesn't force every list item to re-render.
- **Optimistic sends with reconciliation.** `useChat.sendMessage` immediately inserts a
  `status: 'sending'` message keyed by a client-generated id, then swaps it for the
  server-confirmed message on `message:ack` (see `messageAcknowledged` in `chatSlice`).
- **Virtualized message list.** `MessageList` uses `react-window`'s `VariableSizeList`
  so DOM node count stays constant regardless of conversation length — critical for
  threads with thousands of messages.
- **Memoized list items.** `MessageItem`, `ConversationItem`, and `Avatar` are wrapped
  in `React.memo` with targeted comparators so unrelated re-renders don't cascade.
- **Debounced typing indicator.** Typing events are throttled client-side (2s idle
  timeout) instead of firing a socket event on every keystroke.
- **Typed socket contract.** `ServerToClientEvents` / `ClientToServerEvents` give
  compile-time safety on every `emit`/`on` call — no magic strings, no payload typos.

## Setup in VS Code

### 1. Prerequisites
- Node.js 20+ (`node -v`)
- VS Code with these extensions recommended: **ESLint**, **Prettier - Code formatter**,
  **Tailwind CSS IntelliSense**

### 2. Install dependencies
```bash
cd howdy-chat
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# edit .env if your backend runs somewhere other than localhost:4000
```

### 4. Run the dev server
```bash
npm run dev
```
Open the printed local URL (default `http://localhost:5173`).

### 5. VS Code workspace settings (optional but recommended)
Create `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Available scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |

## Backend

This module ships with a matching backend in the companion `howdy-chat-backend` package
(Node.js + Express + Socket.IO + MongoDB, JWT auth). It implements exactly the REST and
socket contracts this frontend expects:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/conversations`, `POST /api/conversations`, `GET /api/conversations/:id/messages`
- Socket events: `message:send/new/ack/error`, `typing:start/stop/update`,
  `conversation:join/leave/markRead/read`, `presence:update`

Point this frontend's `.env` at it:
```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```
See the backend's own README for setup and full API reference.
