'use client'

import { X, Star, MapPin, Clock, Zap, Navigation } from 'lucide-react'
import { ProviderRecommendation } from '@/types'

interface ProvidersDrawerProps {
  isOpen: boolean
  onClose: () => void
  providers: ProviderRecommendation[]
  recommendationLabel?: string
  onDistanceClick: (provider: ProviderRecommendation) => void
  onViewMap?: () => void
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProvidersDrawer({
  isOpen,
  onClose,
  providers,
  recommendationLabel,
  onDistanceClick,
  onViewMap,
}: ProvidersDrawerProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      )}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] transform border-l border-[#1E2D4A] bg-[#111827] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E2D4A]">
          <div>
            <h2 className="text-base font-semibold text-white">
              {recommendationLabel || 'Lugares recomendados'}
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Estos profesionales están cerca de ti</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-130px)] scrollbar-thin">
          {providers.length > 0 ? (
            <div className="p-4 space-y-3">
              {providers.map((provider, idx) => (
                <div
                  key={provider.provider_id || idx}
                  className="bg-[#151E2F] rounded-2xl border border-[#1E2D4A] p-4 space-y-3 transition-all duration-200 hover:bg-[#1A2440]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center text-xs font-bold text-[#6D5EF8] flex-shrink-0">
                      {getInitials(provider.business_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-white truncate">
                        {provider.business_name}
                      </p>
                      {provider.estimated_cost && (
                        <span className="text-[10px] text-[#9CA3AF]">{provider.estimated_cost}</span>
                      )}
                    </div>
                    {provider.available_now && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg whitespace-nowrap">
                        <Zap size={10} strokeWidth={2} />
                        Abierto
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                    {typeof provider.rating === 'number' && provider.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
                        {provider.rating.toFixed(1)}
                      </span>
                    )}
                    {typeof provider.response_time_hours === 'number' && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} strokeWidth={1.5} />
                        {provider.response_time_hours}h
                      </span>
                    )}
                    {typeof provider.distance_km === 'number' && (
                      <button
                        onClick={() => onDistanceClick(provider)}
                        className="flex items-center gap-1 text-white hover:text-[#6D5EF8] transition-colors duration-200"
                      >
                        <MapPin size={12} strokeWidth={1.5} />
                        {provider.distance_km.toFixed(1)} km
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-12 h-12 rounded-2xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mb-4">
                <MapPin size={22} className="text-[#1E2D4A]" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                Aun no encontramos lugares disponibles para esta categoria.
              </p>
            </div>
          )}
        </div>

        {providers.length > 0 && (
          <div className="px-4 py-4 border-t border-[#1E2D4A]">
            <button
              onClick={onViewMap}
              className="flex items-center justify-center gap-2 w-full text-sm font-medium text-white bg-gradient-to-br from-[#6D5EF8] to-[#5B4FE0] hover:from-[#5B4FE0] hover:to-[#4A3FD0] rounded-2xl px-4 py-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Navigation size={16} strokeWidth={1.75} />
              Ver en el mapa
            </button>
          </div>
        )}
      </div>
    </>
  )
}
