'use client'

import React from 'react'
import Link from 'next/link'
import {
  Star,
  MapPin,
  Clock,
  Share2,
  Heart,
  Navigation,
  Phone,
  MessageCircle,
  User,
  Wrench,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { ProviderRecommendation } from '@/types'

interface RightPanelProps {
  providers?: ProviderRecommendation[]
  onOpenProviders?: () => void
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

export function RightPanel({ providers = [], onOpenProviders }: RightPanelProps) {
  const primary = providers[0] as ProviderRecommendation | undefined

  return (
    <aside className="hidden xl:flex xl:flex-col xl:w-[380px] bg-theme-bg border-l border-theme-border p-4 gap-4 overflow-y-auto h-screen shrink-0 select-none transition-colors duration-200">

      {/* Header + "Ver más sugerencias" */}
      <div>
        <h3 className="text-xs font-bold text-theme-text uppercase tracking-wider">
          Proveedores disponibles
        </h3>
        <p className="text-xs text-theme-text-muted mb-3">Estos profesionales están cerca de ti</p>
        {onOpenProviders && (
          <button
            onClick={onOpenProviders}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-violet-600/30 border border-violet-500/40 text-white text-xs font-semibold hover:bg-violet-600/40 transition"
          >
            Ver más sugerencias
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        )}
      </div>

      {/* Real provider card or empty state */}
      {primary ? (
        <div className="bg-theme-card rounded-3xl border border-theme-border p-4 shadow-xl transition-colors duration-200">
          {/* Header: Avatar + Name + Actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 overflow-hidden flex items-center justify-center font-bold text-white text-base shadow-md shrink-0">
                {primary.avatar_url ? (
                  <img src={primary.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(primary.business_name)
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-sm font-bold text-theme-text leading-tight">
                    {primary.business_name}
                  </h4>
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 fill-violet-400/20" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-theme-text">{primary.rating ? primary.rating.toFixed(1) : '—'}</span>
                  <div className="flex items-center text-yellow-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3 h-3 ${star <= Math.round(primary.rating || 0) ? 'fill-current' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <span className="text-white/30">•</span>
                  <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {primary.available_now ? 'Abierto' : 'Disponible'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] text-theme-text-muted hover:text-theme-text transition">
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] text-rose-400 transition">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>

          <p className="text-xs text-theme-text-muted mb-4">
            {primary.address || primary.service_area || 'Servicio profesional verificado'}
          </p>

          {/* Metrics Grid (4 columns) */}
          <div className="grid grid-cols-4 gap-1.5 mb-4 text-center">
            <div className="dark:bg-[#0b0817] bg-gray-100 p-2.5 rounded-2xl dark:border-white/5 border-gray-200">
              <span className="block text-xs font-bold text-theme-text">—</span>
              <span className="block text-[10px] text-theme-text-muted">Experiencia</span>
            </div>
            <div className="dark:bg-[#0b0817] bg-gray-100 p-2.5 rounded-2xl dark:border-white/5 border-gray-200">
              <span className="block text-xs font-bold text-theme-text">{primary.estimated_cost || '—'}</span>
              <span className="block text-[10px] text-theme-text-muted">Precio medio</span>
            </div>
            <div className="dark:bg-[#0b0817] bg-gray-100 p-2.5 rounded-2xl dark:border-white/5 border-gray-200">
              <span className="block text-xs font-bold text-theme-text">
                {primary.distance_km != null
                  ? primary.distance_km < 1
                    ? `${Math.round(primary.distance_km * 1000)} m`
                    : `${primary.distance_km.toFixed(1)} km`
                  : '—'}
              </span>
              <span className="block text-[10px] text-theme-text-muted">Distancia</span>
            </div>
            <div className="dark:bg-[#0b0817] bg-gray-100 p-2.5 rounded-2xl dark:border-white/5 border-gray-200">
              <span className="block text-xs font-bold text-theme-text">
                {typeof primary.response_time_hours === 'number'
                  ? primary.response_time_hours < 1
                    ? '<1 h'
                    : `${primary.response_time_hours}h`
                  : '—'}
              </span>
              <span className="block text-[10px] text-theme-text-muted">Respuesta</span>
            </div>
          </div>

          {/* Action Buttons Row (4 columns) */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-[10px] font-medium transition">
              <Navigation className="w-3.5 h-3.5 mb-1 text-violet-400" />
              <span>Cómo llegar</span>
            </button>
            {primary.phone ? (
              <a
                href={`tel:${primary.phone}`}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition"
              >
                <Phone className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>Llamar</span>
              </a>
            ) : (
              <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition">
                <Phone className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>Llamar</span>
              </button>
            )}
            {primary.whatsapp ? (
              <a
                href={`https://wa.me/${primary.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition"
              >
                <MessageCircle className="w-3.5 h-3.5 mb-1 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition">
                <MessageCircle className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>WhatsApp</span>
              </button>
            )}
            {primary.provider_id ? (
              <Link
                href={`/providers/${primary.provider_id}`}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition"
              >
                <User className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>Ver perfil</span>
              </Link>
            ) : (
              <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-theme-divider hover:bg-[var(--color-border)] border border-theme-border text-theme-text-secondary text-[10px] font-medium transition">
                <User className="w-3.5 h-3.5 mb-1 text-violet-400" />
                <span>Ver perfil</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-theme-text-muted leading-relaxed pt-2 border-t border-theme-border">
            {primary.address
              ? `Ubicado en ${primary.address}${primary.service_area ? `, ${primary.service_area}` : ''}.`
              : primary.service_area
                ? `Sirve en el área de ${primary.service_area}.`
                : 'Profesional verificado listo para ayudarte.'}
          </p>
        </div>
      ) : (
        <div className="bg-theme-card rounded-3xl border border-theme-border p-6 text-center transition-colors duration-200">
          <div className="w-10 h-10 rounded-xl bg-theme-divider flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-5 h-5 text-theme-text-muted" />
          </div>
          <p className="text-xs text-theme-text-muted">Haz una consulta para ver proveedores disponibles</p>
        </div>
      )}

      {/* Route card */}
      <div className="bg-theme-card rounded-3xl border border-theme-border p-4 shadow-xl transition-colors duration-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-theme-text tracking-wide">Ruta sugerida</span>
          </div>
          <span className="text-xs text-theme-text-muted">Llegada estimada 9:48 AM</span>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-theme-text">
          <span>
            {primary?.distance_km != null
              ? primary.distance_km < 1
                ? `${Math.round(primary.distance_km * 1000)} m`
                : `${primary.distance_km.toFixed(1)} km`
              : '4 min'}
            <span className="text-theme-text-muted font-normal">
              {primary?.distance_km != null ? ' (estimado)' : ' (350 m)'}
            </span>
          </span>

          <div className="flex items-center gap-2 dark:bg-[#0b0817] bg-gray-100 px-2.5 py-1.5 rounded-xl dark:border-white/5 border-gray-200 text-theme-text-muted">
            <span className="text-violet-400 font-bold">🚶‍♂️</span>
            <span className="hover:text-theme-text transition cursor-pointer">🚗</span>
            <span className="hover:text-theme-text transition cursor-pointer">🚲</span>
            <span className="hover:text-theme-text transition cursor-pointer">🚌</span>
          </div>
        </div>

        {/* Mini Map */}
        <div className="h-28 dark:bg-[#0b0817] bg-gray-100 rounded-2xl dark:border-white/5 border-gray-200 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:12px_12px]"></div>
          <svg className="w-full h-full absolute inset-0 px-4" viewBox="0 0 200 60" fill="none">
            <path d="M10 45 Q 60 10, 100 30 T 190 20" stroke="#a78bfa" strokeWidth="2.5" strokeDasharray="4 4" />
          </svg>
          <div className="absolute left-6 bottom-4 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20 animate-pulse"></div>
          <div className="absolute right-6 top-4 w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs shadow-md">
            <Wrench className="w-3 h-3 text-white" />
          </div>
        </div>

        <button className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition flex items-center justify-center gap-2">
          <Navigation className="w-3.5 h-3.5 fill-current" /> Iniciar navegación
        </button>
      </div>
    </aside>
  )
}

export default RightPanel
