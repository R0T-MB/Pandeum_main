'use client'

import axios, { AxiosInstance } from 'axios'
import type { AISolveResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const setAuthToken = (token: string) => {
  api.defaults.headers.common.Authorization = `Bearer ${token}` 
}

export const removeAuthToken = () => {
  delete api.defaults.headers.common.Authorization
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')

      if (token) {
        config.headers.Authorization = `Bearer ${token}` 
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      const refreshToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('refresh_token')
          : null

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const newAccessToken = response.data.access_token
          const newRefreshToken = response.data.refresh_token

          localStorage.setItem('access_token', newAccessToken)
          localStorage.setItem('refresh_token', newRefreshToken)

          document.cookie = `access_token=${newAccessToken}; path=/; SameSite=Lax` 

          setAuthToken(newAccessToken)

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}` 

          return api(originalRequest)
        } catch (refreshError) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')

          document.cookie =
            'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'

          window.location.href = '/login'

          return Promise.reject(refreshError)
        }
      }

      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export const aiApi = {
  solve: async (problem: string): Promise<AISolveResponse> => {
    const response = await api.post<AISolveResponse>('/ai/solve', {
      problem,
    })

    return response.data
  },
}

export default api