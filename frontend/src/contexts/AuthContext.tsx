'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@/types';
import { getToken, setToken, removeToken, getStoredUser, setStoredUser } from '@/lib/auth';
import { clientFetch } from '@/lib/clientApi';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = getToken();
    const savedUser = getStoredUser();
    if (savedToken && savedUser) {
      setTokenState(savedToken);
      setUser(savedUser);
      // Refresh user data from server to get up-to-date roles/permissions
      clientFetch<{ success: boolean; data: User }>('/auth/me')
        .then((res) => {
          setUser(res.data);
          setStoredUser(res.data);
        })
        .catch(() => {
          // Token expired or invalid — clear session
          removeToken();
          setTokenState(null);
          setUser(null);
          syncCookie(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const syncCookie = (token: string | null) => {
    if (token) {
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await clientFetch<{ success: boolean; data: { token: string; user: User } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    setToken(res.data.token);
    setStoredUser(res.data.user);
    setTokenState(res.data.token);
    setUser(res.data.user);
    syncCookie(res.data.token);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await clientFetch<{ success: boolean; data: { token: string; user: User } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password, password_confirmation: password }) }
    );
    setToken(res.data.token);
    setStoredUser(res.data.user);
    setTokenState(res.data.token);
    setUser(res.data.user);
    syncCookie(res.data.token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await clientFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore errors on logout
    } finally {
      removeToken();
      setTokenState(null);
      setUser(null);
      syncCookie(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin: !!user?.roles?.includes('admin'),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
