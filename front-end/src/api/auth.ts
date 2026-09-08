import { apiClient, API_BASE_URL } from './client';
import { LoginInput, RegisterInput } from './schemas';
import { RegisterResponseDto, TokenResponseDto, UserDto } from './types';

export function parseGoogleOAuthError(errorCode?: string | string[] | null): string {
  const raw = Array.isArray(errorCode) ? errorCode[0] : errorCode;
  if (!raw) {
    return 'Falha na autenticação com o Google. Tente novamente.';
  }

  const normalized = String(raw).toLowerCase();
  if (normalized.includes('access_denied')) {
    return 'Acesso cancelado ou não autorizado pelo Google.';
  }
  if (normalized.includes('invalid_state')) {
    return 'Sessão de autenticação expirada ou inválida. Tente novamente.';
  }
  if (normalized.includes('suspended')) {
    return 'Esta conta está suspensa.';
  }
  if (normalized.includes('email_unverified') || normalized.includes('not verified')) {
    return 'O e-mail do Google não está verificado.';
  }
  if (normalized.includes('email') || normalized.includes('conflict')) {
    return 'Este e-mail já está vinculado a outra conta.';
  }
  if (normalized.includes('google_unavailable')) {
    return 'O Google está indisponível no momento. Tente novamente.';
  }

  return `Erro ao autenticar com o Google (${raw}). Tente novamente.`;
}

export const authApi = {
  async register(dto: RegisterInput): Promise<RegisterResponseDto> {
    const { data } = await apiClient.post<RegisterResponseDto>('/auth/register', dto);
    return data;
  },

  async login(dto: LoginInput): Promise<TokenResponseDto> {
    const { data } = await apiClient.post<TokenResponseDto>('/auth/login', dto);
    return data;
  },

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    const { data } = await apiClient.post<TokenResponseDto>('/auth/refresh', { refreshToken });
    return data;
  },

  async logout(refreshToken: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/logout', { refreshToken });
    return data;
  },

  async getMe(): Promise<UserDto> {
    const { data } = await apiClient.get<UserDto>('/auth/me');
    return data;
  },

  async deleteAccount(): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>('/auth/me');
    return data;
  },

  getGoogleAuthUrl(returnUrl?: string): string {
    const base = API_BASE_URL.replace(/\/+$/, '');
    if (!returnUrl) {
      return `${base}/auth/google`;
    }
    const params = new URLSearchParams({ returnUrl });
    return `${base}/auth/google?${params.toString()}`;
  },
};

