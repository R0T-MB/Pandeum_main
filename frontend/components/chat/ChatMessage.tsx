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
    const responseMode = aiResponse.response_mode

    // Modo direct: mostrar solo respuesta directa sin tarjetas
    if (responseMode === 'direct' || responseMode === 'follow_up') {
      return (
        <div className="flex justify-start">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {aiResponse.direct_answer || aiResponse.natural_message || 'Lo siento, no pude generar una respuesta.'}
            </p>
          </div>
        </div>
      )
    }

    // Modo food: mostrar respuesta directa o recomendaciones
    if (responseMode === 'food') {
      if (aiResponse.direct_answer && !aiResponse.has_providers) {
        return (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {aiResponse.direct_answer}
              </p>
            </div>
          </div>
        )
      }
      // Si hay recomendaciones, mostrar SolutionJourney con label personalizado
    }

    // Modo journey, providers, o fallback: mostrar SolutionJourney
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
