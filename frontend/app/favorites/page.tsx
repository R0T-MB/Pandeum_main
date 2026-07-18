'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, Heart, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else if (!user && !loading) {
      setLoading(false)
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
      setFavorites(favorites.filter((f: any) => f.provider_id !== providerId))
      toast.success('Eliminado de favoritos')
    } catch (error) {
      toast.error('Error al eliminar favorito')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0B1020] items-center justify-center">
        <Loader2 size={32} className="text-[#6D5EF8] animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0B1020]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1E2D4A]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white">
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-semibold text-white">Mis Favoritos</h1>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center">
            <Heart size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mx-auto mb-4">
                <Heart size={22} className="text-[#1E2D4A]" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-[#9CA3AF]">No tienes favoritos aún</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              {favorites.map((favorite: any) => (
                <div key={favorite.provider_id} className="bg-[#111827] border border-[#1E2D4A] rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#1E2D4A]/80 transition-all duration-200">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">{favorite.provider_name}</h3>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      Añadido: {new Date(favorite.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFavorite(favorite.provider_id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all duration-200 flex-shrink-0"
                  >
                    <Trash2 size={12} strokeWidth={1.75} />
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
