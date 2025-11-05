// API 클라이언트 설정
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: Authorization 헤더 자동 추가
apiClient.interceptors.request.use((config) => {
  // zustand persist에서 토큰 가져오기
  const authData = localStorage.getItem('pptpro-auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      const token = parsed.state?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to parse auth data:', e);
    }
  }
  return config;
});

// 응답 인터셉터: 401 에러 시 로그아웃 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // zustand persist 스토리지 클리어
      localStorage.removeItem('pptpro-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;