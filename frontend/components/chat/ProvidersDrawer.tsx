'use client'

import { X, Star, MapPin, Clock, Zap } from 'lucide-react'
import { ProviderRecommendation } from '@/types'

interface ProvidersDrawerProps {
  isOpen: boolean
  onClose: () => void
  providers: ProviderRecommendation[]
  recommendationLabel?: string
  onDistanceClick: (provider: ProviderRecommendation) => void
}

export function ProvidersDrawer({
  isOpen,
  onClose,
  providers,
  recommendationLabel,
  onDistanceClick,
}: ProvidersDrawerProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      )}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-96 transform border-l border-[#5e5d69] bg-[#1d1d22] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#5e5d69]">
          <h2 className="text-base font-semibold text-white">
            {recommendationLabel || 'Lugares disponibles'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#3b3b43] transition-colors text-[#868393] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-57px)] scrollbar-thin">
          {providers.length > 0 ? (
            <div className="p-4 space-y-3">
              {providers.map((provider, idx) => (
                <div
                  key={provider.provider_id || idx}
                  className="bg-[#3b3b43] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-white truncate">
                        {provider.business_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {typeof provider.rating === 'number' && provider.rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-[#868393]">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            {provider.rating.toFixed(1)}
                          </span>
                        )}
                        {provider.estimated_cost && (
                          <span className="text-xs text-[#868393]">{provider.estimated_cost}</span>
                        )}
                      </div>
                    </div>
                    {provider.available_now && (
                      <span className="flex items-center gap-1 text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded-full whitespace-nowrap">
                        <Zap size={10} />
                        Disponible
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#868393]">
                    {typeof provider.response_time_hours === 'number' && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {provider.response_time_hours}h
                      </span>
                    )}
                    {typeof provider.distance_km === 'number' && (
                      <button
                        onClick={() => onDistanceClick(provider)}
                        className="flex items-center gap-1 text-white hover:text-[#868393] transition-colors"
                      >
                        <MapPin size={12} />
                        {provider.distance_km.toFixed(1)} km
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <MapPin size={32} className="text-[#5e5d69] mb-3" />
              <p className="text-sm text-[#868393]">
                Aun no encontramos lugares disponibles para esta categoria.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
