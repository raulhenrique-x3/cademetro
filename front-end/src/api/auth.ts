import { apiClient } from './client';
import { LoginInput, RegisterInput } from './schemas';
import { RegisterResponseDto, TokenResponseDto, UserDto } from './types';

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
};
