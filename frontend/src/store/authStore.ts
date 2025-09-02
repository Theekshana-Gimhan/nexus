import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  tenantId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // For development: check demo credentials
          if (email === 'admin@nexus.lk' && password === 'admin123') {
            const mockUser = {
              id: '1',
              email: 'admin@nexus.lk',
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin',
              permissions: ['read', 'write', 'delete'],
              tenantId: 'demo-tenant'
            };
            
            set({
              user: mockUser,
              token: 'demo-token-123',
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
          
          // Try real API call
          const response = await api.post('/auth/login', { email, password });
          const data = response.data;
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          
          // If it's a network error, provide helpful feedback
          if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
            throw new Error('Backend server is not running. Use demo credentials: admin@nexus.lk / admin123');
          }
          
          const message = error.response?.data?.message || error.message || 'Login failed';
          throw new Error(message);
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
