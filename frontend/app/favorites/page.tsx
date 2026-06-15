'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import { Menu } from 'lucide-react'
import toast from 'react-hot-toast'

interface Favorite {
  provider_id: string
  provider_name: string
  created_at: string
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user])

  const loadFavorites = async () => {
    try {
      const response = await api.get('/providers/me/favorites')
      setFavorites(response.data)
    } catch (error) {
      toast.error('Error al cargar favoritos')
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (providerId: string) => {
    try {
      await api.delete(`/providers/${providerId}/favorite`)
      setFavorites(favorites.filter(f => f.provider_id !== providerId))
      toast.success('Eliminado de favoritos')
    } catch (error) {
      toast.error('Error al eliminar favorito')
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
            <h1 className="text-2xl font-bold mt-4 lg:mt-0">Mis Favoritos</h1>
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
          <h1 className="text-2xl font-bold mt-4 lg:mt-0">Mis Favoritos</h1>
        </header>
        <div className="p-4">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No tienes favoritos aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((favorite) => (
                <div key={favorite.provider_id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{favorite.provider_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Añadido: {new Date(favorite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFavorite(favorite.provider_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
