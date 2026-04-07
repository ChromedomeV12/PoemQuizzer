/**
 * Auth Store (Zustand)
 * Manages authentication state across the app.
 */

import { create } from 'zustand';
import { AuthState, User } from '../types';
import { authApi, getToken } from '../services/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  isAuthenticated: !!getToken(),
  isLoading: false,

  login: (token: string, user: User) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user: User) => {
    set({ user });
  },
}));

/**
 * Hook to initialize auth state on app load.
 * Fetches current user if a token exists.
 */
export async function initializeAuth(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await authApi.getMe();
    if (response.error || !(response.data as Record<string, unknown>)?.user) {
      localStorage.removeItem('token');
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem('token');
    return false;
  }
}
