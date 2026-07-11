"use client";

import { AISolveResponse, ProviderRecommendation } from '@/types';
import { AlertCircle, Wrench, User, ChevronDown, ChevronUp, Star, Phone, MapPin, DollarSign, Clock } from 'lucide-react';
import { useState } from 'react';

interface Props {
  response: AISolveResponse;
}

type RecommendedProvider = ProviderRecommendation;

// Función para parsear solución en múltiples formatos
const parseSolution = (text: string) => {
  // Formato 1: "**Título:** detalle"
  const boldMatch = text.match(/\*\*(.+?):\*\*([\s\S]*)/);
  if (boldMatch) {
    return { title: boldMatch[1].trim(), detail: boldMatch[2].trim() };
  }
  
  // Formato 2: "Título: detalle" (sin negritas)
  const colonMatch = text.match(/^([^:]+):(.+)$/);
  if (colonMatch) {
    return { title: colonMatch[1].trim(), detail: colonMatch[2].trim() };
  }
  
  // Formato 3: Texto simple sin dos puntos
  const summary = text.length > 50 ? text.substring(0, 50) + '...' : text;
  return { title: summary, detail: text };
};

type ActiveSection = 'diagnosis' | 'solutions' | 'provider' | null;

export const SolutionJourney = ({ response }: Props) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('solutions');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({});

  const toggleSection = (section: ActiveSection) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const toggleSolution = (index: number) => {
    setExpandedSolutions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const topCauses = response.diagnosis.possible_causes.slice(0, 3);
  const hasMoreCauses = response.diagnosis.possible_causes.length > 3;
  const providers = response.has_providers && response.providers ? response.providers : [];
  const instantSolutions = response.instant_solutions || [];
  const topSolutions = instantSolutions.slice(0, 3);
  const hasSolutions = instantSolutions.length > 0;

  // Detectar si es tema de salud
  const healthKeywords = [
    'cuello', 'espalda', 'hombro', 'brazo', 'pierna', 'rodilla', 'muscular',
    'contractura', 'postura', 'tension', 'tensión', 'dolor', 'estomago', 'estómago',
    'cabeza', 'pecho', 'fiebre', 'mareo', 'nausea', 'náusea', 'vomito', 'vómito', 'diarrea'
  ];
  
  const isHealthRelated = healthKeywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    return (
      response.diagnosis.possible_causes.some(cause => cause.toLowerCase().includes(lowerKeyword)) ||
      (response.diagnosis.questions || []).some(q => q.toLowerCase().includes(lowerKeyword))
    );
  });

  // Generar mensaje natural basado en contexto
  const getNaturalMessage = () => {
    // Priorizar mensaje del backend si existe
    if (response.natural_message) {
      return response.natural_message;
    }
    
    // Fallback a lógica local
    if (isHealthRelated) {
      return "Siento que estés pasando por eso. Te dejo una orientación general; si el dolor es fuerte, empeora o continúa, busca atención médica.";
    }
    if (providers.length > 0) {
      return "Encontré una posible explicación y también especialistas disponibles que podrían ayudarte.";
    }
    return "Te dejo una guía rápida para entender qué puede estar pasando y qué puedes intentar ahora.";
  };

  // Calcular badges comparativos si hay múltiples proveedores
  const getProviderBadges = (provider: RecommendedProvider, allProviders: RecommendedProvider[]) => {
    if (allProviders.length <= 1) return [];

    const badges: string[] = [];

    // Más barato
    const costs = allProviders.map(p => {
      const match = p.estimated_cost?.match(/\$?(\d+)/);
      return match ? parseInt(match[1]) : Infinity;
    }).filter(c => c !== Infinity);
    
    if (costs.length > 0) {
      const currentCostMatch = provider.estimated_cost?.match(/\$?(\d+)/);
      const currentCost = currentCostMatch ? parseInt(currentCostMatch[1]) : Infinity;
      if (currentCost === Math.min(...costs)) {
        badges.push('Más barato');
      }
    }

    // Mejor calificación
    const ratings = allProviders.map(p => typeof p.rating === 'number' ? p.rating : 0);
    const currentRating = typeof provider.rating === 'number' ? provider.rating : 0;
    if (currentRating === Math.max(...ratings) && currentRating > 0) {
      badges.push('Mejor calificación');
    }

    // Mayor confianza
    const trustScores = allProviders.map(p => typeof p.trust_score === 'number' ? p.trust_score : 0);
    const currentTrustScore = typeof provider.trust_score === 'number' ? provider.trust_score : 0;
    if (currentTrustScore === Math.max(...trustScores) && currentTrustScore > 0) {
      badges.push('Mayor confianza');
    }

    // Más rápido
    const responseTimes = allProviders.map(p => typeof p.response_time_hours === 'number' ? p.response_time_hours : Infinity);
    const currentResponseTime = typeof provider.response_time_hours === 'number' ? provider.response_time_hours : Infinity;
    if (currentResponseTime === Math.min(...responseTimes) && currentResponseTime !== Infinity) {
      badges.push('Más rápido');
    }

    // Más cercano (solo si distance_km existe)
    const distances = allProviders.map(p => typeof p.distance_km === 'number' ? p.distance_km : Infinity);
    const currentDistance = typeof provider.distance_km === 'number' ? provider.distance_km : Infinity;
    if (currentDistance === Math.min(...distances) && currentDistance !== Infinity) {
      badges.push('Más cercano');
    }

    return badges.slice(0, 2); // Máximo 2 badges por proveedor
  };

  return (
    <div className="my-6 space-y-4">
      {/* Mensaje natural del asistente */}
      <div className="bg-[#1d1d22] rounded-2xl p-6 border border-[#5e5d69]">
        <p className="text-white text-base leading-relaxed">
          {getNaturalMessage()}
        </p>
      </div>

      {/* 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Diagnóstico Card */}
        <div
          onClick={() => toggleSection('diagnosis')}
          className={`cursor-pointer bg-[#1d1d22] rounded-2xl p-6 border transition-all hover:shadow-xl ${
            activeSection === 'diagnosis'
              ? 'border-white'
              : 'border-[#5e5d69] hover:border-[#868393]'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              activeSection === 'diagnosis'
                ? 'bg-white text-black'
                : 'bg-[#3b3b43] text-[#868393]'
            }`}>
              <AlertCircle size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">Diagnóstico</h4>
              <p className="text-sm text-[#868393] mt-1">
                Identificamos las posibles causas de tu problema
              </p>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-[#868393] transition-transform ${
                activeSection === 'diagnosis' ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Soluciones Card */}
        <div
          onClick={() => toggleSection('solutions')}
          className={`cursor-pointer bg-[#1d1d22] rounded-2xl p-6 border transition-all hover:shadow-xl ${
            activeSection === 'solutions'
              ? 'border-white'
              : 'border-[#5e5d69] hover:border-[#868393]'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              activeSection === 'solutions'
                ? 'bg-white text-black'
                : 'bg-[#3b3b43] text-[#868393]'
            }`}>
              <Wrench size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">Soluciones inmediatas</h4>
              <p className="text-sm text-[#868393] mt-1">
                Acciones que puedes realizar ahora mismo
              </p>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-[#868393] transition-transform ${
                activeSection === 'solutions' ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Proveedor Card */}
        <div
          onClick={() => toggleSection('provider')}
          className={`cursor-pointer bg-[#1d1d22] rounded-2xl p-6 border transition-all hover:shadow-xl ${
            activeSection === 'provider'
              ? 'border-white'
              : 'border-[#5e5d69] hover:border-[#868393]'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              activeSection === 'provider'
                ? 'bg-white text-black'
                : 'bg-[#3b3b43] text-[#868393]'
            }`}>
              <User size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">
                {response.recommendation_label || 'Proveedor recomendado'}
              </h4>
              <p className="text-sm text-[#868393] mt-1">
                {providers.length > 0 
                  ? `${providers.length} especialista${providers.length > 1 ? 's' : ''} encontrado${providers.length > 1 ? 's' : ''}`
                  : 'Aun no encontramos especialista'
                }
              </p>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-[#868393] transition-transform ${
                activeSection === 'provider' ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expanded Sections */}
      <div className="space-y-4">
        {/* Diagnóstico Detail */}
        {activeSection === 'diagnosis' && (
          <div className="bg-[#1d1d22] rounded-2xl p-6 border border-[#5e5d69] shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-[#868393]" />
              Causas identificadas
            </h4>
            <div className="space-y-3">
              {topCauses.map((cause, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-[#3b3b43] rounded-xl border border-[#5e5d69]">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5e5d69] text-white text-sm font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-white leading-relaxed">{cause}</span>
                </div>
              ))}
              {hasMoreCauses && (
                <div className="text-sm text-[#868393] italic text-center py-2">
                  +{response.diagnosis.possible_causes.length - 3} causas adicionales
                </div>
              )}
            </div>
          </div>
        )}

        {/* Soluciones Detail */}
        {activeSection === 'solutions' && (
          <div className="bg-[#1d1d22] rounded-2xl p-6 border border-[#5e5d69] shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-[#868393]" />
              Acciones recomendadas
            </h4>
            {hasSolutions ? (
              <div className="space-y-3">
                {topSolutions.map((solution, idx) => {
                  const { title, detail } = parseSolution(solution);
                  const isExpanded = expandedSolutions[idx];
                  
                  return (
                    <div key={idx} className="bg-[#3b3b43] rounded-xl border border-[#5e5d69] overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5e5d69] text-white text-sm font-bold flex items-center justify-center">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-2">
                              {title}
                            </div>
                            {isExpanded && (
                              <div className="text-sm text-[#868393] whitespace-pre-wrap leading-relaxed">
                                {detail}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSolution(idx);
                            }}
                            className="flex-shrink-0 text-[#868393] text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#3b3b43] hover:bg-[#5e5d69] transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={14} />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} />
                                Más detalle
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-[#3b3b43] flex items-center justify-center mx-auto mb-3">
                  <Wrench size={24} className="text-[#5e5d69]" />
                </div>
                <p className="text-sm text-[#868393] leading-relaxed">
                  Por ahora no tengo acciones inmediatas claras para este caso, pero puedes revisar el diagnóstico y considerar ayuda profesional si el problema continúa.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Provider Detail */}
        {activeSection === 'provider' && (
          <div className="bg-[#1d1d22] rounded-2xl p-6 border border-[#5e5d69] shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            {response.has_providers && providers.length > 0 ? (
              <>
                <h4 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <User size={20} className="text-[#868393]" />
                  Especialistas recomendados
                </h4>
                <div className="space-y-4">
                  {providers.map((provider, idx) => {
                    const badges = getProviderBadges(provider, providers);
                    
                    return (
                      <div key={provider.provider_id || idx} className="bg-[#3b3b43] rounded-xl p-5 border border-[#5e5d69]">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h5 className="font-bold text-xl text-white">
                              {provider.business_name}
                            </h5>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star size={16} fill="currentColor" />
                                <span className="font-medium">{typeof provider.rating === 'number' ? provider.rating.toFixed(1) : 'N/A'}</span>
                              </div>
                              <span className="text-[#5e5d69]">-</span>
                              <span className="text-sm text-[#868393]">
                                Trust Score: {typeof provider.trust_score === "number" ? provider.trust_score.toFixed(1) : "N/A"}
                              </span>
                              {badges.length > 0 && (
                                <>
                                  <span className="text-[#5e5d69]">-</span>
                                  {badges.map((badge, bIdx) => (
                                    <span key={bIdx} className="px-2 py-1 bg-[#3b3b43] text-[#868393] text-xs font-semibold rounded-full border border-[#5e5d69]">
                                      {badge}
                                    </span>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                          {provider.available_now && (
                            <div className="px-4 py-2 bg-emerald-900/30 text-emerald-400 text-sm font-semibold rounded-full">
                              Disponible ahora
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mb-4">
                          <div className="flex items-center gap-2 px-4 py-2 bg-[#1d1d22] rounded-lg">
                            <DollarSign size={16} className="text-[#868393]" />
                            <span className="text-sm font-medium text-white">{provider.estimated_cost || 'Consultar'}</span>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 bg-[#1d1d22] rounded-lg">
                            <Clock size={16} className="text-[#868393]" />
                            <span className="text-sm font-medium text-white">
                              {typeof provider.response_time_hours === 'number' ? `${provider.response_time_hours}h` : 'Consultar'}
                            </span>
                          </div>
                          {provider.distance_km !== null && provider.distance_km !== undefined && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#1d1d22] rounded-lg">
                              <MapPin size={16} className="text-[#868393]" />
                              <span className="text-sm font-medium text-white">
                                {typeof provider.distance_km === "number" ? provider.distance_km.toFixed(1) : provider.distance_km} km
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          {(provider.reason_bullets || []).slice(0, 2).map((reason, rIdx) => (
                            <div key={rIdx} className="flex items-start gap-2 text-sm text-[#868393]">
                              <span className="text-[#5e5d69] mt-0.5">-</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>

                        <button className="w-full bg-[#3b3b43] hover:bg-[#5e5d69] text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
                          <Phone size={18} />
                          Contactar proveedor
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#3b3b43] flex items-center justify-center mx-auto mb-4">
                  <User size={32} className="text-[#5e5d69]" />
                </div>
                <h5 className="font-semibold text-white mb-2">
                  {response.recommendation_label || 'Aun no encontramos proveedores disponibles para esta categoria'}
                </h5>
                <p className="text-sm text-[#868393]">
                  Te notificaremos cuando haya opciones en tu área
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alerta de confianza baja */}
      {response.confidence_score < 0.6 && (
        <div className="flex items-start gap-3 p-4 bg-[#3b3b43] rounded-xl border border-[#5e5d69]">
          <AlertCircle size={20} className="text-[#868393] flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-white text-sm">
              Confianza baja
            </div>
            <div className="text-xs text-[#868393] mt-1">
              Verifica esta información con un profesional antes de tomar decisiones.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
