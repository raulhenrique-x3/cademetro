import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authApi, parseGoogleOAuthError } from '@/api/auth';
import { apiClient } from '@/api/client';
import { LoginInput, RegisterInput } from '@/api/schemas';
import { UserDto } from '@/api/types';
import { storage, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<UserDto>;
  register: (input: RegisterInput) => Promise<UserDto>;
  loginWithTokens: (tokens: AuthTokens) => Promise<UserDto>;
  loginWithGoogle: () => Promise<UserDto | null>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!storage.getItem(AUTH_TOKEN_KEY));

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
    const token = storage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return;
    }

    let isMounted = true;
    authApi
      .getMe()
      .then((me) => {
        if (isMounted) setUser(me);
      })
      .catch(() => {
        if (isMounted) {
          storage.removeItem(AUTH_TOKEN_KEY);
          storage.removeItem(REFRESH_TOKEN_KEY);
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithTokens = useCallback(
    async (tokens: AuthTokens): Promise<UserDto> => {
      storage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
      storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;

      const me = await authApi.getMe();
      setUser(me);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      return me;
    },
    [],
  );

  const login = async (input: LoginInput): Promise<UserDto> => {
    const tokens = await authApi.login(input);
    return loginWithTokens(tokens);
  };

  const register = async (input: RegisterInput): Promise<UserDto> => {
    await authApi.register(input);
    // Auto-login after successful registration
    return login({ email: input.email, password: input.password });
  };

  const loginWithGoogle = useCallback(async (): Promise<UserDto | null> => {
    const redirectUrl = Linking.createURL('auth/callback');
    const authUrl = authApi.getGoogleAuthUrl(redirectUrl);

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      const queryParams = parsed.queryParams || {};
      const accessToken = queryParams.accessToken as string | undefined;
      const refreshToken = queryParams.refreshToken as string | undefined;
      const error = queryParams.error as string | undefined;

      if (error) {
        throw new Error(parseGoogleOAuthError(error));
      }

      if (accessToken && refreshToken) {
        return await loginWithTokens({ accessToken, refreshToken });
      }

      throw new Error('Tokens não recebidos do Google. Tente novamente.');
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return null;
    }

    return null;
  }, [loginWithTokens]);

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
    delete apiClient.defaults.headers.common.Authorization;
    setUser(null);
    queryClient.clear();
  };

  const deleteAccount = async (): Promise<void> => {
    try {
      await authApi.deleteAccount();
    } finally {
      storage.removeItem(AUTH_TOKEN_KEY);
      storage.removeItem(REFRESH_TOKEN_KEY);
      delete apiClient.defaults.headers.common.Authorization;
      setUser(null);
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithTokens,
        loginWithGoogle,
        logout,
        deleteAccount,
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
