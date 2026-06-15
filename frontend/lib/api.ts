import axios, { AxiosInstance } from 'axios';
import { AISolveResponse } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const newToken = res.data.access_token;
          localStorage.setItem('access_token', newToken);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          // Sincronizar cookie para el middleware
          document.cookie = `access_token=${newToken}; path=/; SameSite=Lax`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (err) {
          localStorage.clear();
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const aiApi = {
  solve: async (problem: string): Promise<AISolveResponse> => {
    const response = await api.post<AISolveResponse>('/ai/solve', { problem });
    return response.data;
  }
};

export default api;