'use client'

import { useState, useEffect } from 'react'
import { X, Navigation, ExternalLink } from 'lucide-react'
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

export function RouteMapModal({ isOpen, onClose, provider }: RouteMapModalProps) {
  const { latitude: userLat, longitude: userLng, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()
  const [L, setL] = useState<typeof import('leaflet') | null>(null)

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

  if (!isOpen || !provider) return null

  const providerLat = 0
  const providerLng = 0
  const hasProviderCoords = false
  const hasUserCoords = userLat !== null && userLng !== null

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(provider.business_name)}`

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
          {geoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827] z-10">
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <div className="w-4 h-4 border-2 border-[#1E2D4A] border-t-[#6D5EF8] rounded-full animate-spin" />
                Obteniendo ubicacion...
              </div>
            </div>
          )}

          {geoError && !geoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827] z-10">
              <div className="text-center px-6">
                <Navigation size={32} className="text-[#1E2D4A] mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-[#9CA3AF] mb-1">No se pudo obtener tu ubicacion</p>
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
                  <Popup>Tu ubicacion</Popup>
                </Marker>
              )}
              {hasProviderCoords && (
                <>
                  <Marker position={[providerLat, providerLng]}>
                    <Popup>{provider.business_name}</Popup>
                  </Marker>
                  {hasUserCoords && (
                    <Polyline
                      positions={[[userLat!, userLng!], [providerLat, providerLng]]}
                      color="#6D5EF8"
                      weight={2}
                      dashArray="6 4"
                    />
                  )}
                </>
              )}
            </MapContainer>
          )}

          {!hasProviderCoords && !geoLoading && !geoError && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#151E2F] rounded-2xl px-4 py-3 text-center z-10 border border-[#1E2D4A]">
              <p className="text-xs text-[#9CA3AF]">
                Este proveedor aun no tiene coordenadas registradas.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#1E2D4A] flex items-center justify-between">
          <div className="text-xs text-[#9CA3AF]">
            {hasUserCoords && hasProviderCoords && (
              <span>Ruta estimada desde tu ubicacion</span>
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
