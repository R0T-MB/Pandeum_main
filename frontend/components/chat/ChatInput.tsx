'use client'

import { useState, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (problem: string) => Promise<void>
  disabled: boolean
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState('')

  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || disabled) return

    await onSend(trimmedInput)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Describe tu problema..."
        className="flex-1 bg-[#1d1d22] border border-[#5e5d69] rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-[#5e5d69] focus:border-[#868393] disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder:text-[#868393]"
        rows={1}
        style={{ minHeight: '48px', maxHeight: '120px' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="bg-[#1E3A5F] hover:bg-[#2F5D7C] disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors flex items-center justify-center"
        style={{ minHeight: '48px' }}
      >
        <Send size={20} />
      </button>
    </div>
  )
}
