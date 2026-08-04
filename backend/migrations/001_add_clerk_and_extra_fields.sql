-- =====================================================
-- Pandeum - Migración 001 (idempotente)
-- Sincroniza el esquema real de la BD con los modelos ORM
-- (app/models.py) sin destruir datos existentes.
-- Uso: psql -d pandeum -f backend/migrations/001_....sql
-- Puede re-ejecutarse de forma segura (ADD COLUMN IF NOT EXISTS).
-- =====================================================

-- ---------- users ----------
-- Campos de integración con Clerk (auth única)
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'client';

CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_clerk_user_id ON users(clerk_user_id);

-- ---------- providers ----------
-- Campos de contacto, perfiles de marca y búsqueda avanzada
ALTER TABLE providers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS service_area TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS search_tags JSONB DEFAULT '[]';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS service_keywords JSONB DEFAULT '[]';

-- ---------- services ----------
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_min INT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_max INT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =====================================================
-- END MIGRATION 001
-- =====================================================