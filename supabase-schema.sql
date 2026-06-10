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
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabla: cupones ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id               BIGSERIAL PRIMARY KEY,
  code             TEXT        UNIQUE NOT NULL,
  discount_percent INTEGER     NOT NULL,
  max_uses         INTEGER,
  uses             INTEGER     NOT NULL DEFAULT 0,
  active           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed: usuario administrador ───────────────────────────────────────────────
-- Contraseña: Fuelhaus2025
INSERT INTO users (name, last_name, email, password_hash, role, phone, plan, status, notes)
VALUES ('Admin', '', 'admin@fuelhaus.com', '$2b$10$bFglWOGU1uDonYOk4pHHlecRZ.SSrYNMKz0i6tcsDD.iTvorkqCZS', 'admin', '', NULL, 'active', '')
ON CONFLICT (email) DO NOTHING;

-- ── Seed: cupón FULLHAUS (100% de descuento) ─────────────────────────────────
INSERT INTO coupons (code, discount_percent, max_uses, uses, active)
VALUES ('FULLHAUS', 100, NULL, 0, TRUE)
ON CONFLICT (code) DO NOTHING;
