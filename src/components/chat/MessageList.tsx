import { useEffect, useMemo, useRef } from 'react';
import { VariableSizeList, type ListChildComponentProps } from 'react-window';
import { MessageItem } from './MessageItem';
import { useAppSelector } from '@/store/hooks';
import type { ChatMessage } from '@/types/chat.types';
import { getDateLabel } from '@/utils/formatters';
import { DateSeparator } from './DateSeperator';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  height: number;
}

const ESTIMATED_ROW_HEIGHT = 64;
const SEPARATOR_HEIGHT = 36;
// Messages from the same sender within this window are visually grouped —
// same idea as WhatsApp collapsing consecutive bubbles into one "burst".
const GROUP_TIME_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

type ListItem =
  | { type: 'separator'; key: string; label: string }
  | {
      type: 'message';
      key: string;
      message: ChatMessage;
      showSender: boolean;
      showMeta: boolean; // whether to show timestamp + read/delivered tick
    };

function buildListItems(messages: ChatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDateKey: string | null = null;

  messages.forEach((message, index) => {
    const dateKey = new Date(message.createdAt).toDateString();
    if (dateKey !== lastDateKey) {
      items.push({ type: 'separator', key: `sep-${dateKey}`, label: getDateLabel(message.createdAt) });
      lastDateKey = dateKey;
    }

    const prevMessage = index > 0 ? messages[index - 1] : undefined;
    const showSender = !prevMessage || prevMessage.senderId !== message.senderId;

    const nextMessage = messages[index + 1];
    const isLastInGroup =
      !nextMessage ||
      nextMessage.senderId !== message.senderId ||
      new Date(nextMessage.createdAt).toDateString() !== dateKey ||
      new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() >
        GROUP_TIME_THRESHOLD_MS;

    items.push({ type: 'message', key: message.id, message, showSender, showMeta: isLastInGroup });
  });

  return items;
}

export function MessageList({ messages, currentUserId, height }: MessageListProps) {
  const usersById = useAppSelector((state) => state.user.usersById);
  const listRef = useRef<VariableSizeList>(null);
  const rowHeights = useRef<Record<number, number>>({});
  const prevLength = useRef(messages.length);

  const items = useMemo(() => buildListItems(messages), [messages]);

  useEffect(() => {
    if (messages.length > prevLength.current) {
      listRef.current?.scrollToItem(items.length - 1, 'end');
    }
    prevLength.current = messages.length;
  }, [messages.length, items.length]);

  const getItemSize = (index: number) => {
    if (items[index]?.type === 'separator') return SEPARATOR_HEIGHT;
    return rowHeights.current[index] ?? ESTIMATED_ROW_HEIGHT;
  };

  const setRowHeight = (index: number, size: number) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      listRef.current?.resetAfterIndex(index);
    }
  };

  const itemData = useMemo(
    () => ({ items, currentUserId, usersById, setRowHeight }),
    [items, currentUserId, usersById],
  );

  return (
    <VariableSizeList
      ref={listRef}
      height={height}
      width="100%"
      itemCount={items.length}
      itemSize={getItemSize}
      itemData={itemData}
      overscanCount={6}
    >
      {Row}
    </VariableSizeList>
  );
}

interface RowData {
  items: ListItem[];
  currentUserId: string;
  usersById: Record<string, { name: string; avatarUrl?: string }>;
  setRowHeight: (index: number, size: number) => void;
}

function Row({ index, style, data }: ListChildComponentProps<RowData>) {
  const { items, currentUserId, usersById, setRowHeight } = data;
  const item = items[index];
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rowRef.current) {
      setRowHeight(index, rowRef.current.getBoundingClientRect().height);
    }
  }, [index, setRowHeight, item]);

  if (item.type === 'separator') {
    return (
      <div style={style}>
        <div ref={rowRef}>
          <DateSeparator label={item.label} />
        </div>
      </div>
    );
  }

  const { message, showSender, showMeta } = item;
  const sender = usersById[message.senderId];
  const senderName = sender?.name ?? message.senderName ?? 'Unknown';

  return (
    <div style={style}>
      <div ref={rowRef}>
        <MessageItem
          message={message}
          isOwnMessage={message.senderId === currentUserId}
          senderName={senderName}
          senderAvatarUrl={sender?.avatarUrl}
          showSender={showSender}
          showMeta={showMeta}
        />
      </div>
    </div>
  );
}