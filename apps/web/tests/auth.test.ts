import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../src/stores/authStore';

// Simple polyfill for localStorage in node test environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
});

describe('Auth Store (Zustand)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('logs in demo user correctly and persists in state', () => {
    const { loginDemo } = useAuthStore.getState();
    loginDemo('Backend Developer');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('alex.fresher@college.edu');
    expect(state.user?.targetRole).toBe('Backend Developer');
    expect(state.token).toBeDefined();
    expect(localStorage.getItem('fmi_token')).toBe(state.token);
  });

  it('clears auth on logout', () => {
    const { loginDemo, clearAuth } = useAuthStore.getState();
    loginDemo();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    clearAuth();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('fmi_token')).toBeNull();
  });
});
