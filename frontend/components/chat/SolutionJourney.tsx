"use client";

import { AISolveResponse } from '@/types';
import { CheckCircle, AlertCircle, Wrench, User, ChevronDown, ChevronUp, Star, Phone, MapPin, DollarSign, Clock } from 'lucide-react';
import { useState } from 'react';

interface Props {
  response: AISolveResponse;
}

// Función para parsear solución en formato **Título:** detalle
const parseSolution = (text: string) => {
  const match = text.match(/\*\*(.+?):\*\*([\s\S]*)/);
  if (match) {
    return { title: match[1].trim(), detail: match[2].trim() };
  }
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
  const mainProvider = response.has_providers && response.providers.length > 0 ? response.providers[0] : null;
  const topSolutions = response.instant_solutions.slice(0, 3);

  return (
    <div className="my-6 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-lg">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
          <CheckCircle size={28} className="text-white/90" />
          Tu Solution Journey
        </h3>
        <p className="text-blue-100 text-sm mt-2">
          Resumen interactivo de diagnóstico, acciones y recomendaciones
        </p>
      </div>

      {/* 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Diagnóstico Card */}
        <div
          onClick={() => toggleSection('diagnosis')}
          className={`cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all hover:shadow-xl ${
            activeSection === 'diagnosis'
              ? 'border-amber-500 shadow-lg ring-2 ring-amber-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              activeSection === 'diagnosis'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            }`}>
              <AlertCircle size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">Diagnóstico</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Identificamos las posibles causas de tu problema
              </p>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-gray-400 transition-transform ${
                activeSection === 'diagnosis' ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Soluciones Card */}
        <div
          onClick={() => toggleSection('solutions')}
          className={`cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all hover:shadow-xl ${
            activeSection === 'solutions'
              ? 'border-green-500 shadow-lg ring-2 ring-green-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              activeSection === 'solutions'
                ? 'bg-green-500 text-white'
                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            }`}>
              <Wrench size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">Soluciones inmediatas</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Acciones que puedes realizar ahora mismo
              </p>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-gray-400 transition-transform ${
                activeSection === 'solutions' ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Proveedor Card */}
        <div
          onClick={() => toggleSection('provider')}
          className={`cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all hover:shadow-xl ${
            activeSection === 'provider'
              ? 'border-purple-500 shadow-lg ring-2 ring-purple-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              activeSection === 'provider'
                ? 'bg-purple-500 text-white'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            }`}>
              <User size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">Proveedor recomendado</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {mainProvider ? 'Te conectamos con el mejor especialista' : 'Aún no encontramos especialista'}
              </p>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-gray-400 transition-transform ${
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
              Causas identificadas
            </h4>
            <div className="space-y-3">
              {topCauses.map((cause, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{cause}</span>
                </div>
              ))}
              {hasMoreCauses && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
                  +{response.diagnosis.possible_causes.length - 3} causas adicionales
                </div>
              )}
            </div>
          </div>
        )}

        {/* Soluciones Detail */}
        {activeSection === 'solutions' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-green-600 dark:text-green-400" />
              Acciones recomendadas
            </h4>
            <div className="space-y-3">
              {topSolutions.map((solution, idx) => {
                const { title, detail } = parseSolution(solution);
                const isExpanded = expandedSolutions[idx];
                
                return (
                  <div key={idx} className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {title}
                          </div>
                          {isExpanded && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                              {detail}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSolution(idx);
                          }}
                          className="flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
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
          </div>
        )}

        {/* Provider Detail */}
        {activeSection === 'provider' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            {mainProvider ? (
              <>
                <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <User size={20} className="text-purple-600 dark:text-purple-400" />
                  Especialista recomendado
                </h4>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h5 className="font-bold text-xl text-gray-900 dark:text-gray-100">
                        {mainProvider.business_name}
                      </h5>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <Star size={16} fill="currentColor" />
                          <span className="font-medium">{mainProvider.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <span className="text-gray-400">-</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Trust Score: {typeof mainProvider.trust_score === "number" ? mainProvider.trust_score.toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </div>
                    {mainProvider.available_now && (
                      <div className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-full">
                        Disponible ahora
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mainProvider.estimated_cost}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Clock size={16} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {mainProvider.response_time_hours ? `${mainProvider.response_time_hours}h` : 'Consultar'}
                      </span>
                    </div>
                    {mainProvider.distance_km !== null && mainProvider.distance_km !== undefined && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <MapPin size={16} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {typeof mainProvider.distance_km === "number" ? mainProvider.distance_km.toFixed(1) : mainProvider.distance_km} km
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {(mainProvider.reason_bullets || []).slice(0, 2).map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-green-500 mt-0.5">-</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                    <Phone size={18} />
                    Contactar proveedor
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <User size={32} className="text-gray-400" />
                </div>
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Aún no encontramos un especialista disponible
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Te notificaremos cuando haya opciones en tu área
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alerta de confianza baja */}
      {response.confidence_score < 0.6 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-amber-800 dark:text-amber-300 text-sm">
              Confianza baja
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Verifica esta información con un profesional antes de tomar decisiones.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
