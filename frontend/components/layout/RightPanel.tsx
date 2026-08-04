'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Star,
  MapPin,
  Share2,
  Heart,
  Navigation,
  Phone,
  MessageCircle,
  User,
  CheckCircle2,
  ChevronRight,
  Footprints,
  Car,
  Bike,
  Bus,
  Loader2,
  Crosshair,
} from 'lucide-react'
import { ProviderRecommendation } from '@/types'
import { useGeolocation } from '@/hooks/useGeolocation'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false })

interface RightPanelProps {
  providers?: ProviderRecommendation[]
  onOpenProviders?: () => void
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

type TravelMode = 'foot' | 'car' | 'bike' | 'bus'

interface OSRMRoute {
  distance: number
  duration: number
  geometry: {
    coordinates: [number, number][]
  }
}

const MODE_OSRM_PROFILE: Record<TravelMode, string> = {
  foot: 'foot',
  car: 'driving',
  bike: 'bike',
  bus: 'driving',
}

const MODE_ICONS: Record<TravelMode, React.ReactNode> = {
  foot: <Footprints className="w-4 h-4" />,
  car: <Car className="w-4 h-4" />,
  bike: <Bike className="w-4 h-4" />,
  bus: <Bus className="w-4 h-4" />,
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

export function RightPanel({ providers = [], onOpenProviders }: RightPanelProps) {
  const primary = providers[0] as ProviderRecommendation | undefined
  const { latitude: userLat, longitude: userLng, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

  const [L, setL] = useState<typeof import('leaflet') | null>(null)
  const [travelMode, setTravelMode] = useState<TravelMode>('foot')
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null)
  const [routeDistance, setRouteDistance] = useState<number | null>(null)
  const [routeDuration, setRouteDuration] = useState<number | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)

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

  const providerLat = primary?.location_lat ?? null
  const providerLng = primary?.location_lng ?? null
  const hasProviderCoords = providerLat != null && providerLng != null
  const hasUserCoords = userLat != null && userLng != null

  useEffect(() => {
    if (hasProviderCoords && userLat === null && userLng === null && !geoLoading) {
      requestLocation()
    }
  }, [primary?.provider_id])

  const fetchRoute = useCallback(() => {
    if (userLat == null || userLng == null || !hasProviderCoords) {
      setRouteCoords(null)
      setRouteDistance(null)
      setRouteDuration(null)
      return
    }
    setRouteLoading(true)
    const profile = MODE_OSRM_PROFILE[travelMode]
    const url = `https://router.project-osrm.org/route/v1/${profile}/${userLng},${userLat};${providerLng},${providerLat}?overview=full&geometries=geojson`
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const route: OSRMRoute = data.routes[0]
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          )
          setRouteCoords(coords)
          setRouteDistance(route.distance)
          setRouteDuration(route.duration)
        } else {
          setRouteCoords([[userLat, userLng], [providerLat!, providerLng!]])
          setRouteDistance(null)
          setRouteDuration(null)
        }
      })
      .catch(() => {
        setRouteCoords([[userLat, userLng], [providerLat!, providerLng!]])
        setRouteDistance(null)
        setRouteDuration(null)
      })
      .finally(() => setRouteLoading(false))
  }, [userLat, userLng, providerLat, providerLng, travelMode, hasProviderCoords])

  useEffect(() => {
    fetchRoute()
  }, [fetchRoute])

  const arrivalTime = routeDuration != null
    ? new Date(Date.now() + routeDuration * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null

  const googleMapsUrl = hasProviderCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${providerLat},${providerLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primary?.business_name || '')}`

  return (
    <aside className="hidden xl:flex xl:flex-col xl:w-[380px] bg-theme-bg border-l border-theme-border p-4 gap-4 overflow-y-auto h-screen shrink-0 select-none transition-colors duration-200">

      {/* Header + "Ver más sugerencias" */}
      <div>
        <h3 className="text-xs font-bold text-theme-text uppercase tracking-wider">
          Proveedores disponibles
        </h3>
        <p className="text-xs text-theme-text-muted mb-3">Estos profesionales están cerca de ti</p>
        {onOpenProviders && (
          <button
            onClick={onOpenProviders}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-violet-600/30 border border-violet-500/40 text-white text-xs font-semibold hover:bg-violet-600/40 transition"
          >
            Ver más sugerencias
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        )}
      </div>

      {/* Real provider card or empty state */}
      {primary ? (
        <div className="bg-theme-card rounded-3xl border border-theme-border p-4 shadow-xl transition-colors duration-200">
          {/* Header: Avatar + Name + Actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 overflow-hidden flex items-center justify-center font-bold text-white text-base shadow-md shrink-0">
                {primary.avatar_url ? (
                  <img src={primary.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(primary.business_name)
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-sm font-bold text-theme-text leading-tight">
                    {primary.business_name}
                  </h4>
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 fill-violet-400/20" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-theme-text">{primary.rating ? primary.rating.toFixed(1) : '—'}</span>
                  <div className="flex items-center text-yellow-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3 h-3 ${star <= Math.round(primary.rating || 0) ? 'fill-current' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <span className="text-white/30">•</span>
                  <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {primary.available_now ? 'Abierto' : 'Disponible'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] text-theme-text-muted hover:text-theme-text transition">
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] text-rose-400 transition">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>

          <p className="text-xs text-theme-text-muted mb-4">
            {primary.address || primary.service_area || 'Servicio profesional verificado'}
          </p>

          {/* Metrics Grid (4 columns) */}
          <div className="grid grid-cols-4 gap-1.5 mb-4 text-center">
            <div className="dark:bg-[#0b0817] bg-gray-100 p-2.5 rounded-2xl dark:border-white/5 border-gray-200">
              <span className="block text-xs font-bold text-theme-text">—</span>
              <span className="block text-[10px] text-theme-text-muted">Experiencia</span>
            </div>
            <div className="dark:bg-[#0b0817] bg-gray-100 p-2.5 rounded-2xl dark:border-white/5 border-gray-200">
              <span className="block text-xs font-bold text-theme-text">{primary.estimated_cost || '—'}</span>
              <span className="block text-[10px] text-theme-text-muted">Precio medio</span>
            </div>
            <div className="dark:bg-[#0b0817] bg-gray-100 p-2.5 rounded-2xl dark:border-white/5 border-gray-200">
              <span className="block text-xs font-bold text-theme-text">
                {primary.distance_km != null
                  ? primary.distance_km < 1
                    ? `${Math.round(primary.distance_km * 1000)} m`
                    : `${primary.distance_km.toFixed(1)} km`
                  : '—'}
              </span>
              <span className="block text-[10px] text-theme-text-muted">Distancia</span>
            </div>
            <div className="dark:bg-[#0b0817] bg-gray-100 p-2.5 rounded-2xl dark:border-white/5 border-gray-200">
              <span className="block text-xs font-bold text-theme-text">
                {typeof primary.response_time_hours === 'number'
                  ? primary.response_time_hours < 1
                    ? '<1 h'
                    : `${primary.response_time_hours}h`
                  : '—'}
              </span>
              <span className="block text-[10px] text-theme-text-muted">Respuesta</span>
            </div>
          </div>

          {/* Action Buttons Row (4 columns) */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-[10px] font-medium transition"
            >
              <Navigation className="w-3.5 h-3.5 mb-1 text-violet-400" />
              <span>Cómo llegar</span>
            </a>
            {primary.phone ? (
              <a
                href={`tel:${primary.phone}`}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition"
              >
                <Phone className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>Llamar</span>
              </a>
            ) : (
              <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition">
                <Phone className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>Llamar</span>
              </button>
            )}
            {primary.whatsapp ? (
              <a
                href={`https://wa.me/${primary.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition"
              >
                <MessageCircle className="w-3.5 h-3.5 mb-1 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition">
                <MessageCircle className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>WhatsApp</span>
              </button>
            )}
            {primary.provider_id ? (
              <Link
                href={`/providers/${primary.provider_id}`}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition"
              >
                <User className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>Ver perfil</span>
              </Link>
            ) : (
              <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition">
                <User className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>Ver perfil</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-theme-text-muted leading-relaxed pt-2 border-t border-theme-border">
            {primary.address
              ? `Ubicado en ${primary.address}${primary.service_area ? `, ${primary.service_area}` : ''}.`
              : primary.service_area
                ? `Sirve en el área de ${primary.service_area}.`
                : 'Profesional verificado listo para ayudarte.'}
          </p>
        </div>
      ) : (
        <div className="bg-theme-card rounded-3xl border border-theme-border p-6 text-center transition-colors duration-200">
          <div className="w-10 h-10 rounded-xl bg-theme-divider flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-5 h-5 text-theme-text-muted" />
          </div>
          <p className="text-xs text-theme-text-muted">Haz una consulta para ver proveedores disponibles</p>
        </div>
      )}

      {/* Route card */}
      <div className="bg-theme-card rounded-3xl border border-theme-border p-4 shadow-xl transition-colors duration-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-theme-text tracking-wide">Ruta sugerida</span>
          </div>
          {routeLoading ? (
            <span className="flex items-center gap-1.5 text-xs text-theme-text-muted">
              <Loader2 className="w-3 h-3 animate-spin text-violet-400" /> Calculando...
            </span>
          ) : arrivalTime ? (
            <span className="text-xs text-theme-text-muted">
              Llegada estimada <span className="text-theme-text font-semibold">{arrivalTime}</span>
            </span>
          ) : hasProviderCoords && !hasUserCoords ? (
            <span className="text-xs text-theme-text-muted">Sin ubicación</span>
          ) : (
            <span className="text-xs text-theme-text-muted">Llegada estimada —</span>
          )}
        </div>

        {primary ? (
          <div className="text-xs font-semibold text-theme-text">
            {routeDistance != null && routeDuration != null ? (
              <>
                {formatDistance(routeDistance)}
                <span className="text-theme-text-muted font-normal"> · {formatDuration(routeDuration)}</span>
              </>
            ) : routeCoords != null && hasUserCoords && hasProviderCoords ? (
              <>
                <span className="text-amber-400 font-medium">Ruta aproximada por calles</span>
              </>
            ) : routeLoading ? (
              <span className="text-theme-text-muted font-normal">Calculando ruta...</span>
            ) : hasProviderCoords && !hasUserCoords ? (
              <>
                {primary.distance_km != null
                  ? primary.distance_km < 1
                    ? `${Math.round(primary.distance_km * 1000)} m`
                    : `${primary.distance_km.toFixed(1)} km`
                  : 'Ruta sugerida'}
                <span className="text-theme-text-muted font-normal"> (estimado)</span>
              </>
            ) : (
              <span className="text-theme-text-muted font-normal">Selecciona un proveedor para calcular tu ruta</span>
            )}
          </div>
        ) : (
          <div className="text-xs font-semibold text-theme-text">
            <span className="text-theme-text-muted font-normal">Selecciona un proveedor para calcular tu ruta</span>
          </div>
        )}

        {/* Transport selector — 4 square buttons */}
        <div className="flex items-center gap-2">
          {(Object.keys(MODE_ICONS) as TravelMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setTravelMode(mode)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                travelMode === mode
                  ? 'bg-violet-600/20 border border-violet-500/40 text-violet-400'
                  : 'dark:bg-[#0b0817] bg-gray-100 dark:border-white/5 border-gray-200 text-theme-text-muted hover:text-theme-text'
              }`}
              title={mode === 'foot' ? 'A pie' : mode === 'car' ? 'En coche' : mode === 'bike' ? 'En bicicleta' : 'En bus'}
            >
              {MODE_ICONS[mode]}
            </button>
          ))}
        </div>

        {/* Mini Map */}
        <div className="h-28 dark:bg-[#0b0817] bg-gray-100 rounded-2xl dark:border-white/5 border-gray-200 relative overflow-hidden flex items-center justify-center">
          {L && hasProviderCoords && hasUserCoords ? (
            <div className="absolute inset-0 overflow-hidden" style={{ contain: 'strict' }}>
              <MapContainer
                center={[userLat!, userLng!]}
                zoom={13}
                className="h-full w-full"
                scrollWheelZoom={false}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <CircleMarker
                  center={[userLat!, userLng!]}
                  radius={5}
                  pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 1, weight: 2 }}
                />
                <Marker
                  position={[providerLat!, providerLng!]}
                  icon={L.divIcon({
                    html: `<div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;border:2px solid #a78bfa;color:white;font-size:10px;font-weight:700;">${getInitials(primary.business_name)}</div>`,
                    className: 'custom-marker-icon',
                    iconSize: [26, 26],
                    iconAnchor: [13, 13],
                  })}
                />
                {routeCoords && routeCoords.length >= 2 && (
                  <Polyline
                    positions={routeCoords}
                    color="#a78bfa"
                    weight={2.5}
                    dashArray="6 6"
                  />
                )}
              </MapContainer>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:12px_12px]"></div>
              {hasProviderCoords && !hasUserCoords && !geoError && (
                <button
                  onClick={requestLocation}
                  className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/40 text-violet-300 text-[11px] font-semibold hover:bg-violet-600/30 transition"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Usar mi ubicación
                </button>
              )}
              {hasProviderCoords && hasUserCoords && routeLoading && (
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin relative z-10" />
              )}
              {hasProviderCoords && hasUserCoords && !routeLoading && routeDistance == null && routeCoords == null && (
                <span className="relative z-10 text-[11px] text-theme-text-muted">No se pudo cargar el mapa</span>
              )}
            </>
          )}
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition flex items-center justify-center gap-2"
        >
          <Navigation className="w-3.5 h-3.5 fill-current" /> Iniciar navegación
        </a>
      </div>
    </aside>
  )
}

export default RightPanel
