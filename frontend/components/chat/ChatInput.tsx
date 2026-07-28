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
      el.style.height = Math.min(el.scrollHeight, 140) + 'px'
    }
  }

  const handleQuickAction = (text: string) => {
    setInput(text)
    textareaRef.current?.focus()
    onQuickAction?.(text)
  }

  return (
    <div className="space-y-4">
      {/* Quick action chips - above input */}
      {quickActions && quickActions.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
          {quickActions.map((action) => (
            <button
              key={action.text}
              onClick={() => handleQuickAction(action.text)}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-[999px] bg-[#111827]/80 border border-[rgba(255,255,255,0.08)] text-[#9CA3AF] hover:text-white hover:border-[#6E42FF]/30 hover:bg-[#151E2F] hover:shadow-xl hover:shadow-[#6E42FF]/10 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 whitespace-nowrap text-[13px] font-medium group pandeum-shadow-sm"
            >
              <span className="text-[#6E42FF] group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Premium Input */}
      <div className="flex items-end gap-3 bg-gradient-to-br from-[#111827] to-[#0E1422] rounded-[18px] border border-[rgba(255,255,255,0.08)] px-5 py-4 transition-all duration-300 focus-within:border-[#6E42FF]/60 focus-within:shadow-2xl focus-within:shadow-[#6E42FF]/20 pandeum-shadow">
        <button className="flex-shrink-0 p-2 rounded-[14px] text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
          <Paperclip size={20} strokeWidth={1.75} />
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
          className="flex-1 bg-transparent resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder:text-[#6B7280] text-base leading-relaxed py-0.5"
          rows={1}
          style={{ minHeight: '26px', maxHeight: '140px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="flex-shrink-0 w-12 h-12 rounded-full pandeum-gradient-strong hover:from-[#7C4DFF] hover:to-[#8B5CFF] disabled:from-[#1E2D4A] disabled:to-[#1E2D4A] disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-[0.93] shadow-2xl shadow-[#6E42FF]/30 hover:shadow-[#6E42FF]/50 active:shadow-sm pandeum-glow-purple"
        >
          <Send size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin pb-0.5">
        {filterChips.map((chip) => {
          const Icon = chip.icon
          return (
            <button
              key={chip.label}
              onClick={() => onQuickFilter?.(chip.label)}
              className="flex items-center gap-2 px-[14px] py-2 rounded-[999px] text-[12px] font-medium bg-[#111827]/60 border border-[rgba(255,255,255,0.08)] text-[#9CA3AF] hover:bg-[#151E2F] hover:text-white hover:border-[#6E42FF]/30 hover:shadow-lg hover:shadow-[#6E42FF]/10 hover:scale-[1.02] active:scale-[0.95] transition-all duration-200 whitespace-nowrap"
            >
              <Icon size={14} strokeWidth={1.75} />
              {chip.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
