'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Menu,
  Loader2,
  ShieldCheck,
  Store,
  Users,
  Check,
  X,
  ExternalLink,
  Eye,
  RefreshCw,
  User as UserIcon,
  ShieldAlert,
  Clock,
  MessageSquare,
  Flag,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Provider, User, ReviewModeration } from '@/types'

type Tab = 'verification' | 'users' | 'reviews'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  verified: 'Verificado',
  rejected: 'Rechazado',
}

const REVIEW_STATUS_LABEL: Record<string, string> = {
  approved: 'Aprobada',
  rejected: 'Rechazada',
  pending: 'Pendiente',
}

const FLAG_LABEL: Record<string, string> = {
  inappropriate: 'Lenguaje inapropiado',
  spam_links: 'Enlaces/spam',
  spam: 'Contenido de spam',
  pii_email: 'Datos personales (email)',
  pii_phone: 'Datos personales (teléfono)',
  pii_card: 'Datos personales (tarjeta)',
  fresh_account: 'Cuenta nueva',
  burst_reviews: 'Reseñas masivas',
  account_signals: 'Señal de cuenta',
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('verification')
  const [providers, setProviders] = useState<Provider[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [reviewQueue, setReviewQueue] = useState<ReviewModeration[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Provider | null>(null)
  const [rejectCategory, setRejectCategory] = useState('datos_incompletos')
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const loadProviders = useCallback(async () => {
    try {
      const res = await api.get('/admin/providers/pending')
      setProviders(res.data as Provider[])
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('No tienes permisos de administrador')
        router.push('/')
        return
      }
      toast.error('Error al cargar proveedores pendientes')
    }
  }, [router])

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users')
      setUsersList(res.data as User[])
    } catch {
      toast.error('Error al cargar usuarios')
    }
  }, [])

  const loadReviewQueue = useCallback(async () => {
    try {
      const res = await api.get('/admin/reviews/queue')
      setReviewQueue(res.data as ReviewModeration[])
    } catch {
      toast.error('Error al cargar cola de reseñas')
    }
  }, [])

  useEffect(() => {
    if (user?.is_admin) {
      setLoading(true)
      Promise.all([loadProviders(), loadUsers(), loadReviewQueue()]).finally(() => setLoading(false))
    } else if (user && !user.is_admin) {
      setLoading(false)
    }
  }, [user, loadProviders, loadUsers, loadReviewQueue])

  const verifyProvider = async (providerId: string, status: 'verified' | 'rejected') => {
    setActingId(providerId)
    try {
      const payload: Record<string, unknown> = { verification_status: status }
      if (status === 'rejected') {
        if (!rejectReason.trim()) {
          toast.error('Indica el motivo del rechazo')
          setActingId(null)
          return
        }
        payload.rejection_category = rejectCategory
        payload.rejection_reason = rejectReason.trim()
      }
      await api.put(`/admin/providers/${providerId}/verify`, payload)
      toast.success(status === 'verified' ? 'Proveedor verificado' : 'Proveedor rechazado')
      setProviders(prev => prev.filter(p => p.id !== providerId))
      setRejectTarget(null)
      setRejectReason('')
    } catch {
      toast.error('Error al actualizar la verificación')
    } finally {
      setActingId(null)
    }
  }

  const moderateReview = async (reviewId: string, action: 'approve' | 'reject') => {
    setActingId(reviewId)
    try {
      await api.put(`/admin/reviews/${reviewId}/moderate`, { action })
      toast.success(action === 'approve' ? 'Reseña aprobada' : 'Reseña rechazada')
      setReviewQueue(prev => prev.filter(r => r.id !== reviewId))
    } catch {
      toast.error('Error al moderar la reseña')
    } finally {
      setActingId(null)
    }
  }

  const toggleAdmin = async (userToToggle: User) => {
    setActingId(userToToggle.id)
    try {
      await api.put(`/admin/users/${userToToggle.id}/role`, { is_admin: !userToToggle.is_admin })
      toast.success(userToToggle.is_admin ? 'Admin removido' : 'Marcado como admin')
      setUsersList(prev =>
        prev.map(u => (u.id === userToToggle.id ? { ...u, is_admin: !u.is_admin } : u))
      )
    } catch {
      toast.error('Error al actualizar el rol')
    } finally {
      setActingId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-[#0B1020] items-center justify-center">
        <Loader2 size={32} className="text-[#6D5EF8] animate-spin" />
      </div>
    )
  }

  if (!user) return null

  if (!user.is_admin) {
    return (
      <div className="flex h-screen bg-[#0B1020]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-6 py-4 flex items-center justify-between flex-shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white">
              <Menu size={18} strokeWidth={1.75} />
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={28} className="text-red-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Acceso restringido</h2>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                Esta sección es exclusiva para administradores de Pandeum.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 mt-6 bg-[#6D5EF8] hover:bg-[#5B4FE0] text-white rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-200"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const inputClass = "w-full bg-[#111827] border border-[#1E2D4A] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6D5EF8]/50 transition-all duration-200"
  const cardClass = "bg-[#111827] border border-[#1E2D4A] rounded-2xl p-5"

  return (
    <div className="flex h-screen bg-[#0B1020]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1E2D4A]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white">
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-white hidden sm:block">Panel de Administración</h1>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center">
              <ShieldCheck size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full">
            {/* Nav tabs */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {([
                { key: 'verification', label: 'Verificación de proveedores', icon: Store },
                { key: 'users', label: 'Usuarios', icon: Users },
                { key: 'reviews', label: 'Moderación de reseñas', icon: MessageSquare },
              ] as { key: Tab; label: string; icon: React.ElementType }[]).map(s => {
                const Icon = s.icon
                const isActive = tab === s.key
                return (
                  <button
                    key={s.key}
                    onClick={() => setTab(s.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#6D5EF8]/15 border border-[#6D5EF8]/40 text-white'
                        : 'bg-[#151E2F] border border-[#1E2D4A] text-[#9CA3AF] hover:bg-[#1A2440] hover:text-white hover:border-[#1E2D4A]/80'
                    }`}
                  >
                    <Icon size={15} strokeWidth={1.75} />
                    {s.label}
                  </button>
                )
              })}
            </div>

            {/* Verificación de proveedores */}
            {tab === 'verification' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6D5EF8]/10 flex items-center justify-center">
                      <Store size={18} className="text-[#6D5EF8]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Solicitudes de verificación</h2>
                      <p className="text-xs text-[#9CA3AF]">Aprobar o rechazar el acceso de proveedores al catálogo</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setLoading(true); loadProviders().finally(() => setLoading(false)) }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#151E2F] border border-[#1E2D4A] text-white hover:border-[#6D5EF8]/50 text-xs font-medium transition-all duration-200"
                  >
                    <RefreshCw size={14} strokeWidth={1.75} />
                    Actualizar
                  </button>
                </div>

                {providers.length === 0 ? (
                  <div className={`${cardClass} flex flex-col items-center py-12 text-center`}>
                    <div className="w-14 h-14 rounded-2xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mb-3">
                      <Check size={24} className="text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-white">No hay solicitudes pendientes</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">Todos los proveedores han sido revisados</p>
                  </div>
                ) : (
                  providers.map(p => (
                    <div key={p.id} className={cardClass}>
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#1E2D4A] bg-[#151E2F] flex-shrink-0">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[#6D5EF8]">
                              {(p.business_name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-white truncate">{p.business_name}</h3>
                            <span className="flex items-center gap-1 text-[11px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-lg">
                              <Clock size={11} strokeWidth={2} />
                              {STATUS_LABEL[p.verification_status] || p.verification_status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#6D5EF8]/10 border border-[#6D5EF8]/30 text-[#6D5EF8] font-medium">
                              {p.category}
                            </span>
                            {p.subcategory && (
                              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#151E2F] border border-[#1E2D4A] text-[#9CA3AF]">
                                {p.subcategory}
                              </span>
                            )}
                            {p.user?.full_name && (
                              <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1">
                                <UserIcon size={11} strokeWidth={1.75} />
                                {p.user.full_name}
                              </span>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-sm text-[#9CA3AF] mt-2 line-clamp-2">{p.description}</p>
                          )}
                          {(p.phone || p.contact_email || p.service_area) && (
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#9CA3AF]">
                              {p.phone && <span>📞 {p.phone}</span>}
                              {p.contact_email && <span>✉️ {p.contact_email}</span>}
                              {p.service_area && <span>📍 {p.service_area}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#1E2D4A]">
                        <Link
                          href={`/providers/${p.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#151E2F] border border-[#1E2D4A] text-white hover:border-[#6D5EF8]/50 text-xs font-medium transition-all duration-200"
                        >
                          <Eye size={13} strokeWidth={1.75} />
                          Ver perfil
                        </Link>
                        <button
                          onClick={() => { setRejectTarget(p); setRejectCategory('datos_incompletos'); setRejectReason('') }}
                          disabled={actingId === p.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          <X size={13} strokeWidth={2} />
                          Rechazar
                        </button>
                        <button
                          onClick={() => verifyProvider(p.id, 'verified')}
                          disabled={actingId === p.id}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          {actingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2} />}
                          Aprobar
                        </button>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-3 flex items-center gap-1.5">
                        <ExternalLink size={11} strokeWidth={1.75} />
                        Solo los proveedores verificados aparecen en el catálogo y recomendaciones.
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Usuarios */}
            {tab === 'users' && (
              <div className={`${cardClass} !p-0 overflow-hidden`}>
                <div className="p-5 border-b border-[#1E2D4A]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6D5EF8]/10 flex items-center justify-center">
                      <Users size={18} className="text-[#6D5EF8]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Usuarios</h2>
                      <p className="text-xs text-[#9CA3AF]">{usersList.length} cuentas registradas</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-[#1E2D4A]">
                  {usersList.map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="w-10 h-10 rounded-full bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.full_name || 'Sin nombre'}</p>
                        <p className="text-xs text-[#9CA3AF] truncate">{u.email}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${
                            u.is_provider ? 'bg-[#6D5EF8]/10 border border-[#6D5EF8]/30 text-[#6D5EF8]' : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                          }`}>
                            {u.is_provider ? 'Proveedor' : 'Cliente'}
                          </span>
                          {u.is_admin && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium flex items-center gap-1 ${
                              u.is_super_admin ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                            }`}>
                              <ShieldCheck size={10} strokeWidth={2} />
                              {u.is_super_admin ? 'Super Admin' : 'Admin'}
                            </span>
                          )}
                        </div>
                      </div>
                      {[
                        (() => {
                          // Reglas de permiso por fila, espejo del backend:
                          // - Super admin (fundador): autoridad total, pero su rol es PERMANENTE
                          //   (no puede degradarse a sí mismo; el botón de "quitar admin" no aparece)
                          // - Admin normal: no puede tocar su propio rol ni el de otros admins
                          if (!user.is_super_admin && (u.id === user.id || u.is_admin)) {
                            return null
                          }
                          if (user.is_super_admin && u.id === user.id) {
                            return null
                          }
                          if (u.is_admin) {
                            return (
                              <button
                                onClick={() => toggleAdmin(u)}
                                disabled={actingId === u.id}
                                title="Quitar admin"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                              >
                                {actingId === u.id ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} strokeWidth={1.75} />}
                                Quitar admin
                              </button>
                            )
                          }
                          return (
                            <button
                              onClick={() => toggleAdmin(u)}
                              disabled={actingId === u.id}
                              title="Marcar como admin"
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#151E2F] border border-[#1E2D4A] text-[#9CA3AF] hover:border-[#6D5EF8]/50 hover:text-white text-xs font-medium transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                            >
                              {actingId === u.id ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} strokeWidth={1.75} />}
                              Hacer admin
                            </button>
                          )
                        })(),
                      ]}
                    </div>
                  ))}
                  {usersList.length === 0 && (
                    <div className="px-5 py-10 text-center">
                      <p className="text-sm text-[#9CA3AF]">No hay usuarios registrados</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Moderación de reseñas */}
            {tab === 'reviews' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6D5EF8]/10 flex items-center justify-center">
                      <MessageSquare size={18} className="text-[#6D5EF8]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Moderación de reseñas</h2>
                      <p className="text-xs text-[#9CA3AF]">
                        Reseñas pendientes o rechazadas automáticamente, listas para revisión
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setLoading(true); loadReviewQueue().finally(() => setLoading(false)) }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#151E2F] border border-[#1E2D4A] text-white hover:border-[#6D5EF8]/50 text-xs font-medium transition-all duration-200"
                  >
                    <RefreshCw size={14} strokeWidth={1.75} />
                    Actualizar
                  </button>
                </div>

                {reviewQueue.length === 0 ? (
                  <div className={`${cardClass} flex flex-col items-center py-12 text-center`}>
                    <div className="w-14 h-14 rounded-2xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mb-3">
                      <Flag size={24} className="text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-white">Sin reseñas por revisar</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">La moderación automática filtró todo el contenido</p>
                  </div>
                ) : (
                  reviewQueue.map(rv => (
                    <div key={rv.id} className={cardClass}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center flex-shrink-0">
                            <MessageSquare size={17} className="text-[#6D5EF8]" strokeWidth={1.75} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{rv.user_name}</p>
                            <p className="text-xs text-[#9CA3AF]">para {rv.provider_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-yellow-400">{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${
                            rv.review_verification_status === 'rejected' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-yellow-400/10 border border-yellow-400/30 text-yellow-400'
                          }`}>
                            {REVIEW_STATUS_LABEL[rv.review_verification_status] || rv.review_verification_status}
                          </span>
                        </div>
                      </div>
                      {rv.comment && (
                        <p className="text-sm text-[#D1D5DB] mt-3 bg-[#151E2F] border border-[#1E2D4A] rounded-xl p-3">
                          {rv.comment}
                        </p>
                      )}
                      {(rv.fraud_risk_flags && Object.keys(rv.fraud_risk_flags).length > 0) ? (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {Object.entries(rv.fraud_risk_flags).map(([k, v]) => (
                            <span key={k} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                              <Flag size={10} strokeWidth={2} />
                              {FLAG_LABEL[k] || k}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#9CA3AF] mt-3 flex items-center gap-1.5">
                          <Check size={11} strokeWidth={2} className="text-emerald-400" />
                          Sin señales de riesgo detectadas
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#1E2D4A]">
                        <button
                          onClick={() => moderateReview(rv.id, 'reject')}
                          disabled={actingId === rv.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          <X size={13} strokeWidth={2} />
                          Rechazar
                        </button>
                        <button
                          onClick={() => moderateReview(rv.id, 'approve')}
                          disabled={actingId === rv.id}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          {actingId === rv.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2} />}
                          Aprobar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de rechazo de proveedor */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setRejectTarget(null)} />
          <div className="relative w-full max-w-md bg-[#111827] border border-[#1E2D4A] rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[#1E2D4A]">
              <h3 className="text-sm font-semibold text-white">Rechazar solicitud</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {rejectTarget.business_name} — el proveedor verá este motivo y podrá corregirlo en 72h.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Categoría de infracción</label>
                <select
                  value={rejectCategory}
                  onChange={e => setRejectCategory(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1E2D4A] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#6D5EF8]/50 transition-all duration-200"
                >
                  <option value="datos_incompletos">Datos de negocio incompletos o incorrectos</option>
                  <option value="normativas_licencias">Falta licencia/certificado exigido</option>
                  <option value="contenido_inapropiado">Contenido inapropiado o spam</option>
                  <option value="identidad_falsa">Identidad falsa o datos no coincidentes</option>
                  <option value="sancion_previa">Cuenta previamente sancionada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Motivo para el proveedor</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="Explica qué debe corregir para cumplir las normativas (ej: falta dirección, teléfono válido, rango de precios...)"
                  className="w-full bg-[#111827] border border-[#1E2D4A] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6D5EF8]/50 transition-all duration-200 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-4 border-t border-[#1E2D4A]">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#151E2F] border border-[#1E2D4A] text-white text-xs font-medium transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => verifyProvider(rejectTarget.id, 'rejected')}
                disabled={actingId === rejectTarget.id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-all duration-200 disabled:opacity-50"
              >
                {actingId === rejectTarget.id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} strokeWidth={2} />}
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}