'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Heart, History, User, Briefcase, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useDarkMode } from '@/hooks/useDarkMode';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();
  
  const navItems = [
    { href: '/', label: 'Chat', icon: MessageSquare },
    { href: '/favorites', label: 'Favoritos', icon: Heart },
    { href: '/history', label: 'Historial', icon: History },
    { href: '/dashboard', label: 'Mi Perfil', icon: User },
  ];
  
  if (user?.is_provider) {
    navItems.push({ href: '/provider-dashboard', label: 'Panel Proveedor', icon: Briefcase });
  }
  
  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Pandeum
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};