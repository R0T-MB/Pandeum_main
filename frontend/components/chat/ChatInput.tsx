'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { Send, Paperclip } from 'lucide-react'

interface ChatInputProps {
  onSend: (problem: string) => Promise<void>
  disabled: boolean
}

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
    <div className="flex items-end gap-2 bg-[#111827] rounded-2xl border border-[#1E2D4A] px-4 py-2.5 transition-all duration-200 focus-within:border-[#6D5EF8]/50">
      <button className="flex-shrink-0 p-1.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-[#151E2F] transition-all duration-200">
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
        className="flex-1 bg-transparent resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder:text-[#9CA3AF] text-sm leading-relaxed py-1"
        rows={1}
        style={{ minHeight: '24px', maxHeight: '120px' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#6D5EF8] hover:bg-[#5B4FE0] disabled:bg-[#1E2D4A] disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Send size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
