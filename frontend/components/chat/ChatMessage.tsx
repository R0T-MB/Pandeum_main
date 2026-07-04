'use client'

import { Message } from '@/types'
import { SolutionJourney } from './SolutionJourney'

interface ChatMessageProps {
  message: Message
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
          {message.content}
        </div>
      </div>
    )
  }

  if (message.role === 'assistant') {
    const aiResponse = message.content

    return (
      <div className="flex justify-start">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
          <SolutionJourney response={aiResponse} />
        </div>
      </div>
    )
  }

  return null
}
