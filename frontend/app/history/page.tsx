'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import { Menu } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Conversation {
  id: string
  problem_text: string
  created_at: string
}

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user])

  const loadHistory = async () => {
    try {
      const response = await api.get('/users/me/conversations')
      setConversations(response.data)
    } catch (error) {
      toast.error('Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  const openConversation = (conversationId: string) => {
    router.push(`/?conversation=${conversationId}`)
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
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
            <h1 className="text-2xl font-bold mt-4 lg:mt-0">Historial</h1>
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
          <h1 className="text-2xl font-bold mt-4 lg:mt-0">Historial</h1>
        </header>
        <div className="p-4">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No hay conversaciones aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => openConversation(conversation.id)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">
                        {truncateText(conversation.problem_text, 60)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(conversation.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
