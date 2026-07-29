'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api, aiApi } from '@/lib/api'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ProvidersDrawer } from '@/components/chat/ProvidersDrawer'
import { RouteMapModal } from '@/components/map/RouteMapModal'
import Sidebar from '@/components/layout/Sidebar'
import { SuggestionDrawer } from '@/components/layout/SuggestionDrawer'
import { Bot, Stars, Sparkles, Zap, ChefHat, Laptop, Wrench, Calculator, Car, PaintBucket, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Conversation, Message, ProviderRecommendation } from '@/types'

const quickActions = [
  { icon: <ChefHat size={16} />, label: 'Tengo hambre', text: 'Tengo hambre' },
  { icon: <Laptop size={16} />, label: 'Mi laptop no enciende', text: 'Mi laptop no enciende' },
  { icon: <Wrench size={16} />, label: 'Necesito un técnico', text: 'Necesito un técnico' },
  { icon: <Car size={16} />, label: 'Mecánico cerca', text: 'Busco un mecánico cerca' },
  { icon: <PaintBucket size={16} />, label: 'Pintor para mi casa', text: 'Necesito un pintor para mi casa' },
  { icon: <Calculator size={16} />, label: 'Tutor de matemáticas', text: 'Necesito un tutor de matemáticas' },
]

const exampleProblems = [
  { icon: ChefHat, label: 'Tengo hambre', text: 'Tengo hambre' },
  { icon: Laptop, label: 'Mi laptop no enciende', text: 'Mi laptop no enciende' },
  { icon: Wrench, label: 'Necesito un técnico', text: 'Necesito un técnico' },
  { icon: Calculator, label: 'Tutor de matemáticas', text: 'Necesito un tutor de matemáticas' },
  { icon: Car, label: 'Mecánico cerca', text: 'Busco un mecánico cerca' },
  { icon: PaintBucket, label: 'Pintor para mi casa', text: 'Necesito un pintor para mi casa' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [panelProviders, setPanelProviders] = useState<ProviderRecommendation[]>([])
  const [panelLabel, setPanelLabel] = useState<string | undefined>()
  const [selectedProvider, setSelectedProvider] = useState<ProviderRecommendation | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [showSuggestionDrawer, setShowSuggestionDrawer] = useState(false)
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
    setPanelProviders(providers)
    setPanelLabel(label)
  }

  const handleDistanceClick = (provider: ProviderRecommendation) => {
    setSelectedProvider(provider)
    setMapOpen(true)
  }

  return (
    <div className="flex h-screen bg-[#090C14]">
      {/* Premium ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#6E42FF]/[0.04] blur-[150px] rounded-full" />
        <div className="absolute top-1/3 -right-60 w-[600px] h-[600px] bg-[#22D3EE]/[0.02] blur-[150px] rounded-full" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-[#6E42FF]/[0.03] blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-[200px] h-[200px] bg-[#7C4DFF]/[0.02] blur-[100px] rounded-full" />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main center panel */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[332px] pb-16 lg:pb-0 overflow-hidden relative z-10">
        {/* Top gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#6E42FF]/[0.03] blur-[150px] rounded-full pointer-events-none" />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin relative">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full flex flex-col items-center text-center px-4 md:px-8 pt-10 pb-8"
            >
              <div className="max-w-2xl mx-auto w-full">
                <div className="glass-panel p-8 md:p-10 animate-appear">
                  {/* Premium header */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="text-left">
                      <div className="flex items-center gap-4 mb-3">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#6E42FF] to-[#835DFF] flex items-center justify-center shadow-2xl shadow-[#6E42FF]/40"
                        >
                          <Stars size={28} className="text-white" strokeWidth={1.5} />
                        </motion.div>
                        <div>
                          <h1 className="text-[40px] font-bold text-white tracking-tight leading-none">
                            ¡Hola{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
                          </h1>
                          <p className="text-[20px] text-[#AEB5C5] mt-2 font-medium">
                            Estoy aquí para ayudarte a encontrar justo lo que necesitas.
                          </p>
                        </div>
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-[rgba(110,66,255,.1)] border border-[rgba(110,66,255,.2)] shadow-[0_0_18px_rgba(124,77,255,.10)]"
                    >
                      <Bot size={20} className="text-[#6E42FF]" strokeWidth={1.75} />
                      <span className="text-sm font-medium text-[#6E42FF]">IA Asistente</span>
                    </motion.div>
                  </div>

                  {/* Elegant decorative element */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="relative mb-10"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-72 h-72 rounded-full bg-[#6E42FF]/[0.04] blur-3xl" />
                      <div className="w-40 h-40 rounded-full bg-[#22D3EE]/[0.03] blur-2xl -ml-20" />
                    </div>
                    <div className="relative flex items-center justify-center h-[160px]">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 160" fill="none">
                        <motion.line
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          x1="80" y1="35" x2="160" y2="80" stroke="rgba(110,66,255,0.12)" strokeWidth="1.5"
                        />
                        <motion.line
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.35 }}
                          x1="160" y1="80" x2="240" y2="35" stroke="rgba(110,66,255,0.12)" strokeWidth="1.5"
                        />
                        <motion.line
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                          x1="160" y1="80" x2="200" y2="130" stroke="rgba(110,66,255,0.12)" strokeWidth="1.5"
                        />
                        <motion.line
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.45 }}
                          x1="240" y1="35" x2="320" y2="80" stroke="rgba(110,66,255,0.12)" strokeWidth="1.5"
                        />
                        <motion.line
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.5 }}
                          x1="320" y1="80" x2="240" y2="130" stroke="rgba(110,66,255,0.12)" strokeWidth="1.5"
                        />
                        <motion.line
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.55 }}
                          x1="200" y1="130" x2="320" y2="80" stroke="rgba(110,66,255,0.08)" strokeWidth="1.5"
                        />
                      </svg>
                      {/* Floating nodes */}
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-[18px] h-[18px] rounded-full bg-[#6E42FF]/30 border border-[#6E42FF]/50 shadow-lg shadow-[#6E42FF]/20"
                        style={{ left: '18%', top: '22%' }}
                      />
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="absolute w-[22px] h-[22px] rounded-full bg-[#7C4DFF]/40 border border-[#7C4DFF]/60 shadow-lg shadow-[#7C4DFF]/30"
                        style={{ left: '38%', top: '44%' }}
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute w-[18px] h-[18px] rounded-full bg-[#6E42FF]/30 border border-[#6E42FF]/50 shadow-lg shadow-[#6E42FF]/20"
                        style={{ left: '57%', top: '22%' }}
                      />
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                        className="absolute w-[14px] h-[14px] rounded-full bg-[#22D3EE]/30 border border-[#22D3EE]/50 shadow-lg shadow-[#22D3EE]/20"
                        style={{ left: '48%', top: '72%' }}
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                        className="absolute w-[18px] h-[18px] rounded-full bg-[#6E42FF]/30 border border-[#6E42FF]/50 shadow-lg shadow-[#6E42FF]/20"
                        style={{ left: '77%', top: '44%' }}
                      />
                      {/* Center icon */}
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-[#6E42FF] to-[#835DFF] flex items-center justify-center shadow-2xl shadow-[#6E42FF]/50 relative z-10"
                      >
                        <Sparkles size={36} className="text-white" strokeWidth={1.5} />
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#22D3EE] shadow-xl shadow-[#22D3EE]/50 flex items-center justify-center z-20"
                        style={{ left: '68%', top: '24%' }}
                      >
                        <Zap size={14} className="text-[#090A14]" strokeWidth={2.5} />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Quick action chips */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 gap-3 max-w-lg mx-auto"
                  >
                    {exampleProblems.map((example) => {
                      const Icon = example.icon
                      return (
                        <motion.button
                          key={example.text}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSendMessage(example.text)}
                          className="flex items-center gap-3 bg-[#111827] border border-[rgba(255,255,255,.08)] hover:border-[rgba(110,66,255,.4)] hover:bg-[rgba(110,66,255,.08)] rounded-[18px] px-5 py-4 text-left transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_8px_20px_rgba(0,0,0,.14)]"
                        >
                          <div className="w-10 h-10 rounded-[14px] bg-[rgba(110,66,255,.1)] flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(110,66,255,.2)] transition-colors duration-[180ms] group-hover:shadow-lg group-hover:shadow-[#6E42FF]/20">
                            <Icon size={18} className="text-[#6E42FF]" strokeWidth={1.75} />
                          </div>
                          <span className="text-sm text-white font-medium leading-tight">{example.label}</span>
                        </motion.button>
                      )
                    })}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ChatMessage message={msg} onViewPlaces={handleViewPlaces} />
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6E42FF] to-[#835DFF] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xl shadow-[#6E42FF]/30">
                        <Bot size={18} className="text-white" strokeWidth={1.75} />
                      </div>
                      <div className="bg-[#151E2F] border border-[rgba(255,255,255,.08)] rounded-[18px] rounded-tl-sm px-6 py-5 shadow-[0_12px_30px_rgba(0,0,0,.18)]">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                              className="w-2 h-2 bg-[#6E42FF] rounded-full"
                            />
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                              className="w-2 h-2 bg-[#6E42FF] rounded-full"
                            />
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                              className="w-2 h-2 bg-[#6E42FF] rounded-full"
                            />
                          </div>
                          <span className="text-sm text-[#AEB5C5] ml-2">Pandeum está encontrando la mejor solución para ti...</span>
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

        {/* Input area */}
        <div className="flex-shrink-0 px-4 md:px-8 pb-6 pt-4 lg:pb-8 relative">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} onQuickFilter={handleQuickFilter} quickActions={quickActions} />
          </div>
        </div>
      </div>

      <ProvidersDrawer
        providers={panelProviders}
        recommendationLabel={panelLabel}
        onDistanceClick={handleDistanceClick}
        onOpenSuggestionDrawer={() => setShowSuggestionDrawer(true)}
      />

      <SuggestionDrawer
        isOpen={showSuggestionDrawer}
        onClose={() => setShowSuggestionDrawer(false)}
        providers={panelProviders}
      />

      <RouteMapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        provider={selectedProvider}
      />
    </div>
  )
}
