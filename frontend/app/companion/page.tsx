'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, Sparkles, Gift, Star, MapPin, MessageSquare, Lock, UtensilsCrossed, Heart, Eye, Flower2 } from 'lucide-react'

const ACCESSORIES = [
  { name: 'Gorro de chef', icon: UtensilsCrossed, color: 'text-white', description: 'Visita un restaurante registrado' },
  { name: 'Collar de huellita', icon: Heart, color: 'text-red-400', description: 'Deja 3 reseñas en negocios' },
  { name: 'Lentes tecnológicos', icon: Eye, color: 'text-blue-400', description: 'Visita un técnico registrado' },
  { name: 'Flor relajante', icon: Flower2, color: 'text-pink-400', description: 'Deja una reseña en un centro de bienestar' },
]

export default function CompanionPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#0B1020]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1E2D4A]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-semibold text-white">Mi Compañero</h1>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center">
            <Sparkles size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
          </div>
        </header>

        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Mascota */}
            <div className="bg-[#111827] border border-[#1E2D4A] rounded-3xl p-6 text-center">
              <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6D5EF8]/30 to-[#5B4FE0]/30 border-2 border-[#6D5EF8]/50 flex items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[#6D5EF8]/40 flex items-center justify-center">
                    <Sparkles size={28} className="text-[#A78BFA]" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] font-bold text-white">
                    1
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">Pandi</h2>
              <p className="text-sm text-[#9CA3AF] mt-1">Nivel 1 &middot; Explorador inicial</p>

              <div className="mt-4 flex items-center justify-center gap-1">
                <div className="w-32 h-1.5 rounded-full bg-[#151E2F] overflow-hidden">
                  <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-[#6D5EF8] to-[#A78BFA]" />
                </div>
                <span className="text-[11px] text-[#9CA3AF]">25%</span>
              </div>
            </div>

            {/* C\u00f3mo desbloquear */}
            <div className="bg-[#111827] border border-[#1E2D4A] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                Cómo desbloquear accesorios
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-[#151E2F] rounded-xl px-4 py-3 border border-[#1E2D4A]">
                  <div className="w-8 h-8 rounded-lg bg-[#6D5EF8]/20 flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Visita un negocio registrado</p>
                    <p className="text-[11px] text-[#9CA3AF]">Encuéntralos en el mapa de Pandeum</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#151E2F] rounded-xl px-4 py-3 border border-[#1E2D4A]">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={14} className="text-yellow-400" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Deja una reseña y calificación</p>
                    <p className="text-[11px] text-[#9CA3AF]">Comparte tu experiencia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Accesorios bloqueados */}
            <div className="bg-[#111827] border border-[#1E2D4A] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Gift size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                Accesorios desbloqueados
              </h3>
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mx-auto mb-2">
                  <Lock size={16} className="text-[#1E2D4A]" strokeWidth={1.75} />
                </div>
                <p className="text-sm text-[#9CA3AF]">Aún no tienes accesorios desbloqueados.</p>
              </div>
            </div>

            {/* Pr\u00f3ximas recompensas */}
            <div className="bg-[#111827] border border-[#1E2D4A] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Star size={14} className="text-yellow-400" strokeWidth={1.75} />
                Próximas recompensas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {ACCESSORIES.map((acc, i) => {
                  const Icon = acc.icon
                  return (
                    <div key={i} className="bg-[#151E2F] border border-[#1E2D4A] rounded-xl p-4 text-center opacity-60 hover:opacity-80 transition-opacity">
                      <div className="flex items-center justify-center mb-2">
                        <Icon size={24} className={acc.color} strokeWidth={1.5} />
                      </div>
                      <p className="text-xs font-medium text-white mb-1">{acc.name}</p>
                      <p className="text-[10px] text-[#9CA3AF] leading-tight">{acc.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
