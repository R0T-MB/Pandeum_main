'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Provider, ProviderRecommendation } from '@/types'
import { RouteMapModal } from '@/components/map/RouteMapModal'
import Sidebar from '@/components/layout/Sidebar'
import { MapPin, Navigation, Menu, Loader2, Crosshair } from 'lucide-react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { useGeolocation } from '@/hooks/useGeolocation'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
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

export default function MapPage() {
  const [L, setL] = useState<typeof import('leaflet') | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ProviderRecommendation | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const { latitude: userLat, longitude: userLng, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

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

  const providersWithCoords = providers.filter(
    p => p.location_lat != null && p.location_lng != null
  )

  const handleViewProfile = () => {
    toast('Perfil del proveedor próximamente')
  }

  const handleSetRoute = (provider: Provider) => {
    const recommendation: ProviderRecommendation = {
      provider_id: provider.id,
      business_name: provider.business_name,
      trust_score: provider.trust_score,
      rating: provider.rating,
      location_lat: provider.location_lat,
      location_lng: provider.location_lng,
      reason_bullets: [],
      estimated_cost: provider.price_min != null && provider.price_max != null
        ? `$${provider.price_min} - $${provider.price_max}`
        : undefined,
      available_now: provider.available_now,
    }
    setSelectedProvider(recommendation)
    setMapOpen(true)
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
            </MapContainer>
          )}
        </div>
      </div>

      <RouteMapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        provider={selectedProvider}
      />
    </div>
  )
}
