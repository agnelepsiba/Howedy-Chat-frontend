export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}