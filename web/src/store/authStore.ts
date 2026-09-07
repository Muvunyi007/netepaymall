import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await api.post('/api/v1/auth/login', { email, password });
    api.setTokens(response.access_token, response.refresh_token);
    set({ user: response.user, isAuthenticated: true });
  },

  register: async (data: any) => {
    const response = await api.post('/api/v1/auth/register', data);
    api.setTokens(response.access_token, response.refresh_token);
    set({ user: response.user, isAuthenticated: true });
  },

  logout: () => {
    api.clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      api.loadTokens();
      const response = await api.get('/api/v1/auth/me');
      set({ user: response, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));