-- =====================================================
-- Pandeum - Esquema de Base de Datos (PostgreSQL)
-- Fase 2: MVP v2.2
-- =====================================================

-- Extensión para UUID (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Usuarios (clientes, proveedores, admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- NULL si es OAuth
    oauth_provider TEXT,
    oauth_id TEXT,
    full_name TEXT,
    city TEXT,
    is_provider BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Proveedores (extiende users)
CREATE TABLE providers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Technology', 'Education', 'Home Services'
    subcategory TEXT,
    description TEXT,
    avatar_url TEXT,
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    trust_score DECIMAL(5,2) DEFAULT 0.0, -- 0-100
    trust_factors JSONB DEFAULT '{}', -- { "antiguedad_dias": 0, "tasa_respuesta": 0, "clientes_satisfechos": 0, "verificacion": "none", "reseñas_validas": 0 }
    price_min INT,
    price_max INT,
    location_lat NUMERIC(10,7),
    location_lng NUMERIC(10,7),
    availability_json JSONB, -- horarios
    portfolio JSONB DEFAULT '[]', -- array de URLs
    response_time_hours DECIMAL(5,2), -- promedio
    available_now BOOLEAN DEFAULT false,
    cases_resolved_similar INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Servicios específicos de cada proveedor
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_estimate TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reseñas (con soporte antifraude futuro)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    -- Prevención de fraude (campos preparados)
    reviewer_ip TEXT,              -- se puede hashear en producción
    reviewer_user_agent TEXT,
    fraud_risk_flags JSONB DEFAULT '{}',
    review_verification_status TEXT DEFAULT 'pending' -- 'pending', 'verified', 'flagged'
);

-- Conversaciones (resultados de IA)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_text TEXT NOT NULL,
    ai_response JSONB NOT NULL, -- respuesta completa de Gemini (incluye diagnosis, soluciones, confidence_score)
    ai_confidence_score DECIMAL(3,2), -- 0-1
    category TEXT,
    subcategory TEXT,
    urgency TEXT, -- 'low', 'medium', 'high'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historial de casos (resolución real)
CREATE TABLE case_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    problem_text TEXT,
    diagnosis JSONB,
    instant_solutions_attempted JSONB DEFAULT '[]',
    chosen_solution_type TEXT, -- 'instant', 'provider', 'product', 'composite'
    resolution_status TEXT, -- 'resolved', 'partial', 'unresolved'
    resolution_feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Métricas de tiempo hasta resolución (Time To Solution)
CREATE TABLE resolution_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_history_id UUID REFERENCES case_history(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_contact_at TIMESTAMP,
    solution_reported_at TIMESTAMP,
    time_to_solution_hours NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Favoritos
CREATE TABLE favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, provider_id)
);

-- Feedback de recomendaciones (para aprendizaje)
CREATE TABLE recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    user_clicked BOOLEAN DEFAULT false,
    user_hired BOOLEAN DEFAULT false,
    review_left BOOLEAN DEFAULT false,
    user_returned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lista de espera (cuando no hay proveedores)
CREATE TABLE waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_category TEXT,
    subcategory TEXT,
    notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Memoria contextual del usuario (Pandeum Memory)
CREATE TABLE user_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    context_data JSONB DEFAULT '{}', -- { "known_devices": [], "preferred_categories": [], "budget_range": [], ... }
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recursos externos para Plan B
CREATE TABLE external_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT,
    subcategory TEXT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    resource_type TEXT, -- 'guide', 'video', 'article'
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES Y RESTRICCIONES ADICIONALES
-- =====================================================

CREATE INDEX idx_providers_category ON providers(category);
CREATE INDEX idx_providers_location ON providers(location_lat, location_lng);
CREATE INDEX idx_providers_trust_score ON providers(trust_score DESC);
CREATE INDEX idx_reviews_provider ON reviews(provider_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX idx_case_history_user ON case_history(user_id);
CREATE INDEX idx_resolution_metrics_case ON resolution_metrics(case_history_id);

-- =====================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();