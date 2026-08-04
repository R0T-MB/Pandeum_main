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