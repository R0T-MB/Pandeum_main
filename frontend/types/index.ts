export interface User {
  id: string;
  email: string;
  full_name: string | null;
  city: string | null;
  is_provider: boolean;
  is_admin: boolean;
}

export interface Provider {
  id: string;
  business_name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  avatar_url: string | null;
  verification_status: string;
  trust_score: number;
  trust_factors: Record<string, unknown>;
  price_min: number | null;
  price_max: number | null;
  location_lat: number | null;
  location_lng: number | null;
  available_now: boolean;
  response_time_hours: number | null;
  cases_resolved_similar: number;
  address: string | null;
  service_area: string | null;
  phone: string | null;
  whatsapp: string | null;
  search_tags: string[];
  service_keywords: string[];
  rating: number;
}

export interface Service {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  price_estimate: string | null;
  price_min: number | null;
  price_max: number | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

export interface AISolveResponse {
  confidence_score: number;
  diagnosis: { possible_causes: string[]; questions?: string[] };
  instant_solutions: string[];
  has_providers: boolean;
  providers: ProviderRecommendation[];
  composite_solution?: unknown;
  fallback?: Fallback;
  natural_message?: string;
  response_mode?: string; // direct, journey, providers, food, follow_up, suggestions
  direct_answer?: string; // respuesta directa para modo direct
  recommendation_label?: string; // etiqueta para recomendaciones
  provider_category?: string; // categoría de proveedor (ej: "centro médico", "restaurante")
  suggestions_label?: string; // etiqueta para sugerencias de comida
  suggestions?: string[]; // lista de sugerencias de platos
  intent_category?: string; // food, clothing, service, product, health, tech, general
}

export interface ProviderRecommendation {
  provider_id: string;
  business_name: string;
  trust_score: number;
  rating: number;
  distance_km?: number;
  reason_bullets: string[];
  estimated_cost: string;
  available_now: boolean;
  response_time_hours?: number;
}

export interface Fallback {
  type: string;
  guides: string[];
  waitlist_enabled: boolean;
}

export interface Conversation {
  id: string;
  problem_text: string;
  ai_response: AISolveResponse;
  created_at: string;
}

export type Message =
  | { id: string; role: 'user'; content: string; timestamp: Date }
  | { id: string; role: 'assistant'; content: AISolveResponse; timestamp: Date }