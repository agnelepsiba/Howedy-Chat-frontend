/**
 * Retrieves the authentication token from localStorage
 * @returns The auth token string, or null if not available
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Stores the authentication token in localStorage
 * @param token The auth token to store
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

/**
 * Clears the authentication token from localStorage
 */
export function clearAuthToken(): void {
  localStorage.removeItem('authToken');
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

/**
 * Logs in a user with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await res.json();
  
  // Check if the response status is true
  if (!data.status) {
    throw new Error(data.message || 'Login failed');
  }

  // Extract token from the nested data structure
  const token = data.data?.token;
  if (!token) {
    throw new Error('No token received from login');
  }

  return {
    token,
    user: {
      id: '',
      name: '',
      email: email,
    },
  };
}

/**
 * Registers a new user
 */
export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Registration failed');
  }

  const data = await res.json();
  
  // Check if the response status is true
  if (!data.status) {
    throw new Error(data.message || 'Registration failed');
  }

  // Extract token from the nested data structure
  const token = data.data?.token || data.token;
  if (!token) {
    throw new Error('No token received from registration');
  }

  return {
    token,
    user: {
      id: '',
      name: name,
      email: email,
    },
  };
}

/**
 * Fetches the current user's profile
 */
export async function getMyProfile(): Promise<AuthResponse['user']> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const res = await fetch(`${API_BASE_URL}/auth/myProfile`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });

  if (!res.ok) {
    let errorMessage = 'Failed to fetch profile';
    try {
      const error = await res.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();

  // Extract profile data from nested structure
  // Response format: { status: true, data: { user: {...} } }
  const profileData = data.data?.user || data.data || data;
  
  if (!profileData || !profileData._id) {
    throw new Error('Invalid profile data received');
  }

  // Map _id to id and return user object
  return {
    id: profileData._id,
    name: profileData.name || '',
    email: profileData.email || '',
    avatarUrl: profileData.avatarUrl,
  };
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

/**
 * Fetches all users for starting conversations
 */
export async function getAllUsers(): Promise<ChatUser[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const res = await fetch(`${API_BASE_URL}/auth/users`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });

  if (!res.ok) {
    let errorMessage = 'Failed to fetch users';
    try {
      const error = await res.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();

  // Extract users from response
  // Response format: { success: true, data: [...] }
  const users = data.data || [];

  if (!Array.isArray(users)) {
    throw new Error('Invalid users data received');
  }

  return users;
}
