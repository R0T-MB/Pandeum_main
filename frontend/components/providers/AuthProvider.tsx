'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/nextjs'
import api from '@/lib/api'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  isGuest: boolean
  logout: () => void
  refreshUser: () => Promise<void>
  switchRole: (role: 'client' | 'provider') => Promise<User>
  convertToProvider: (businessName?: string) => Promise<User>
  deleteAccount: (confirmEmail: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { isLoaded: clerkLoaded, isSignedIn } = useUser()
  const { signOut: clerkSignOut } = useClerk()

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me')
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!clerkLoaded) return

    const initAuth = async () => {
      if (isSignedIn) {
        await fetchUser()
      } else {
        setUser(null)
        setLoading(false)
      }
    }

    initAuth()
  }, [clerkLoaded, isSignedIn])

  const logout = () => {
    setUser(null)
    clerkSignOut({ redirectUrl: '/login' })
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  const switchRole = async (role: 'client' | 'provider') => {
    const response = await api.put('/users/me/role', { role })
    setUser(response.data)
    return response.data
  }

  const convertToProvider = async (businessName?: string) => {
    const response = await api.post('/users/me/convert-to-provider', {
      business_name: businessName || null,
    })
    setUser(response.data)
    return response.data
  }

  const deleteAccount = async (confirmEmail: string) => {
    await api.delete('/users/me', { data: { confirm_email: confirmEmail } })
    logout()
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest: !loading && !user, logout, refreshUser, switchRole, convertToProvider, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}