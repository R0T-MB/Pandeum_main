'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import type { ProviderPublic, Review } from '@/types'
import toast from 'react-hot-toast'
import {
  Star, MapPin, Clock, Share2, Heart, Navigation, Phone, MessageCircle,
  CheckCircle2, Check, Briefcase, Loader2, ArrowLeft,
  ChevronLeft, ChevronRight, Image, MessageSquare,
  Shield, ChevronDown, ChevronUp, Mail, Globe, ExternalLink, X
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

  useEffect(() => { loadProvider() }, [id])

  const loadReviews = () => {
    if (!id) return
    setReviewsLoading(true)
    api.get(`/providers/${id}/reviews`)
      .then(res => setReviews(res.data as Review[]))
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }

  useEffect(() => { loadReviews() }, [id])

  const handleSubmitReview = async () => {
    if (!user) { toast.error('Debes iniciar sesión para calificar a este proveedor.'); return }
    if (reviewRating < 1 || reviewRating > 5) { toast.error('Selecciona una calificación entre 1 y 5 estrellas.'); return }
    setSubmittingReview(true)
    try {
      await api.post(`/providers/${id}/reviews`, { rating: reviewRating, comment: reviewComment || null })
      toast.success('Reseña enviada correctamente')
      setShowReviewModal(false)
      setReviewRating(0)
      setReviewComment('')
      loadReviews()
      loadProvider()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Error al enviar la reseña')
    } finally { setSubmittingReview(false) }
  }

  const openGoogleMaps = () => {
    if (!provider?.location_lat || !provider?.location_lng) return
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${provider.location_lat},${provider.location_lng}`, '_blank')
  }

  const scheduleEntries = provider?.availability_json
    ? Object.entries(DAYS_LABELS).map(([key, label]) => {
        const day = (provider.availability_json as Record<string, unknown>)?.[key] as Record<string, unknown> | undefined
        return { key, label, day }
      })
    : []

  const activeServices = provider?.services?.filter(s => s.is_active) ?? []

  const galleryImages = [...(provider?.gallery_images || [])].sort((a, b) => (a.is_main ? -1 : 0) - (b.is_main ? -1 : 0))

  const contactItems: { icon: React.ReactNode; label: string; href: string; visible: boolean; color: string }[] = [
    { icon: <MessageCircle size={16} className="text-green-400" strokeWidth={1.75} />, label: 'WhatsApp', href: `https://wa.me/${provider?.whatsapp?.replace(/[^0-9]/g, '')}`, visible: !!provider?.whatsapp, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' },
    { icon: <Phone size={16} className="text-[#7C3AED]" strokeWidth={1.75} />, label: 'Llamar', href: `tel:${provider?.phone}`, visible: !!provider?.phone, color: 'bg-[#7C3AED]/10 border-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/20' },
    { icon: <Mail size={16} className="text-yellow-400" strokeWidth={1.75} />, label: 'Correo', href: `mailto:${provider?.contact_email}`, visible: !!provider?.contact_email, color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20' },
    { icon: <Globe size={16} className="text-blue-400" strokeWidth={1.75} />, label: 'Sitio web', href: provider?.website_url || '#', visible: !!provider?.website_url, color: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' },
  ]

  if (loading) {
    return (
      <div className="flex h-screen bg-[#07050d] items-center justify-center">
        <Loader2 size={32} className="text-violet-500 animate-spin" />
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="flex h-screen bg-[#07050d] items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[#120f24] border border-white/5 flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Proveedor no encontrado</h2>
          <p className="text-sm text-white/60 leading-relaxed mb-6">El perfil que buscas no existe o no está disponible.</p>
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-5 py-3 text-sm font-medium transition">
            <ArrowLeft size={16} strokeWidth={1.75} /> Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#07050d]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 text-white p-6 overflow-y-auto h-screen select-none">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#120f24] border border-white/5 text-white/70 hover:text-white text-xs font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {/* Banner */}
        <div className="relative h-64 w-full rounded-3xl overflow-hidden mb-6 bg-[#120f24] border border-white/5 shadow-[0_10px_40px_rgb(0,0,0,0.7)]">
          {provider.cover_image_url ? (
            <img src={provider.cover_image_url} alt={provider.business_name} className="w-full h-full object-cover opacity-85" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#120f24] to-[#0c0a15]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07050d] via-transparent to-black/50" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button className="p-2.5 rounded-2xl bg-black/50 backdrop-blur-md text-white/80 hover:text-white transition shadow-md">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2.5 rounded-2xl bg-black/50 backdrop-blur-md text-rose-400 hover:text-rose-300 transition shadow-md">
              <Heart className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* Header info + action buttons */}
        <div className="relative px-2 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-violet-500/40 shadow-[0_8px_25px_rgb(0,0,0,0.6)] -mt-12 bg-[#120f24] shrink-0 relative z-10">
              {provider.avatar_url ? (
                <img src={provider.avatar_url} alt={provider.business_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base font-bold text-violet-400 bg-gradient-to-br from-violet-600/20 to-indigo-600/10">
                  {getInitials(provider.business_name)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white tracking-tight">{provider.business_name}</h1>
                {provider.verification_status === 'verified' && (
                  <CheckCircle2 className="w-4 h-4 text-violet-400 fill-violet-400/20" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
                <span className="font-bold text-white">{provider.rating > 0 ? provider.rating.toFixed(1) : '—'}</span>
                <div className="flex items-center text-yellow-400 gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(provider.rating || 0) ? 'fill-current' : 'text-white/20'}`} />
                  ))}
                </div>
                <span className="text-white/40">({provider.review_count || reviews.length})</span>
                <span className="text-white/30">•</span>
                {provider.available_now ? (
                  <span className="text-emerald-400 font-medium">Abierto</span>
                ) : (
                  <span className="text-white/40">No disponible</span>
                )}
              </div>
              <p className="text-xs text-white/60">{provider.category}{provider.subcategory ? ` • ${provider.subcategory}` : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={openGoogleMaps} className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm">
              <Navigation className="w-4 h-4 text-violet-400" /> Cómo llegar
            </button>
            {provider.phone && (
              <a href={`tel:${provider.phone}`} className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-[#120f24] hover:bg-white/10 border border-white/5 text-white/90 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm">
                <Phone className="w-4 h-4 text-violet-400" /> Llamar
              </a>
            )}
            {provider.whatsapp && (
              <a href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm">
                <MessageCircle className="w-4 h-4 text-emerald-400" /> Chat
              </a>
            )}
          </div>
        </div>

        {/* Metrics bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#120f24] p-3.5 rounded-2xl border border-white/5 text-center shadow-[0_4px_20px_rgb(0,0,0,0.5)]">
            <span className="block text-sm font-bold text-white mb-0.5">{provider.response_time_hours != null ? `${provider.response_time_hours < 1 ? '<1 h' : `${provider.response_time_hours} h`}` : '—'}</span>
            <span className="block text-[11px] text-white/40">Respuesta</span>
          </div>
          <div className="bg-[#120f24] p-3.5 rounded-2xl border border-white/5 text-center shadow-[0_4px_20px_rgb(0,0,0,0.5)]">
            <span className="block text-sm font-bold text-white mb-0.5">{provider.review_count || reviews.length}</span>
            <span className="block text-[11px] text-white/40">Reseñas</span>
          </div>
          <div className="bg-[#120f24] p-3.5 rounded-2xl border border-white/5 text-center shadow-[0_4px_20px_rgb(0,0,0,0.5)]">
            <span className="block text-sm font-bold text-white mb-0.5">{provider.cases_resolved_similar || provider.trust_score || '—'}</span>
            <span className="block text-[11px] text-white/40">Casos resueltos</span>
          </div>
        </div>

        {/* Main grid: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* About */}
            <div className="bg-[#120f24] rounded-3xl border border-white/5 p-5 shadow-[0_6px_25px_rgb(0,0,0,0.5)]">
              <h3 className="text-sm font-bold text-white mb-3">Acerca de</h3>
              {provider.description ? (
                <>
                  <p className="text-xs text-white/60 leading-relaxed mb-3">{provider.description}</p>
                  <p className="text-[11px] text-white/40">{provider.business_name} — {provider.category}</p>
                </>
              ) : (
                <p className="text-xs text-white/40">Este proveedor aún no agregó una descripción.</p>
              )}
            </div>

            {/* Services */}
            <div className="bg-[#120f24] rounded-3xl border border-white/5 p-5 shadow-[0_6px_25px_rgb(0,0,0,0.5)]">
              <h3 className="text-sm font-bold text-white mb-4">Servicios</h3>
              {activeServices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeServices.map((service) => (
                    <div key={service.id} className="flex items-center gap-2.5 text-xs text-white/80">
                      <div className="w-5 h-5 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <span>{service.name}</span>
                        {service.price_estimate && (
                          <span className="text-[10px] text-violet-400 ml-1">({service.price_estimate})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40">Este proveedor aún no publicó servicios activos.</p>
              )}
            </div>

            {/* Gallery */}
            {galleryImages.length > 0 && (
              <div className="bg-[#120f24] rounded-3xl border border-white/5 p-5 shadow-[0_6px_25px_rgb(0,0,0,0.5)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Galería</h3>
                  {galleryImages.length > 3 && (
                    <button onClick={() => setGalleryModal({ images: galleryImages, index: 0 })} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition">
                      Ver más
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.slice(0, 3).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGalleryModal({ images: galleryImages, index: idx })}
                      className="h-28 rounded-2xl overflow-hidden border border-white/5 bg-[#0b0817] relative group shadow-sm"
                    >
                      <img src={img.url} alt={img.title || 'Galería'} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-[#120f24] rounded-3xl border border-white/5 p-5 shadow-[0_6px_25px_rgb(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-400" /> Reseñas
                </h3>
                <button
                  onClick={() => {
                    if (!user) { toast.error('Debes iniciar sesión para calificar a este proveedor.'); return }
                    if (user && provider && String(user.id) === String(provider.id)) { toast.error('No puedes reseñar tu propio perfil'); return }
                    setShowReviewModal(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition"
                >
                  <Star size={13} /> Calificar
                </button>
              </div>

              {reviewsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="text-violet-500 animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-4">Este proveedor aún no tiene reseñas.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-[#0b0817] rounded-2xl border border-white/5 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-[10px] font-bold text-violet-400">
                            {(r.user_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">{r.user_name || 'Usuario'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/10'} strokeWidth={1.5} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-xs text-white/60 leading-relaxed">{r.comment}</p>}
                      <p className="text-[10px] text-white/40 mt-2">
                        {new Date(r.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Location */}
            {(provider.address || provider.service_area) && (
              <div className="bg-[#120f24] rounded-3xl border border-white/5 p-5 shadow-[0_6px_25px_rgb(0,0,0,0.5)]">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-400" /> Ubicación
                </h3>
                <p className="text-xs text-white/60 mb-3">{provider.address || provider.service_area}</p>
                <div className="h-32 bg-[#0b0817] rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:12px_12px]"></div>
                  <div className="w-4 h-4 rounded-full bg-violet-600 ring-4 ring-violet-600/20 animate-pulse flex items-center justify-center text-white text-[10px]">📍</div>
                </div>
                {provider.location_lat != null && provider.location_lng != null && (
                  <button onClick={openGoogleMaps} className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20">
                    <Navigation size={14} /> Abrir ruta en Google Maps
                  </button>
                )}
              </div>
            )}

            {/* Contact */}
            {contactItems.some(i => i.visible) && (
              <div className="bg-[#120f24] rounded-3xl border border-white/5 p-5 shadow-[0_6px_25px_rgb(0,0,0,0.5)]">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-violet-400" /> Contacto
                </h3>
                <div className="space-y-2">
                  {contactItems.filter(i => i.visible).map((item, idx) => (
                    <a key={idx} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${item.color}`}>
                      {item.icon}{item.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            {scheduleEntries.length > 0 && (
              <div className="bg-[#120f24] rounded-3xl border border-white/5 p-5 shadow-[0_6px_25px_rgb(0,0,0,0.5)]">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" /> Horario
                </h3>
                <div className="flex flex-col gap-2.5 text-xs">
                  {scheduleEntries.map(({ label, day }) => {
                    const isOpen = day?.open === true
                    return (
                      <div key={label} className="flex items-center justify-between pb-2 last:pb-0 border-b border-white/5 last:border-0">
                        <span className="text-white/60">{label}</span>
                        {isOpen ? (
                          <span className="font-medium text-white">{String(day?.from || '09:00')} — {String(day?.to || '18:00')}</span>
                        ) : (
                          <span className="text-white/40">Cerrado</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
          <div className="relative w-full max-w-md bg-[#120f24] border border-white/5 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition">
              <X size={18} strokeWidth={1.75} />
            </button>
            <h3 className="text-lg font-bold text-white mb-2">Calificar a {provider?.business_name}</h3>
            <p className="text-xs text-white/60 mb-5">Comparte tu experiencia con este proveedor.</p>
            <div className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setReviewRating(s)} className="p-1 transition-all duration-150 hover:scale-110">
                  <Star size={32} className={s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-white/10 hover:text-yellow-400/50'} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
              className="w-full bg-[#07050d] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-violet-500/30 transition min-h-[80px] resize-y"
              placeholder="Escribe un comentario (opcional)..." />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-[#0b0817] border border-white/5 text-white/70 hover:text-white transition">
                Cancelar
              </button>
              <button onClick={handleSubmitReview} disabled={submittingReview || reviewRating === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:cursor-not-allowed text-white transition">
                {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                {submittingReview ? 'Enviando...' : 'Enviar reseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery modal */}
      {galleryModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setGalleryModal(null)}>
          <button onClick={() => setGalleryModal(null)} className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition">
            <X size={24} strokeWidth={1.75} />
          </button>
          {galleryModal.images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setGalleryModal(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null) }}
                className="absolute left-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition">
                <ChevronLeft size={28} strokeWidth={1.75} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setGalleryModal(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null) }}
                className="absolute right-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition">
                <ChevronRight size={28} strokeWidth={1.75} />
              </button>
            </>
          )}
          <div className="max-w-4xl max-h-[80vh] mx-4" onClick={e => e.stopPropagation()}>
            <img src={galleryModal.images[galleryModal.index].url} alt={galleryModal.images[galleryModal.index].title || `Imagen ${galleryModal.index + 1}`}
              className="w-full h-full object-contain rounded-2xl" />
            <div className="text-center mt-3 space-y-1">
              {galleryModal.images[galleryModal.index].title && (
                <p className="text-sm font-medium text-white">{galleryModal.images[galleryModal.index].title}</p>
              )}
              <p className="text-xs text-white/60">{galleryModal.index + 1} / {galleryModal.images.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
