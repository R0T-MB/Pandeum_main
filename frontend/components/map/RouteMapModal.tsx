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

      <div className="fixed inset-4 z-50 m-auto max-w-2xl max-h-[80vh] bg-[#1d1d22] rounded-2xl border border-[#5e5d69] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#5e5d69]">
          <div className="min-w-0 flex-1 mr-4">
            <h3 className="text-sm font-semibold text-white truncate">{provider.business_name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#3b3b43] transition-colors text-[#868393] hover:text-white flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 relative min-h-[300px]">
          {geoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1d1d22] z-10">
              <div className="flex items-center gap-2 text-sm text-[#868393]">
                <div className="w-4 h-4 border-2 border-[#5e5d69] border-t-white rounded-full animate-spin" />
                Obteniendo ubicacion...
              </div>
            </div>
          )}

          {geoError && !geoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1d1d22] z-10">
              <div className="text-center px-6">
                <Navigation size={32} className="text-[#5e5d69] mx-auto mb-3" />
                <p className="text-sm text-[#868393] mb-1">No se pudo obtener tu ubicacion</p>
                <p className="text-xs text-[#5e5d69] mb-4">{geoError}</p>
                <button
                  onClick={requestLocation}
                  className="text-sm text-white bg-[#3b3b43] hover:bg-[#5e5d69] px-4 py-2 rounded-lg transition-colors"
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
                      color="#868393"
                      weight={2}
                      dashArray="6 4"
                    />
                  )}
                </>
              )}
            </MapContainer>
          )}

          {!hasProviderCoords && !geoLoading && !geoError && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#3b3b43] rounded-xl px-4 py-3 text-center z-10">
              <p className="text-xs text-[#868393]">
                Este proveedor aun no tiene coordenadas registradas.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#5e5d69] flex items-center justify-between">
          <div className="text-xs text-[#868393]">
            {hasUserCoords && hasProviderCoords && (
              <span>Ruta estimada desde tu ubicacion</span>
            )}
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white bg-[#3b3b43] hover:bg-[#5e5d69] px-4 py-2 rounded-lg transition-colors"
          >
            <ExternalLink size={14} />
            Abrir en Google Maps
          </a>
        </div>
      </div>
    </>
  )
}
