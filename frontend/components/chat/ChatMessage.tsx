'use client'

import { Message, ProviderRecommendation } from '@/types'
import { SolutionJourney } from './SolutionJourney'
import { MapPin, Utensils, Shirt, Scissors, Wrench, ShoppingBag, HeartPulse, Info, Lightbulb, LucideIcon, CheckCheck } from 'lucide-react'

interface ChatMessageProps {
  message: Message
  onViewPlaces?: (providers: ProviderRecommendation[], label?: string) => void
}

const getSuggestionsIcon = (intentCategory?: string, suggestionsLabel?: string): LucideIcon => {
  if (intentCategory) {
    switch (intentCategory) {
      case 'food': return Utensils
      case 'clothing': return Shirt
      case 'service': return Wrench
      case 'product': return ShoppingBag
      case 'health': return HeartPulse
      case 'tech': return Info
      case 'general': return Lightbulb
      default: return Lightbulb
    }
  }
  if (suggestionsLabel) {
    const label = suggestionsLabel.toLowerCase()
    if (label.includes('comida') || label.includes('sushi') || label.includes('pizza') || label.includes('restaurante')) return Utensils
    if (label.includes('ropa') || label.includes('prenda') || label.includes('camisa') || label.includes('pantalón')) return Shirt
    if (label.includes('costurera') || label.includes('sastre') || label.includes('zapatero')) return Scissors
    if (label.includes('proveedor') || label.includes('servicio') || label.includes('reparar')) return Wrench
    if (label.includes('comprar') || label.includes('producto') || label.includes('guitarra')) return ShoppingBag
  }
  return Lightbulb
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export const ChatMessage = ({ message, onViewPlaces }: ChatMessageProps) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="bg-gradient-to-br from-[#6D5EF8] to-[#5B4FE0] text-white rounded-[18px] rounded-tr-sm px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <div className="flex items-center justify-end gap-1 mt-1 mr-1">
            <span className="text-[10px] text-[#9CA3AF]">
              {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
            </span>
            <CheckCheck size={12} className="text-[#6D5EF8]" strokeWidth={2} />
          </div>
        </div>
      </div>
    )
  }

  if (message.role === 'assistant') {
    const aiResponse = message.content
    const responseMode = aiResponse.response_mode
    const providers = (aiResponse.providers || []) as ProviderRecommendation[]
    const showProviderCta = aiResponse.has_providers || !!aiResponse.recommendation_label

    // Modo direct / follow_up
    if (responseMode === 'direct' || responseMode === 'follow_up') {
      return (
        <div className="flex justify-start">
          <div className="max-w-[75%]">
            <div className="bg-[#151E2F] border border-[#1E2D4A] rounded-[18px] rounded-tl-sm px-5 py-4 shadow-sm">
              <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                {aiResponse.direct_answer || aiResponse.natural_message || 'Lo siento, no pude generar una respuesta.'}
              </p>
            </div>
            <div className="mt-1 ml-1">
              <span className="text-[10px] text-[#9CA3AF]">
                {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
              </span>
            </div>
          </div>
        </div>
      )
    }

    // Modo food / suggestions
    if (responseMode === 'food' || responseMode === 'suggestions') {
      const suggestions = aiResponse.suggestions || []
      const showSuggestions = suggestions.length > 0
      const SuggestionsIcon = showSuggestions ? getSuggestionsIcon(aiResponse.intent_category, aiResponse.suggestions_label) : null

      return (
        <div className="flex justify-start">
          <div className="max-w-[75%]">
            <div className="bg-[#151E2F] border border-[#1E2D4A] rounded-[18px] rounded-tl-sm px-5 py-4 shadow-sm">
              {aiResponse.direct_answer && (
                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap mb-4">
                  {aiResponse.direct_answer}
                </p>
              )}

              {showSuggestions && (
                <div className="bg-[#111827] rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    {SuggestionsIcon && <SuggestionsIcon size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />}
                    <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                      {aiResponse.suggestions_label || 'Sugerencias'}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2.5 text-sm text-white leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6D5EF8] mt-2 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                  {suggestions.length > 5 && (
                    <p className="text-xs text-[#9CA3AF] mt-3 italic">
                      Puedes pedirme más sugerencias si quieres ver otras opciones.
                    </p>
                  )}
                </div>
              )}

              {showProviderCta && (
                <button
                  onClick={() => onViewPlaces?.(providers, aiResponse.recommendation_label)}
                  className="flex items-center justify-center gap-2 w-full text-sm font-medium text-[#6D5EF8] bg-[#111827] border border-[#1E2D4A] hover:border-[#6D5EF8]/50 rounded-2xl px-4 py-2.5 transition-all duration-200 hover:bg-[#151E2F]"
                >
                  <MapPin size={14} strokeWidth={1.75} />
                  Ver lugares
                </button>
              )}
            </div>
            <div className="mt-1 ml-1">
              <span className="text-[10px] text-[#9CA3AF]">
                {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
              </span>
            </div>
          </div>
        </div>
      )
    }

    // Modo journey / providers
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%]">
          <div className="bg-[#151E2F] border border-[#1E2D4A] rounded-[18px] rounded-tl-sm px-5 py-4 shadow-sm">
            <SolutionJourney response={aiResponse} />
            {showProviderCta && (
              <div className="mt-4 pt-4 border-t border-[#1E2D4A]">
                <button
                  onClick={() => onViewPlaces?.(providers, aiResponse.recommendation_label)}
                  className="flex items-center justify-center gap-2 w-full text-sm font-medium text-[#6D5EF8] bg-[#111827] border border-[#1E2D4A] hover:border-[#6D5EF8]/50 rounded-2xl px-4 py-2.5 transition-all duration-200 hover:bg-[#151E2F]"
                >
                  <MapPin size={14} strokeWidth={1.75} />
                  Ver lugares
                </button>
              </div>
            )}
          </div>
          <div className="mt-1 ml-1">
            <span className="text-[10px] text-[#9CA3AF]">
              {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}
