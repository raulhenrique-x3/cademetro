import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '@/api/auth';
import { LoginInput, RegisterInput } from '@/api/schemas';
import { UserDto } from '@/api/types';
import { storage, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<UserDto>;
  register: (input: RegisterInput) => Promise<UserDto>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const token = storage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      storage.removeItem(AUTH_TOKEN_KEY);
      storage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (input: LoginInput): Promise<UserDto> => {
    const tokens = await authApi.login(input);
    storage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

    const me = await authApi.getMe();
    setUser(me);
    queryClient.invalidateQueries({ queryKey: ['me'] });
    return me;
  };

  const register = async (input: RegisterInput): Promise<UserDto> => {
    await authApi.register(input);
    // Auto-login after successful registration
    return login({ email: input.email, password: input.password });
  };

  const logout = async (): Promise<void> => {
    const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout error on server
      }
    }
    storage.removeItem(AUTH_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
