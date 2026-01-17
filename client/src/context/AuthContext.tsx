import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../lib/api';
import { queryClient } from '../lib/queryClient';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  organisationId: number;
  organisation: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<{ data: User }>('/auth/me');
      setUser(response.data);
    } catch {
      setUser(null);
      api.clearToken();
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ data: { token: string; user: User } }>('/auth/login', {
      email,
      password,
    });

    api.setToken(response.data.token);
    setUser(response.data.user);
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
    queryClient.clear();
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
