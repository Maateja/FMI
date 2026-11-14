import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  targetRole: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  initialize: () => Promise<void>;
  loginDemo: (role?: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: (user: AuthUser, token: string) => {
    localStorage.setItem('fmi_token', token);
    localStorage.setItem('fmi_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem('fmi_token');
    localStorage.removeItem('fmi_user');
    supabase.auth.signOut().catch(() => {});
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  initialize: async () => {
    // 1. Check local storage first for quick restore
    const savedToken = localStorage.getItem('fmi_token');
    const savedUser = localStorage.getItem('fmi_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as AuthUser;
        set({ user: parsedUser, token: savedToken, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem('fmi_token');
        localStorage.removeItem('fmi_user');
      }
    }

    // 2. Sync with Supabase session if available
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const sbUser = data.session.user;
        const authUser: AuthUser = {
          id: sbUser.id,
          email: sbUser.email || '',
          fullName: (sbUser.user_metadata?.full_name as string) || (sbUser.user_metadata?.name as string) || 'Candidate',
          avatarUrl: (sbUser.user_metadata?.avatar_url as string) || undefined,
          targetRole: (sbUser.user_metadata?.target_role as string) || 'Frontend Developer',
          role: (sbUser.user_metadata?.role as 'user' | 'admin') || 'user',
        };
        const token = data.session.access_token;
        localStorage.setItem('fmi_token', token);
        localStorage.setItem('fmi_user', JSON.stringify(authUser));
        set({ user: authUser, token, isAuthenticated: true, isLoading: false });
      } else if (!savedToken) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      // In offline / dev mode without live Supabase server
      if (!savedToken) {
        set({ isLoading: false });
      }
    }
  },

  loginDemo: (targetRole = 'Frontend Developer') => {
    // Generates a local demo token for rapid local testing
    const demoUser: AuthUser = {
      id: 'demo-fresher-001',
      email: 'alex.fresher@college.edu',
      fullName: 'Alex Morgan',
      targetRole,
      role: 'user',
    };
    // Dummy JWT structure: header.payload.signature
    const demoPayload = btoa(
      JSON.stringify({
        sub: demoUser.id,
        email: demoUser.email,
        user_metadata: {
          full_name: demoUser.fullName,
          target_role: demoUser.targetRole,
          role: demoUser.role,
        },
        exp: Math.floor(Date.now() / 1000) + 86400,
      })
    );
    const demoToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${demoPayload}.demofreshertoken`;

    localStorage.setItem('fmi_token', demoToken);
    localStorage.setItem('fmi_user', JSON.stringify(demoUser));
    set({ user: demoUser, token: demoToken, isAuthenticated: true, isLoading: false });
  },
}));

