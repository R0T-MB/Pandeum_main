"use client";

import { AISolveResponse } from '@/types';
import { CheckCircle, Wrench, User, DollarSign, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Props {
  response: AISolveResponse;
}

// Función para parsear solución en formato **Título:** detalle
const parseSolution = (text: string) => {
  const match = text.match(/\*\*(.+?):\*\*(.*)/s);
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

  const steps = [
    { icon: AlertCircle, label: 'Diagnóstico', content: response.diagnosis.possible_causes.join(', ') },
    ...(response.has_providers && response.providers.length > 0 ? [
      { icon: User, label: 'Proveedor recomendado', content: response.providers[0].business_name },
      { icon: DollarSign, label: 'Costo estimado', content: response.providers[0].estimated_cost },
      { icon: Clock, label: 'Tiempo estimado', content: response.providers[0].response_time_hours ? `${response.providers[0].response_time_hours}h` : 'Consultar' }
    ] : [])
  ];

  return (
    <div className="my-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold mb-3 flex items-center gap-2">Tu Solution Journey</h4>
      
      {/* Diagnóstico y proveedores */}
      <div className="relative flex flex-wrap gap-4 justify-between mb-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex-1 min-w-[120px] text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <step.icon size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 font-medium text-sm">{step.label}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{step.content}</div>
          </div>
        ))}
      </div>

      {/* Soluciones inmediatas - sección separada */}
      {response.instant_solutions.length > 0 && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-sm">Soluciones inmediatas</span>
          </div>
          <div className="space-y-2">
            {response.instant_solutions.map((solution, idx) => {
              const { title, detail } = parseSolution(solution);
              const isExpanded = expandedSolutions[idx];
              
              return (
                <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {title}
                      </div>
                      {isExpanded && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {detail}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleSolution(idx)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium flex items-center gap-1 flex-shrink-0"
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
              );
            })}
          </div>
        </div>
      )}

      {response.confidence_score < 0.6 && (
        <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <AlertCircle size={14} /> Confianza baja: verifica con un profesional.
        </div>
      )}
    </div>
  );
};