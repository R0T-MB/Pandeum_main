'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { Send, Paperclip, MapPin, DollarSign, Clock, SlidersHorizontal } from 'lucide-react'

interface ChatInputProps {
  onSend: (problem: string) => Promise<void>
  disabled: boolean
}

const filterChips = [
  { icon: MapPin, label: 'Buscar cerca de mí' },
  { icon: DollarSign, label: 'Con presupuesto medio' },
  { icon: Clock, label: 'Abierto ahora' },
  { icon: SlidersHorizontal, label: 'Más filtros' },
]

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || disabled) return

    await onSend(trimmedInput)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  return (
    <div className="space-y-2.5">
      {/* Premium Input */}
      <div className="flex items-end gap-2 bg-[#111827] rounded-2xl border border-[rgba(255,255,255,0.08)] px-4 py-3 transition-all duration-200 focus-within:border-[#7C3AED]/40 focus-within:shadow-lg focus-within:shadow-[#7C3AED]/10 pandeum-glow">
        <button className="flex-shrink-0 p-1.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
          <Paperclip size={18} strokeWidth={1.75} />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            handleInput()
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Describe tu problema..."
          className="flex-1 bg-transparent resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder:text-[#9CA3AF] text-sm leading-relaxed py-0.5"
          rows={1}
          style={{ minHeight: '22px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D5EF8] hover:from-[#6D5EF8] hover:to-[#5B4FE0] disabled:from-[#1E2D4A] disabled:to-[#1E2D4A] disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-[#7C3AED]/20"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
        {filterChips.map((chip) => {
          const Icon = chip.icon
          return (
            <button
              key={chip.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#111827] border border-[rgba(255,255,255,0.06)] text-[#9CA3AF] hover:bg-[#151E2F] hover:text-white hover:border-[#7C3AED]/20 transition-all duration-200 whitespace-nowrap"
            >
              <Icon size={12} strokeWidth={1.75} />
              {chip.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
