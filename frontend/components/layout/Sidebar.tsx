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
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const userName = user?.full_name || 'María Fernanda'
  const userEmail = user?.email || 'marialf@example.com'
  const userInitials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'MF'

  const navItems = [
    { href: '/', label: 'Chat', icon: MessageSquare },
    { href: '/map', label: 'Mapa', icon: MapPin },
    { href: '/favorites', label: 'Favoritos', icon: Heart },
    { href: '/history', label: 'Historial', icon: History },
    { href: '/companion', label: 'Mi Compañero', icon: Users },
  ]

  const isActive = (href: string) => pathname === href

  const content = (
    <aside className="w-[260px] bg-[#07050d] border-r border-white/5 flex flex-col justify-between p-4 select-none h-screen shrink-0">
      <div>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-violet-500/30">
              P
            </div>
            <span className="font-bold tracking-wider text-white text-base">PANDEUM</span>
          </div>
          <button className="text-white/60 hover:text-white transition">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition ${
                  active
                    ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/10 text-white font-medium border border-violet-500/30 shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-violet-400' : ''}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <div className="relative bg-gradient-to-b from-[#151128] to-[#0c0a15] p-3.5 rounded-2xl border border-violet-500/30 overflow-hidden shadow-xl">
          <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-violet-600/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-1.5">
            <Crown className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs font-bold text-white">Pandeum Pro</h4>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed mb-3">
            Desbloquea beneficios exclusivos y experiencias premium.
          </p>
          <button className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-violet-600/30 transition">
            Actualizar ahora &gt;
          </button>
        </div>

        <div className="flex items-center justify-between px-2 py-2 bg-[#120f24] rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-violet-600/40 border border-violet-500/40 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-xs">
              {userInitials}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-white truncate">{userName}</h4>
              <span className="text-[10px] text-white/40 truncate block">{userEmail}</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
        </div>

        <div className="flex items-center justify-between bg-[#120f24] p-1.5 rounded-2xl border border-white/5">
          {mounted ? (
            <>
              <button onClick={() => setTheme('light')} className={`p-2 rounded-xl transition ${theme === 'light' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-white/40 hover:text-white'}`}><Sun className="w-4 h-4" /></button>
              <button onClick={() => setTheme('dark')} className={`p-2 rounded-xl transition ${theme === 'dark' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-white/40 hover:text-white'}`}><Moon className="w-4 h-4" /></button>
              <button onClick={() => setTheme('system')} className={`p-2 rounded-xl transition ${theme === 'system' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-white/40 hover:text-white'}`}><Monitor className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <span className="p-2"><Sun className="w-4 h-4 text-white/40" /></span>
              <span className="p-2"><Moon className="w-4 h-4 text-white/40" /></span>
              <span className="p-2"><Monitor className="w-4 h-4 text-white/40" /></span>
            </>
          )}
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-white/40 hover:text-red-400 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
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
