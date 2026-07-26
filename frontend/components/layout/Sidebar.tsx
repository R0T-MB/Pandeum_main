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
        className={`fixed left-0 top-0 z-50 h-screen w-[270px] transform border-r border-[rgba(255,255,255,0.06)] bg-[#080B14] transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-[rgba(255,255,255,0.06)]">
          <div className="w-9 h-9 rounded-xl pandeum-gradient flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-[#7C3AED]/20">
            P
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">Pandeum</span>
            <span className="block text-[10px] text-[#9CA3AF] tracking-wider uppercase">Soluciones</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#7C3AED]/10 text-white font-medium border border-[#7C3AED]/20 pandeum-glow'
                    : 'text-[#9CA3AF] hover:bg-[rgba(255,255,255,0.03)] hover:text-white'
                }`}
              >
                <div className={`flex items-center justify-center w-5 h-5 ${
                  isActive ? 'text-[#7C3AED]' : 'text-[#9CA3AF] group-hover:text-[#7C3AED]'
                }`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
                </div>
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7C3AED] shadow-lg shadow-[#7C3AED]/50" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Pro Card */}
        <div className="px-3 py-3">
          <div className="bg-gradient-to-br from-[#0E1422] to-[#080B14] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 pandeum-glow">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center mb-3">
              <Sparkles size={14} className="text-[#7C3AED]" />
            </div>
            <p className="text-xs font-semibold text-white mb-1 leading-relaxed">
              Mejora tu experiencia
            </p>
            <p className="text-[10px] text-[#9CA3AF] mb-3 leading-relaxed">
              Descubre todas las funciones de Pandeum.
            </p>
            <button className="flex items-center gap-1.5 text-[11px] font-medium text-[#7C3AED] hover:text-white transition-colors duration-200">
              Explorar funciones
              <ArrowRight size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <div className="px-3 py-2 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)]">
              {themeOptions.map((opt) => {
                const Icon = opt.icon
                const isThemeActive = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex items-center justify-center flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                      isThemeActive
                        ? 'bg-[#7C3AED]/20 text-[#7C3AED]'
                        : 'text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                    title={opt.label}
                  >
                    <Icon size={14} strokeWidth={1.75} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* User & Logout */}
        <div className="px-3 py-3 border-t border-[rgba(255,255,255,0.06)]">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
              <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center text-xs font-bold text-[#7C3AED]">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{user.full_name || 'Usuario'}</p>
                <p className="text-[10px] text-[#9CA3AF] truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[#9CA3AF] hover:bg-[rgba(255,255,255,0.03)] hover:text-white transition-all duration-200 text-sm"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 bg-[#0E1422]/95 backdrop-blur-xl border-t border-[rgba(255,255,255,0.06)] lg:hidden safe-area-bottom">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[48px] ${
                isActive
                  ? 'text-[#7C3AED]'
                  : 'text-[#6B7280] hover:text-[#9CA3AF]'
              }`}
            >
              <div className={`flex items-center justify-center w-6 h-6 ${
                isActive ? 'drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]' : ''
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              </div>
              <span className={`text-[9px] font-medium ${
                isActive ? 'text-[#7C3AED]' : 'text-[#6B7280]'
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
