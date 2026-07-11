'use client'

import { Message, ProviderRecommendation } from '@/types'
import { SolutionJourney } from './SolutionJourney'
import { MapPin, Utensils, Shirt, Scissors, Wrench, ShoppingBag, HeartPulse, Info, Lightbulb, LucideIcon } from 'lucide-react'

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

export const ChatMessage = ({ message, onViewPlaces }: ChatMessageProps) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-[#3b3b43] text-white rounded-xl rounded-tr-sm px-4 py-2.5 max-w-[75%]">
          <p className="text-sm leading-relaxed">{message.content}</p>
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
          <div className="bg-[#1d1d22] border border-[#3b3b43] rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
              {aiResponse.direct_answer || aiResponse.natural_message || 'Lo siento, no pude generar una respuesta.'}
            </p>
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
          <div className="bg-[#1d1d22] border border-[#3b3b43] rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
            {/* Direct answer */}
            {aiResponse.direct_answer && (
              <p className="text-sm text-white leading-relaxed whitespace-pre-wrap mb-3">
                {aiResponse.direct_answer}
              </p>
            )}

            {/* Suggestions card */}
            {showSuggestions && (
              <div className="bg-[#3b3b43] rounded-xl p-3.5 mb-3">
                <div className="flex items-center gap-2 mb-2.5">
                  {SuggestionsIcon && <SuggestionsIcon size={14} className="text-[#868393]" />}
                  <h4 className="text-xs font-semibold text-[#868393] uppercase tracking-wide">
                    {aiResponse.suggestions_label || 'Sugerencias'}
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-white flex items-start gap-2 leading-relaxed">
                      <span className="text-[#868393] mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ver lugares CTA */}
            {showProviderCta && (
              <button
                onClick={() => onViewPlaces?.(providers, aiResponse.recommendation_label)}
                className="flex items-center gap-2 text-xs text-white bg-[#3b3b43] hover:bg-[#5e5d69] px-3.5 py-2 rounded-lg transition-colors w-full justify-center"
              >
                <MapPin size={14} />
                Ver lugares
              </button>
            )}
          </div>
        </div>
      )
    }

    // Modo journey / providers
    return (
      <div className="flex justify-start">
        <div className="bg-[#1d1d22] border border-[#3b3b43] rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
          <SolutionJourney response={aiResponse} />
          {showProviderCta && (
            <button
              onClick={() => onViewPlaces?.(providers, aiResponse.recommendation_label)}
              className="flex items-center gap-2 text-xs text-white bg-[#3b3b43] hover:bg-[#5e5d69] px-3.5 py-2 rounded-lg transition-colors w-full justify-center mt-3"
            >
              <MapPin size={14} />
              Ver lugares
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
