'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import {
  Send, Paperclip, MapPin, DollarSign, Clock, SlidersHorizontal,
  ChefHat, Laptop, Wrench, Calculator, Car, PaintBucket
} from 'lucide-react'

interface ChatInputProps {
  onSend: (problem: string) => Promise<void>
  disabled: boolean
  onQuickFilter?: (filter: string) => void
  quickActions?: { icon: React.ReactNode; label: string; text: string }[]
  onQuickAction?: (text: string) => void
}

const filterChips = [
  { icon: MapPin, label: 'Buscar cerca de mí' },
  { icon: DollarSign, label: 'Con presupuesto medio' },
  { icon: Clock, label: 'Abierto ahora' },
  { icon: SlidersHorizontal, label: 'Más filtros' },
]

export const ChatInput = ({ onSend, disabled, onQuickFilter, quickActions, onQuickAction }: ChatInputProps) => {
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

  const handleQuickAction = (text: string) => {
    setInput(text)
    textareaRef.current?.focus()
    onQuickAction?.(text)
  }

  return (
    <div className="space-y-3">
      {/* Quick action chips - above input */}
      {quickActions && quickActions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
          {quickActions.map((action) => (
            <button
              key={action.text}
              onClick={() => handleQuickAction(action.text)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111827]/80 border border-[rgba(255,255,255,0.06)] text-[#9CA3AF] hover:text-white hover:border-[#7C3AED]/30 hover:bg-[#151E2F] hover:shadow-lg hover:shadow-[#7C3AED]/10 hover:scale-105 active:scale-[0.97] transition-all duration-200 whitespace-nowrap text-[12px] font-medium group"
            >
              <span className="text-[#7C3AED] group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Premium Input */}
      <div className="flex items-end gap-2 bg-gradient-to-br from-[#111827] to-[#0E1422] rounded-2xl border border-[rgba(255,255,255,0.08)] px-4 py-3 transition-all duration-300 focus-within:border-[#7C3AED]/60 focus-within:shadow-xl focus-within:shadow-[#7C3AED]/20 pandeum-glow">
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
          placeholder="Cuéntame qué necesitas..."
          className="flex-1 bg-transparent resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder:text-[#6B7280] text-sm leading-relaxed py-0.5"
          rows={1}
          style={{ minHeight: '22px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D5EF8] hover:from-[#6D5EF8] hover:to-[#5B4FE0] disabled:from-[#1E2D4A] disabled:to-[#1E2D4A] disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-[0.93] shadow-lg shadow-[#7C3AED]/20 hover:shadow-[#7C3AED]/40 active:shadow-sm"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-0.5">
        {filterChips.map((chip) => {
          const Icon = chip.icon
          return (
            <button
              key={chip.label}
              onClick={() => onQuickFilter?.(chip.label)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#111827]/60 border border-[rgba(255,255,255,0.06)] text-[#9CA3AF] hover:bg-[#151E2F] hover:text-white hover:border-[#7C3AED]/30 hover:shadow-sm hover:shadow-[#7C3AED]/10 hover:scale-105 active:scale-[0.95] transition-all duration-200 whitespace-nowrap"
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
