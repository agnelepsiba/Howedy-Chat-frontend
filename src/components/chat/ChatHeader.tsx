import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { OnlineBadge } from '@/components/common/OnlineBadge';
import { useAppSelector } from '@/store/hooks';
import { MoreVerticalIcon, PhoneIcon, VideoIcon } from '../common/Icons';

export function ChatHeader({ conversationId }: { conversationId: string }) {
  const conversation = useAppSelector((state) => state.chat.conversations[conversationId]);
  const usersById = useAppSelector((state) => state.user.usersById);
  const connectionStatus = useAppSelector((state) => state.ui.connectionStatus);
  
  // 1. Get the current user to exclude their ID
  const currentUser = useAppSelector((state) => state.user.currentUser);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (!conversation) return null;

  // Safely find the other participant's ID by excluding the current user's ID
  const otherParticipantId = currentUser
    ? conversation.participantIds.find((id) => id !== currentUser.id)
    : undefined;

  const otherParticipant = !conversation.isGroup && otherParticipantId
    ? usersById[otherParticipantId]
    : undefined;

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar name={conversation.participantName || conversation.name} />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {conversation.participantName || conversation.name}
          </p>
          {!conversation.isGroup && otherParticipant && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <OnlineBadge isOnline={otherParticipant.isOnline} />
              {otherParticipant.isOnline ? 'Online' : 'Offline'}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ConnectionBadge status={connectionStatus} />
        <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100" title="Call">
          <PhoneIcon className="h-5 w-5" />
        </button>
        <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100" title="Video call">
          <VideoIcon className="h-5 w-5" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            title="More options"
          >
            <MoreVerticalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectionBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    connected: 'bg-emerald-50 text-emerald-600',
    connecting: 'bg-amber-50 text-amber-600',
    disconnected: 'bg-red-50 text-red-600',
    error: 'bg-red-50 text-red-600',
    idle: 'bg-gray-50 text-gray-400',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[status] ?? styles.idle}`}>
      {status}
    </span>
  );
}