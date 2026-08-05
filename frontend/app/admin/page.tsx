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
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Provider, User } from '@/types'

type Tab = 'verification' | 'users'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  verified: 'Verificado',
  rejected: 'Rechazado',
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('verification')
  const [providers, setProviders] = useState<Provider[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

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

  useEffect(() => {
    if (user?.is_admin) {
      setLoading(true)
      Promise.all([loadProviders(), loadUsers()]).finally(() => setLoading(false))
    } else if (user && !user.is_admin) {
      setLoading(false)
    }
  }, [user, loadProviders, loadUsers])

  const verifyProvider = async (providerId: string, status: 'verified' | 'rejected') => {
    setActingId(providerId)
    try {
      await api.put(`/admin/providers/${providerId}/verify`, { verification_status: status })
      toast.success(status === 'verified' ? 'Proveedor verificado' : 'Proveedor rechazado')
      setProviders(prev => prev.filter(p => p.id !== providerId))
    } catch {
      toast.error('Error al actualizar la verificación')
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
                          onClick={() => verifyProvider(p.id, 'rejected')}
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
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium flex items-center gap-1">
                              <ShieldCheck size={10} strokeWidth={2} />
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAdmin(u)}
                        disabled={actingId === u.id || u.id === user.id}
                        title={u.id === user.id ? 'No puedes quitar tu propio admin' : (u.is_admin ? 'Quitar admin' : 'Marcar como admin')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-50 flex-shrink-0 ${
                          u.is_admin
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-[#151E2F] border border-[#1E2D4A] text-[#9CA3AF] hover:border-[#6D5EF8]/50 hover:text-white'
                        }`}
                      >
                        {actingId === u.id ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} strokeWidth={1.75} />}
                        {u.is_admin ? 'Quitar admin' : 'Ser admin'}
                      </button>
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
          </div>
        </div>
      </div>
    </div>
  )
}