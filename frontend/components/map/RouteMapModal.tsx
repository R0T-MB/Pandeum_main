'use client'

import { useState, useEffect } from 'react'
import { X, Navigation, ExternalLink, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ProviderRecommendation } from '@/types'
import { useGeolocation } from '@/hooks/useGeolocation'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false })

interface RouteMapModalProps {
  isOpen: boolean
  onClose: () => void
  provider: ProviderRecommendation | null
}

interface OSRMRoute {
  distance: number
  duration: number
  geometry: {
    coordinates: [number, number][]
  }
}

export function RouteMapModal({ isOpen, onClose, provider }: RouteMapModalProps) {
  const { latitude: userLat, longitude: userLng, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()
  const [L, setL] = useState<typeof import('leaflet') | null>(null)
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

  useEffect(() => {
    if (isOpen && userLat === null && userLng === null && !geoLoading) {
      requestLocation()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !provider) return
    const pLat = provider.location_lat
    const pLng = provider.location_lng
    if (userLat != null && userLng != null && pLat != null && pLng != null) {
      setRouteLoading(true)
      const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${pLng},${pLat}?overview=full&geometries=geojson`
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
            setRouteCoords([[userLat, userLng], [pLat, pLng]])
            setRouteDistance(null)
            setRouteDuration(null)
          }
        })
        .catch(() => {
          setRouteCoords([[userLat, userLng], [pLat, pLng]])
          setRouteDistance(null)
          setRouteDuration(null)
        })
        .finally(() => setRouteLoading(false))
    } else {
      setRouteCoords(null)
      setRouteDistance(null)
      setRouteDuration(null)
    }
  }, [isOpen, provider, userLat, userLng])

  if (!isOpen || !provider) return null

  const providerLat = provider.location_lat != null ? provider.location_lat : null
  const providerLng = provider.location_lng != null ? provider.location_lng : null
  const hasProviderCoords = providerLat != null && providerLng != null
  const hasUserCoords = userLat !== null && userLng !== null

  const googleMapsUrl = hasProviderCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${providerLat},${providerLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.business_name)}`

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
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

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70" onClick={onClose} />

      <div className="fixed inset-4 z-50 m-auto max-w-2xl max-h-[80vh] bg-[#111827] rounded-3xl border border-[#1E2D4A] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D4A]">
          <div className="min-w-0 flex-1 mr-4">
            <h3 className="text-sm font-semibold text-white truncate">{provider.business_name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white flex-shrink-0"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 relative min-h-[300px]">
          {(geoLoading || routeLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827] z-10">
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Loader2 size={16} className="animate-spin text-[#6D5EF8]" />
                {routeLoading ? 'Calculando ruta...' : 'Obteniendo ubicación...'}
              </div>
            </div>
          )}

          {geoError && !geoLoading && !routeLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827] z-10">
              <div className="text-center px-6">
                <Navigation size={32} className="text-[#1E2D4A] mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-[#9CA3AF] mb-1">No se pudo obtener tu ubicación</p>
                <p className="text-xs text-[#1E2D4A] mb-4">{geoError}</p>
                <button
                  onClick={requestLocation}
                  className="text-sm text-white bg-[#151E2F] hover:bg-[#1A2440] px-4 py-2 rounded-2xl transition-all duration-200 border border-[#1E2D4A]"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {L && (
            <MapContainer
              center={[userLat ?? -0.22985, userLng ?? -78.52495]}
              zoom={14}
              className="h-full w-full"
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {hasUserCoords && (
                <Marker position={[userLat!, userLng!]}>
                  <Popup>Tu ubicación</Popup>
                </Marker>
              )}
              {hasProviderCoords && (
                <Marker position={[providerLat, providerLng]}>
                  <Popup>{provider.business_name}</Popup>
                </Marker>
              )}
              {routeCoords && routeCoords.length >= 2 && (
                <Polyline
                  positions={routeCoords}
                  color="#6D5EF8"
                  weight={3}
                />
              )}
            </MapContainer>
          )}

          {!hasProviderCoords && !geoLoading && !geoError && !routeLoading && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#151E2F] rounded-2xl px-4 py-3 text-center z-10 border border-[#1E2D4A]">
              <p className="text-xs text-[#9CA3AF]">
                Este proveedor aún no tiene una ubicación registrada.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#1E2D4A] flex items-center justify-between">
          <div className="text-xs text-[#9CA3AF]">
            {hasUserCoords && hasProviderCoords ? (
              routeDistance != null && routeDuration != null ? (
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">{formatDistance(routeDistance)}</span>
                  <span className="text-[#6D5EF8] font-medium">{formatDuration(routeDuration)}</span>
                </div>
              ) : routeCoords != null ? (
                <span className="text-[#FBBF24]">No se pudo calcular la ruta por calles. Mostrando ruta aproximada.</span>
              ) : routeLoading ? (
                <span>Calculando ruta...</span>
              ) : (
                <span>Ruta estimada desde tu ubicación</span>
              )
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white bg-[#151E2F] hover:bg-[#1A2440] border border-[#1E2D4A] hover:border-[#6D5EF8]/50 px-4 py-2 rounded-2xl transition-all duration-200"
          >
            <ExternalLink size={14} strokeWidth={1.75} />
            Abrir en Google Maps
          </a>
        </div>
      </div>
    </>
  )
}
