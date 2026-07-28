'use client'

import { Message, ProviderRecommendation } from '@/types'
import { SolutionJourney } from './SolutionJourney'
import { MapPin, Utensils, Shirt, Scissors, Wrench, ShoppingBag, HeartPulse, Info, Lightbulb, LucideIcon, CheckCheck, Star, Bot, ChevronRight, Navigation, Phone } from 'lucide-react'

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

const PandeumAvatar = () => (
  <div className="w-9 h-9 rounded-full pandeum-gradient flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#7C3AED]/20">
    <Bot size={16} className="text-white" strokeWidth={1.75} />
  </div>
)

export const ChatMessage = ({ message, onViewPlaces }: ChatMessageProps) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div className="bg-gradient-to-br from-[#7C3AED] to-[#6D5EF8] text-white rounded-[18px] rounded-tr-sm px-4 py-3 shadow-lg shadow-[#7C3AED]/20">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <div className="flex items-center justify-end gap-1 mt-1 mr-1">
            <span className="text-[10px] text-[#9CA3AF]">
              {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
            </span>
            <CheckCheck size={12} className="text-[#7C3AED]" strokeWidth={2} />
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

    const ctaButton = showProviderCta ? (
      <button
        onClick={() => onViewPlaces?.(providers, aiResponse.recommendation_label)}
        className="flex items-center justify-center gap-2 w-full text-sm font-medium text-[#7C3AED] bg-[#111827] border border-[rgba(255,255,255,0.06)] hover:border-[#7C3AED]/40 hover:bg-[rgba(124,58,237,0.05)] rounded-xl px-4 py-2.5 transition-all duration-200"
      >
        <MapPin size={14} strokeWidth={1.75} />
        Ver lugares
      </button>
    ) : null

    // Modo direct / follow_up
    if (responseMode === 'direct' || responseMode === 'follow_up') {
      return (
        <div className="flex justify-start">
          <div className="max-w-[85%] sm:max-w-[75%]">
            <div className="flex items-start gap-3">
              <PandeumAvatar />
              <div className="bg-[#151E2F] border border-[rgba(255,255,255,0.06)] rounded-[18px] rounded-tl-sm px-5 py-4 shadow-lg shadow-black/10 flex-1">
                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                  {aiResponse.direct_answer || aiResponse.natural_message || 'Lo siento, no pude generar una respuesta.'}
                </p>
              </div>
            </div>
            <div className="mt-1 ml-12">
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
          <div className="max-w-[85%] sm:max-w-[75%]">
            <div className="flex items-start gap-3">
              <PandeumAvatar />
              <div className="bg-[#151E2F] border border-[rgba(255,255,255,0.06)] rounded-[18px] rounded-tl-sm px-5 py-4 shadow-lg shadow-black/10 flex-1">
                {aiResponse.direct_answer && (
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap mb-4">
                    {aiResponse.direct_answer}
                  </p>
                )}

                {showSuggestions && (
                  <div className="bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      {SuggestionsIcon && <SuggestionsIcon size={14} className="text-[#7C3AED]" strokeWidth={1.75} />}
                      <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                        {aiResponse.suggestions_label || 'Sugerencias'}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {suggestions.slice(0, 5).map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2.5 text-sm text-white leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2 flex-shrink-0" />
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

                {ctaButton}
              </div>
            </div>
            <div className="mt-1 ml-12">
              <span className="text-[10px] text-[#9CA3AF]">
                {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
              </span>
            </div>
          </div>
        </div>
      )
    }

    // Modo journey / providers
    const hasInlineProviders = providers.length > 0

    return (
      <div className="flex justify-start">
        <div className="w-full max-w-[90%] sm:max-w-[85%]">
          <div className="flex items-start gap-3">
            <PandeumAvatar />
            <div className="bg-[#151E2F] border border-[rgba(255,255,255,0.06)] rounded-[18px] rounded-tl-sm px-5 py-4 shadow-lg shadow-black/10 flex-1">
              <SolutionJourney response={aiResponse} />

              {/* Inline provider recommendation cards */}
              {hasInlineProviders && (
                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                    {aiResponse.recommendation_label || 'Recomendados para ti'}
                  </h4>
                  <div className="space-y-2.5">
                    {providers.slice(0, 3).map((p, idx) => (
                      <div
                        key={p.provider_id || idx}
                        className="flex items-center gap-3 bg-[#111827] rounded-xl p-3 border border-[rgba(255,255,255,0.06)] transition-all duration-200 hover:border-[#7C3AED]/30 hover:bg-[rgba(124,58,237,0.04)] hover-lift cursor-pointer shadow-sm"
                        onClick={() => onViewPlaces?.(providers, aiResponse.recommendation_label)}
                      >
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.business_name} className="w-11 h-11 rounded-xl object-cover border border-[rgba(255,255,255,0.06)] flex-shrink-0" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#6D5EF8]/10 flex items-center justify-center text-sm font-bold text-[#7C3AED] flex-shrink-0">
                            {p.business_name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white truncate">{p.business_name}</span>
                            {p.available_now && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400/50" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {typeof p.rating === 'number' && p.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                                <Star size={9} className="fill-yellow-400" strokeWidth={1.5} />
                                {p.rating.toFixed(1)}
                              </span>
                            )}
                            {p.estimated_cost && (
                              <span className="text-[10px] text-[#9CA3AF]">• {p.estimated_cost}</span>
                            )}
                            {p.distance_km != null && (
                              <span className="text-[10px] text-[#9CA3AF]">• {p.distance_km.toFixed(1)} km</span>
                            )}
                          </div>
                        </div>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 flex-shrink-0">
                            ★ Recomendado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {providers.length > 3 && (
                    <button
                      onClick={() => onViewPlaces?.(providers, aiResponse.recommendation_label)}
                      className="flex items-center justify-center gap-1.5 w-full mt-3 py-2.5 rounded-xl text-xs font-medium bg-gradient-to-r from-[#7C3AED]/10 to-[#6D5EF8]/10 border border-[#7C3AED]/20 text-[#7C3AED] hover:from-[#7C3AED]/20 hover:to-[#6D5EF8]/20 hover:border-[#7C3AED]/40 transition-all duration-200"
                    >
                      Ver más opciones
                      <ChevronRight size={14} strokeWidth={1.75} />
                      <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[#7C3AED]/10 text-[10px]">{providers.length}</span>
                    </button>
                  )}
                </div>
              )}

              {showProviderCta && !hasInlineProviders && (
                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  {ctaButton}
                </div>
              )}
            </div>
          </div>
          <div className="mt-1 ml-12 flex items-center gap-2">
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
