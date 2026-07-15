import { memo } from 'react';
import { Avatar } from '@/components/common/Avatar';
import type { ChatMessage } from '@/types/chat.types';
import { formatMessageTime } from '@/utils/formatters';

interface MessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  senderName: string;
  senderAvatarUrl?: string;
  showSender: boolean;
  showMeta: boolean;
}

function MessageItemImpl({
  message,
  isOwnMessage,
  senderName,
  senderAvatarUrl,
  showSender,
  showMeta,
}: MessageItemProps) {
  return (
    <div className={`flex gap-2 px-4 ${showMeta ? 'pb-2' : 'pb-0.5'} pt-0.5 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <div className="w-8">
        {showSender && !isOwnMessage && <Avatar name={senderName} imageUrl={senderAvatarUrl} size="sm" />}
      </div>

      <div className={`flex max-w-[70%] flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {showSender && !isOwnMessage && (
          <span className="mb-0.5 px-1 text-xs font-medium text-gray-500">{senderName}</span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isOwnMessage ? 'rounded-br-sm bg-howdy-500 text-white' : 'rounded-bl-sm bg-gray-100 text-gray-900'
          }`}
        >
          {message.body}
        </div>

        {/* Only the last bubble in a consecutive run shows time + tick —
            same as WhatsApp collapsing a burst of texts into one meta line. */}
        {showMeta && (
          <div className="mt-0.5 flex items-center gap-1 px-1 text-[11px] text-gray-400">
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwnMessage && <MessageStatusIcon status={message.status} />}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageStatusIcon({ status }: { status: ChatMessage['status'] }) {
  console.log("status", status)
  switch (status) {
    
    case 'sending':
      return <span title="Sending">⏳</span>;
    case 'failed':
      return <span className="text-red-500" title="Failed to send">⚠</span>;
    case 'read':
      return <span className="text-blue-500" title="Read">✓✓</span>;
    case 'delivered':
      return <span title="Delivered">✓✓</span>;
    case 'sent':
      return <span title="Sent">✓</span>;
    default:
      return <span title="Sent">✓</span>;
  }
}

export const MessageItem = memo(MessageItemImpl, (prev, next) => {
  return (
    prev.message === next.message &&
    prev.isOwnMessage === next.isOwnMessage &&
    prev.showSender === next.showSender &&
    prev.showMeta === next.showMeta
  );
});