'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Provider } from '@/types'
import Sidebar from '@/components/layout/Sidebar'
import { MapPin, Navigation, Menu, Loader2, Crosshair, X, Car, Footprints, Bike } from 'lucide-react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { useGeolocation } from '@/hooks/useGeolocation'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false })

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
  const [L, setL] = useState<typeof import('leaflet') | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { latitude: userLat, longitude: userLng, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

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

  const handleViewProfile = () => {
    toast('Perfil del proveedor próximamente')
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
    <div className="flex h-screen bg-[#0B1020]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1E2D4A]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-semibold text-white">Mapa de proveedores</h1>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center">
            <MapPin size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
          </div>
        </header>

        {!hasUserLocation && !loading && providersWithCoords.length > 0 && (
          <div className="px-4 py-2 bg-[#151E2F] border-b border-[#1E2D4A] flex items-center justify-between">
            <p className="text-xs text-[#9CA3AF]">
              {permissionDenied
                ? 'Activa la ubicación en tu navegador para calcular distancias y rutas.'
                : 'Activa tu ubicación para calcular distancias y rutas.'}
            </p>
            {!permissionDenied && (
              <button
                onClick={requestLocation}
                disabled={geoLoading}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#6D5EF8] hover:text-[#A78BFA] transition-colors disabled:opacity-50"
              >
                <Crosshair size={12} strokeWidth={1.75} />
                {geoLoading ? 'Obteniendo...' : 'Usar mi ubicación'}
              </button>
            )}
          </div>
        )}

        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827] z-20">
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Loader2 size={16} className="animate-spin text-[#6D5EF8]" />
                Cargando proveedores...
              </div>
            </div>
          )}

          {!loading && providersWithCoords.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827] z-20">
              <div className="text-center px-6">
                <MapPin size={32} className="text-[#1E2D4A] mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-[#9CA3AF] mb-1">No hay proveedores con ubicación registrada</p>
                <p className="text-xs text-[#6B7280]">Los proveedores aparecerán aquí cuando registren su ubicación.</p>
              </div>
            </div>
          )}

          {L && !loading && (
            <MapContainer
              center={[userLat ?? -0.22985, userLng ?? -78.52495]}
              zoom={13}
              className="h-full w-full"
              zoomControl={true}
            >
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
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-sm mb-1">{p.business_name}</p>
                      <p className="text-xs text-[#6B7280] mb-1">{p.category}{p.subcategory ? ` · ${p.subcategory}` : ''}</p>
                      {(() => {
                        const d = getDistance(p)
                        return d != null ? (
                          <p className="text-xs text-[#6D5EF8] mb-2 flex items-center gap-1">
                            <MapPin size={10} />
                            {d.toFixed(1)} km
                          </p>
                        ) : null
                      })()}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleViewProfile}
                          className="flex-1 text-xs text-white bg-[#6D5EF8] hover:bg-[#5B4FE0] px-3 py-1.5 rounded-xl transition-colors"
                        >
                          Ver perfil
                        </button>
                        <button
                          onClick={() => handleSetRoute(p)}
                          className="flex-1 text-xs text-white bg-[#151E2F] hover:bg-[#1A2440] px-3 py-1.5 rounded-xl border border-[#1E2D4A] transition-colors flex items-center justify-center gap-1"
                        >
                          <Navigation size={10} />
                          Ruta
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
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
          )}

          {selectedRouteProvider && (
            <div className="absolute bottom-6 left-4 right-4 z-30">
              <div className="bg-[#151E2F] rounded-2xl border border-[#1E2D4A] p-4 shadow-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedRouteProvider.business_name}</p>
                    {routeDistance != null && routeDuration != null ? (
                      <p className="text-xs text-[#6D5EF8] mt-0.5">
                        {MODE_LABELS[travelMode].label} · {formatDistance(routeDistance)} · {formatDuration(routeDuration)}
                      </p>
                    ) : routeError ? (
                      <p className="text-xs text-[#FBBF24] mt-0.5">{routeError}</p>
                    ) : routeLoading ? (
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Calculando ruta...</p>
                    ) : null}
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
                            ? 'bg-[#6D5EF8]/20 border border-[#6D5EF8]/50 text-white'
                            : 'bg-[#111827] border border-[#1E2D4A] text-[#9CA3AF] hover:bg-[#1A2440] hover:text-white'
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
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#151E2F] rounded-xl px-4 py-2 border border-[#1E2D4A] flex items-center gap-2 shadow-lg">
              <Loader2 size={14} className="animate-spin text-[#6D5EF8]" />
              <span className="text-xs text-[#9CA3AF]">Calculando ruta...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
