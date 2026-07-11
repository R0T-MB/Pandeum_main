'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Heart,
  History,
  User,
  Briefcase,
  LogOut,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    { href: '/', label: 'Chat', icon: MessageSquare },
    { href: '/favorites', label: 'Favoritos', icon: Heart },
    { href: '/history', label: 'Historial', icon: History },
    { href: '/dashboard', label: 'Mi Perfil', icon: User },
  ]

  if (user?.is_provider) {
    navItems.push({
      href: '/provider-dashboard',
      label: 'Panel Proveedor',
      icon: Briefcase,
    })
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[280px] transform border-r border-[#1E2D4A] bg-[#111827] transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1E2D4A]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8] to-[#5B4FE0] flex items-center justify-center text-white text-sm font-bold">
            P
          </div>
          <span className="text-base font-semibold text-white tracking-tight">Pandeum</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#151E2F] text-white font-medium border border-[#1E2D4A]'
                    : 'text-[#9CA3AF] hover:bg-[#151E2F] hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4">
          <div className="bg-gradient-to-br from-[#151E2F] to-[#111827] rounded-2xl border border-[#1E2D4A] p-4">
            <div className="w-8 h-8 rounded-xl bg-[#6D5EF8]/10 flex items-center justify-center mb-3">
              <Sparkles size={16} className="text-[#6D5EF8]" />
            </div>
            <p className="text-xs font-semibold text-white mb-1 leading-relaxed">
              Mejora tu experiencia
            </p>
            <p className="text-[10px] text-[#9CA3AF] mb-3 leading-relaxed">
              Descubre todas las funciones de Pandeum.
            </p>
            <button className="flex items-center gap-1.5 text-[11px] font-medium text-[#6D5EF8] hover:text-white transition-colors duration-200">
              Explorar funciones
              <ArrowRight size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="px-3 py-3 border-t border-[#1E2D4A]">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-[#9CA3AF] hover:bg-[#151E2F] hover:text-white transition-all duration-200 text-sm"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }
export default Sidebar
