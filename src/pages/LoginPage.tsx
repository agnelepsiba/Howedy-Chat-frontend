import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { currentUserSet } from '@/store/slices/userSlice';
import { login, setAuthToken, getMyProfile } from '@/services/authApi';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Email is required');
      }
      if (!password) {
        throw new Error('Password is required');
      }

      const response = await login(email, password);

      if (!response.token) {
        throw new Error('Login failed: No token received');
      }

      setAuthToken(response.token);

      const user = await getMyProfile();

      if (!user.id) {
        throw new Error('Failed to load user profile');
      }

      dispatch(
        currentUserSet({
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          isOnline: true,
        }),
      );

      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Welcome back to Howdy</h1>
        <p className="mb-6 text-sm text-gray-500">Sign in to continue chatting.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-howdy-500 focus:ring-1 focus:ring-howdy-500"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-howdy-500 focus:ring-1 focus:ring-howdy-500"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-howdy-500 py-2.5 text-sm font-medium text-white transition hover:bg-howdy-600 disabled:opacity-50"
          >
            {loading ? 'Please wait…' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/register')}
          className="mt-3 w-full text-center text-xs text-gray-500 hover:text-howdy-600"
        >
          Don't have an account? Sign up
        </button>
      </div>
    </div>
  );
}
