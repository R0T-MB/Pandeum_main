'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, MapPin, Clock, Zap, Tag, Phone, Loader2, Mail, Globe, MessageCircle, ExternalLink, User, Navigation, X } from 'lucide-react'
import { ProviderRecommendation } from '@/types'
import { useGeolocation } from '@/hooks/useGeolocation'

interface ProvidersDrawerProps {
  isOpen: boolean
  onClose: () => void
  providers: ProviderRecommendation[]
  recommendationLabel?: string
  onDistanceClick: (provider: ProviderRecommendation) => void
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

type SortMode = 'rating' | 'distance' | 'price'

const parseMinPrice = (cost: string): number | null => {
  const match = cost.match(/\$?(\d+([.,]\d+)?)/)
  if (match) return parseFloat(match[1].replace(',', '.'))
  return null
}

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const sortModes: { key: SortMode; label: string }[] = [
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
  const [openContactFor, setOpenContactFor] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && providers.some((p) => p.location_lat != null && p.location_lng != null)) {
      if (userLat === null && userLng === null && !geoLoading && !geoError) {
        requestLocation()
      }
    }
  }, [isOpen, providers, userLat, userLng, geoLoading, geoError, requestLocation])

  const getProviderDistance = useCallback((p: ProviderRecommendation): number | null => {
    if (userLat != null && userLng != null && p.location_lat != null && p.location_lng != null) {
      return haversineDistance(userLat, userLng, p.location_lat, p.location_lng)
    }
    return p.distance_km ?? null
  }, [userLat, userLng])

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
  }, [providers, activeSort, getProviderDistance])

  /* ── Desktop: slide-over drawer ── */
  /* ── Mobile: full-screen overlay  ── */

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[440px] bg-[#07050d] border-l border-white/5 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5 sticky top-0 bg-[#07050d] z-10">
          <div>
            <h2 className="text-base font-semibold text-white">
              {recommendationLabel || 'Lugares recomendados'}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">Estos profesionales están cerca de ti</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sort filters – grid 3 cols */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="grid grid-cols-3 gap-2">
            {sortModes.map(({ key, label }) => {
              const isActive = activeSort === key
              const Icon = key === 'rating' ? Star : key === 'distance' ? MapPin : Tag
              return (
                <button
                  key={key}
                  onClick={() => setActiveSort(key)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium transition ${
                    isActive
                      ? 'bg-violet-600/10 border border-violet-500/30 text-white'
                      : 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white'
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
                          ? 'text-violet-400'
                          : 'text-amber-400'
                        : 'text-current'
                    }
                  />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Provider list */}
        <div className="flex-1 overflow-y-auto">
          {sortedProviders.length > 0 ? (
            <div className="p-4 space-y-3">
              {sortedProviders.map((provider, idx) => (
                <div
                  key={provider.provider_id || idx}
                  className="bg-[#120f24] rounded-2xl border border-white/5 p-4 space-y-3 transition hover:border-violet-500/30"
                >
                  <div className="flex items-start gap-3">
                    {provider.avatar_url ? (
                      <img
                        src={provider.avatar_url}
                        alt={provider.business_name}
                        className="w-12 h-12 rounded-xl border border-white/5 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-violet-600/10 flex items-center justify-center text-sm font-bold text-violet-400 shrink-0">
                        {getInitials(provider.business_name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-white truncate">{provider.business_name}</p>
                        {provider.available_now && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                            <Zap size={10} strokeWidth={2} />
                            Abierto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {typeof provider.rating === 'number' && provider.rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-400">
                            <Star size={11} className="fill-yellow-400" strokeWidth={1.5} />
                            {provider.rating.toFixed(1)}
                          </span>
                        )}
                        {provider.estimated_cost && (
                          <span className="text-[11px] text-white/50">{provider.estimated_cost}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(provider.address || provider.service_area) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                      <MapPin size={11} strokeWidth={1.5} className="shrink-0" />
                      <span className="truncate">{provider.address || provider.service_area}</span>
                    </div>
                  )}

                  {typeof provider.response_time_hours === 'number' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                      <Clock size={11} strokeWidth={1.5} />
                      {provider.response_time_hours < 1
                        ? 'Responde en menos de 1 h'
                        : `Responde en ${provider.response_time_hours} h aprox.`}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {(() => {
                      const dist = getProviderDistance(provider)
                      const hasCoords = provider.location_lat != null && provider.location_lng != null
                      const permissionDenied =
                        geoError?.toLowerCase().includes('denied') ||
                        geoError?.toLowerCase().includes('denegado') ||
                        geoError?.toLowerCase().includes('permission')
                      const locationMissing = userLat === null && userLng === null
                      if (dist != null) {
                        return (
                          <div className="flex items-center justify-between w-full">
                            <span className="flex items-center gap-1 text-[11px] text-white/50">
                              <MapPin size={11} strokeWidth={1.5} />
                              A {dist.toFixed(1)} km aprox.
                            </span>
                            <button
                              onClick={() => onDistanceClick(provider)}
                              className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium transition"
                            >
                              <Navigation size={11} strokeWidth={1.75} />
                              Ver ruta
                            </button>
                          </div>
                        )
                      }
                      if (hasCoords && permissionDenied) {
                        return (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400">
                            <MapPin size={12} strokeWidth={1.5} />
                            Activa ubicación para calcular distancia
                          </span>
                        )
                      }
                      if (hasCoords && geoLoading) {
                        return (
                          <span className="flex items-center gap-1 text-[11px] text-white/50">
                            <Loader2 size={12} className="animate-spin" strokeWidth={1.5} />
                            Obteniendo ubicación...
                          </span>
                        )
                      }
                      if (hasCoords && locationMissing) {
                        return (
                          <span className="flex items-center gap-1 text-[11px] text-white/50">
                            <MapPin size={12} strokeWidth={1.5} />
                            Activa ubicación
                          </span>
                        )
                      }
                      return null
                    })()}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/providers/${provider.provider_id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600/10 border border-violet-500/30 text-violet-300 text-[11px] font-medium hover:bg-violet-600/20 transition"
                    >
                      <User size={13} strokeWidth={1.75} />
                      Ver perfil
                    </Link>
                    {provider.whatsapp && (
                      <a
                        href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition flex-1"
                      >
                        <MessageCircle size={13} strokeWidth={1.75} />
                        WhatsApp
                      </a>
                    )}
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/5 text-white/60 text-[11px] font-medium hover:bg-white/10 hover:text-white transition flex-1"
                      >
                        <Phone size={13} strokeWidth={1.75} />
                        Llamar
                      </a>
                    )}
                  </div>

                  {/* Más contactos */}
                  <div className="relative pt-1">
                    <button
                      onClick={() =>
                        setOpenContactFor(
                          openContactFor === provider.provider_id ? null : provider.provider_id
                        )
                      }
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-white/5 border border-white/5 text-white/60 text-[11px] font-medium hover:bg-white/10 hover:text-white transition"
                    >
                      <ExternalLink size={13} strokeWidth={1.75} />
                      Más formas de contacto
                    </button>

                    {openContactFor === provider.provider_id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenContactFor(null)} />
                        <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-[#120f24] border border-white/5 rounded-xl p-2 space-y-1 shadow-2xl">
                          {(() => {
                            const items: { icon: React.ReactNode; label: string; href: string }[] = []

                            if (provider.contact_email) {
                              items.push({
                                icon: <Mail size={14} className="text-yellow-400" strokeWidth={1.75} />,
                                label: 'Correo',
                                href: `mailto:${provider.contact_email}`,
                              })
                            }
                            if (provider.website_url) {
                              items.push({
                                icon: <Globe size={14} className="text-blue-400" strokeWidth={1.75} />,
                                label: 'Sitio web',
                                href: provider.website_url,
                              })
                            }
                            if (provider.facebook_url) {
                              items.push({
                                icon: <ExternalLink size={14} className="text-blue-500" strokeWidth={1.75} />,
                                label: 'Facebook',
                                href: provider.facebook_url,
                              })
                            }
                            if (provider.instagram_url) {
                              items.push({
                                icon: <ExternalLink size={14} className="text-pink-400" strokeWidth={1.75} />,
                                label: 'Instagram',
                                href: provider.instagram_url,
                              })
                            }
                            if (provider.tiktok_url) {
                              items.push({
                                icon: <ExternalLink size={14} className="text-white" strokeWidth={1.75} />,
                                label: 'TikTok',
                                href: provider.tiktok_url,
                              })
                            }
                            if (provider.linkedin_url) {
                              items.push({
                                icon: <ExternalLink size={14} className="text-blue-400" strokeWidth={1.75} />,
                                label: 'LinkedIn',
                                href: provider.linkedin_url,
                              })
                            }

                            if (items.length === 0) {
                              return (
                                <div className="px-3 py-3 text-[11px] text-white/50 text-center">
                                  Este proveedor aún no tiene métodos de contacto disponibles.
                                </div>
                              )
                            }

                            return items.map((item, i) => (
                              <a
                                key={i}
                                href={item.href}
                                target={item.href.startsWith('http') ? '_blank' : undefined}
                                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                onClick={() => setOpenContactFor(null)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-white hover:bg-white/5 transition"
                              >
                                {item.icon}
                                {item.label}
                              </a>
                            ))
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-4">
                <MapPin size={24} className="text-white/10" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Aún no hay proveedores registrados para esta necesidad.
              </p>
              <p className="text-xs text-white/30 mt-2 leading-relaxed">
                Puedes intentar con una búsqueda más general o revisar más tarde.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default ProvidersDrawer
