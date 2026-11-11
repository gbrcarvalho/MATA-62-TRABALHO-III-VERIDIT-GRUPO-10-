'use client';

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Account, LoginResponse, LoginRequest } from '@/types/auth';

interface AuthContextType {
  user: Account | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Ao montar, recupera do localStorage (não há GET /me no back)
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  async function login(data: LoginRequest) {
    const res = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.accountResponseDto));
    setUser(res.accountResponseDto);
    router.push('/profile');
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // se falhar (token expirado etc.), segue com limpeza local
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      router.push('/login');
    }
  }

  return createElement(AuthContext.Provider, { value: { user, loading, login, logout } }, children);
}

export const useAuth = () => useContext(AuthContext);