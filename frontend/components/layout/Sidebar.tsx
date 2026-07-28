'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Heart,
  History,
  Briefcase,
  MapPin,
  LogOut,
  Sparkles,
  ArrowRight,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/', label: 'Inicio', icon: MessageSquare },
  { href: '/map', label: 'Mapa', icon: MapPin },
  { href: '/favorites', label: 'Favoritos', icon: Heart },
  { href: '/history', label: 'Historial', icon: History },
  { href: '/companion', label: 'Compañero', icon: Sparkles },
]

const bottomNavItems = [
  { href: '/', label: 'Inicio', icon: MessageSquare },
  { href: '/map', label: 'Mapa', icon: MapPin },
  { href: '/favorites', label: 'Favoritos', icon: Heart },
  { href: '/history', label: 'Historial', icon: History },
  { href: '/companion', label: 'Compañero', icon: Sparkles },
]

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const allNavItems = [...navItems]
  if (user?.is_provider) {
    allNavItems.push({
      href: '/provider-dashboard',
      label: 'Panel Proveedor',
      icon: Briefcase,
    })
  }

  const themeOptions = [
    { value: 'dark', icon: Moon, label: 'Oscuro' },
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'system', icon: Monitor, label: 'Sistema' },
  ]

  return (
    <>
      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[280px] transform border-r border-[rgba(255,255,255,0.08)] bg-[#111521] transition-transform duration-300 flex flex-col rounded-[22px] m-3 h-[calc(100vh-24px)] pandeum-shadow ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0 lg:ml-0 lg:mr-0 lg:my-0 lg:rounded-none lg:m-0 lg:h-screen`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 pt-8 pb-6">
          <div className="w-12 h-12 rounded-[18px] pandeum-gradient-strong flex items-center justify-center text-white text-lg font-bold shadow-2xl shadow-[#6E42FF]/30">
            P
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">Pandeum</span>
            <span className="block text-[11px] text-[#9CA3AF] tracking-wider uppercase mt-0.5">Soluciones</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-5 py-3 rounded-[14px] transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#6E42FF]/15 text-white font-medium border border-[#6E42FF]/30 pandeum-glow-purple'
                    : 'text-[#9CA3AF] hover:bg-[rgba(255,255,255,0.03)] hover:text-white hover:border hover:border-[rgba(255,255,255,0.06)]'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 ${
                  isActive ? 'text-[#6E42FF] drop-shadow-[0_0_8px_rgba(110,66,255,0.4)]' : 'text-[#9CA3AF] group-hover:text-[#6E42FF]'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Pro Card */}
        <div className="px-4 py-3">
          <div className="bg-gradient-to-br from-[#0E1422] to-[#080B14] rounded-[18px] border border-[#6E42FF]/20 p-5 pandeum-glow-purple hover-lift">
            <div className="w-10 h-10 rounded-[14px] bg-[#6E42FF]/10 flex items-center justify-center mb-3">
              <Sparkles size={18} className="text-[#6E42FF]" />
            </div>
            <p className="text-sm font-semibold text-white mb-1.5 leading-relaxed">
              Pandeum Pro
            </p>
            <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">
              Accede a funciones exclusivas y recomendaciones prioritarias.
            </p>
            <button className="flex items-center gap-1.5 text-xs font-medium text-[#6E42FF] hover:text-white transition-colors duration-200 group">
              Actualizar ahora
              <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-[14px] bg-[rgba(255,255,255,0.03)]">
              {themeOptions.map((opt) => {
                const Icon = opt.icon
                const isThemeActive = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex items-center justify-center flex-1 px-2 py-1.5 rounded-[14px] text-xs font-medium transition-all duration-200 ${
                      isThemeActive
                        ? 'bg-[#6E42FF]/20 text-[#6E42FF] shadow-sm'
                        : 'text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                    title={opt.label}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* User & Logout */}
        <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.08)]">
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-[14px] bg-[rgba(255,255,255,0.03)] hover-lift">
              <div className="w-10 h-10 rounded-full bg-[#6E42FF]/20 flex items-center justify-center text-sm font-bold text-[#6E42FF] ring-2 ring-[#6E42FF]/20">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{user.full_name || 'Usuario'}</p>
                <p className="text-xs text-[#9CA3AF] truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3.5 w-full px-5 py-3 rounded-[14px] text-[#9CA3AF] hover:bg-[rgba(255,255,255,0.03)] hover:text-white transition-all duration-200 text-sm group"
          >
            <LogOut size={18} strokeWidth={1.75} className="group-hover:text-red-400 transition-colors" />
            <span className="text-sm font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 bg-[#111521]/95 backdrop-blur-xl border-t border-[rgba(255,255,255,0.08)] lg:hidden safe-area-bottom">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[14px] transition-all duration-200 min-w-[48px] ${
                isActive
                  ? 'text-[#6E42FF]'
                  : 'text-[#6B7280] hover:text-[#9CA3AF]'
              }`}
            >
              <div className={`flex items-center justify-center w-6 h-6 ${
                isActive ? 'drop-shadow-[0_0_8px_rgba(110,66,255,0.4)]' : ''
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              </div>
              <span className={`text-[9px] font-medium ${
                isActive ? 'text-[#6E42FF]' : 'text-[#6B7280]'
              }`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export { Sidebar }
export default Sidebar
