'use client'

import Link from 'next/link'
import { Message, ProviderRecommendation } from '@/types'
import { SolutionJourney } from './SolutionJourney'
import { Utensils, Shirt, Scissors, Wrench, ShoppingBag, HeartPulse, Info, Lightbulb, LucideIcon, Star, Zap } from 'lucide-react'

interface ChatMessageProps {
  message: Message
}

const getSuggestionsIcon = (intentCategory?: string, suggestionsLabel?: string): LucideIcon => {
  // Prioridad: intent_category > suggestions_label
  if (intentCategory) {
    switch (intentCategory) {
      case 'food':
        return Utensils
      case 'clothing':
        return Shirt
      case 'service':
        return Wrench
      case 'product':
        return ShoppingBag
      case 'health':
        return HeartPulse
      case 'tech':
        return Info
      case 'general':
        return Lightbulb
      default:
        return Lightbulb
    }
  }

  // Fallback a suggestions_label si no hay intent_category
  if (suggestionsLabel) {
    const label = suggestionsLabel.toLowerCase()
    if (label.includes('comida') || label.includes('sushi') || label.includes('pizza') || label.includes('restaurante')) {
      return Utensils
    }
    if (label.includes('ropa') || label.includes('prenda') || label.includes('camisa') || label.includes('pantalón')) {
      return Shirt
    }
    if (label.includes('costurera') || label.includes('sastre') || label.includes('zapatero')) {
      return Scissors
    }
    if (label.includes('proveedor') || label.includes('servicio') || label.includes('reparar')) {
      return Wrench
    }
    if (label.includes('comprar') || label.includes('producto') || label.includes('guitarra')) {
      return ShoppingBag
    }
  }

  // Por defecto
  return Lightbulb
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-[#1E3A5F] text-white rounded-xl rounded-tr-sm px-4 py-3 max-w-[80%]">
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
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl rounded-tl-sm px-4 py-3 max-w-[80%]">
            <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
              {aiResponse.direct_answer || aiResponse.natural_message || 'Lo siento, no pude generar una respuesta.'}
            </p>
          </div>
        </div>
      )
    }

    // Modo food / suggestions: respuesta directa, tarjeta de sugerencias y tarjeta de proveedores
    if (responseMode === 'food' || responseMode === 'suggestions') {
      const suggestions = aiResponse.suggestions || []
      const showSuggestions = suggestions.length > 0
      const showProviders = aiResponse.has_providers || !!aiResponse.recommendation_label
      const SuggestionsIcon = getSuggestionsIcon(aiResponse.intent_category, aiResponse.suggestions_label)
      const providers = (aiResponse.providers || []) as ProviderRecommendation[]

      return (
        <div className="flex justify-start">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl rounded-tl-sm px-4 py-3 max-w-[80%]">
            {/* Direct answer */}
            {aiResponse.direct_answer && (
              <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap mb-4">
                {aiResponse.direct_answer}
              </p>
            )}

            {/* Suggestions card */}
            {showSuggestions && (
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <SuggestionsIcon className="w-5 h-5 text-slate-500" />
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    {aiResponse.suggestions_label || 'Sugerencias'}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Providers section */}
            {showProviders && (
              <div className="mt-4 bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
                  {aiResponse.recommendation_label || 'Proveedores disponibles'}
                </h4>
                {providers.length > 0 ? (
                  <div className="space-y-3">
                    {providers.map((provider, idx) => (
                      <div key={provider.provider_id || idx} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                            {provider.business_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            {typeof provider.rating === 'number' && provider.rating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                {provider.rating.toFixed(1)}
                              </span>
                            )}
                            {provider.estimated_cost && (
                              <span>{provider.estimated_cost}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {provider.available_now && (
                            <span className="flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <Zap size={10} />
                              Disponible
                            </span>
                          )}
                          {provider.provider_id && (
                            <Link
                              href={`/providers/${provider.provider_id}`}
                              className="text-xs text-[#1E3A5F] dark:text-[#2F5D7C] font-medium hover:underline whitespace-nowrap"
                            >
                              Ver proveedor
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Aún no encontramos proveedores disponibles para esta categoría.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    // Modo journey, providers, o fallback: mostrar SolutionJourney
    return (
      <div className="flex justify-start">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl rounded-tl-sm px-4 py-3 max-w-[80%]">
          <SolutionJourney response={aiResponse} />
        </div>
      </div>
    )
  }

  return null
}
