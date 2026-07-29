'use client'

import Link from 'next/link'
import {
  Star,
  Navigation,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  ChevronRight,
  User,
  ExternalLink,
  MessageCircle,
  Footprints,
  Car,
  Bike,
  Bus,
  Utensils,
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
    <aside className="hidden xl:flex xl:flex-col xl:w-[380px] bg-[#07050d] border-l border-white/5 p-4 gap-4 overflow-y-auto h-screen shrink-0 select-none">
      {/* Header + Drawer trigger */}
      <div>
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Restaurantes disponibles
        </h3>
        <p className="text-xs text-white/40 mb-3">Estos profesionales están cerca de ti</p>
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

      {/* Real provider card */}
      {primary ? (
        <div className="bg-[#120f24] rounded-3xl border border-white/5 p-4 shadow-xl">
          {/* Header with avatar + status */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 overflow-hidden shrink-0 flex items-center justify-center font-bold text-violet-300 text-sm">
              {primary.avatar_url ? (
                <img src={primary.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(primary.business_name)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white truncate">{primary.business_name}</h4>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {primary.available_now ? 'Abierto' : 'Disponible'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60 mt-0.5">
                <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                  <Star className="w-3 h-3 fill-yellow-400" strokeWidth={1.5} />
                  {primary.rating ? primary.rating.toFixed(1) : '—'}
                </span>
                <span className="text-white/40">•</span>
                <span>{primary.estimated_cost || 'Consultar'}</span>
              </div>
            </div>
          </div>

          {/* Location + times */}
          <div className="space-y-1.5 mb-3 pb-3 border-b border-white/5">
            {(primary.address || primary.service_area) && (
              <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                <MapPin className="w-3 h-3 text-violet-400 shrink-0" />
                <span className="truncate">{primary.address || primary.service_area}</span>
              </div>
            )}
            {typeof primary.response_time_hours === 'number' && (
              <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                <Clock className="w-3 h-3 text-violet-400 shrink-0" />
                {primary.response_time_hours < 1
                  ? 'Responde en menos de 1 h'
                  : `Responde en ${primary.response_time_hours} h aprox.`}
              </div>
            )}
            {primary.distance_km != null && (
              <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                <MapPin className="w-3 h-3 text-violet-400 shrink-0" />
                A {primary.distance_km.toFixed(1)} km aprox.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {primary.provider_id && (
                <Link
                  href={`/providers/${primary.provider_id}`}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600 text-white text-[11px] font-medium shadow-md shadow-violet-600/30"
                >
                  <User className="w-3.5 h-3.5" />
                  Ver perfil
                </Link>
              )}
              {primary.whatsapp ? (
                <a
                  href={`https://wa.me/${primary.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              ) : null}
            </div>

            <button className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/70 hover:bg-white/10 hover:text-white transition">
              <ExternalLink className="w-3 h-3" />
              Más formas de contacto
            </button>
          </div>
        </div>
      ) : (
        /* Empty state when no providers */
        <div className="bg-[#120f24] rounded-3xl border border-white/5 p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-5 h-5 text-white/30" />
          </div>
          <p className="text-xs text-white/50">Haz una consulta para ver proveedores disponibles</p>
        </div>
      )}

      {/* Route module */}
      <div className="bg-[#120f24] rounded-3xl border border-white/5 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" /> Ruta sugerida
          </span>
          <span className="text-[10px] text-white/50">Llegada estimada 9:48 AM</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white">4 min <span className="text-xs text-white/50 font-normal">(350 m)</span></h4>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button className="p-1.5 bg-violet-600 text-white rounded-lg"><Footprints className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 text-white/40 hover:text-white rounded-lg transition"><Car className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 text-white/40 hover:text-white rounded-lg transition"><Bike className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 text-white/40 hover:text-white rounded-lg transition"><Bus className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="relative h-28 rounded-2xl bg-[#090710] border border-white/5 overflow-hidden flex items-center justify-center mb-3">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#382b63_1px,transparent_1px)] [background-size:12px_12px]" />
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M 40 80 Q 90 30 150 60 T 280 30" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="absolute top-6 right-8 w-6 h-6 rounded-full bg-violet-600 shadow-lg shadow-violet-600/50 flex items-center justify-center text-white text-xs">
            <Utensils className="w-3 h-3" />
          </div>
          <div className="absolute bottom-5 left-10 w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-ping" />
          <div className="absolute bottom-5 left-10 w-4 h-4 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center" />
        </div>
        <button className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2">
          <Navigation className="w-3.5 h-3.5" /> Iniciar navegación
        </button>
      </div>
    </aside>
  )
}

export default RightPanel
