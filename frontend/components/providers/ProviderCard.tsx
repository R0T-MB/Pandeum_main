import { Star, Zap, Clock, MapPin, DollarSign } from 'lucide-react';
import { ProviderRecommendation } from '@/types';
import Link from 'next/link';

interface Props {
  provider: ProviderRecommendation;
}

export const ProviderCard = ({ provider }: Props) => {
  return (
    <Link href={`/providers/${provider.provider_id}`}>
      <div className="group bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow cursor-pointer">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{provider.business_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="ml-1 text-sm">{provider.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-slate-500">Trust Score: {provider.trust_score}</span>
            </div>
          </div>
          {provider.available_now && (
            <span className="flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
              <Zap size={12} /> Disponible ahora
            </span>
          )}
        </div>
        
        <div className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
          {provider.distance_km && (
            <div className="flex items-center gap-2"><MapPin size={14} /> {provider.distance_km.toFixed(1)} km</div>
          )}
          {provider.response_time_hours && (
            <div className="flex items-center gap-2"><Clock size={14} /> Responde en ~{provider.response_time_hours}h</div>
          )}
          {provider.estimated_cost && (
            <div className="flex items-center gap-2"><DollarSign size={14} /> Costo estimado: {provider.estimated_cost}</div>
          )}
        </div>
        
        <div className="mt-3">
          {provider.reason_bullets.map((reason, idx) => (
            <div key={idx} className="text-sm text-slate-600 dark:text-slate-400">✓ {reason}</div>
          ))}
        </div>
        
        <button className="mt-3 w-full bg-[#1E3A5F] hover:bg-[#2F5D7C] text-white font-medium py-2 rounded-lg transition-colors">
          Contactar
        </button>
      </div>
    </Link>
  );
};