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
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 transform border-r border-[#5e5d69] bg-[#1d1d22] transition-transform lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-[#5e5d69]">
          <p className="text-base font-semibold text-white">Pandeum</p>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#3b3b43] text-white font-medium'
                    : 'text-[#868393] hover:bg-[#3b3b43] hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#5e5d69]">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[#868393] hover:bg-[#3b3b43] hover:text-white transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }
export default Sidebar