// 인증 관련 API 함수들
import apiClient from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// 회원가입
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

// 로그인
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

// 토큰 갱신
export const refreshToken = async (refresh_token: string): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/refresh', { refresh_token });
  return response.data;
};

// 현재 사용자 정보 조회
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};