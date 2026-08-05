'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  MapPin,
  Heart,
  History,
  Users,
  Bell,
  Crown,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  LogOut,
  Bot,
  ArrowRightLeft,
  Trash2,
  AlertTriangle,
  User,
  ShieldAlert,
  Loader2,
  Lock,
  LogIn,
  Store,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isGuest, logout, deleteAccount, convertToProvider } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [convertBusinessName, setConvertBusinessName] = useState('')
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isProvider = user?.account_type === 'provider' || user?.is_provider === true
  const isAdmin = user?.is_admin === true
  const userName = user?.full_name || ''
  const userEmail = user?.email || ''
  const userInitials = userName
    ? userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : ''

  const navItems: Array<{ href: string; label: string; icon: LucideIcon; locked?: boolean } | null> = [
    { href: '/', label: 'Chat', icon: MessageSquare },
    { href: '/map', label: 'Mapa', icon: MapPin },
    { href: '/favorites', label: 'Favoritos', icon: Heart, locked: isGuest },
    { href: '/history', label: 'Historial', icon: History, locked: isGuest },
    isProvider
      ? { href: '/provider-dashboard', label: 'Panel de Proveedor', icon: Store }
      : { href: '/companion', label: 'Mi Compañero', icon: Users, locked: isGuest },
    isAdmin
      ? { href: '/admin', label: 'Administración', icon: ShieldCheck }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  const isActive = (href: string) => pathname === href

  const handleConvertToProvider = async () => {
    if (converting) return
    setConverting(true)
    try {
      await convertToProvider(convertBusinessName.trim() || undefined)
      setConvertModalOpen(false)
      setConvertBusinessName('')
      toast.success('Tu cuenta ahora es de proveedor')
      router.push('/provider-dashboard')
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.message || ''
      console.error('Convert to provider error:', detail)
      toast.error(detail ? `Error: ${detail}` : 'Error al convertir la cuenta')
    } finally {
      setConverting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleting || confirmEmail.trim().toLowerCase() !== userEmail.toLowerCase()) return
    setDeleting(true)
    try {
      await deleteAccount(confirmEmail.trim())
      toast.success('Cuenta eliminada permanentemente')
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.message || ''
      console.error('Account delete error:', detail)
      toast.error(detail ? `Error: ${detail}` : 'Error al eliminar la cuenta')
      setDeleting(false)
    }
  }

  const content = (
    <aside className="w-[260px] bg-theme-bg border-r border-theme-border flex flex-col justify-between p-4 select-none h-screen shrink-0 transition-colors duration-200">
      <div>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-violet-500/30">
              P
            </div>
            <span className="font-bold tracking-wider text-theme-text text-base">PANDEUM</span>
          </div>
          <button className="text-theme-text-secondary hover:text-theme-text transition">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const isLocked = item.locked
            const content = (
              <>
                <Icon className={`w-5 h-5 ${active ? 'text-violet-400' : ''}`} />
                <span className="text-sm flex-1">{item.label}</span>
                {isLocked && <Lock className="w-3.5 h-3.5 text-theme-text-muted" />}
              </>
            )
            if (isLocked) {
              return (
                <Link
                  key={item.href}
                  href="/login"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition ${
                    active
                      ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/10 text-theme-text font-medium border border-violet-500/30 shadow-sm'
                      : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-divider'
                  }`}
                >
                  {content}
                </Link>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition ${
                  active
                    ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/10 text-theme-text font-medium border border-violet-500/30 shadow-sm'
                    : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-divider'
                }`}
              >
                {content}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="relative space-y-4">
        {profileOpen && !isGuest && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-theme-card border border-theme-border rounded-3xl p-3 shadow-2xl shadow-black/50 z-30 animate-slide-up">
            <div className="max-h-[55vh] overflow-y-auto no-scrollbar flex flex-col gap-3 pr-0.5">
              {/* Cabecera de identidad */}
              <div className="flex items-center gap-3 px-1 pt-1 pb-2 border-b border-theme-divider">
                <div className="w-11 h-11 rounded-2xl bg-violet-600/40 border border-violet-500/40 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-sm">
                  {userInitials || <User className="w-5 h-5 text-theme-text-muted" />}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold text-theme-text truncate">
                    {userName || 'Cuenta'}
                  </h4>
                  <span className="text-[10px] text-theme-text-muted truncate block">
                    {userEmail || 'Sesión iniciada'}
                  </span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-[10px] font-semibold capitalize">
                    {isProvider ? 'Proveedor' : 'Cliente'}
                  </span>
                </div>
              </div>

              {/* Bloque de rol */}
              <div className="px-1">
                <h5 className="text-[10px] uppercase tracking-wider text-theme-text-muted mb-2 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3 h-3" /> Tipo de cuenta
                </h5>
                {isProvider ? (
                  <div className="bg-theme-bg rounded-2xl border border-theme-border p-3 flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 shrink-0">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-theme-text">Proveedor</p>
                      <p className="text-[9px] text-theme-text-muted truncate">Cuenta registrada como negocio o servicio</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-[9px] font-semibold">
                      Fija
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="bg-theme-bg rounded-2xl border border-theme-border p-3 flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-600/15 text-cyan-400 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-theme-text">Cliente</p>
                        <p className="text-[9px] text-theme-text-muted truncate">Cuenta registrada al crear tu perfil</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-600/15 border border-cyan-500/30 text-cyan-300 text-[9px] font-semibold">
                        Fija
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setConvertBusinessName(user?.full_name || '')
                        setConvertModalOpen(true)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-2xl bg-violet-600/15 border border-violet-500/30 text-violet-300 hover:bg-violet-600/25 transition text-[11px] font-semibold"
                    >
                      <Store className="w-3.5 h-3.5" />
                      Convertir cuenta a proveedor
                    </button>
                    <p className="text-[9px] text-theme-text-muted leading-relaxed">
                      Al convertir, podrás ofrecer tus servicios y gestionar tu negocio en Pandeum.
                    </p>
                  </div>
                )}
              </div>

              {/* Panel de Proveedor / Mi Compañero */}
              {isProvider ? (
                <Link
                  href="/provider-dashboard"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-2 py-2.5 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-theme-text hover:bg-violet-600/20 transition"
                >
                  <div className="p-1.5 rounded-xl bg-violet-600/20 text-violet-400">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-theme-text truncate">Panel de Proveedor</p>
                    <p className="text-[9px] text-theme-text-muted truncate">Gestiona tu negocio y servicios en Pandeum</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-theme-text-muted rotate-[-90deg]" />
                </Link>
              ) : (
                <Link
                  href="/companion"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-2 py-2.5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-theme-text hover:bg-indigo-600/20 transition"
                >
                  <div className="p-1.5 rounded-xl bg-indigo-600/20 text-indigo-400">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-theme-text truncate">Mi Compañero</p>
                    <p className="text-[9px] text-theme-text-muted truncate">Configuración y accesos del asistente IA</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-theme-text-muted rotate-[-90deg]" />
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-2 py-2.5 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-theme-text hover:bg-amber-600/20 transition"
                >
                  <div className="p-1.5 rounded-xl bg-amber-600/20 text-amber-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-theme-text truncate">Administración</p>
                    <p className="text-[9px] text-theme-text-muted truncate">Verificación y gestión de usuarios</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-theme-text-muted rotate-[-90deg]" />
                </Link>
              )}

              {/* Configuración y Seguridad */}
              <div className="px-1">
                <h5 className="text-[10px] uppercase tracking-wider text-theme-text-muted mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3" /> Configuración y seguridad
                </h5>
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-2xl bg-theme-bg border border-theme-border">
                  <div className="p-1.5 rounded-xl bg-cyan-600/15 text-cyan-400">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[10px] text-theme-text-muted flex-1">
                    La gestión de contraseña y sesiones la administra tu proveedor de autenticación.
                  </p>
                </div>
              </div>

              {/* Zona de peligro */}
              <div className="px-1">
                <h5 className="text-[10px] uppercase tracking-wider text-theme-text-muted mb-2 flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-rose-400" /> Zona de peligro
                </h5>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="flex items-center gap-2.5 w-full px-2 py-2.5 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-300 hover:bg-rose-600/20 transition text-[11px] font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar cuenta
                </button>
              </div>
            </div>
          </div>
        )}

        {isGuest ? (
          <Link
            href="/login"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-2 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-lg shadow-violet-600/25"
          >
            <LogIn className="w-4 h-4" />
            Iniciar sesión
          </Link>
        ) : (
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between px-2 py-2 rounded-2xl border transition-colors duration-200 ${
              profileOpen
                ? 'bg-theme-card border-violet-500/30'
                : 'bg-theme-card border-theme-border hover:border-violet-500/20'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-violet-600/40 border border-violet-500/40 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-xs">
                {userInitials || <User className="w-4 h-4 text-theme-text-muted" />}
              </div>
              <div className="overflow-hidden text-left">
                <h4 className="text-xs font-semibold text-theme-text truncate">{userName || 'Cuenta'}</h4>
                <span className="text-[10px] text-theme-text-muted truncate block">
                  {userEmail || 'Perfil y configuración'}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-theme-text-muted shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
        )}

        <div className="flex items-center justify-between bg-theme-card p-1.5 rounded-2xl border border-theme-border transition-colors duration-200">
          {mounted ? (
            <>
              <button onClick={() => setTheme('light')} className={`p-2 rounded-xl transition ${theme === 'light' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-theme-text-muted hover:text-theme-text'}`}><Sun className="w-4 h-4" /></button>
              <button onClick={() => setTheme('dark')} className={`p-2 rounded-xl transition ${theme === 'dark' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-theme-text-muted hover:text-theme-text'}`}><Moon className="w-4 h-4" /></button>
              <button onClick={() => setTheme('system')} className={`p-2 rounded-xl transition ${theme === 'system' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-theme-text-muted hover:text-theme-text'}`}><Monitor className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <span className="p-2"><Sun className="w-4 h-4 text-theme-text-muted" /></span>
              <span className="p-2"><Moon className="w-4 h-4 text-theme-text-muted" /></span>
              <span className="p-2"><Monitor className="w-4 h-4 text-theme-text-muted" /></span>
            </>
          )}
        </div>

        {!isGuest && (
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-theme-text-muted hover:text-red-400 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        )}
      </div>

      {/* Modal de conversión a proveedor */}
      {convertModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !converting && setConvertModalOpen(false)}>
          <div
            className="bg-theme-card border border-theme-border rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-violet-400">
              <div className="p-3 rounded-2xl bg-violet-600/20 border border-violet-500/30">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-text">Convertir a proveedor</h3>
                <p className="text-xs text-theme-text-muted">Tu cuenta pasará a ser de proveedor de forma permanente.</p>
              </div>
            </div>

            <p className="text-xs text-theme-text-secondary leading-relaxed bg-theme-bg p-3.5 rounded-2xl border border-theme-border">
              Podrás ofrecer tus servicios, gestionar tu perfil de negocio, servicios y horarios desde el panel de proveedor. No se podrá volver a una cuenta de cliente.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-theme-text-muted">
                Nombre de tu negocio o servicio
              </label>
              <input
                type="text"
                value={convertBusinessName}
                onChange={(e) => setConvertBusinessName(e.target.value)}
                placeholder="Ej: TechSolutions EC"
                className="w-full px-3.5 py-2.5 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text placeholder-theme-text-muted outline-none focus:border-violet-500/40 transition"
              />
              <p className="text-[9px] text-theme-text-muted">
                Si lo dejas vacío se usará tu nombre de perfil.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  setConvertModalOpen(false)
                  setConvertBusinessName('')
                }}
                disabled={converting}
                className="flex-1 py-2.5 rounded-xl bg-theme-divider hover:bg-theme-card-hover text-theme-text text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConvertToProvider}
                disabled={converting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-violet-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {converting ? 'Convirtiendo...' : 'Convertir cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar cuenta */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="bg-theme-card border border-theme-border rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-600/20 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-text">¿Eliminar cuenta permanentemente?</h3>
                <p className="text-xs text-theme-text-muted">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-theme-text-secondary leading-relaxed bg-theme-bg p-3.5 rounded-2xl border border-theme-border">
              Se eliminarán todos tus registros de la base de datos, historial de interacciones, preferencias guardadas y accesos asociados a este correo.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-theme-text-muted">
                Escribe <span className="text-theme-text font-semibold">{userEmail}</span> para confirmar
              </label>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text placeholder-theme-text-muted outline-none focus:border-rose-500/40 transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setConfirmEmail('')
                }}
                className="flex-1 py-2.5 rounded-xl bg-theme-divider hover:bg-theme-card-hover text-theme-text text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || confirmEmail.trim().toLowerCase() !== userEmail.toLowerCase()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Sí, eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={onClose} />
      )}
      <div className={`${isOpen ? 'fixed inset-y-0 left-0 z-50 animate-slide-in-left' : 'hidden'} lg:block`}>
        {content}
      </div>
    </>
  )
}

export { Sidebar }
export default Sidebar
