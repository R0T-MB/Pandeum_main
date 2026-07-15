'use client'

import { useState, useMemo, useEffect } from 'react'
import { X, Star, MapPin, Clock, Zap, Tag, Phone, Map, Loader2 } from 'lucide-react'
import { ProviderRecommendation } from '@/types'
import { useGeolocation } from '@/hooks/useGeolocation'

interface ProvidersDrawerProps {
  isOpen: boolean
  onClose: () => void
  providers: ProviderRecommendation[]
  recommendationLabel?: string
  onDistanceClick: (provider: ProviderRecommendation) => void
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

type SortMode = 'rating' | 'distance' | 'price'

const parseMinPrice = (cost: string): number | null => {
  const match = cost.match(/\$?(\d+([.,]\d+)?)/)
  if (match) {
    return parseFloat(match[1].replace(',', '.'))
  }
  return null
}

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const sortModes: { key: SortMode; label: string; }[] = [
  { key: 'rating', label: 'Mejor calificados' },
  { key: 'distance', label: 'Más cercanos' },
  { key: 'price', label: 'Más económicos' },
]

export function ProvidersDrawer({
  isOpen,
  onClose,
  providers,
  recommendationLabel,
  onDistanceClick,
}: ProvidersDrawerProps) {
  const { latitude: userLat, longitude: userLng, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()
  const [activeSort, setActiveSort] = useState<SortMode>('rating')

  useEffect(() => {
    if (isOpen && providers.some(p => p.location_lat != null && p.location_lng != null)) {
      if (userLat === null && userLng === null && !geoLoading && !geoError) {
        requestLocation()
      }
    }
  }, [isOpen, providers, userLat, userLng, geoLoading, geoError, requestLocation])

  const getProviderDistance = (p: ProviderRecommendation): number | null => {
    if (userLat != null && userLng != null && p.location_lat != null && p.location_lng != null) {
      return haversineDistance(userLat, userLng, p.location_lat, p.location_lng)
    }
    return p.distance_km ?? null
  }

  const sortedProviders = useMemo(() => {
    const list = [...providers]
    switch (activeSort) {
      case 'rating':
        return list.sort((a, b) => {
          const ratingA = typeof a.rating === 'number' ? a.rating : 0
          const ratingB = typeof b.rating === 'number' ? b.rating : 0
          const trustA = typeof a.trust_score === 'number' ? a.trust_score : 0
          const trustB = typeof b.trust_score === 'number' ? b.trust_score : 0
          if (ratingB !== ratingA) return ratingB - ratingA
          if (trustB !== trustA) return trustB - trustA
          if (a.available_now && !b.available_now) return -1
          if (!a.available_now && b.available_now) return 1
          return 0
        })
      case 'distance':
        return list.sort((a, b) => {
          const distA = getProviderDistance(a)
          const distB = getProviderDistance(b)
          if (distA == null && distB == null) return 0
          if (distA == null) return 1
          if (distB == null) return -1
          return distA - distB
        })
      case 'price':
        return list.sort((a, b) => {
          const priceA = a.estimated_cost ? parseMinPrice(a.estimated_cost) : null
          const priceB = b.estimated_cost ? parseMinPrice(b.estimated_cost) : null
          if (priceA == null && priceB == null) return 0
          if (priceA == null) return 1
          if (priceB == null) return -1
          return priceA - priceB
        })
      default:
        return list
    }
  }, [providers, activeSort, userLat, userLng])

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

        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-[#1E2D4A]">
          {sortModes.map(({ key, label }) => {
            const isActive = activeSort === key
            const Icon = key === 'rating' ? Star : key === 'distance' ? MapPin : Tag
            return (
              <button
                key={key}
                onClick={() => setActiveSort(key)}
                className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-2xl text-[11px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 border border-[#6D5EF8]/50 text-white'
                    : 'bg-[#151E2F] border border-[#1E2D4A] text-[#9CA3AF] hover:bg-[#1A2440] hover:text-white hover:border-[#1E2D4A]/80'
                }`}
              >
                <Icon
                  size={13}
                  strokeWidth={1.75}
                  className={
                    isActive
                      ? key === 'rating'
                        ? 'text-yellow-400'
                        : key === 'distance'
                        ? 'text-[#A78BFA]'
                        : 'text-[#FBBF24]'
                      : 'text-current'
                  }
                />
                {label}
              </button>
            )
          })}
        </div>

        <div className="overflow-y-auto h-[calc(100%-185px)] scrollbar-thin">
          {sortedProviders.length > 0 ? (
            <div className="p-4 space-y-3">
              {sortedProviders.map((provider, idx) => (
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
                        <span className={`text-[10px] ${activeSort === 'price' ? 'text-[#FBBF24] font-medium' : 'text-[#9CA3AF]'}`}>{provider.estimated_cost}</span>
                      )}
                    </div>
                    {provider.available_now && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg whitespace-nowrap">
                        <Zap size={10} strokeWidth={2} />
                        Abierto
                      </span>
                    )}
                  </div>

                  {(provider.address || provider.service_area) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF]">
                      <MapPin size={11} strokeWidth={1.5} className="flex-shrink-0" />
                      <span className="truncate">{provider.address || provider.service_area}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                    {typeof provider.rating === 'number' && provider.rating > 0 && (
                      <span className={`flex items-center gap-1 ${activeSort === 'rating' ? 'text-yellow-400' : ''}`}>
                        <Star size={12} className={activeSort === 'rating' ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-500 fill-yellow-500'} strokeWidth={1.5} />
                        {provider.rating.toFixed(1)}
                      </span>
                    )}
                    {typeof provider.response_time_hours === 'number' && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock size={12} strokeWidth={1.5} />
                        {provider.response_time_hours < 1
                          ? 'Responde en menos de 1 h'
                          : `Responde en ${provider.response_time_hours} h aprox.`}
                      </span>
                    )}
                    {provider.phone && (
                      <a href={`tel:${provider.phone}`} className="flex items-center gap-1 text-white hover:text-[#6D5EF8] transition-colors duration-200">
                        <Phone size={12} strokeWidth={1.5} />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {(() => {
                      const dist = getProviderDistance(provider)
                      const hasCoords = provider.location_lat != null && provider.location_lng != null
                      const permissionDenied = geoError?.toLowerCase().includes('denied') || geoError?.toLowerCase().includes('denegado') || geoError?.toLowerCase().includes('permission')
                      const locationMissing = userLat === null && userLng === null
                      if (dist != null) {
                        return (
                          <>
                            <span className={`flex items-center gap-1 text-[11px] ${activeSort === 'distance' ? 'text-[#A78BFA] font-medium' : 'text-[#9CA3AF]'}`}>
                              <MapPin size={12} strokeWidth={1.5} />
                              A {dist.toFixed(1)} km aprox.
                            </span>
                            <button
                              onClick={() => onDistanceClick(provider)}
                              className="flex items-center gap-1 text-[11px] text-[#6D5EF8] hover:text-[#A78BFA] font-medium transition-colors duration-200 ml-auto"
                            >
                              <Map size={12} strokeWidth={1.75} />
                              Ver ruta
                            </button>
                          </>
                        )
                      }
                      if (hasCoords && permissionDenied) {
                        return (
                          <span className="flex items-center gap-1 text-[11px] text-[#FBBF24]">
                            <MapPin size={12} strokeWidth={1.5} />
                            Activa ubicación para calcular distancia
                          </span>
                        )
                      }
                      if (hasCoords && geoLoading) {
                        return (
                          <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                            <Loader2 size={12} className="animate-spin" strokeWidth={1.5} />
                            Obteniendo ubicación...
                          </span>
                        )
                      }
                      if (hasCoords && locationMissing) {
                        return (
                          <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                            <MapPin size={12} strokeWidth={1.5} />
                            Activa ubicación
                          </span>
                        )
                      }
                      return null
                    })()}
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
                Aún no hay proveedores registrados para esta necesidad.
              </p>
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                Puedes intentar con una búsqueda más general o revisar más tarde.
              </p>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
