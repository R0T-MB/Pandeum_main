'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api, aiApi } from '@/lib/api'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ProvidersDrawer } from '@/components/chat/ProvidersDrawer'
import { RouteMapModal } from '@/components/map/RouteMapModal'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, MessageSquare } from 'lucide-react'
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
    <div className="flex h-screen bg-[#000000]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-[#1d1d22] border-b border-[#3b3b43] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[#3b3b43] transition-colors text-[#868393] hover:text-white"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[#868393]" />
            <span className="text-sm font-medium text-white">Pandeum</span>
          </div>
          <div className="w-7" />
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#1d1d22] border border-[#3b3b43] flex items-center justify-center mx-auto mb-5">
                  <MessageSquare size={22} className="text-[#868393]" />
                </div>
                <h1 className="text-xl font-semibold text-white mb-2 leading-snug">
                  Hola, ¿en qué puedo ayudarte hoy?
                </h1>
                <p className="text-sm text-[#868393] mb-6 leading-relaxed">
                  Describe tu situación de forma natural. Te ayudaré a encontrar la mejor solución.
                </p>
                <div className="grid gap-2.5">
                  {[
                    "Mi laptop se apaga cuando juego",
                    "Necesito un tutor de cálculo para mi examen",
                    "El lavaplatos está inundando la cocina",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => handleSendMessage(example)}
                      className="bg-[#1d1d22] border border-[#3b3b43] rounded-xl px-4 py-3 text-left hover:bg-[#3b3b43] transition-colors text-sm text-white"
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
                  <div className="bg-[#1d1d22] border border-[#3b3b43] rounded-xl rounded-tl-sm px-4 py-3 max-w-[75%]">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-[#5e5d69] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#5e5d69] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#5e5d69] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#3b3b43] bg-[#1d1d22] flex-shrink-0">
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