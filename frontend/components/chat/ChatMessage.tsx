'use client'

import { Message } from '@/types'
import { SolutionJourney } from './SolutionJourney'
import { Utensils } from 'lucide-react'

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

    // Modo food: mostrar respuesta directa y sugerencias si existen
    if (responseMode === 'food' || responseMode === 'suggestions') {
      // Si hay sugerencias, mostrar tarjeta de sugerencias
      if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
        return (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap mb-4">
                {aiResponse.direct_answer}
              </p>
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="w-5 h-5 text-orange-500" />
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">
                    {aiResponse.suggestions_label || 'Sugerencias'}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {aiResponse.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      }
      // Si no hay sugerencias, mostrar solo respuesta directa
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
