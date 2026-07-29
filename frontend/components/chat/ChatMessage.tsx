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
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6E42FF] to-[#835DFF] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xl shadow-[#6E42FF]/30">
    <Bot size={18} className="text-white" strokeWidth={1.75} />
  </div>
)

export const ChatMessage = ({ message, onViewPlaces }: ChatMessageProps) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div className="bg-gradient-to-br from-[#6E42FF] to-[#835DFF] text-white rounded-[18px] rounded-tr-sm px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,.18)] shadow-[#6E42FF]/30">
            <p className="text-base leading-relaxed font-medium">{message.content}</p>
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-1.5 mr-1">
            <span className="text-xs text-[#AEB5C5]">
              {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
            </span>
            <CheckCheck size={14} className="text-[#6E42FF]" strokeWidth={2} />
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
        className="flex items-center justify-center gap-2 w-full text-sm font-medium text-[#6E42FF] bg-[#111827] border border-[rgba(255,255,255,0.08)] hover:border-[#6E42FF]/40 hover:bg-[rgba(110,66,255,0.05)] rounded-[14px] px-5 py-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
      >
        <MapPin size={16} strokeWidth={1.75} />
        Ver lugares
      </button>
    ) : null

    // Modo direct / follow_up
    if (responseMode === 'direct' || responseMode === 'follow_up') {
      return (
        <div className="flex justify-start">
          <div className="max-w-[85%] sm:max-w-[75%]">
            <div className="flex items-start gap-4">
              <PandeumAvatar />
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-white">Pandeum</span>
                  <span className="text-[11px] text-[#AEB5C5]">
                    {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
                  </span>
                </div>
                <div className="bg-[#151E2F] border border-[rgba(255,255,255,0.08)] rounded-[18px] rounded-tl-sm px-6 py-5 shadow-[0_12px_30px_rgba(0,0,0,.18)]">
                  <p className="text-base text-white leading-relaxed whitespace-pre-wrap">
                    {aiResponse.direct_answer || aiResponse.natural_message || 'Lo siento, no pude generar una respuesta.'}
                  </p>
                </div>
              </div>
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
            <div className="flex items-start gap-4">
              <PandeumAvatar />
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-white">Pandeum</span>
                  <span className="text-[11px] text-[#9CA3AF]">
                    {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
                  </span>
                </div>
                <div className="bg-[#151E2F] border border-[rgba(255,255,255,0.08)] rounded-[18px] rounded-tl-sm px-6 py-5 pandeum-shadow">
                  {aiResponse.direct_answer && (
                    <p className="text-base text-white leading-relaxed whitespace-pre-wrap mb-4">
                      {aiResponse.direct_answer}
                    </p>
                  )}

                  {showSuggestions && (
                    <div className="bg-[#111827] rounded-[18px] border border-[rgba(255,255,255,0.08)] p-5 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        {SuggestionsIcon && <SuggestionsIcon size={16} className="text-[#6E42FF]" strokeWidth={1.75} />}
                        <h4 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">
                          {aiResponse.suggestions_label || 'Sugerencias'}
                        </h4>
                      </div>
                      <div className="space-y-2.5">
                        {suggestions.slice(0, 5).map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm text-white leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6E42FF] mt-2 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                      {suggestions.length > 5 && (
                        <p className="text-sm text-[#9CA3AF] mt-3 italic">
                          Puedes pedirme más sugerencias si quieres ver otras opciones.
                        </p>
                      )}
                    </div>
                  )}

                  {ctaButton}
                </div>
              </div>
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
          <div className="flex items-start gap-4">
            <PandeumAvatar />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold text-white">Pandeum</span>
                <span className="text-[11px] text-[#9CA3AF]">
                  {message.timestamp ? formatTime(new Date(message.timestamp)) : ''}
                </span>
              </div>
              <div className="bg-[#151E2F] border border-[rgba(255,255,255,0.08)] rounded-[18px] rounded-tl-sm px-6 py-5 pandeum-shadow">
                <SolutionJourney response={aiResponse} />

                {/* Inline provider recommendation cards - Visual Cards */}
                {hasInlineProviders && (
                  <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.08)]">
                    <h4 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Star size={14} className="text-yellow-400" strokeWidth={1.75} />
                      {aiResponse.recommendation_label || 'Recomendados para ti'}
                    </h4>
                    <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1 lg:grid lg:grid-cols-2 lg:overflow-x-visible">
                      {providers.slice(0, 3).map((p, idx) => (
                        <div
                          key={p.provider_id || idx}
                          className="min-w-[240px] lg:min-w-0 bg-gradient-to-br from-[#151E2F] to-[#111827] rounded-[18px] border border-[rgba(255,255,255,0.08)] overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:border-[#6E42FF]/40 hover:shadow-2xl hover:shadow-[#6E42FF]/20 cursor-pointer group flex-shrink-0 animate-slide-up active:scale-[0.97] pandeum-shadow-sm"
                          style={{ animationDelay: `${idx * 80}ms` }}
                          onClick={() => onViewPlaces?.(providers, aiResponse.recommendation_label)}
                        >
                          {/* Card image area */}
                          <div className="relative h-28 bg-gradient-to-br from-[#6E42FF]/20 to-[#7C4DFF]/10 overflow-hidden">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt={p.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#6E42FF] to-[#7C4DFF] flex items-center justify-center text-2xl font-bold text-white shadow-2xl shadow-[#6E42FF]/30">
                                  {p.business_name.charAt(0)}
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 via-transparent to-transparent" />
                            {p.available_now && (
                              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-[10px] font-semibold text-white shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Abierto
                              </div>
                            )}
                            {idx === 0 && (
                              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#6E42FF] to-[#7C4DFF] text-[10px] font-semibold text-white shadow-xl shadow-[#6E42FF]/40">
                                ★ Recomendado
                              </div>
                            )}
                          </div>
                          {/* Card content */}
                          <div className="p-4 space-y-2.5">
                            <h5 className="text-base font-semibold text-white truncate group-hover:text-[#6E42FF] transition-colors">
                              {p.business_name}
                            </h5>
                            <div className="flex items-center gap-3">
                              {typeof p.rating === 'number' && p.rating > 0 && (
                                <span className="flex items-center gap-1 text-xs text-yellow-400 font-medium">
                                  <Star size={12} className="fill-yellow-400" strokeWidth={1.5} />
                                  {p.rating.toFixed(1)}
                                </span>
                              )}
                              {p.estimated_cost && (
                                <span className="text-xs text-[#9CA3AF]">{p.estimated_cost}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                              {p.estimated_cost && (
                                <span className="px-2.5 py-1 rounded-md bg-[#6E42FF]/8 border border-[rgba(255,255,255,0.04)]">{p.estimated_cost}</span>
                              )}
                              {p.distance_km != null && (
                                <span className="flex items-center gap-0.5">
                                  <MapPin size={10} strokeWidth={1.5} />
                                  {p.distance_km.toFixed(1)} km
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {providers.length > 3 && (
                      <button
                        onClick={() => onViewPlaces?.(providers, aiResponse.recommendation_label)}
                        className="flex items-center justify-center gap-1.5 w-full mt-3 py-3 rounded-[14px] text-sm font-medium bg-gradient-to-r from-[#6E42FF]/10 to-[#7C4DFF]/10 border border-[#6E42FF]/20 text-[#6E42FF] hover:from-[#6E42FF]/20 hover:to-[#7C4DFF]/20 hover:border-[#6E42FF]/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                      >
                        Ver más opciones
                        <ChevronRight size={16} strokeWidth={1.75} />
                        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[#6E42FF]/10 text-xs">{providers.length}</span>
                      </button>
                    )}
                  </div>
                )}

                {showProviderCta && !hasInlineProviders && (
                  <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.08)]">
                    {ctaButton}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
