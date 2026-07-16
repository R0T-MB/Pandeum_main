'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { ProviderPublic } from '@/types'
import {
  Star, MapPin, Clock, Zap, Tag, Phone, Mail, Globe, MessageCircle,
  ExternalLink, Briefcase, DollarSign, Loader2, ArrowLeft,
  Map, Instagram, Facebook, X, ChevronLeft, ChevronRight, Image
} from 'lucide-react'

const DAYS_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
}

const getInitials = (name: string) => {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function PublicProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [provider, setProvider] = useState<ProviderPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [galleryModal, setGalleryModal] = useState<{ images: { url: string; title?: string }[]; index: number } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(false)
    api.get(`/providers/${id}`)
      .then(res => setProvider(res.data as ProviderPublic))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  const openGoogleMaps = () => {
    if (!provider?.location_lat || !provider?.location_lng) return
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${provider.location_lat},${provider.location_lng}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0B1020] items-center justify-center">
        <Loader2 size={32} className="text-[#6D5EF8] animate-spin" />
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="flex h-screen bg-[#0B1020] items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Proveedor no encontrado</h2>
          <p className="text-sm text-[#9CA3AF] leading-relaxed mb-6">
            El perfil que buscas no existe o no está disponible.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-[#6D5EF8] hover:bg-[#5B4FE0] text-white rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-200"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
            Volver
          </button>
        </div>
      </div>
    )
  }

  const scheduleEntries = provider.availability_json
    ? Object.entries(DAYS_LABELS).map(([key, label]) => {
        const day = (provider.availability_json as Record<string, unknown>)?.[key] as Record<string, unknown> | undefined
        return { key, label, day }
      })
    : []

  const activeServices = provider.services?.filter(s => s.is_active) ?? []

  const galleryImages = [...(provider.gallery_images || [])].sort((a, b) => (a.is_main ? -1 : 0) - (b.is_main ? -1 : 0))

  const priceRange = provider.price_min != null && provider.price_max != null
    ? `$${provider.price_min} - $${provider.price_max}`
    : provider.price_min != null
    ? `Desde $${provider.price_min}`
    : provider.price_max != null
    ? `Hasta $${provider.price_max}`
    : null

  const contactItems: { icon: React.ReactNode; label: string; href: string; visible: boolean }[] = [
    {
      icon: <MessageCircle size={16} className="text-green-400" strokeWidth={1.75} />,
      label: 'WhatsApp',
      href: `https://wa.me/${provider.whatsapp?.replace(/[^0-9]/g, '')}`,
      visible: !!provider.whatsapp
    },
    {
      icon: <Phone size={16} className="text-[#6D5EF8]" strokeWidth={1.75} />,
      label: 'Llamar',
      href: `tel:${provider.phone}`,
      visible: !!provider.phone
    },
    {
      icon: <Mail size={16} className="text-yellow-400" strokeWidth={1.75} />,
      label: 'Correo',
      href: `mailto:${provider.contact_email}`,
      visible: !!provider.contact_email
    },
    {
      icon: <Globe size={16} className="text-blue-400" strokeWidth={1.75} />,
      label: 'Sitio web',
      href: provider.website_url || '#',
      visible: !!provider.website_url
    },
  ]

  const socialItems: { icon: React.ReactNode; label: string; href: string; visible: boolean }[] = [
    {
      icon: <Facebook size={16} className="text-blue-500" strokeWidth={1.75} />,
      label: 'Facebook',
      href: provider.facebook_url || '#',
      visible: !!provider.facebook_url
    },
    {
      icon: <Instagram size={16} className="text-pink-400" strokeWidth={1.75} />,
      label: 'Instagram',
      href: provider.instagram_url || '#',
      visible: !!provider.instagram_url
    },
    {
      icon: <ExternalLink size={16} className="text-white" strokeWidth={1.75} />,
      label: 'TikTok',
      href: provider.tiktok_url || '#',
      visible: !!provider.tiktok_url
    },
    {
      icon: <ExternalLink size={16} className="text-blue-400" strokeWidth={1.75} />,
      label: 'LinkedIn',
      href: provider.linkedin_url || '#',
      visible: !!provider.linkedin_url
    },
  ]

  const cardClass = "bg-[#111827] border border-[#1E2D4A] rounded-2xl p-5"

  return (
    <div className="min-h-screen bg-[#0B1020]">
      <div
        className="relative h-48 sm:h-56 border-b border-[#1E2D4A]"
        style={provider.cover_image_url ? {
          backgroundImage: `linear-gradient(to bottom, rgba(11,16,32,0.7), rgba(11,16,32,0.9)), url(${provider.cover_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {
          background: 'linear-gradient(to bottom right, #1E2D4A, #111827, #0B1020)',
        }}
      >
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 p-2 rounded-2xl bg-[#111827]/80 border border-[#1E2D4A] text-[#9CA3AF] hover:text-white hover:bg-[#151E2F] transition-all duration-200"
        >
          <ArrowLeft size={18} strokeWidth={1.75} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 mb-6">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#1E2D4A] bg-[#151E2F] flex-shrink-0 shadow-xl">
            {provider.avatar_url ? (
              <img src={provider.avatar_url} alt={provider.business_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#6D5EF8] bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20">
                {getInitials(provider.business_name)}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {provider.business_name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-medium bg-[#6D5EF8]/15 border border-[#6D5EF8]/30 text-[#6D5EF8]">
                <Tag size={11} strokeWidth={2} />
                {provider.category}
              </span>
              {provider.subcategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-medium bg-[#151E2F] border border-[#1E2D4A] text-[#9CA3AF]">
                  {provider.subcategory}
                </span>
              )}
              {typeof provider.rating === 'number' && provider.rating > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-medium bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                  <Star size={11} className="fill-yellow-400" strokeWidth={1.5} />
                  {provider.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {provider.available_now && (
              <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Zap size={13} strokeWidth={2} />
                Disponible ahora
              </span>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* Info General */}
          <div className={cardClass}>
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Briefcase size={16} className="text-[#6D5EF8]" strokeWidth={1.75} />
              Información general
            </h2>
            {provider.description && (
              <p className="text-sm text-[#D1D5DB] leading-relaxed mb-4">{provider.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              {priceRange && (
                <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                  <DollarSign size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                  <span className="text-white font-medium">{priceRange}</span>
                </div>
              )}
              {provider.response_time_hours != null && (
                <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                  <Clock size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                  <span className="text-white">
                    {provider.response_time_hours < 1
                      ? 'Responde en menos de 1 hora'
                      : `Responde en ${provider.response_time_hours} h aprox.`}
                  </span>
                </div>
              )}
              {provider.verification_status === 'verified' && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  Verificado
                </span>
              )}
            </div>
          </div>

          {/* Servicios */}
          <div className={cardClass}>
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-[#6D5EF8]" strokeWidth={1.75} />
              Servicios
            </h2>
            {activeServices.length > 0 ? (
              <div className="space-y-3">
                {activeServices.map(service => (
                  <div
                    key={service.id}
                    className="bg-[#151E2F] border border-[#1E2D4A] rounded-xl p-4 hover:border-[#1E2D4A]/80 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white">{service.name}</h3>
                        {service.description && (
                          <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">{service.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {(service.price_estimate || service.price_min != null || service.price_max != null) && (
                            <span className="text-xs text-[#6D5EF8] flex items-center gap-1">
                              <DollarSign size={10} strokeWidth={2} />
                              {service.price_estimate ||
                                (service.price_min != null && service.price_max != null
                                  ? `$${service.price_min} - $${service.price_max}`
                                  : service.price_min != null ? `Desde $${service.price_min}` :
                                    service.price_max != null ? `Hasta $${service.price_max}` : '')}
                            </span>
                          )}
                          {service.tags.length > 0 && service.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] bg-[#111827] text-[#9CA3AF] px-2 py-0.5 rounded-lg border border-[#1E2D4A]">
                              {tag}
                            </span>
                          ))}
                          {service.tags.length > 3 && (
                            <span className="text-[10px] text-[#9CA3AF]">+{service.tags.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-xl bg-[#151E2F] flex items-center justify-center mx-auto mb-2">
                  <Briefcase size={18} className="text-[#1E2D4A]" strokeWidth={1.75} />
                </div>
                <p className="text-sm text-[#9CA3AF]">Este proveedor aún no publicó servicios activos.</p>
              </div>
            )}
          </div>

          {/* Horario */}
          <div className={cardClass}>
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#6D5EF8]" strokeWidth={1.75} />
              Horario de atención
            </h2>
            <div className="space-y-2">
              {scheduleEntries.map(({ key, label, day }) => {
                const isOpen = day?.open === true
                return (
                  <div key={key} className="flex items-center gap-3 bg-[#151E2F] rounded-xl px-4 py-2.5 border border-[#1E2D4A]">
                    <span className={`text-sm w-20 flex-shrink-0 ${isOpen ? 'text-white' : 'text-[#9CA3AF]'}`}>
                      {label}
                    </span>
                    {isOpen ? (
                      <span className="text-xs text-[#D1D5DB]">
                        {String(day?.from || '09:00')} — {String(day?.to || '18:00')}
                      </span>
                    ) : (
                      <span className="text-xs text-[#9CA3AF]">Cerrado</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ubicación */}
          {(provider.address || provider.service_area || (provider.location_lat != null && provider.location_lng != null)) && (
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-[#6D5EF8]" strokeWidth={1.75} />
                Ubicación
              </h2>
              <div className="space-y-2 text-sm">
                {provider.address && (
                  <p className="text-[#D1D5DB]">{provider.address}</p>
                )}
                {provider.service_area && (
                  <p className="text-[#9CA3AF] flex items-center gap-1.5">
                    <MapPin size={12} strokeWidth={1.5} />
                    Zona de atención: {provider.service_area}
                  </p>
                )}
                {provider.location_lat != null && provider.location_lng != null && (
                  <button
                    onClick={openGoogleMaps}
                    className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-xs font-medium bg-[#151E2F] border border-[#1E2D4A] text-white hover:border-[#6D5EF8]/50 transition-all duration-200"
                  >
                    <Map size={14} strokeWidth={1.75} />
                    Abrir ruta en Google Maps
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Galería */}
          {galleryImages.length > 0 && (
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Image size={16} className="text-[#6D5EF8]" strokeWidth={1.75} />
                Galería
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryModal({ images: galleryImages, index: i })}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[#1E2D4A] bg-[#151E2F] group hover:border-[#6D5EF8]/50 transition-all duration-200"
                  >
                    <img src={img.url} alt={img.title || `Galería ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contacto */}
          <div className={cardClass}>
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <MessageCircle size={16} className="text-[#6D5EF8]" strokeWidth={1.75} />
              Contacto y redes
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {contactItems.filter(i => i.visible).map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#151E2F] border border-[#1E2D4A] text-white hover:border-[#6D5EF8]/50 hover:bg-[#1A2440] transition-all duration-200"
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
              {contactItems.filter(i => i.visible).length === 0 && socialItems.filter(i => i.visible).length === 0 && (
                <p className="text-xs text-[#9CA3AF]">Este proveedor aún no registró información de contacto.</p>
              )}
            </div>
            {socialItems.filter(i => i.visible).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {socialItems.filter(i => i.visible).map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[#151E2F] border border-[#1E2D4A] text-[#9CA3AF] hover:text-white hover:border-[#6D5EF8]/50 hover:bg-[#1A2440] transition-all duration-200"
                  >
                    {item.icon}
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Galería Modal */}
      {galleryModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setGalleryModal(null)}>
          <button onClick={() => setGalleryModal(null)} className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all">
            <X size={24} strokeWidth={1.75} />
          </button>

          {galleryModal.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setGalleryModal(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null) }}
                className="absolute left-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <ChevronLeft size={28} strokeWidth={1.75} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setGalleryModal(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null) }}
                className="absolute right-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <ChevronRight size={28} strokeWidth={1.75} />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[80vh] mx-4" onClick={e => e.stopPropagation()}>
            <img
              src={galleryModal.images[galleryModal.index].url}
              alt={galleryModal.images[galleryModal.index].title || `Imagen ${galleryModal.index + 1}`}
              className="w-full h-full object-contain rounded-2xl"
            />
            <p className="text-center text-sm text-[#9CA3AF] mt-3">
              {galleryModal.index + 1} / {galleryModal.images.length}
              {galleryModal.images[galleryModal.index].title && ` — ${galleryModal.images[galleryModal.index].title}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
