'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api, aiApi } from '@/lib/api'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ProvidersDrawer } from '@/components/chat/ProvidersDrawer'
import { RouteMapModal } from '@/components/map/RouteMapModal'
import Sidebar from '@/components/layout/Sidebar'
import { Sparkles, Zap, ChefHat, Laptop, Wrench, Calculator, Car, PaintBucket } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Conversation, Message, ProviderRecommendation } from '@/types'

const exampleProblems = [
  { icon: ChefHat, label: 'Tengo hambre', text: 'Tengo hambre' },
  { icon: Laptop, label: 'Mi laptop no enciende', text: 'Mi laptop no enciende' },
  { icon: Wrench, label: 'Necesito un técnico', text: 'Necesito un técnico' },
  { icon: Calculator, label: 'Tutor de matemáticas', text: 'Necesito un tutor de matemáticas' },
  { icon: Car, label: 'Mecánico cerca', text: 'Busco un mecánico cerca' },
  { icon: PaintBucket, label: 'Pintor para mi casa', text: 'Necesito un pintor para mi casa' },
]

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerProviders, setDrawerProviders] = useState<ProviderRecommendation[]>([])
  const [drawerLabel, setDrawerLabel] = useState<string | undefined>()
  const [selectedProvider, setSelectedProvider] = useState<ProviderRecommendation | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const res = await api.get(`/users/me/conversations/${conversationId}`)
      const conv: Conversation = res.data
      setMessages([
        {
          id: conv.id + '-user',
          role: 'user',
          content: conv.problem_text,
          timestamp: new Date(conv.created_at)
        },
        {
          id: conv.id + '-assistant',
          role: 'assistant',
          content: conv.ai_response,
          timestamp: new Date(conv.created_at)
        }
      ])
      setCurrentConversationId(conv.id)
    } catch (error: any) {
      const status = error?.response?.status || ''
      const detail = error?.response?.data?.detail || error?.message || ''
      console.error('Load conversation error:', { status, detail, url: `/users/me/conversations/${conversationId}` })
      toast.error(detail ? `Error: ${detail}` : 'Error al cargar la conversación')
      setMessages([])
      setCurrentConversationId(null)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const params = new URLSearchParams(window.location.search)
    const conversationId = params.get('conversation')
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      setMessages([])
      setCurrentConversationId(null)
    }
  }, [user, loadConversation])

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
      const contextMessages = messages.slice(-5).map(m => {
        if (m.role === 'user' && typeof m.content === 'string') {
          return { problem_text: m.content, ai_response: {} }
        }
        if (m.role === 'assistant' && typeof m.content !== 'string') {
          return { problem_text: '', ai_response: m.content }
        }
        return null
      }).filter(Boolean) as Array<{ problem_text: string; ai_response: unknown }>

      const aiData = await aiApi.solve(problem, contextMessages)
      if (aiData.conversation_id) {
        setCurrentConversationId(aiData.conversation_id)
        router.replace(`/?conversation=${aiData.conversation_id}`, { scroll: false })
      }
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiData,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      const status = error?.response?.status || ''
      const detail = error?.response?.data?.detail || error?.message || ''
      console.error('Chat error:', { status, detail, url: '/ai/solve' })
      toast.error(detail ? `Error: ${detail}` : 'Error al procesar tu consulta')
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
    <div className="flex h-screen bg-[#050816]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 pb-16 lg:pb-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-5 py-8">
              <div className="max-w-lg mx-auto w-full">
                {/* Logo/Icon decorative */}
                <div className="relative inline-block mb-8">
                  <div className="w-20 h-20 rounded-2xl pandeum-gradient flex items-center justify-center mx-auto shadow-2xl shadow-[#7C3AED]/30">
                    <Sparkles size={32} className="text-white" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#22D3EE] shadow-lg shadow-[#22D3EE]/30 flex items-center justify-center">
                    <Zap size={12} className="text-[#050816]" strokeWidth={2.5} />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  ¿Qué necesitas hoy?
                </h1>
                <p className="text-sm text-[#9CA3AF] mb-8 leading-relaxed max-w-sm mx-auto">
                  Pandeum conecta tu problema con la mejor solución.
                </p>

                {/* Example chips */}
                <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
                  {exampleProblems.map((example) => {
                    const Icon = example.icon
                    return (
                      <button
                        key={example.text}
                        onClick={() => handleSendMessage(example.text)}
                        className="flex items-center gap-2.5 bg-[#111827] border border-[rgba(255,255,255,0.06)] hover:border-[#7C3AED]/30 hover:bg-[rgba(124,58,237,0.05)] rounded-xl px-4 py-3 text-left transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#7C3AED]/20 transition-colors">
                          <Icon size={15} className="text-[#7C3AED]" strokeWidth={1.75} />
                        </div>
                        <span className="text-sm text-white font-medium leading-tight">{example.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
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
                    <div className="bg-[#151E2F] border border-[rgba(255,255,255,0.06)] rounded-[18px] rounded-tl-sm px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-[#9CA3AF] ml-2">Pandeum está encontrando la mejor solución para ti...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2 lg:pb-6">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>

      <ProvidersDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        providers={drawerProviders}
        recommendationLabel={drawerLabel}
        onDistanceClick={handleDistanceClick}
      />

      <RouteMapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        provider={selectedProvider}
      />
    </div>
  )
}
