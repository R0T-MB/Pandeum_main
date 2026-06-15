'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, History, Heart, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Conversation {
  id: string
  problem_text: string
  created_at: string
}

interface Favorite {
  provider_id: string
  provider_name: string
  created_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      const [convRes, favRes] = await Promise.all([
        api.get('/users/me/conversations'),
        api.get('/providers/me/favorites')
      ])
      setConversations(convRes.data)
      setFavorites(favRes.data)
    } catch (error) {
      console.error('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-64">
          <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu />
            </button>
            <h1 className="text-2xl font-bold mt-4 lg:mt-0">Dashboard</h1>
          </header>
          <div className="p-4">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu />
          </button>
          <h1 className="text-2xl font-bold mt-4 lg:mt-0">Dashboard</h1>
        </header>
        <div className="p-4">
          {/* Resumen de usuario */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Bienvenido, {user?.full_name || user?.email}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conversaciones</span>
                </div>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Favoritos</span>
                </div>
                <p className="text-2xl font-bold">{favorites.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Miembro desde</span>
                </div>
                <p className="text-sm font-semibold">
                  {user ? new Date().toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Accesos rápidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/history')}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <p className="font-semibold">Historial</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ver conversaciones pasadas</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/favorites')}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div className="text-left">
                  <p className="font-semibold">Favoritos</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ver proveedores guardados</p>
                </div>
              </button>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Actividad reciente</h2>
            {conversations.length === 0 && favorites.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No hay actividad reciente</p>
            ) : (
              <div className="space-y-3">
                {conversations.slice(0, 3).map((conv) => (
                  <div key={conv.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium truncate">{conv.problem_text}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(conv.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {conversations.length === 0 && favorites.slice(0, 3).map((fav) => (
                  <div key={fav.provider_id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium">{fav.provider_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Añadido: {new Date(fav.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
