'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api, aiApi } from '@/lib/api'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ProvidersDrawer } from '@/components/chat/ProvidersDrawer'
import { RouteMapModal } from '@/components/map/RouteMapModal'
import Sidebar from '@/components/layout/Sidebar'
import RightPanel from '@/components/layout/RightPanel'
import { SuggestionDrawer } from '@/components/layout/SuggestionDrawer'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Conversation, Message, ProviderRecommendation } from '@/types'
import {
  Store,
  Utensils,
  Wrench,
  Laptop,
  GraduationCap,
  Car,
  Paintbrush,
  Paperclip,
  Send,
  MapPin,
  DollarSign,
  Clock,
  SlidersHorizontal,
  Bot,
  Menu,
  Mic,
  MicOff,
  Square,
} from 'lucide-react'

const exampleProblems = [
  { icon: Utensils, label: 'Tengo hambre', text: 'Tengo hambre' },
  { icon: Wrench, label: 'Necesito un técnico', text: 'Necesito un técnico' },
  { icon: Laptop, label: 'Mi laptop no enciende', text: 'Mi laptop no enciende' },
  { icon: GraduationCap, label: 'Tutor de matemáticas', text: 'Necesito un tutor de matemáticas' },
  { icon: Car, label: 'Mecánico cerca', text: 'Busco un mecánico cerca' },
  { icon: Paintbrush, label: 'Pintar para mi casa', text: 'Necesito un pintor para mi casa' },
]

export default function HomePage() {
  const { user, isGuest } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [panelProviders, setPanelProviders] = useState<ProviderRecommendation[]>([])
  const [panelLabel, setPanelLabel] = useState<string | undefined>()
  const [selectedProvider, setSelectedProvider] = useState<ProviderRecommendation | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [showSuggestionDrawer, setShowSuggestionDrawer] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [guestBlocked, setGuestBlocked] = useState(false)
  const [guestRemaining, setGuestRemaining] = useState<number | null>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<{
    start: () => void
    stop: () => void
    abort: () => void
    onresult: ((e: { results: ArrayLike<unknown> }) => void) | null
    onend: (() => void) | null
    onerror: ((e: unknown) => void) | null
  } | null>(null)
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
          timestamp: new Date(conv.created_at),
        },
        {
          id: conv.id + '-assistant',
          role: 'assistant',
          content: conv.ai_response,
          timestamp: new Date(conv.created_at),
        },
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
    const loadLatest = async () => {
      try {
        const res = await api.get('/users/me/conversations', { params: { limit: 1 } })
        const latest: Conversation[] = res.data
        if (latest && latest.length > 0) {
          loadConversation(latest[0].id)
        } else {
          setMessages([])
          setCurrentConversationId(null)
        }
      } catch (error) {
        console.error('Load latest conversation error:', error)
        setMessages([])
        setCurrentConversationId(null)
      }
    }
    const params = new URLSearchParams(window.location.search)
    const conversationId = params.get('conversation')
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      loadLatest()
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
    if (isGuest && guestBlocked) {
      toast.error('Alcanzaste el límite del modo invitado. Inicia sesión para continuar.')
      return
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: problem,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    try {
      const contextMessages = messages
        .slice(-5)
        .map((m) => {
          if (m.role === 'user' && typeof m.content === 'string') {
            return { problem_text: m.content, ai_response: {} }
          }
          if (m.role === 'assistant' && typeof m.content !== 'string') {
            return { problem_text: '', ai_response: m.content }
          }
          return null
        })
        .filter(Boolean) as Array<{ problem_text: string; ai_response: unknown }>

      const aiData = await aiApi.solve(problem, contextMessages)
      if (aiData.guest_remaining != null) {
        setGuestRemaining(aiData.guest_remaining)
      }
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
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      const status = error?.response?.status || ''
      const detail = error?.response?.data?.detail || error?.message || ''
      console.error('Chat error:', { status, detail, url: '/ai/solve' })
      if (status === 429 && isGuest) {
        setGuestBlocked(true)
        toast.error('Alcanzaste el límite del modo invitado. Inicia sesión para continuar.')
      } else {
        toast.error(detail ? `Error: ${detail}` : 'Error al procesar tu consulta')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim()) {
        handleSendMessage(inputValue.trim())
        setInputValue('')
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop?.()
    }
    setIsListening(false)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
      return
    }

    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz.')
      return
    }

    // La API de voz solo funciona en contexto seguro (https o localhost).
    if (!window.isSecureContext) {
      toast.error('El reconocimiento de voz requiere conexión segura (https o localhost).')
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = 'es-ES'
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onresult = (e: any) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0]?.transcript ?? ''
      }
      transcript = transcript.trim()
      if (!transcript) return
      setInputValue(transcript)
      // Si el resultado es final, enviar la consulta.
      if (e.results[e.results.length - 1]?.isFinal) {
        setInputValue('')
        handleSendMessage(transcript)
      }
    }

    rec.onend = () => setIsListening(false)
    rec.onerror = (e: any) => {
      setIsListening(false)
      const code = e?.error || ''
      const messages: Record<string, string> = {
        'not-allowed':
          'Permiso de micrófono denegado. Actívalo en la configuración del navegador y vuelve a intentar.',
        'service-not-allowed':
          'Permiso de micrófono denegado. Actívalo en la configuración del navegador.',
        'no-speech':
          'No se detectó tu voz. Asegúrate de que el micrófono funcione y haz clic para hablar de nuevo.',
        'audio-capture': 'No se encontró ningún micrófono disponible.',
        network: 'Hubo un error de red con el reconocimiento de voz. Intenta de nuevo.',
        aborted: 'La captura se detuvo.',
        'not-found': 'No se encontró el módulo de lenguaje seleccionado.',
      }
      console.error('SpeechRecognition error:', code)
      toast.error(messages[code] || `Error al capturar la voz (${code}).`)
    }

    recognitionRef.current = rec
    try {
      rec.start()
      setIsListening(true)
      toast('Escuchando... habla ahora')
    } catch {
      setIsListening(false)
      toast.error('No se pudo iniciar el micrófono.')
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

  const userName = user?.full_name || 'María Fernanda'
  const userInitials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'MF'

  return (
    <div className="flex h-screen w-screen bg-theme-bg text-theme-text font-sans overflow-hidden transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Barra móvil: botón del menú lateral + acceso al panel derecho */}
      <header className="xl:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-theme-bg/90 backdrop-blur border-b border-theme-border flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
          className="p-2 rounded-xl hover:bg-theme-divider transition-all duration-200 text-theme-text-secondary hover:text-theme-text"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <span className="text-sm font-bold text-theme-text">PANDEUM</span>
        <button
          onClick={() => setRightPanelOpen(true)}
          aria-label="Abrir panel de proveedores"
          className="flex items-center gap-1.5 p-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition"
        >
          <MapPin size={16} strokeWidth={1.75} />
          <span className="text-[11px] font-semibold hidden sm:inline">Proveedores</span>
        </button>
      </header>

      <main className="flex-1 bg-theme-bg p-6 pt-20 xl:pt-6 flex flex-col justify-between overflow-y-auto transition-colors duration-200">
        <div className="max-w-4xl mx-auto w-full">
          {/* Banner de Saludo e IA Superior */}
          <div className="relative bg-theme-surface border border-theme-border rounded-3xl p-6 mb-6 overflow-hidden shadow-2xl transition-colors duration-200">
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-36 h-36 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start relative z-10 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-theme-text mb-1">
                  {isGuest
                    ? '¡Hola! ¿Qué necesitas hoy?'
                    : `¡Hola, ${userName.split(' ')[0]}!`}
                </h1>
                <p className="text-xs text-theme-text-secondary">Estoy aquí para ayudarte a encontrar justo lo que necesitas.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-600/40 flex items-center justify-center text-white shrink-0">
                <Store className="w-6 h-6" />
              </div>
            </div>

            <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1 relative z-10">
              {exampleProblems.map((example) => {
                const Icon = example.icon
                return (
                  <button
                    key={example.text}
                    onClick={() => handleSendMessage(example.text)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-theme-card border border-theme-border text-xs text-theme-text hover:border-violet-500/40 transition whitespace-nowrap shrink-0"
                  >
                    <Icon className="w-3.5 h-3.5 text-violet-400" /> {example.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat Messages */}
          {(messages.length > 0 || isLoading) && (
            <div className="space-y-6 mb-6">
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
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-theme-card border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 shadow-md">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-theme-text">Pandeum IA</span>
                        <div className="flex gap-1">
                          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Empty state decoration */}
          {messages.length === 0 && !isLoading && (
            <div className="relative mt-2 flex items-center justify-center h-[100px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-violet-600/[0.03] blur-3xl" />
              </div>
              <p className="text-xs text-theme-text-muted relative z-10">Haz una pregunta para empezar</p>
            </div>
          )}
        </div>

        {/* Input + Filters */}
        <div className="max-w-4xl mx-auto w-full mt-6">
          {isGuest && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-theme-surface border border-theme-border mb-3 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-xl bg-violet-600/20 text-violet-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-theme-text-secondary truncate">
                  Modo invitado: usa el chat y el mapa sin registrarte.
                  {guestRemaining != null && !guestBlocked && (
                    <span className="text-theme-text-muted"> Quedan <span className="text-violet-400 font-semibold">{guestRemaining}</span> consultas.</span>
                  )}
                  {guestBlocked && (
                    <span className="text-rose-400 font-semibold"> Alcanzaste el límite de consultas.</span>
                  )}
                </p>
              </div>
              {guestBlocked && (
                <Link
                  href="/login"
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition"
                >
                  Inicia sesión
                </Link>
              )}
            </div>
          )}

          <div className="bg-theme-surface border border-theme-border rounded-2xl p-2 flex items-center justify-between mb-3 shadow-2xl transition-colors duration-200">
            <div className="flex items-center gap-3 px-3 flex-1">
              <Paperclip className="w-5 h-5 text-theme-text-muted cursor-pointer hover:text-theme-text transition" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGuest && guestBlocked}
                placeholder={guestBlocked ? 'Límite alcanzado. Inicia sesión para seguir.' : 'Cuéntame qué necesitas...'}
                className="bg-transparent border-none outline-none text-sm text-theme-text placeholder-[var(--color-text-muted)] w-full disabled:opacity-50"
              />
              <button
                onClick={toggleListening}
                disabled={isGuest && guestBlocked}
                aria-label={isListening ? 'Detener grabación' : 'Hablar'}
                title={isListening ? 'Detener' : 'Dictar por voz'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                    : 'bg-theme-divider text-theme-text-muted hover:text-theme-text hover:bg-[var(--color-border)]'
                }`}
              >
                {isListening ? <Square size={15} className="fill-current" /> : <Mic size={17} />}
              </button>
            </div>
            <button
              onClick={() => {
                if (inputValue.trim()) {
                  handleSendMessage(inputValue.trim())
                  setInputValue('')
                }
              }}
              disabled={isLoading || (isGuest && guestBlocked)}
              className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { icon: MapPin, label: 'Buscar cerca de mí' },
              { icon: DollarSign, label: 'Con presupuesto medio' },
              { icon: Clock, label: 'Abierto ahora' },
              { icon: SlidersHorizontal, label: 'Más filtros' },
            ].map((f) => {
              const Icon = f.icon
              return (
                <button
                  key={f.label}
                  onClick={() => handleQuickFilter(f.label)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text-secondary hover:border-violet-500/40 transition whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 text-violet-400" /> {f.label}
                </button>
              )
            })}
          </div>
        </div>
      </main>

      <RightPanel
        providers={panelProviders}
        onOpenProviders={() => setIsDrawerOpen(true)}
        isOpen={rightPanelOpen}
        onClose={() => setRightPanelOpen(false)}
      />

      {/* Backdrop del panel derecho en móvil */}
      {rightPanelOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 xl:hidden" onClick={() => setRightPanelOpen(false)} />
      )}

      {/* Botón flotante para abrir el panel de proveedores en móvil */}
      <button
        onClick={() => setRightPanelOpen(true)}
        aria-label="Abrir proveedores"
        className="xl:hidden fixed bottom-6 right-5 z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/40 flex items-center justify-center text-white transition"
      >
        <MapPin size={22} strokeWidth={1.75} />
      </button>

      <ProvidersDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        providers={panelProviders}
        recommendationLabel={panelLabel}
        onDistanceClick={handleDistanceClick}
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
