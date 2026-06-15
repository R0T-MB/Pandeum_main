import { AISolveResponse } from '@/types';
import { CheckCircle, Wrench, User, DollarSign, Clock, AlertCircle } from 'lucide-react';

interface Props {
  response: AISolveResponse;
}

export const SolutionJourney = ({ response }: Props) => {
  const steps = [
    { icon: AlertCircle, label: 'Diagnóstico', content: response.diagnosis.possible_causes.join(', ') },
    { icon: Wrench, label: 'Soluciones inmediatas', content: response.instant_solutions.join(' → ') },
    ...(response.has_providers && response.providers.length > 0 ? [
      { icon: User, label: 'Proveedor recomendado', content: response.providers[0].business_name },
      { icon: DollarSign, label: 'Costo estimado', content: response.providers[0].estimated_cost },
      { icon: Clock, label: 'Tiempo estimado', content: response.providers[0].response_time_hours ? `${response.providers[0].response_time_hours}h` : 'Consultar' }
    ] : [])
  ];
  
  return (
    <div className="my-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold mb-3 flex items-center gap-2">Tu Solution Journey</h4>
      <div className="relative flex flex-wrap gap-4 justify-between">
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
      {response.confidence_score < 0.6 && (
        <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <AlertCircle size={14} /> Confianza baja: verifica con un profesional.
        </div>
      )}
    </div>
  );
};