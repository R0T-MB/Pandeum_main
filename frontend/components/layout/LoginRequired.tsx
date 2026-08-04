'use client'

import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import { Lock, LogIn } from 'lucide-react'

interface LoginRequiredProps {
  isOpen?: boolean
  onClose?: () => void
  title?: string
  description?: string
}

export default function LoginRequired({
  isOpen = false,
  onClose,
  title = 'Inicia sesión para continuar',
  description = 'Esta función está disponible solo para usuarios registrados.',
}: LoginRequiredProps) {
  return (
    <div className="flex h-screen bg-theme-bg">
      <Sidebar isOpen={isOpen} onClose={onClose} />
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-violet-400" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-bold text-theme-text mb-2 text-center">{title}</h2>
        <p className="text-xs text-theme-text-muted max-w-sm text-center leading-relaxed mb-6">{description}</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-lg shadow-violet-600/25"
        >
          <LogIn className="w-4 h-4" />
          Iniciar sesión
        </Link>
      </div>
    </div>
  )
}
