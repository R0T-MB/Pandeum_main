'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api, aiApi } from '@/lib/api'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ProvidersDrawer } from '@/components/chat/ProvidersDrawer'
import { RouteMapModal } from '@/components/map/RouteMapModal'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Message, ProviderRecommendation } from '@/types'

export default function HomePage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerProviders, setDrawerProviders] = useState<ProviderRecommendation[]>([])
  const [drawerLabel, setDrawerLabel] = useState<string | undefined>()
  const [selectedProvider, setSelectedProvider] = useState<ProviderRecommendation | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user])

  const loadHistory = async () => {
    try {
      const response = await api.get('/users/me/conversations')
      const conversations = response.data
      const historyMessages: Message[] = []
      conversations.forEach((conv: any) => {
        historyMessages.push({
          id: conv.id + '-user',
          role: 'user',
          content: conv.problem_text,
          timestamp: new Date(conv.created_at)
        })
        historyMessages.push({
          id: conv.id + '-assistant',
          role: 'assistant',
          content: conv.ai_response,
          timestamp: new Date(conv.created_at)
        })
      })
      setMessages(historyMessages)
    } catch (error) {
      console.error('Error loading history')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (problem: string) => {
    if (!problem.trim()) return
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: problem,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    try {
      const aiData = await aiApi.solve(problem)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiData,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Error al procesar tu consulta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPlaces = (providers: ProviderRecommendation[], label?: string) => {
    setDrawerProviders(providers)
    setDrawerLabel(label)
    setDrawerOpen(true)
  }

  const handleDistanceClick = (provider: ProviderRecommendation) => {
    setSelectedProvider(provider)
    setMapOpen(true)
  }

  return (
    <div className="flex h-screen bg-[#0B1020]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimal header */}
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center">
            <Sparkles size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 -mt-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6D5EF8] to-[#5B4FE0] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#6D5EF8]/20">
                  <Sparkles size={28} className="text-white" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  Hola, ¿en qué puedo ayudarte hoy?
                </h1>
                <p className="text-sm text-[#9CA3AF] mb-8 leading-relaxed max-w-sm mx-auto">
                  Estoy aquí para ayudarte a encontrar la mejor solución para tu problema.
                </p>
                <div className="space-y-2.5 max-w-sm mx-auto">
                  {[
                    "Mi laptop se apaga cuando juego",
                    "Necesito un tutor de cálculo para mi examen",
                    "El lavaplatos está inundando la cocina",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => handleSendMessage(example)}
                      className="w-full bg-[#111827] border border-[#1E2D4A] hover:bg-[#151E2F] hover:border-[#1E2D4A]/80 rounded-2xl px-5 py-3 text-left transition-all duration-200 text-sm text-white"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onViewPlaces={handleViewPlaces} />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#151E2F] border border-[#1E2D4A] rounded-[18px] rounded-tl-sm px-5 py-4">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-[#6D5EF8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#6D5EF8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#6D5EF8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 flex-shrink-0">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>

      {/* Providers Drawer */}
      <ProvidersDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        providers={drawerProviders}
        recommendationLabel={drawerLabel}
        onDistanceClick={handleDistanceClick}
      />

      {/* Route Map Modal */}
      <RouteMapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        provider={selectedProvider}
      />
    </div>
  )
}
