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
  tenantId?: string;
  tenantName?: string;
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
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // For development: check demo credentials first
          if (email === 'admin@nexus.lk' && password === 'admin123') {
            const mockUser: User = {
              id: '1',
              email: 'admin@nexus.lk',
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin',
              permissions: ['tenant:read', 'tenant:create', 'tenant:update', 'tenant:delete', 'user:read', 'user:create'],
              tenantId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              tenantName: 'Acme Corporation'
            };
            
            const mockToken = 'demo-token-123';
            
            // Set the token in API client
            api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
            
            set({
              user: mockUser,
              token: mockToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
          
          // Try real API call through the API Gateway
          const response = await api.post('/api/v1/auth/login', { 
            email, 
            password 
          });
          
          const { token, user } = response.data;
          
          // Set the token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
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
        // Clear token from API client
        delete api.defaults.headers.common['Authorization'];
        
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

      initializeAuth: async () => {
        const state = get();
        if (state.token && !state.isAuthenticated) {
          try {
            // Set token in API client
            api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
            
            // Verify token is still valid by calling a protected endpoint
            const response = await api.get('/api/v1/auth/me');
            set({ user: response.data, isAuthenticated: true });
          } catch (error) {
            // Token is invalid, clear auth state
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        }
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
