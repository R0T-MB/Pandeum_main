'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import type { ProviderPublic, Review } from '@/types'
import toast from 'react-hot-toast'
import {
  Star, MapPin, Clock, Zap, Tag, Phone, Mail, Globe, MessageCircle,
  ExternalLink, Briefcase, DollarSign, Loader2, ArrowLeft,
  Map, Instagram, Facebook, X, ChevronLeft, ChevronRight, Image, MessageSquare,
  Navigation, Shield, ChevronDown, ChevronUp, Heart
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'

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

  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [provider, setProvider] = useState<ProviderPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const [galleryModal, setGalleryModal] = useState<{ images: { url: string; title?: string }[]; index: number } | null>(null)

  const [scheduleOpen, setScheduleOpen] = useState(false)

  const loadProvider = () => {
    if (!id) return
    setLoading(true)
    setError(false)
    api.get(`/providers/${id}`)
      .then(res => setProvider(res.data as ProviderPublic))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProvider()
  }, [id])

  const loadReviews = () => {
    if (!id) return
    setReviewsLoading(true)
    api.get(`/providers/${id}/reviews`)
      .then(res => setReviews(res.data as Review[]))
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }

  useEffect(() => {
    loadReviews()
  }, [id])

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para calificar a este proveedor.')
      return
    }
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error('Selecciona una calificación entre 1 y 5 estrellas.')
      return
    }
    setSubmittingReview(true)
    try {
      await api.post(`/providers/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment || null,
      })
      toast.success('Reseña enviada correctamente')
      setShowReviewModal(false)
      setReviewRating(0)
      setReviewComment('')
      loadReviews()
      loadProvider()
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Error al enviar la reseña'
      toast.error(message)
    } finally {
      setSubmittingReview(false)
    }
  }

  const openGoogleMaps = () => {
    if (!provider?.location_lat || !provider?.location_lng) return
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${provider.location_lat},${provider.location_lng}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#050816] items-center justify-center">
        <Loader2 size={32} className="text-[#7C3AED] animate-spin" />
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="flex h-screen bg-[#050816] items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[#151E2F] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Proveedor no encontrado</h2>
          <p className="text-sm text-[#9CA3AF] leading-relaxed mb-6">
            El perfil que buscas no existe o no está disponible.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D5EF8] text-white rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200"
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

  const contactItems: { icon: React.ReactNode; label: string; href: string; visible: boolean; color: string }[] = [
    {
      icon: <MessageCircle size={16} className="text-green-400" strokeWidth={1.75} />,
      label: 'WhatsApp',
      href: `https://wa.me/${provider.whatsapp?.replace(/[^0-9]/g, '')}`,
      visible: !!provider.whatsapp,
      color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
    },
    {
      icon: <Phone size={16} className="text-[#7C3AED]" strokeWidth={1.75} />,
      label: 'Llamar',
      href: `tel:${provider.phone}`,
      visible: !!provider.phone,
      color: 'bg-[#7C3AED]/10 border-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/20'
    },
    {
      icon: <Mail size={16} className="text-yellow-400" strokeWidth={1.75} />,
      label: 'Correo',
      href: `mailto:${provider.contact_email}`,
      visible: !!provider.contact_email,
      color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
    },
    {
      icon: <Globe size={16} className="text-blue-400" strokeWidth={1.75} />,
      label: 'Sitio web',
      href: provider.website_url || '#',
      visible: !!provider.website_url,
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
    },
  ]

  return (
    <div className="min-h-screen bg-[#050816]">
      <div
        className="relative h-28 sm:h-32 border-b border-[rgba(255,255,255,0.06)]"
        style={provider.cover_image_url ? {
          backgroundImage: `linear-gradient(to bottom, rgba(5,8,22,0.7), rgba(5,8,22,0.9)), url(${provider.cover_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {
          background: 'linear-gradient(to bottom right, #0E1422, #111827, #050816)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-end pb-4">
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-10 p-2 rounded-xl bg-[#111827]/80 border border-[rgba(255,255,255,0.06)] text-[#9CA3AF] hover:text-white hover:bg-[#151E2F] transition-all duration-200"
          >
            <ArrowLeft size={18} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-[#111827]/80 border border-[rgba(255,255,255,0.06)] text-[#9CA3AF] hover:text-white hover:bg-[#151E2F] transition-all duration-200 lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 pb-10">
        <div className="flex flex-row items-end gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[rgba(255,255,255,0.06)] bg-[#151E2F] flex-shrink-0 shadow-xl ring-2 ring-[#7C3AED]/10">
            {provider.avatar_url ? (
              <img src={provider.avatar_url} alt={provider.business_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base font-bold text-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/10 to-[#6D5EF8]/10">
                {getInitials(provider.business_name)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {provider.business_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED]">
                    <Tag size={11} strokeWidth={2} />
                    {provider.category}
                  </span>
                  {provider.subcategory && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium bg-[#151E2F] border border-[rgba(255,255,255,0.06)] text-[#9CA3AF]">
                      {provider.subcategory}
                    </span>
                  )}
                  {typeof provider.rating === 'number' && provider.rating > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                      <Star size={11} className="fill-yellow-400" strokeWidth={1.5} />
                      {provider.rating.toFixed(1)}
                    </span>
                  )}
                  {provider.verification_status === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Shield size={11} strokeWidth={1.75} />
                      Verificado
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!user) {
                      toast.error('Debes iniciar sesión para calificar a este proveedor.')
                      return
                    }
                    if (user && provider && String(user.id) === String(provider.id)) {
                      toast.error('No puedes reseñar tu propio perfil')
                      return
                    }
                    setShowReviewModal(true)
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-all duration-200"
                >
                  <Star size={13} strokeWidth={2} />
                  Calificar
                </button>
                {provider.available_now && (
                  <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Zap size={13} strokeWidth={2} />
                    Disponible ahora
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main grid: 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column - main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Info General */}
            <div className="bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Briefcase size={15} className="text-[#7C3AED]" strokeWidth={1.75} />
                Información general
              </h2>
              {provider.description && (
                <p className="text-sm text-[#D1D5DB] leading-relaxed mb-4">{provider.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                {priceRange && (
                  <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                    <DollarSign size={14} className="text-[#7C3AED]" strokeWidth={1.75} />
                    <span className="text-white font-medium">{priceRange}</span>
                  </div>
                )}
                {provider.response_time_hours != null && (
                  <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                    <Clock size={14} className="text-[#7C3AED]" strokeWidth={1.75} />
                    <span className="text-white">
                      {provider.response_time_hours < 1
                        ? 'Responde en menos de 1 hora'
                        : `Responde en ${provider.response_time_hours} h aprox.`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Servicios */}
            <div className="bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase size={15} className="text-[#7C3AED]" strokeWidth={1.75} />
                Servicios
              </h2>
              {activeServices.length > 0 ? (
                <div className="space-y-3">
                  {activeServices.map(service => (
                    <div
                      key={service.id}
                      className="bg-[#151E2F] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[#7C3AED]/20 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white">{service.name}</h3>
                          {service.description && (
                            <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">{service.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {(service.price_estimate || service.price_min != null || service.price_max != null) && (
                              <span className="text-xs text-[#7C3AED] flex items-center gap-1">
                                <DollarSign size={10} strokeWidth={2} />
                                {service.price_estimate ||
                                  (service.price_min != null && service.price_max != null
                                    ? `$${service.price_min} - $${service.price_max}`
                                    : service.price_min != null ? `Desde $${service.price_min}` :
                                      service.price_max != null ? `Hasta $${service.price_max}` : '')}
                              </span>
                            )}
                            {service.tags.length > 0 && service.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[10px] bg-[#111827] text-[#9CA3AF] px-2 py-0.5 rounded-lg border border-[rgba(255,255,255,0.06)]">
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
                    <Briefcase size={18} className="text-[rgba(255,255,255,0.1)]" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm text-[#9CA3AF]">Este proveedor aún no publicó servicios activos.</p>
                </div>
              )}
            </div>

            {/* Reseñas */}
            <div className="bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare size={15} className="text-[#7C3AED]" strokeWidth={1.75} />
                Reseñas y calificaciones
              </h2>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      size={18}
                      className={s <= Math.round(provider.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-[rgba(255,255,255,0.06)]'}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-white">
                  {provider.rating > 0 ? provider.rating.toFixed(1) : '—'}
                </span>
                <span className="text-sm text-[#9CA3AF]">
                  ({provider.review_count || reviews.length} reseña{(provider.review_count || reviews.length) !== 1 ? 's' : ''})
                </span>
              </div>

              {reviewsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="text-[#7C3AED] animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-xl bg-[#151E2F] flex items-center justify-center mx-auto mb-2">
                    <MessageSquare size={18} className="text-[rgba(255,255,255,0.1)]" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm text-[#9CA3AF]">Este proveedor aún no tiene reseñas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-[#151E2F] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-[10px] font-bold text-[#7C3AED]">
                            {(r.user_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">{r.user_name || 'Usuario'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star
                              key={s}
                              size={12}
                              className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-[rgba(255,255,255,0.06)]'}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-[#D1D5DB] leading-relaxed">{r.comment}</p>
                      )}
                      <p className="text-[11px] text-[#9CA3AF] mt-2">
                        {new Date(r.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Galería */}
            {galleryImages.length > 0 && (
              <div className="bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Image size={15} className="text-[#7C3AED]" strokeWidth={1.75} />
                  Galería
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {galleryImages.slice(0, 4).map((img, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#151E2F] group hover:border-[#7C3AED]/30 transition-all duration-200">
                      <button
                        onClick={() => setGalleryModal({ images: galleryImages, index: i })}
                        className="w-full aspect-square overflow-hidden"
                      >
                        <img src={img.url} alt={img.title || `Galería ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </button>
                    </div>
                  ))}
                </div>
                {galleryImages.length > 4 && (
                  <button
                    onClick={() => setGalleryModal({ images: galleryImages, index: 0 })}
                    className="flex items-center justify-center gap-1 w-full mt-2 py-2 rounded-lg text-[11px] font-medium text-[#7C3AED] hover:bg-[rgba(124,58,237,0.05)] transition-all duration-200"
                  >
                    Ver todas ({galleryImages.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right column - sidebar info */}
          <div className="space-y-5 lg:sticky lg:top-5">
            {/* Ubicación */}
            {(provider.address || provider.service_area || (provider.location_lat != null && provider.location_lng != null)) && (
              <div className="bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <MapPin size={15} className="text-[#7C3AED]" strokeWidth={1.75} />
                  Ubicación
                </h2>
                {provider.address && (
                  <p className="text-sm text-[#D1D5DB] mb-2">{provider.address}</p>
                )}
                {provider.service_area && (
                  <p className="text-xs text-[#9CA3AF] flex items-center gap-1.5 mb-3">
                    <MapPin size={12} strokeWidth={1.5} />
                    Zona de atención: {provider.service_area}
                  </p>
                )}
                {provider.location_lat != null && provider.location_lng != null && (
                  <button
                    onClick={openGoogleMaps}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium bg-[#7C3AED] hover:bg-[#6D5EF8] text-white transition-all duration-200 shadow-lg shadow-[#7C3AED]/20"
                  >
                    <Navigation size={14} strokeWidth={1.75} />
                    Abrir ruta en Google Maps
                  </button>
                )}
              </div>
            )}

            {/* Contacto */}
            <div className="bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MessageCircle size={15} className="text-[#7C3AED]" strokeWidth={1.75} />
                Contacto
              </h2>
              <div className="space-y-2">
                {contactItems.filter(i => i.visible).map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${item.color}`}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                ))}
                {contactItems.filter(i => i.visible).length === 0 && (
                  <p className="text-xs text-[#9CA3AF]">Este proveedor aún no registró información de contacto.</p>
                )}
              </div>
            </div>

            {/* Horario - Accordion style */}
            {scheduleEntries.length > 0 && (
              <div className="bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                <button
                  onClick={() => setScheduleOpen(!scheduleOpen)}
                  className="flex items-center justify-between w-full"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock size={15} className="text-[#7C3AED]" strokeWidth={1.75} />
                    Horario de atención
                  </h2>
                  {scheduleOpen ? <ChevronUp size={16} className="text-[#9CA3AF]" /> : <ChevronDown size={16} className="text-[#9CA3AF]" />}
                </button>
                {scheduleOpen && (
                  <div className="space-y-2 mt-4">
                    {scheduleEntries.map(({ key, label, day }) => {
                      const isOpen = day?.open === true
                      return (
                        <div key={key} className="flex items-center gap-3 bg-[#151E2F] rounded-xl px-4 py-2.5 border border-[rgba(255,255,255,0.06)]">
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
          <div className="relative w-full max-w-md bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[#151E2F] text-[#9CA3AF] hover:text-white transition-all">
              <X size={18} strokeWidth={1.75} />
            </button>
            <h3 className="text-lg font-bold text-white mb-2">Calificar a {provider?.business_name}</h3>
            <p className="text-sm text-[#9CA3AF] mb-5">Comparte tu experiencia con este proveedor.</p>

            <div className="flex items-center justify-center gap-2 mb-5">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  className="p-1 transition-all duration-150 hover:scale-110"
                >
                  <Star
                    size={32}
                    className={s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-[rgba(255,255,255,0.06)] hover:text-yellow-400/50'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              className="w-full bg-[#050816] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/30 transition-all duration-200 min-h-[80px] resize-y"
              placeholder="Escribe un comentario (opcional)..."
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#151E2F] border border-[rgba(255,255,255,0.06)] text-[#9CA3AF] hover:text-white hover:border-[#7C3AED]/30 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || reviewRating === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[#7C3AED] hover:bg-[#6D5EF8] disabled:bg-[rgba(255,255,255,0.06)] disabled:cursor-not-allowed text-white transition-all duration-200"
              >
                {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} strokeWidth={1.75} />}
                {submittingReview ? 'Enviando...' : 'Enviar reseña'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="text-center mt-3 space-y-1">
              {galleryModal.images[galleryModal.index].title && (
                <p className="text-sm font-medium text-white">{galleryModal.images[galleryModal.index].title}</p>
              )}
              <p className="text-sm text-[#9CA3AF]">
                {galleryModal.index + 1} / {galleryModal.images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
