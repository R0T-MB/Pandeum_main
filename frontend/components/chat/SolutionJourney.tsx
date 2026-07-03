"use client";

import { AISolveResponse } from '@/types';
import { CheckCircle, Wrench, User, DollarSign, Clock, AlertCircle, ChevronDown, ChevronUp, Star, Phone, MapPin } from 'lucide-react';
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
  // Si no tiene formato de título, usar primeras 50 chars como resumen
  const summary = text.length > 50 ? text.substring(0, 50) + '...' : text;
  return { title: summary, detail: text };
};

export const SolutionJourney = ({ response }: Props) => {
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({});

  const toggleSolution = (index: number) => {
    setExpandedSolutions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Obtener las primeras 3 causas del diagnóstico
  const topCauses = response.diagnosis.possible_causes.slice(0, 3);
  const hasMoreCauses = response.diagnosis.possible_causes.length > 3;

  // Proveedor principal (si existe)
  const mainProvider = response.has_providers && response.providers.length > 0 ? response.providers[0] : null;

  return (
    <div className="my-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle size={24} className="text-white/90" />
          Tu Solution Journey
        </h3>
        <p className="text-blue-100 text-sm mt-1">
          Resumen de diagnóstico, acciones inmediatas y proveedor sugerido
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Diagnóstico */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Diagnóstico</h4>
          </div>
          <div className="grid gap-2">
            {topCauses.map((cause, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-center font-medium">
                  {idx + 1}
                </span>
                <span>{cause}</span>
              </div>
            ))}
            {hasMoreCauses && (
              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                +{response.diagnosis.possible_causes.length - 3} causas adicionales
              </div>
            )}
          </div>
        </div>

        {/* Resumen rápido - Mini cards */}
        {mainProvider && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <User size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Resumen rápido</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Costo estimado</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {mainProvider.estimated_cost}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Tiempo estimado</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {mainProvider.response_time_hours ? `${mainProvider.response_time_hours}h` : 'Consultar'}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={16} className="text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Rating</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {mainProvider.rating?.toFixed(1) || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Soluciones inmediatas */}
        {response.instant_solutions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Wrench size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Soluciones inmediatas</h4>
            </div>
            <div className="space-y-3">
              {response.instant_solutions.map((solution, idx) => {
                const { title, detail } = parseSolution(solution);
                const isExpanded = expandedSolutions[idx];
                
                return (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">
                            {title}
                          </div>
                          {isExpanded && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                              {detail}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleSolution(idx)}
                          className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
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

        {/* Tarjeta del proveedor */}
        {mainProvider && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <User size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Proveedor recomendado</h4>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h5 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {mainProvider.business_name}
                  </h5>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-medium">{mainProvider.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <span className="text-gray-400">-</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Trust Score: {typeof mainProvider.trust_score === "number" ? mainProvider.trust_score.toFixed(1) : "N/A"}
                    </span>
                  </div>
                </div>
                {mainProvider.available_now && (
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    Disponible ahora
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <DollarSign size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{mainProvider.estimated_cost}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Clock size={14} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {mainProvider.response_time_hours ? `${mainProvider.response_time_hours}h` : 'Consultar'}
                  </span>
                </div>
                {mainProvider.distance_km !== null && mainProvider.distance_km !== undefined && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <MapPin size={14} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{typeof mainProvider.distance_km === "number" ? mainProvider.distance_km.toFixed(1) : mainProvider.distance_km} km</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {(mainProvider.reason_bullets || []).slice(0, 2).map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-green-500 mt-0.5">-</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow">
                <Phone size={16} />
                Contactar proveedor
              </button>
            </div>
          </div>
        )}

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
    </div>
  );
};
