-- ╔══════════════════════════════════════════╗
-- ║   FUELHAUS — Esquema de base de datos    ║
-- ║   Ejecutar en: Supabase SQL Editor       ║
-- ╚══════════════════════════════════════════╝

-- ── Tabla: usuarios ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT        NOT NULL DEFAULT '',
  last_name     TEXT        NOT NULL DEFAULT '',
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'user',
  phone         TEXT        NOT NULL DEFAULT '',
  plan          TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending',
  notes         TEXT        NOT NULL DEFAULT '',
  stripe_customer_id                TEXT,
  stripe_subscription_id            TEXT,
  subscription_status               TEXT,
  subscription_current_period_end   TIMESTAMPTZ,
  subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabla: pedidos ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT      REFERENCES users(id) ON DELETE SET NULL,
  user_name        TEXT        NOT NULL DEFAULT '',
  user_email       TEXT        NOT NULL DEFAULT '',
  user_phone       TEXT        NOT NULL DEFAULT '',
  plan             TEXT        NOT NULL,
  plan_price       NUMERIC     NOT NULL DEFAULT 0,
  coupon           TEXT,
  discount_percent INTEGER     NOT NULL DEFAULT 0,
  discount_amount  NUMERIC     NOT NULL DEFAULT 0,
  final_price      NUMERIC     NOT NULL DEFAULT 0,
  preferences      JSONB       NOT NULL DEFAULT '{}',
  status           TEXT        NOT NULL DEFAULT 'paid',
  read_by_admin    BOOLEAN     NOT NULL DEFAULT FALSE,
  stripe_session_id        TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id        TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabla: cupones ───────────────────────────────────────────────────────────
-- discount_type: 'percent' (discount_value 1-100) o 'fixed' (discount_value
-- en dólares). min_order_amount es opcional: si está seteado, el cupón solo
-- aplica cuando el precio del plan sea igual o mayor a ese monto.
CREATE TABLE IF NOT EXISTS coupons (
  id                BIGSERIAL PRIMARY KEY,
  code              TEXT        UNIQUE NOT NULL,
  discount_type     TEXT        NOT NULL DEFAULT 'percent',
  discount_value    NUMERIC     NOT NULL,
  min_order_amount  NUMERIC,
  max_uses          INTEGER,
  uses              INTEGER     NOT NULL DEFAULT 0,
  active            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed: usuario administrador ───────────────────────────────────────────────
-- Contraseña: Fuelhaus2025
INSERT INTO users (name, last_name, email, password_hash, role, phone, plan, status, notes)
VALUES ('Admin', '', 'admin@fuelhaus.com', '$2b$10$bFglWOGU1uDonYOk4pHHlecRZ.SSrYNMKz0i6tcsDD.iTvorkqCZS', 'admin', '', NULL, 'active', '')
ON CONFLICT (email) DO NOTHING;

-- ── Seed: cupón FULLHAUS (100% de descuento) ─────────────────────────────────
INSERT INTO coupons (code, discount_type, discount_value, max_uses, uses, active)
VALUES ('FULLHAUS', 'percent', 100, NULL, 0, TRUE)
ON CONFLICT (code) DO NOTHING;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  MIGRACIÓN (correr esto en la base ya existente en Supabase, no   ║
-- ║  hace falta tocar nada más de lo de arriba — CREATE TABLE IF NOT  ║
-- ║  EXISTS no toca la tabla que ya existe)                           ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- ALTER TABLE coupons RENAME COLUMN discount_percent TO discount_value;
-- ALTER TABLE coupons ALTER COLUMN discount_value TYPE NUMERIC;
-- ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percent';
-- ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC;

-- Autopay semanal (suscripciones de Stripe) — correr también antes de deployar:
-- ALTER TABLE users  ADD COLUMN IF NOT EXISTS stripe_customer_id                  TEXT;
-- ALTER TABLE users  ADD COLUMN IF NOT EXISTS stripe_subscription_id              TEXT;
-- ALTER TABLE users  ADD COLUMN IF NOT EXISTS subscription_status                 TEXT;
-- ALTER TABLE users  ADD COLUMN IF NOT EXISTS subscription_current_period_end     TIMESTAMPTZ;
-- ALTER TABLE users  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end   BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_invoice_id                   TEXT UNIQUE;
