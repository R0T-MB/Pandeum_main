'use client'

import { Star, MapPin, Clock, Zap, Navigation, Car, Footprints, Bike, MessageCircle, Phone, Heart, ChevronRight, ShieldCheck, Bot, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { ProviderRecommendation } from '@/types'

interface RightPanelProps {
  providers?: ProviderRecommendation[]
  onOpenProviders?: () => void
}

export function RightPanel({ providers = [], onOpenProviders }: RightPanelProps) {
  const featured = providers[0] || null

  if (providers.length === 0) {
    return (
      <aside className="hidden xl:flex xl:flex-col xl:w-[340px] flex-shrink-0 border-l border-[rgba(255,255,255,0.06)] bg-[#080B14]/80 h-screen overflow-y-auto scrollbar-thin">
        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-br from-[#111827] to-[#0E1422] rounded-xl border border-[rgba(255,255,255,0.06)] p-6 text-center pandeum-glow">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#6D5EF8]/10 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7C3AED]/10">
              <Bot size={22} className="text-[#7C3AED]" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-2">Proveedores recomendados</h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Haz una consulta para que Pandeum encuentre opciones cercanas.
            </p>
            <button
              onClick={onOpenProviders}
              className="mt-3 w-full py-2 rounded-lg text-[11px] font-medium bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/20 transition-all duration-200"
            >
              Buscar proveedores
            </button>
          </div>
        </div>
      </aside>
    )
  }

  const distanceStr = (km?: number) => km != null ? `${km.toFixed(1)} km` : null

  return (
    <aside className="hidden xl:flex xl:flex-col xl:w-[340px] flex-shrink-0 border-l border-[rgba(255,255,255,0.06)] bg-[#080B14]/80 h-screen overflow-y-auto scrollbar-thin animate-slide-right">
      <div className="p-4 space-y-4">
        {/* SECTION 1: Más opciones cercanas */}
        <div className="bg-gradient-to-br from-[#111827] to-[#0E1422] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 shadow-sm pandeum-glow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                <Sparkles size={12} className="text-[#7C3AED]" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-white">Más opciones cercanas</h3>
            </div>
            <button
              onClick={onOpenProviders}
              className="text-[11px] font-medium text-[#7C3AED] hover:text-white transition-all duration-200 hover:scale-105"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-1.5">
            {providers.slice(0, 3).map((p, i) => {
              const distance = distanceStr(p.distance_km)
              return (
                <div key={p.provider_id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[rgba(124,58,237,0.06)] hover:border hover:border-[#7C3AED]/20 transition-all duration-200 group border border-transparent animate-fade-up active:scale-[0.98]" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#6D5EF8]/10 flex items-center justify-center text-xs font-bold text-[#7C3AED] flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:shadow-[#7C3AED]/20 transition-all duration-200">
                    {p.business_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {p.provider_id ? (
                        <Link href={`/providers/${p.provider_id}`} className="text-sm font-medium text-white truncate hover:text-[#7C3AED] transition-colors">
                          {p.business_name}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-white truncate">{p.business_name}</span>
                      )}
                      {p.available_now && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400/50 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                        <Star size={9} className="fill-yellow-400" strokeWidth={1.5} />
                        {p.rating}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">({p.trust_score.toFixed(1)})</span>
                      {distance && (
                        <>
                          <span className="text-[10px] text-[#9CA3AF]">·</span>
                          <span className="text-[10px] text-[#9CA3AF]">{distance}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Heart size={14} className="text-[#9CA3AF] hover:text-[#7C3AED] hover:scale-110 transition-all duration-200 flex-shrink-0" strokeWidth={1.5} />
                </div>
              )
            })}
          </div>
        </div>

        {/* SECTION 2: Proveedor destacado */}
        {featured && (
          <div className="bg-gradient-to-br from-[#111827] via-[#0E1422] to-[#080B14] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 space-y-3 shadow-md pandeum-glow">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck size={12} className="text-emerald-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-white">Proveedor destacado</h3>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D5EF8] flex items-center justify-center text-lg font-bold text-white flex-shrink-0 shadow-lg shadow-[#7C3AED]/30">
                {featured.business_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate">{featured.business_name}</h4>
                  {featured.trust_score > 0.7 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                      <ShieldCheck size={9} strokeWidth={2} />
                      Verificado
                    </span>
                  )}
                </div>
                {featured.service_area && (
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">{featured.service_area}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                    <Star size={10} className="fill-yellow-400" strokeWidth={1.5} />
                    {featured.rating}
                  </span>
                  <span className="text-[11px] text-[#9CA3AF]">({featured.trust_score.toFixed(1)})</span>
                  {featured.available_now && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      <Zap size={10} strokeWidth={2} />
                      Abierto
                    </span>
                  )}
                </div>
                {featured.reason_bullets.length > 0 && (
                  <p className="text-[11px] text-[#9CA3AF] mt-2 leading-relaxed line-clamp-2 italic">
                    "{featured.reason_bullets[0]}"
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[rgba(255,255,255,0.03)] rounded-lg px-3 py-2 border border-[rgba(255,255,255,0.04)]">
                <p className="text-[10px] text-[#9CA3AF]">Confianza</p>
                <p className="text-xs font-medium text-white">{(featured.trust_score * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.03)] rounded-lg px-3 py-2 border border-[rgba(255,255,255,0.04)]">
                <p className="text-[10px] text-[#9CA3AF]">Costo</p>
                <p className="text-xs font-medium text-white">{featured.estimated_cost || '—'}</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.03)] rounded-lg px-3 py-2 border border-[rgba(255,255,255,0.04)]">
                <p className="text-[10px] text-[#9CA3AF]">Distancia</p>
                <p className="text-xs font-medium text-white">
                  {distanceStr(featured.distance_km) || '—'}
                </p>
              </div>
              <div className="bg-[rgba(255,255,255,0.03)] rounded-lg px-3 py-2 border border-[rgba(255,255,255,0.04)]">
                <p className="text-[10px] text-[#9CA3AF]">Respuesta</p>
                <p className="text-xs font-medium text-white">
                  {featured.response_time_hours != null ? `~${featured.response_time_hours}h` : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium bg-[#7C3AED] hover:bg-[#6D5EF8] text-white transition-all duration-200 shadow-sm shadow-[#7C3AED]/20 hover:shadow-md hover:shadow-[#7C3AED]/30 hover:scale-105 active:scale-[0.95]">
                <Navigation size={12} strokeWidth={1.75} />
                Cómo llegar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 active:scale-[0.95] transition-all duration-200">
                <Phone size={12} strokeWidth={1.75} />
                Llamar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.08)] hover:scale-105 active:scale-[0.95] transition-all duration-200">
                <MessageCircle size={12} strokeWidth={1.75} />
                Chat
              </button>
            </div>
            {featured.provider_id && (
              <Link
                href={`/providers/${featured.provider_id}`}
                className="flex items-center justify-center gap-1 w-full py-2 rounded-lg text-[11px] font-medium text-[#7C3AED] hover:bg-[rgba(124,58,237,0.05)] transition-all duration-200 hover:scale-[1.02]"
              >
                Ver perfil completo
                <ChevronRight size={12} strokeWidth={1.75} />
              </Link>
            )}
          </div>
        )}

        {/* SECTION 3: Ruta sugerida */}
        <div className="bg-gradient-to-br from-[#0E1422] to-[#080B14] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 pandeum-glow shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[#22D3EE]/10 flex items-center justify-center">
              <MapPin size={12} className="text-[#22D3EE]" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-white">Ruta sugerida</h3>
            {featured?.distance_km != null && (
              <span className="ml-auto text-[10px] text-[#9CA3AF] bg-[rgba(255,255,255,0.03)] px-2 py-0.5 rounded-full">
                {featured.distance_km.toFixed(1)} km
              </span>
            )}
          </div>

          <div className="text-center py-3 bg-[rgba(255,255,255,0.02)] rounded-lg mb-3">
            <p className="text-3xl font-bold text-white">
              {featured?.distance_km != null
                ? `${Math.round(featured.distance_km / 0.1)} min`
                : '—'}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {featured?.distance_km != null
                ? `${featured.distance_km.toFixed(1)} km · ${new Date(Date.now() + Math.round(featured.distance_km / 0.1) * 60000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                : 'Distancia no disponible'}
            </p>
          </div>

          <div className="relative h-16 bg-[#111827] rounded-lg mb-3 overflow-hidden border border-[rgba(255,255,255,0.04)]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full px-4 flex items-center justify-between">
                <div className="w-3.5 h-3.5 rounded-full bg-[#7C3AED] shadow-lg shadow-[#7C3AED]/50 ring-2 ring-[#7C3AED]/20 z-10" />
                <div className="flex-1 mx-3 h-1 bg-gradient-to-r from-[#7C3AED] via-[#6D5EF8] to-[#22D3EE] relative rounded-full overflow-hidden animate-route-line">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/50 to-[#22D3EE]/50 blur-sm" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-lg shadow-[#22D3EE]/60 animate-moving-dot" style={{ left: '4px' }} />
                </div>
                <div className="w-3.5 h-3.5 rounded-full bg-[#22D3EE] shadow-lg shadow-[#22D3EE]/30 ring-2 ring-[#22D3EE]/20 z-10" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {[
              { icon: Car, label: 'Auto', active: true },
              { icon: Footprints, label: 'Caminar', active: false },
              { icon: Bike, label: 'Bici', active: false },
            ].map((mode) => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.label}
                  className={`flex items-center justify-center gap-1 flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 hover:scale-105 active:scale-[0.95] ${
                    mode.active
                      ? 'bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[#7C3AED] shadow-sm hover:bg-[#7C3AED]/15'
                      : 'bg-[#111827] border border-[rgba(255,255,255,0.06)] text-[#9CA3AF] hover:bg-[#151E2F] hover:text-white'
                  }`}
                >
                  <Icon size={12} strokeWidth={1.75} />
                  {mode.label}
                </button>
              )
            })}
          </div>

          <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#7C3AED] to-[#6D5EF8] hover:from-[#6D5EF8] hover:to-[#5B4FE0] text-white transition-all duration-200 shadow-lg shadow-[#7C3AED]/20 hover:shadow-xl hover:shadow-[#7C3AED]/30 hover:scale-[1.02] active:scale-95">
            <Navigation size={14} strokeWidth={1.75} />
            Iniciar navegación
          </button>
        </div>
      </div>
    </aside>
  )
}

export default RightPanel
