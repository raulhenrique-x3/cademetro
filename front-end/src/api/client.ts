import axios, { AxiosError } from 'axios';
import { storage, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/storage';
import { ApiErrorResponse, TokenResponseDto } from './types';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8006';

function createTimeoutSignal(timeoutMs: number): AbortSignal | undefined {
  if (typeof AbortSignal !== 'undefined') {
    if (typeof (AbortSignal as any).timeout === 'function') {
      return (AbortSignal as any).timeout(timeoutMs);
    }
    if (typeof AbortController !== 'undefined') {
      const controller = new AbortController();
      setTimeout(() => {
        controller.abort(new Error(`Timeout of ${timeoutMs}ms exceeded`));
      }, timeoutMs);
      return controller.signal;
    }
  }
  return undefined;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach bearer token and ensure guaranteed AbortSignal timeout
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.signal) {
      const signal = createTimeoutSignal(config.timeout || 10000);
      if (signal) {
        config.signal = signal;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: error normalization & auto-refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as any;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await axios.post<TokenResponseDto>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            {
              timeout: 10000,
              signal: createTimeoutSignal(10000),
            },
          );

          const { accessToken, refreshToken: newRefresh } = response.data;
          storage.setItem(AUTH_TOKEN_KEY, accessToken);
          storage.setItem(REFRESH_TOKEN_KEY, newRefresh);

          apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          processQueue(null, accessToken);
          return apiClient(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          storage.removeItem(AUTH_TOKEN_KEY);
          storage.removeItem(REFRESH_TOKEN_KEY);
          return Promise.reject(normalizeError(refreshErr as AxiosError<ApiErrorResponse>));
        } finally {
          isRefreshing = false;
        }
      } else {
        storage.removeItem(AUTH_TOKEN_KEY);
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

export function normalizeError(error: AxiosError<ApiErrorResponse> | any): ApiErrorResponse {
  if (error.response?.data && typeof error.response.data === 'object' && error.response.data.message) {
    return error.response.data;
  }

  const isNetworkError =
    !error.response ||
    error.code === 'ERR_NETWORK' ||
    error.message?.includes('Network Error');

  const isTimeout =
    error.code === 'ECONNABORTED' ||
    error.name === 'AbortError' ||
    error.message?.toLowerCase().includes('timeout');

  let statusCode = error.response?.status;
  let message = 'Não foi possível conectar ao servidor. Verifique sua conexão.';

  if (isTimeout) {
    statusCode = 408;
    message = 'Tempo de conexão esgotado. Verifique se o servidor está respondendo.';
  } else if (isNetworkError && !error.response) {
    statusCode = 0;
    message = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  } else if (statusCode === 401) {
    message = 'Sessão expirada ou não autorizada. Faça login novamente.';
  } else if (statusCode === 403) {
    message = 'Você não tem permissão para realizar esta ação.';
  } else if (statusCode === 404) {
    message = 'Recurso não encontrado.';
  } else if (statusCode === 409) {
    message = 'Este e-mail já está cadastrado.';
  } else if (statusCode === 429) {
    message = 'Muitas tentativas em pouco tempo. Aguarde um instante.';
  } else if (statusCode && statusCode >= 500) {
    message = 'Erro interno do servidor. Tente novamente mais tarde.';
  }

  return {
    statusCode: statusCode ?? 500,
    error: error.response?.statusText || error.code || error.name || 'Error',
    message,
    path: error.config?.url,
    timestamp: new Date().toISOString(),
  };
}
