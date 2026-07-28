"use client";

import { AISolveResponse } from '@/types';
import { AlertCircle, Wrench, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface Props {
  response: AISolveResponse;
}

const parseSolution = (text: string) => {
  const boldMatch = text.match(/\*\*(.+?):\*\*([\s\S]*)/);
  if (boldMatch) {
    return { title: boldMatch[1].trim(), detail: boldMatch[2].trim() };
  }

  const colonMatch = text.match(/^([^:]+):(.+)$/);
  if (colonMatch) {
    return { title: colonMatch[1].trim(), detail: colonMatch[2].trim() };
  }

  const summary = text.length > 50 ? text.substring(0, 50) + '...' : text;
  return { title: summary, detail: text };
};

type ActiveSection = 'diagnosis' | 'solutions' | null;

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

  const getNaturalMessage = () => {
    if (response.natural_message) {
      return response.natural_message;
    }

    if (isHealthRelated) {
      return "Siento que estés pasando por eso. Te dejo una orientación general; si el dolor es fuerte, empeora o continúa, busca atención médica.";
    }
    if (providers.length > 0) {
      return "Encontré una posible explicación y también especialistas disponibles que podrían ayudarte.";
    }
    return "Te dejo una guía rápida para entender qué puede estar pasando y qué puedes intentar ahora.";
  };

  return (
    <div className="space-y-5">
      {/* Mensaje natural del asistente */}
      <div className="bg-[#111827] rounded-[18px] p-5 pandeum-shadow-sm">
        <p className="text-base text-white leading-relaxed">
          {getNaturalMessage()}
        </p>
      </div>

      {/* Diagnosis + Solutions cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Diagnóstico Card */}
        <div
          onClick={() => toggleSection('diagnosis')}
          className={`cursor-pointer bg-[#111827] rounded-[18px] p-5 border transition-all duration-200 hover:scale-[1.02] pandeum-shadow-sm ${
            activeSection === 'diagnosis'
              ? 'border-[#6E42FF]/40'
              : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-colors duration-200 ${
              activeSection === 'diagnosis'
                ? 'bg-[#6E42FF] text-white'
                : 'bg-[#151E2F] text-[#9CA3AF]'
            }`}>
              <AlertCircle size={18} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white">Diagnóstico</h4>
              <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">
                Posibles causas de tu problema
              </p>
            </div>
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              className={`text-[#9CA3AF] transition-transform duration-200 flex-shrink-0 ${
                activeSection === 'diagnosis' ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Soluciones Card */}
        <div
          onClick={() => toggleSection('solutions')}
          className={`cursor-pointer bg-[#111827] rounded-[18px] p-5 border transition-all duration-200 hover:scale-[1.02] pandeum-shadow-sm ${
            activeSection === 'solutions'
              ? 'border-[#6E42FF]/40'
              : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-colors duration-200 ${
              activeSection === 'solutions'
                ? 'bg-[#6E42FF] text-white'
                : 'bg-[#151E2F] text-[#9CA3AF]'
            }`}>
              <Wrench size={18} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white">Soluciones inmediatas</h4>
              <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">
                Acciones que puedes realizar ahora
              </p>
            </div>
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              className={`text-[#9CA3AF] transition-transform duration-200 flex-shrink-0 ${
                activeSection === 'solutions' ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expanded Sections */}
      <div className="space-y-4">
        {/* Diagnóstico Detail */}
        {activeSection === 'diagnosis' && (
          <div className="bg-[#111827] rounded-[18px] p-5 border border-[rgba(255,255,255,0.08)] animate-in">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="text-[#6E42FF]" strokeWidth={1.75} />
              Causas identificadas
            </h4>
            <div className="space-y-2.5">
              {topCauses.map((cause, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 bg-[#151E2F] rounded-[14px]">
                  <span className="flex-shrink-0 w-7 h-7 rounded-[14px] bg-[rgba(255,255,255,0.06)] text-[#9CA3AF] text-xs font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-white leading-relaxed">{cause}</span>
                </div>
              ))}
              {hasMoreCauses && (
                <div className="text-xs text-[#9CA3AF] italic text-center py-1">
                  +{response.diagnosis.possible_causes.length - 3} causas adicionales
                </div>
              )}
            </div>
          </div>
        )}

        {/* Soluciones Detail */}
        {activeSection === 'solutions' && (
          <div className="bg-[#111827] rounded-[18px] p-5 border border-[rgba(255,255,255,0.08)] animate-in">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb size={16} className="text-[#6E42FF]" strokeWidth={1.75} />
              Acciones recomendadas
            </h4>
            {hasSolutions ? (
              <div className="space-y-2.5">
                {topSolutions.map((solution, idx) => {
                  const { title, detail } = parseSolution(solution);
                  const isExpanded = expandedSolutions[idx];

                  return (
                    <div key={idx} className="bg-[#151E2F] rounded-[14px] border border-[rgba(255,255,255,0.08)] overflow-hidden transition-all duration-200">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-[14px] bg-[rgba(255,255,255,0.06)] text-[#9CA3AF] text-xs font-semibold flex items-center justify-center">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">
                              {title}
                            </div>
                            {isExpanded && (
                              <div className="text-xs text-[#9CA3AF] mt-2 leading-relaxed whitespace-pre-wrap">
                                {detail}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSolution(idx);
                            }}
                            className="flex-shrink-0 text-xs font-medium text-[#9CA3AF] hover:text-white bg-[#111827] hover:bg-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-[14px] transition-all duration-200 flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={12} strokeWidth={2} />
                                <span className="hidden sm:inline">Ocultar</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown size={12} strokeWidth={2} />
                                <span className="hidden sm:inline">Detalle</span>
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
                <div className="w-10 h-10 rounded-[14px] bg-[#151E2F] flex items-center justify-center mx-auto mb-3">
                  <Wrench size={18} className="text-[rgba(255,255,255,0.1)]" strokeWidth={1.75} />
                </div>
                <p className="text-sm text-[#9CA3AF] leading-relaxed max-w-xs mx-auto">
                  Por ahora no tengo acciones inmediatas claras para este caso, pero puedes revisar el diagnóstico y considerar ayuda profesional si el problema continúa.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Alerta de confianza baja */}
        {response.confidence_score < 0.6 && (
          <div className="flex items-start gap-3 p-4 bg-[#111827] rounded-[18px] border border-[rgba(255,255,255,0.08)]">
            <AlertCircle size={16} className="text-[#6E42FF] flex-shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-white">Confianza baja</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Verifica esta información con un profesional antes de tomar decisiones.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
