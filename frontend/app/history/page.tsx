'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import { Conversation } from '@/types'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, History, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadHistory()
    } else if (!user && !loading) {
      setLoading(false)
    }
  }, [user])

  const loadHistory = async () => {
    try {
      const response = await api.get('/users/me/conversations')
      setConversations(response.data)
    } catch (error: any) {
      const status = error?.response?.status || ''
      const detail = error?.response?.data?.detail || error?.message || ''
      console.error('History error:', { status, detail, url: '/users/me/conversations' })
      toast.error(detail ? `Error: ${detail}` : 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  const openConversation = (conversationId: string) => {
    router.push(`/?conversation=${conversationId}`)
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
          <h1 className="text-base font-semibold text-white">Historial</h1>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center">
            <History size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mx-auto mb-4">
                <History size={22} className="text-[#1E2D4A]" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-[#9CA3AF]">No hay conversaciones aún</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              {conversations.map((conversation: Conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => openConversation(conversation.id)}
                  className="bg-[#111827] border border-[#1E2D4A] rounded-2xl p-4 cursor-pointer hover:bg-[#151E2F] hover:border-[#6D5EF8]/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {conversation.problem_text}
                      </h3>
                      <p className="text-xs text-[#9CA3AF] mt-1.5">
                        {new Date(conversation.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
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
