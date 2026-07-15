import { memo } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { truncate } from '@/utils/formatters';
import type { Conversation } from '@/types/chat.types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  onSelect,
}: ConversationItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        isActive ? 'bg-howdy-50' : 'hover:bg-gray-50'
      }`}
    >
      <Avatar name={conversation.participantName || conversation.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-gray-900">
            {conversation.participantName || conversation.name}
          </p>
        </div>
        <p className="truncate text-xs text-gray-500">
          {conversation.lastMessage ? truncate(conversation.lastMessage.body, 40) : 'No messages yet'}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-howdy-500 px-1.5 text-[11px] font-semibold text-white">
          {conversation.unreadCount}
        </span>
      )}
    </button>
  );
});
