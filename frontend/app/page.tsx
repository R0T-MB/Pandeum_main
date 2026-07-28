'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api, aiApi } from '@/lib/api'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ProvidersDrawer } from '@/components/chat/ProvidersDrawer'
import { RouteMapModal } from '@/components/map/RouteMapModal'
import Sidebar from '@/components/layout/Sidebar'
import { RightPanel } from '@/components/layout/RightPanel'
import { Sparkles, Zap, ChefHat, Laptop, Wrench, Calculator, Car, PaintBucket, Bot, Stars } from 'lucide-react'
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

  const handleQuickFilter = (filter: string) => {
    switch (filter) {
      case 'Buscar cerca de mí':
        handleSendMessage('busca opciones cerca de mí')
        break
      case 'Con presupuesto medio':
        handleSendMessage('con presupuesto medio')
        break
      case 'Abierto ahora':
        handleSendMessage('que esté abierto ahora')
        break
      case 'Más filtros':
        toast('Más filtros estarán disponibles pronto')
        break
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

      {/* Main center panel */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 pb-16 lg:pb-0 overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#7C3AED]/[0.03] blur-[120px] rounded-full pointer-events-none" />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin relative">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-5 py-8">
              <div className="max-w-2xl mx-auto w-full">
                {/* Glass card wrapper */}
                <div className="glass-panel p-8 md:p-10">
                  {/* Premium header with greeting */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="text-left">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl pandeum-gradient flex items-center justify-center shadow-lg shadow-[#7C3AED]/30">
                          <Stars size={20} className="text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-white tracking-tight">
                            ¡Hola{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
                          </h1>
                          <p className="text-sm text-[#9CA3AF] mt-0.5">
                            Estoy aquí para ayudarte a encontrar justo lo que necesitas.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                      <Bot size={18} className="text-[#7C3AED]" strokeWidth={1.75} />
                      <span className="text-xs font-medium text-[#7C3AED]">IA Asistente</span>
                    </div>
                  </div>

                  {/* Premium decorative visual */}
                  <div className="relative mb-10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-56 h-56 rounded-full bg-[#7C3AED]/[0.04] blur-3xl" />
                      <div className="w-32 h-32 rounded-full bg-[#22D3EE]/[0.04] blur-2xl -ml-16" />
                    </div>
                    {/* Decorative rings */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-28 h-28 rounded-full border border-[rgba(124,58,237,0.15)] animate-pulse" style={{ animationDuration: '3s' }} />
                      <div className="absolute w-36 h-36 rounded-full border border-[rgba(34,211,238,0.1)]" />
                      <div className="w-16 h-16 rounded-2xl pandeum-gradient flex items-center justify-center shadow-2xl shadow-[#7C3AED]/40 relative">
                        <Sparkles size={28} className="text-white" strokeWidth={1.5} />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#22D3EE] shadow-lg shadow-[#22D3EE]/40 flex items-center justify-center">
                        <Zap size={12} className="text-[#050816]" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                  {/* Example chips - premium grid */}
                  <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                    {exampleProblems.map((example) => {
                      const Icon = example.icon
                      return (
                        <button
                          key={example.text}
                          onClick={() => handleSendMessage(example.text)}
                          className="flex items-center gap-3 bg-[#111827] border border-[rgba(255,255,255,0.06)] hover:border-[#7C3AED]/40 hover:bg-[rgba(124,58,237,0.08)] rounded-xl px-4 py-3.5 text-left transition-all duration-200 group hover-lift"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#7C3AED]/20 transition-colors">
                            <Icon size={16} className="text-[#7C3AED]" strokeWidth={1.75} />
                          </div>
                          <span className="text-sm text-white font-medium leading-tight">{example.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
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
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full pandeum-gradient flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#7C3AED]/20">
                        <Bot size={16} className="text-white" strokeWidth={1.75} />
                      </div>
                      <div className="bg-[#151E2F] border border-[rgba(255,255,255,0.06)] rounded-[18px] rounded-tl-sm px-5 py-4 shadow-lg shadow-black/10">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-[#9CA3AF] ml-2">Pandeum está encontrando la mejor solución para ti...</span>
                        </div>
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
        <div className="flex-shrink-0 px-4 pb-4 pt-3 lg:pb-6 relative">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} onQuickFilter={handleQuickFilter} />
          </div>
        </div>
      </div>

      {/* Right Panel - Desktop 3rd column */}
      <RightPanel providers={drawerProviders} onOpenProviders={() => setDrawerOpen(true)} />

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
