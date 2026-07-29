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
  Bell,
  Home,
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/map', label: 'Mapa', icon: MapPin },
  { href: '/favorites', label: 'Favoritos', icon: Heart },
  { href: '/history', label: 'Historial', icon: History },
  { href: '/companion', label: 'Mi Compañero', icon: Sparkles },
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
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`lg:fixed lg:left-4 lg:top-4 lg:z-50 lg:w-[300px] lg:h-[calc(100vh-32px)] lg:rounded-[24px] lg:border lg:border-[rgba(255,255,255,.08)] lg:sidebar-gradient lg:p-0 lg:flex lg:flex-col lg:shadow-[0_20px_50px_rgba(0,0,0,.25)] ${
          isOpen
            ? 'fixed inset-0 z-50 flex flex-col bg-[#0F1420] animate-slide-in-left'
            : 'hidden'
        } lg:flex`}
      >
        {/* Header: Logo + Notification */}
        <div className="flex items-center justify-between px-6 pt-[22px] pb-[18px]" style={{ minHeight: '72px' }}>
          <div className="flex items-center gap-[10px]">
            <svg width="34" height="20" viewBox="0 0 34 20" fill="none" className="flex-shrink-0">
              <path d="M5 4V16M5 4H15C17.5 4 20 5.5 20 9C20 12.5 17.5 14 15 14H5"
                stroke="url(#p-logo)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="p-logo" x1="0" y1="0" x2="34" y2="0">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#8A52FF"/>
                </linearGradient>
              </defs>
            </svg>
            <h1 className="text-[19px] font-semibold tracking-[.02em] leading-none" style={{ fontFamily: 'Inter' }}>
              <span className="text-white">PAN</span><span className="text-[#7B4CFF]">DEUM</span>
            </h1>
          </div>

          <button className="relative w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all duration-[200ms] hover:bg-[rgba(255,255,255,.05)]">
            <Bell size={22} strokeWidth={2} color="#E6EAF5" />
            <span className="absolute top-[6px] right-[6px] w-2 h-2 rounded-full bg-[#7B4CFF] border-2 border-[#0F1420]" />
          </button>
        </div>

        {/* Gap after header: 28px */}
        <div className="h-7" />

        {/* Navigation */}
        <nav className="flex flex-col gap-2 px-6 overflow-y-auto scrollbar-thin flex-1">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 w-full h-14 px-5 rounded-[18px] transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isActive
                    ? 'sidebar-item-active text-white'
                    : 'text-[#D8DCE5] hover:bg-[rgba(255,255,255,.03)] hover:text-white border border-transparent'
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={2}
                  className={`flex-shrink-0 transition-colors duration-[180ms] ${
                    isActive ? 'text-[#8A5DFF]' : 'text-[#C9CED9] group-hover:text-white'
                  }`}
                />
                <span className="text-base font-medium leading-6">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Spacer pushes Pro card + User to bottom */}
        <div className="flex-1 min-h-[20px]" />

        {/* Pro Card */}
        <div className="px-6 pb-2">
          <div className="rounded-[18px] border border-[rgba(110,66,255,.2)] p-5 bg-gradient-to-br from-[#0E1422] to-[#080B14] shadow-[0_0_18px_rgba(124,77,255,.10)]">
            <div className="w-10 h-10 rounded-[14px] bg-[rgba(110,66,255,.1)] flex items-center justify-center mb-3">
              <Sparkles size={18} className="text-[#6E42FF]" strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold text-white mb-1.5 leading-relaxed">
              Pandeum Pro
            </p>
            <p className="text-xs text-[#7E879E] mb-4 leading-relaxed">
              Accede a funciones exclusivas y recomendaciones prioritarias.
            </p>
            <button className="flex items-center gap-1.5 text-xs font-medium text-[#6E42FF] hover:text-white transition-colors duration-[180ms] group">
              Actualizar ahora
              <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform duration-[180ms]" />
            </button>
          </div>
        </div>

        {/* User + Theme + Logout */}
        <div className="px-6 pt-3 pb-[22px] space-y-1">
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-[14px] hover:bg-[rgba(255,255,255,.03)] transition-colors duration-[180ms]">
              <div className="w-10 h-10 rounded-full bg-[rgba(110,66,255,.2)] flex items-center justify-center text-sm font-bold text-[#6E42FF] ring-2 ring-[rgba(110,66,255,.2)]">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{user.full_name || 'Usuario'}</p>
                <p className="text-xs text-[#7E879E] truncate">{user.email}</p>
              </div>
            </div>
          )}

          {mounted && (
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-[14px] bg-[rgba(255,255,255,.03)]">
              {themeOptions.map((opt) => {
                const Icon = opt.icon
                const isThemeActive = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex items-center justify-center flex-1 px-2 py-1.5 rounded-[14px] text-xs font-medium transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isThemeActive
                        ? 'bg-[rgba(110,66,255,.2)] text-[#6E42FF] shadow-sm'
                        : 'text-[#7E879E] hover:text-white hover:bg-[rgba(255,255,255,.05)]'
                    }`}
                    title={opt.label}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-3.5 w-full px-5 py-3 rounded-[14px] text-[#7E879E] hover:bg-[rgba(255,255,255,.03)] hover:text-white transition-all duration-[180ms] text-sm group"
          >
            <LogOut size={18} strokeWidth={2} className="group-hover:text-red-400 transition-colors duration-[180ms]" />
            <span className="text-sm font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }
export default Sidebar
