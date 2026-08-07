'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Provider } from '@/types'
import Sidebar from '@/components/layout/Sidebar'
import { MapPin, Navigation, Menu, Loader2, Crosshair, X, Car, Footprints, Bike, Star, Wallet, Phone, MessageCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useMap } from 'react-leaflet'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false })

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const observer = new ResizeObserver(() => { map.invalidateSize() })
    observer.observe(el)
    const id = setTimeout(() => map.invalidateSize(), 120)
    return () => { observer.disconnect(); clearTimeout(id) }
  }, [map])
  return null
}

type TravelMode = 'driving' | 'foot' | 'bike'

interface OSRMRoute {
  distance: number
  duration: number
  geometry: {
    coordinates: [number, number][]
  }
}

const MODE_LABELS: Record<TravelMode, { label: string; icon: typeof Car; osrmProfile: string }> = {
  driving: { label: 'Auto', icon: Car, osrmProfile: 'driving' },
  foot: { label: 'Caminando', icon: Footprints, osrmProfile: 'foot' },
  bike: { label: 'Bicicleta/Moto', icon: Bike, osrmProfile: 'bike' },
}

const getInitials = (name: string) => {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
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

const formatDistance = (meters: number): string => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

const formatDuration = (seconds: number): string => {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600)
    const m = Math.round((seconds % 3600) / 60)
    return `${h}h ${m}min`
  }
  return `${Math.round(seconds / 60)} min`
}

export default function MapPage() {
  const router = useRouter()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [L, setL] = useState<typeof import('leaflet') | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { latitude: userLat, longitude: userLng, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)

  const [selectedRouteProvider, setSelectedRouteProvider] = useState<Provider | null>(null)
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null)
  const [routeDistance, setRouteDistance] = useState<number | null>(null)
  const [routeDuration, setRouteDuration] = useState<number | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [travelMode, setTravelMode] = useState<TravelMode>('driving')

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
      setL(leaflet)
    })
  }, [])

  useEffect(() => {
    api.get('/providers/')
      .then(res => setProviders(res.data))
      .catch(() => toast.error('Error al cargar proveedores'))
      .finally(() => setLoading(false))
  }, [])

  const fetchRoute = useCallback(async (provider: Provider, mode: TravelMode) => {
    if (userLat == null || userLng == null || provider.location_lat == null || provider.location_lng == null) return
    setRouteLoading(true)
    setRouteError(null)
    const profile = MODE_LABELS[mode].osrmProfile
    const url = `https://router.project-osrm.org/route/v1/${profile}/${userLng},${userLat};${provider.location_lng},${provider.location_lat}?overview=full&geometries=geojson`
    try {
      const res = await fetch(url)
      const data = await res.json()
      if (data.code === 'Ok' && data.routes?.length > 0) {
        const route: OSRMRoute = data.routes[0]
        const coords: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        )
        setRouteCoords(coords)
        setRouteDistance(route.distance)
        setRouteDuration(route.duration)
      } else {
        throw new Error('No route found')
      }
    } catch {
      if (mode === 'bike') {
        setRouteError('No se pudo calcular esta ruta. Intenta con auto o caminando.')
      } else {
        setRouteError('No se pudo calcular la ruta por calles.')
      }
      setRouteCoords([[userLat, userLng], [provider.location_lat, provider.location_lng]])
      setRouteDistance(null)
      setRouteDuration(null)
    } finally {
      setRouteLoading(false)
    }
  }, [userLat, userLng])

  useEffect(() => {
    if (selectedRouteProvider) {
      fetchRoute(selectedRouteProvider, travelMode)
    }
  }, [selectedRouteProvider, travelMode, fetchRoute])

  const providersWithCoords = providers.filter(
    p => p.location_lat != null && p.location_lng != null
  )

  const handleViewProfile = (provider: Provider) => {
    router.push(`/providers/${provider.id}`)
  }

  const handleSelectProvider = (provider: Provider) => {
    setSelectedProvider(provider)
    handleClearRoute()
  }

  const handleCloseProfile = () => {
    setSelectedProvider(null)
  }

  const handleSetRoute = (provider: Provider) => {
    if (!hasUserLocation) {
      if (permissionDenied) {
        toast.error('Activa tu ubicación en el navegador para calcular la ruta.')
      } else {
        requestLocation()
        toast('Activa tu ubicación para calcular la ruta.')
      }
      return
    }
    setSelectedRouteProvider(provider)
    setTravelMode('driving')
  }

  const handleClearRoute = () => {
    setSelectedRouteProvider(null)
    setRouteCoords(null)
    setRouteDistance(null)
    setRouteDuration(null)
    setRouteError(null)
  }

  const handleModeChange = (mode: TravelMode) => {
    setTravelMode(mode)
  }

  const createCustomIcon = (provider: Provider, leaflet: typeof import('leaflet')) => {
    const size = 40
    const html = provider.avatar_url
      ? `<img src="${provider.avatar_url}" style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid #6D5EF8;object-fit:cover;" />`
      : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#6D5EF8,#5B4FE0);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:bold;border:2px solid #6D5EF8;">${getInitials(provider.business_name)}</div>`
    return leaflet.divIcon({
      html,
      className: 'custom-marker-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    })
  }

  const getDistance = (provider: Provider): number | null => {
    if (userLat != null && userLng != null && provider.location_lat != null && provider.location_lng != null) {
      return haversineDistance(userLat, userLng, provider.location_lat, provider.location_lng)
    }
    return null
  }

  const hasUserLocation = userLat != null && userLng != null
  const permissionDenied = geoError?.toLowerCase().includes('denied') || geoError?.toLowerCase().includes('denegado') || geoError?.toLowerCase().includes('permission')

  return (
    <div className="flex h-screen bg-[#050816]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-[rgba(255,255,255,0.06)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200 text-[#9CA3AF] hover:text-white lg:hidden"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-semibold text-white">Mapa de proveedores</h1>
          <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
            <MapPin size={14} className="text-[#7C3AED]" strokeWidth={1.75} />
          </div>
        </header>

        {!hasUserLocation && !loading && providersWithCoords.length > 0 && (
          <div className="px-4 py-3 bg-[#111827] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3">
            <p className="text-xs text-[#9CA3AF]">
              {permissionDenied
                ? 'Activa la ubicación en tu navegador para calcular distancias y rutas.'
                : 'Usa tu ubicación para ver distancias exactas.'}
            </p>
            {!permissionDenied && (
              <button
                onClick={requestLocation}
                disabled={geoLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#6D5EF8] hover:bg-[#5B4FE0] transition-all duration-200 disabled:opacity-50 shadow-lg shadow-[#6D5EF8]/20 whitespace-nowrap"
              >
                <Navigation size={14} strokeWidth={1.75} />
                {geoLoading ? 'Obteniendo...' : 'Usar mi ubicación actual'}
              </button>
            )}
          </div>
        )}

        <div className="flex-1 relative overflow-hidden" ref={mapContainerRef}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050816] z-20">
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Loader2 size={16} className="animate-spin text-[#7C3AED]" />
                Cargando proveedores...
              </div>
            </div>
          )}

          {!loading && providersWithCoords.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050816] z-20">
              <div className="text-center px-6">
                <MapPin size={32} className="text-[rgba(255,255,255,0.06)] mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-[#9CA3AF] mb-1">No hay proveedores con ubicación registrada</p>
                <p className="text-xs text-[#6B7280]">Los proveedores aparecerán aquí cuando registren su ubicación.</p>
              </div>
            </div>
          )}

          {L && !loading && (
            <div className="absolute inset-0 overflow-hidden" style={{ contain: 'strict' }}>
              <MapContainer
                center={[userLat ?? -0.22985, userLng ?? -78.52495]}
                zoom={13}
                className="h-full w-full"
                zoomControl={true}
              >
                <MapResizer />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hasUserLocation && (
                  <Marker position={[userLat!, userLng!]}>
                    <Popup>Tu ubicación</Popup>
                  </Marker>
                )}
                {providersWithCoords.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.location_lat!, p.location_lng!]}
                    icon={createCustomIcon(p, L)}
                    eventHandlers={{
                      click: () => handleSelectProvider(p),
                    }}
                  />
                ))}
                {routeCoords && routeCoords.length >= 2 && (
                  <Polyline
                    positions={routeCoords}
                    color="#6D5EF8"
                    weight={routeError ? 3 : 4}
                    dashArray={routeError ? '6 4' : undefined}
                  />
                )}
              </MapContainer>
            </div>
          )}

          {selectedRouteProvider && (
            <div className="absolute bottom-6 left-4 right-4 z-[60] lg:bottom-6 lg:left-4 lg:right-4">
              <div className="bg-[#151E2F] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 shadow-xl backdrop-blur-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {selectedRouteProvider.avatar_url ? (
                      <img src={selectedRouteProvider.avatar_url} alt="" className="w-8 h-8 rounded-xl object-cover border border-[#1E2D4A] flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center text-[10px] font-bold text-[#6D5EF8] flex-shrink-0">
                        {getInitials(selectedRouteProvider.business_name)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedRouteProvider.business_name}</p>
                      {routeDistance != null && routeDuration != null ? (
                        <p className="text-xs text-[#7C3AED] mt-0.5">
                          {MODE_LABELS[travelMode].label} · {formatDistance(routeDistance)} · {formatDuration(routeDuration)}
                        </p>
                      ) : routeError ? (
                        <p className="text-xs text-[#FBBF24] mt-0.5">{routeError}</p>
                      ) : routeLoading ? (
                        <p className="text-xs text-[#9CA3AF] mt-0.5">Calculando ruta...</p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={handleClearRoute}
                    className="p-1.5 rounded-xl hover:bg-[#1A2440] transition-colors text-[#9CA3AF] hover:text-white"
                  >
                    <X size={14} strokeWidth={1.75} />
                  </button>
                </div>

                <div className="flex gap-2">
                  {(Object.entries(MODE_LABELS) as [TravelMode, typeof MODE_LABELS[TravelMode]][]).map(([mode, config]) => {
                    const Icon = config.icon
                    const isActive = travelMode === mode
                    return (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-white'
                            : 'bg-[#111827] border border-[rgba(255,255,255,0.06)] text-[#9CA3AF] hover:bg-[#151E2F] hover:text-white'
                        }`}
                      >
                        <Icon size={12} strokeWidth={1.75} />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {selectedRouteProvider && routeLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-[#151E2F] rounded-xl px-4 py-2 border border-[rgba(255,255,255,0.06)] flex items-center gap-2 shadow-lg">
              <Loader2 size={14} className="animate-spin text-[#7C3AED]" />
              <span className="text-xs text-[#9CA3AF]">Calculando ruta...</span>
            </div>
          )}

          {selectedProvider && (
            <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[360px] z-[55] border-l border-[rgba(255,255,255,0.06)] bg-[#0B1120]/95 backdrop-blur-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
                  <p className="text-sm font-semibold text-white">Detalles del proveedor</p>
                  <button
                    onClick={handleCloseProfile}
                    className="p-1.5 rounded-xl hover:bg-[#1A2440] transition-colors text-[#9CA3AF] hover:text-white"
                  >
                    <X size={16} strokeWidth={1.75} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  <div className="flex items-start gap-3">
                    {selectedProvider.avatar_url ? (
                      <img
                        src={selectedProvider.avatar_url}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover border border-[#1E2D4A] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center text-lg font-bold text-[#6D5EF8] flex-shrink-0">
                        {getInitials(selectedProvider.business_name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-white leading-snug">{selectedProvider.business_name}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {selectedProvider.category}
                        {selectedProvider.subcategory ? ` · ${selectedProvider.subcategory}` : ''}
                      </p>
                      {selectedProvider.available_now && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Disponible ahora
                        </span>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const d = getDistance(selectedProvider)
                    if (d == null) return null
                    return (
                      <p className="text-xs text-[#7C3AED] flex items-center gap-1.5">
                        <MapPin size={12} strokeWidth={1.75} />
                        A {d.toFixed(1)} km de ti
                      </p>
                    )
                  })()}

                  {selectedProvider.description && (
                    <p className="text-sm text-[#9CA3AF] leading-relaxed">{selectedProvider.description}</p>
                  )}

                  {selectedProvider.rating != null && (
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.06)]">
                        <Star size={13} className="text-amber-400" fill="currentColor" />
                        <span className="text-xs font-medium text-white">{Number(selectedProvider.rating).toFixed(1)}</span>
                        <span className="text-xs text-[#6B7280]">· {selectedProvider.review_count ?? 0} reseñas</span>
                      </div>
                      {(selectedProvider.price_min != null || selectedProvider.price_max != null) && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.06)]">
                          <Wallet size={13} className="text-[#7C3AED]" />
                          <span className="text-xs text-white">
                            {selectedProvider.price_min != null ? `$${selectedProvider.price_min}` : ''}
                            {selectedProvider.price_min != null && selectedProvider.price_max != null ? ' - ' : ''}
                            {selectedProvider.price_max != null ? `$${selectedProvider.price_max}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProvider.address && (
                    <div className="flex items-start gap-2 text-sm text-[#9CA3AF]">
                      <MapPin size={14} className="mt-0.5 text-[#6B7280] flex-shrink-0" strokeWidth={1.75} />
                      <span>{selectedProvider.address}</span>
                    </div>
                  )}

                  {selectedProvider.phone && (
                    <button
                      onClick={() => window.location.href = `tel:${selectedProvider.phone}`}
                      className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-white transition-colors"
                    >
                      <Phone size={14} className="text-[#6B7280] flex-shrink-0" strokeWidth={1.75} />
                      {selectedProvider.phone}
                    </button>
                  )}

                  {selectedProvider.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedProvider.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-emerald-400 transition-colors"
                    >
                      <MessageCircle size={14} className="text-[#25D366] flex-shrink-0" strokeWidth={1.75} />
                      Contactar por WhatsApp
                    </a>
                  )}
                </div>

                <div className="px-5 py-4 border-t border-[rgba(255,255,255,0.06)] flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewProfile(selectedProvider)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6D5EF8] hover:bg-[#5B4FE0] transition-all duration-200 shadow-lg shadow-[#6D5EF8]/20"
                  >
                    Ver perfil completo
                  </button>
                  <button
                    onClick={() => handleSetRoute(selectedProvider)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#151E2F] hover:bg-[#1A2440] border border-[rgba(255,255,255,0.08)] transition-colors"
                  >
                    <Navigation size={15} strokeWidth={1.75} />
                    Ruta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
