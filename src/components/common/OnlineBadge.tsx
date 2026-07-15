export function OnlineBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
        isOnline ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
      aria-label={isOnline ? 'Online' : 'Offline'}
      role="status"
    />
  );
}
