import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { createConversation } from '@/services/chatApi';
import { getAllUsers, type ChatUser } from '@/services/authApi';
import { usersUpserted } from '@/store/slices/userSlice';
import { conversationsLoaded } from '@/store/slices/chatSlice';
import { Avatar } from '@/components/common/Avatar';

export function NewConversationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const conversations = useAppSelector((state) => state.chat.conversations);
  
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setFetchingUsers(true);
      setError(null);
      try {
        const allUsers = await getAllUsers();
        // Filter out current user
        const availableUsers = allUsers.filter((u) => u.id !== currentUser?.id);
        setUsers(availableUsers);

        // Update Redux store with users
        dispatch(usersUpserted(availableUsers));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchUsers();
  }, [isOpen, currentUser?.id, dispatch]);

  const handleCreateConversation = async () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedUser = users.find((u) => u.id === selectedUserId);
      if (!selectedUser) {
        throw new Error('User not found');
      }
      
      // Check if conversation already exists
      const existingConversation = Object.values(conversations).find(
        (conv) =>
          !conv.isGroup &&
          conv.participantIds.includes(selectedUserId) &&
          conv.participantIds.includes(currentUser!.id),
      );

      if (existingConversation) {
        onClose();
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const newConversation = await createConversation(
        [selectedUserId],
        selectedUser.name,
        false,
      );

      if (!newConversation || !newConversation.id) {
        throw new Error('Failed to create conversation: No ID returned');
      }

      // Update conversations in store
      const updatedConversations = [...Object.values(conversations), newConversation];
      dispatch(conversationsLoaded(updatedConversations));

      onClose();
      navigate(`/chat/${newConversation.id}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create conversation';
      console.error('Error creating conversation:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Start a conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
          {fetchingUsers ? (
            <p className="py-6 text-center text-sm text-gray-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No users available</p>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full rounded-lg p-3 text-left transition ${
                  selectedUserId === user.id
                    ? 'bg-howdy-100 border-2 border-howdy-500'
                    : 'border-2 border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className={`text-xs ${user.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                      {user.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={!selectedUserId || loading || fetchingUsers}
            className="flex-1 rounded-lg bg-howdy-500 py-2.5 text-sm font-medium text-white hover:bg-howdy-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
