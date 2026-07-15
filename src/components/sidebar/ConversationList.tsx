import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConversationItem } from './ConversationItem';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar } from '@/components/common/Avatar';
import { socketService } from '@/services/socketService';
import { currentUserCleared } from '@/store/slices/userSlice';
import { clearAuthToken } from '@/services/authApi';

export function ConversationList({
  activeConversationId,
  onCreateConversation,
}: {
  activeConversationId?: string;
  onCreateConversation?: () => void;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Selectors
  const conversations = useAppSelector((state) => state.chat.conversations);
  const order = useAppSelector((state) => state.chat.conversationOrder);
  const currentUser = useAppSelector((state) => state.user.currentUser);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  // Profile Menu Dropdown State
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    socketService.disconnect();
    dispatch(currentUserCleared());
    clearAuthToken()
    navigate('/login');
  };

  const filteredIds = useMemo(() => {
    if (!debouncedQuery.trim()) return order;
    const q = debouncedQuery.toLowerCase();
    return order.filter((id) => conversations[id]?.name.toLowerCase().includes(q));
  }, [order, conversations, debouncedQuery]);

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Search Header */}
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-howdy-500 focus:ring-1 focus:ring-howdy-500"
          />
          <button
            onClick={onCreateConversation}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-howdy-500 text-white hover:bg-howdy-600"
            title="Start a new conversation"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {filteredIds.map((id) => (
          <ConversationItem
            key={id}
            conversation={conversations[id]}
            isActive={id === activeConversationId}
            onSelect={(convoId) => navigate(`/chat/${convoId}`)}
          />
        ))}
        {filteredIds.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-gray-400">No conversations found</p>
        )}
      </div>

      {/* User Profile Footer */}
      {currentUser && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={currentUser.name} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Active
              </div>
            </div>
          </div>
          
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-200 focus:outline-none"
              title="Account settings"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="12" cy="19" r="1.75" />
              </svg>
            </button>

            {profileMenuOpen && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}