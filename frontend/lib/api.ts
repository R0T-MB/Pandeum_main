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
  async (config) => {
    if (typeof window !== 'undefined') {
      try {
        const clerk = (window as any).Clerk
        if (clerk?.session) {
          const token = await clerk.session.getToken()
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
            return config
          }
        }
      } catch {}

      const oldToken = localStorage.getItem('access_token')

      if (oldToken) {
        config.headers.Authorization = `Bearer ${oldToken}` 
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

      try {
        const clerk = (window as any).Clerk
        if (clerk?.session) {
          const token = await clerk.session.getToken()
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          }
        }
      } catch {}

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

          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export const aiApi = {
  solve: async (problem: string, conversation_context?: Array<{ problem_text: string; ai_response: unknown }>): Promise<AISolveResponse> => {
    const response = await api.post<AISolveResponse>('/ai/solve', {
      problem,
      conversation_context,
    })

    return response.data
  },
}

export default api