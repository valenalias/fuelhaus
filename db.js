const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Mapeo camelCase → snake_case para los campos que lo necesitan
const TO_SNAKE = {
  lastName:        'last_name',
  passwordHash:    'password_hash',
  planPrice:       'plan_price',
  discountPercent: 'discount_percent',
  discountAmount:  'discount_amount',
  finalPrice:      'final_price',
  readByAdmin:     'read_by_admin',
  maxUses:         'max_uses',
  userId:          'user_id',
  userName:        'user_name',
  userEmail:       'user_email',
  userPhone:       'user_phone',
  createdAt:       'created_at',
};

const FROM_SNAKE = Object.fromEntries(Object.entries(TO_SNAKE).map(([k, v]) => [v, k]));

function toSnake(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[TO_SNAKE[k] || k] = v;
  }
  return out;
}

function fromSnake(obj) {
  if (!obj) return null;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[FROM_SNAKE[k] || k] = v;
  }
  return out;
}

// ── Users ────────────────────────────────────────────────────────────────────

const Users = {
  async getAll() {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    return (data || []).map(fromSnake);
  },
  async getById(id) {
    const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    return fromSnake(data);
  },
  async getByEmail(email) {
    const { data } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
    return fromSnake(data);
  },
  async create(userData) {
    const { data, error } = await supabase.from('users').insert(toSnake(userData)).select().single();
    if (error) throw error;
    return fromSnake(data);
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('users').update(toSnake(updates)).eq('id', id).select().single();
    if (error) throw error;
    return fromSnake(data);
  },
  async delete(id) {
    await supabase.from('users').delete().eq('id', id);
  },
};

// ── Orders ───────────────────────────────────────────────────────────────────

const Orders = {
  async getAll() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    return (data || []).map(fromSnake);
  },
  async getById(id) {
    const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    return fromSnake(data);
  },
  async find(fn) {
    const all = await Orders.getAll();
    return all.filter(fn);
  },
  async create(orderData) {
    const { data, error } = await supabase.from('orders').insert(toSnake(orderData)).select().single();
    if (error) throw error;
    return fromSnake(data);
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('orders').update(toSnake(updates)).eq('id', id).select().single();
    if (error) throw error;
    return fromSnake(data);
  },
  async delete(id) {
    await supabase.from('orders').delete().eq('id', id);
  },
};

// ── Coupons ──────────────────────────────────────────────────────────────────

const Coupons = {
  async getAll() {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    return (data || []).map(fromSnake);
  },
  async getById(id) {
    const { data } = await supabase.from('coupons').select('*').eq('id', id).maybeSingle();
    return fromSnake(data);
  },
  async create(couponData) {
    const { data, error } = await supabase.from('coupons').insert(toSnake(couponData)).select().single();
    if (error) throw error;
    return fromSnake(data);
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('coupons').update(toSnake(updates)).eq('id', id).select().single();
    if (error) throw error;
    return fromSnake(data);
  },
  async delete(id) {
    await supabase.from('coupons').delete().eq('id', id);
  },
};

function orderNumber(id) {
  return 'FH-' + String(id).padStart(4, '0');
}

module.exports = { Users, Orders, Coupons, orderNumber };
