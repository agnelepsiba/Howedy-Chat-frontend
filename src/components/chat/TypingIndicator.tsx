import { useAppSelector } from '@/store/hooks';

export function TypingIndicator({ conversationId }: { conversationId: string }) {
  const typingUserIds = useAppSelector(
    (state) => state.ui.typingByConversation[conversationId] ?? [],
  );
  const usersById = useAppSelector((state) => state.user.usersById);
  console.log('TypingIndicator render', { conversationId, typingUserIds, usersById });
  const currentUserId = useAppSelector((state) => state.user.currentUser?.id);

  const others = typingUserIds.filter((id) => id !== currentUserId);
  if (others.length === 0) return <div className="h-6" />;

  const names = others.map((id) => usersById[id]?.name ?? 'Someone');
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are typing`;

  return (
    <div className="flex h-6 items-center gap-2 px-4 text-xs text-gray-400">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
      </span>
      {label}
    </div>
  );
}
