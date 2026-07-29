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
      <aside className="hidden xl:flex xl:flex-col xl:w-[360px] flex-shrink-0 border-l border-[rgba(255,255,255,0.08)] bg-[#101522]/80 h-screen overflow-y-auto scrollbar-thin">
        <div className="p-5 space-y-5">
          <div className="bg-gradient-to-br from-[#151B2A] to-[#0F1420] rounded-[20px] border border-[rgba(255,255,255,0.08)] p-8 text-center shadow-[0_12px_30px_rgba(0,0,0,.18)]">
            <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#6E42FF]/20 to-[#7C4DFF]/10 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[#6E42FF]/10">
              <Bot size={26} className="text-[#6E42FF]" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Proveedores recomendados</h3>
            <p className="text-sm text-[#AEB5C5] leading-relaxed">
              Haz una consulta para que Pandeum encuentre opciones cercanas.
            </p>
            <button
              onClick={onOpenProviders}
              className="mt-4 w-full py-2.5 rounded-[14px] text-xs font-medium bg-gradient-to-br from-[#6E42FF] to-[#835DFF] text-white transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-90 active:opacity-80"
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
    <aside className="hidden xl:flex xl:flex-col xl:w-[360px] flex-shrink-0 border-l border-[rgba(255,255,255,0.08)] bg-[#101522]/80 h-screen overflow-y-auto scrollbar-thin animate-slide-in-right">
      <div className="p-5 space-y-5">
        {/* SECTION 1: Más opciones cercanas */}
        <div className="bg-gradient-to-br from-[#151B2A] to-[#0F1420] rounded-[20px] border border-[rgba(255,255,255,0.08)] p-5 shadow-[0_12px_30px_rgba(0,0,0,.18)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[14px] bg-[#6E42FF]/10 flex items-center justify-center">
                <Sparkles size={14} className="text-[#6E42FF]" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-white">Más opciones cercanas</h3>
            </div>
            <button
              onClick={onOpenProviders}
              className="text-xs font-medium text-[#6E42FF] hover:text-white transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-2">
            {providers.slice(0, 3).map((p, i) => {
              const distance = distanceStr(p.distance_km)
              return (
                <div
                  key={p.provider_id}
                  className="flex items-center gap-3 p-3 rounded-[18px] hover:bg-[rgba(110,66,255,0.06)] hover:border hover:border-[#6E42FF]/20 transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] group border border-transparent active:scale-[0.98]"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#6E42FF]/20 to-[#7C4DFF]/10 flex items-center justify-center text-sm font-bold text-[#6E42FF] flex-shrink-0 shadow-sm group-hover:shadow-lg group-hover:shadow-[#6E42FF]/20 transition-all duration-[180ms]">
                    {p.business_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {p.provider_id ? (
                        <Link href={`/providers/${p.provider_id}`} className="text-sm font-medium text-white truncate hover:text-[#6E42FF] transition-colors duration-[180ms]">
                          {p.business_name}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-white truncate">{p.business_name}</span>
                      )}
                      {p.available_now && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400/50 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                        <Star size={10} className="fill-yellow-400" strokeWidth={1.5} />
                        {p.rating}
                      </span>
                      <span className="text-xs text-[#AEB5C5]">({p.trust_score.toFixed(1)})</span>
                      {distance && (
                        <>
                          <span className="text-xs text-[#AEB5C5]">·</span>
                          <span className="text-xs text-[#AEB5C5]">{distance}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Heart size={16} className="text-[#AEB5C5] hover:text-[#6E42FF] hover:scale-110 transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex-shrink-0" strokeWidth={1.5} />
                </div>
              )
            })}
          </div>
        </div>

        {/* SECTION 2: Proveedor destacado */}
        {featured && (
          <div className="bg-gradient-to-br from-[#151B2A] via-[#0F1420] to-[#0D121D] rounded-[20px] border border-[rgba(255,255,255,0.08)] p-5 space-y-4 shadow-[0_12px_30px_rgba(0,0,0,.18)]">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-6 h-6 rounded-[14px] bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck size={14} className="text-emerald-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-white">Proveedor destacado</h3>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#6E42FF] to-[#835DFF] flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow-xl shadow-[#6E42FF]/30">
                {featured.business_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-white truncate">{featured.business_name}</h4>
                  {featured.trust_score > 0.7 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                      <ShieldCheck size={10} strokeWidth={2} />
                      Verificado
                    </span>
                  )}
                </div>
                {featured.service_area && (
                  <p className="text-xs text-[#AEB5C5] mt-0.5">{featured.service_area}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                    <Star size={11} className="fill-yellow-400" strokeWidth={1.5} />
                    {featured.rating}
                  </span>
                  <span className="text-xs text-[#AEB5C5]">({featured.trust_score.toFixed(1)})</span>
                  {featured.available_now && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <Zap size={11} strokeWidth={2} />
                      Abierto
                    </span>
                  )}
                </div>
                {featured.reason_bullets.length > 0 && (
                  <p className="text-xs text-[#AEB5C5] mt-2 leading-relaxed line-clamp-2 italic">
                    "{featured.reason_bullets[0]}"
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[rgba(255,255,255,0.03)] rounded-[14px] px-3.5 py-2.5 border border-[rgba(255,255,255,0.04)]">
                <p className="text-[11px] text-[#AEB5C5]">Confianza</p>
                <p className="text-sm font-medium text-white">{(featured.trust_score * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.03)] rounded-[14px] px-3.5 py-2.5 border border-[rgba(255,255,255,0.04)]">
                <p className="text-[11px] text-[#AEB5C5]">Costo</p>
                <p className="text-sm font-medium text-white">{featured.estimated_cost || '—'}</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.03)] rounded-[14px] px-3.5 py-2.5 border border-[rgba(255,255,255,0.04)]">
                <p className="text-[11px] text-[#AEB5C5]">Distancia</p>
                <p className="text-sm font-medium text-white">
                  {distanceStr(featured.distance_km) || '—'}
                </p>
              </div>
              <div className="bg-[rgba(255,255,255,0.03)] rounded-[14px] px-3.5 py-2.5 border border-[rgba(255,255,255,0.04)]">
                <p className="text-[11px] text-[#AEB5C5]">Respuesta</p>
                <p className="text-sm font-medium text-white">
                  {featured.response_time_hours != null ? `~${featured.response_time_hours}h` : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[14px] text-xs font-medium bg-gradient-to-br from-[#6E42FF] to-[#835DFF] text-white transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-90 active:opacity-80">
                <Navigation size={14} strokeWidth={1.75} />
                Cómo llegar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[14px] text-xs font-medium bg-[rgba(39,194,106,0.1)] border border-[rgba(39,194,106,0.2)] text-[#27C26A] transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[rgba(39,194,106,0.15)] active:opacity-80">
                <Phone size={14} strokeWidth={1.75} />
                Llamar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[14px] text-xs font-medium bg-[#151B2A] border border-[rgba(255,255,255,.08)] text-white transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#1A2234] active:opacity-80">
                <MessageCircle size={14} strokeWidth={1.75} />
                Chat
              </button>
            </div>
            {featured.provider_id && (
              <Link
                href={`/providers/${featured.provider_id}`}
                className="flex items-center justify-center gap-1 w-full py-2.5 rounded-[14px] text-xs font-medium text-[#6E42FF] hover:bg-[rgba(110,66,255,0.05)] transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                Ver perfil completo
                <ChevronRight size={14} strokeWidth={1.75} />
              </Link>
            )}
          </div>
        )}

        {/* SECTION 3: Ruta sugerida */}
        <div className="bg-gradient-to-br from-[#0F1420] to-[#0D121D] rounded-[20px] border border-[rgba(255,255,255,0.08)] p-5 shadow-[0_12px_30px_rgba(0,0,0,.18)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-[14px] bg-[#22D3EE]/10 flex items-center justify-center">
              <MapPin size={14} className="text-[#22D3EE]" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-white">Ruta sugerida</h3>
            {featured?.distance_km != null && (
              <span className="ml-auto text-xs text-[#AEB5C5] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 rounded-full">
                {featured.distance_km.toFixed(1)} km
              </span>
            )}
          </div>

          <div className="text-center py-4 bg-[rgba(255,255,255,0.02)] rounded-[14px] mb-4">
            <p className="text-4xl font-bold text-white">
              {featured?.distance_km != null
                ? `${Math.round(featured.distance_km / 0.1)} min`
                : '—'}
            </p>
            <p className="text-sm text-[#AEB5C5] mt-1">
              {featured?.distance_km != null
                ? `${featured.distance_km.toFixed(1)} km · ${new Date(Date.now() + Math.round(featured.distance_km / 0.1) * 60000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                : 'Distancia no disponible'}
            </p>
          </div>

          <div className="relative h-20 bg-[#151B2A] rounded-[14px] mb-4 overflow-hidden border border-[rgba(255,255,255,0.04)]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full px-5 flex items-center justify-between">
                <div className="w-4 h-4 rounded-full bg-[#6E42FF] shadow-2xl shadow-[#6E42FF]/60 ring-2 ring-[#6E42FF]/20 z-10" />
                <div className="flex-1 mx-4 h-1.5 bg-gradient-to-r from-[#6E42FF] via-[#7C4DFF] to-[#22D3EE] relative rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#6E42FF]/50 to-[#22D3EE]/50 blur-sm" />
                </div>
                <div className="w-4 h-4 rounded-full bg-[#22D3EE] shadow-2xl shadow-[#22D3EE]/40 ring-2 ring-[#22D3EE]/20 z-10" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mb-4">
            {[
              { icon: Car, label: 'Auto', active: true },
              { icon: Footprints, label: 'Caminar', active: false },
              { icon: Bike, label: 'Bici', active: false },
            ].map((mode) => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.label}
                  className={`flex items-center justify-center gap-1 flex-1 py-2 rounded-[14px] text-xs font-medium transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mode.active
                      ? 'bg-[#6E42FF]/10 border border-[#6E42FF]/30 text-[#6E42FF] shadow-sm hover:bg-[#6E42FF]/15'
                      : 'bg-[#151B2A] border border-[rgba(255,255,255,0.08)] text-[#AEB5C5] hover:bg-[#1A2234] hover:text-white'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.75} />
                  {mode.label}
                </button>
              )
            })}
          </div>

          <button className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-sm font-medium bg-gradient-to-br from-[#6E42FF] to-[#835DFF] text-white transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-90 active:opacity-80">
            <Navigation size={16} strokeWidth={1.75} />
            Iniciar navegación
          </button>
        </div>
      </div>
    </aside>
  )
}

export default RightPanel
