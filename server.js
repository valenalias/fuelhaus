const express = require('express');
const path    = require('path');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { Users, Orders, Coupons, orderNumber } = require('./db');

const app        = express();
const PORT       = 3000;
const ROOT       = path.join(__dirname, 'public');
const JWT_SECRET = 'fuelhaus_jwt_2025_secret';

const PLAN_PRICES = { structure: 120, performance: 190, full_system: 225 };

app.use(express.json());
app.use(express.static(ROOT));

// ── Middlewares ──────────────────────────────────────────────────────────────

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Sesión expirada' }); }
}

function adminOnly(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    next();
  });
}

function safeUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

// ── Páginas ──────────────────────────────────────────────────────────────────

app.get('/login', (_req, res) => res.sendFile(path.join(ROOT, 'login.html')));
app.get('/home',  (_req, res) => res.sendFile(path.join(ROOT, 'home.html')));

// ── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  if (password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  if (Users.getByEmail(email))
    return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

  const user = Users.create({
    name: name.trim(), lastName: '', email: email.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'user', plan: null, status: 'pending', notes: '', phone: '',
  });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: safeUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  const user = Users.getByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash))
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: safeUser(user) });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = Users.getById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user: safeUser(user) });
});

// ── Cupones: validar (usuario) ───────────────────────────────────────────────

app.post('/api/coupons/validate', auth, (req, res) => {
  const { code, plan } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Código requerido' });

  const coupon = Coupons.getAll().find(c => c.code.toUpperCase() === code.toUpperCase() && c.active);
  if (!coupon) return res.status(404).json({ error: 'Cupón inválido o inactivo' });
  if (coupon.maxUses && coupon.uses >= coupon.maxUses)
    return res.status(400).json({ error: 'Este cupón ya alcanzó su límite de usos' });

  const basePrice = PLAN_PRICES[plan] || 0;
  const discount  = Math.round(basePrice * coupon.discountPercent / 100);
  const final     = basePrice - discount;

  res.json({ valid: true, coupon: { id: coupon.id, code: coupon.code, discountPercent: coupon.discountPercent }, discount, final });
});

// ── Pedidos: crear (usuario) ──────────────────────────────────────────────────

app.post('/api/orders', auth, (req, res) => {
  const { plan, lastName, phone, preferences, couponCode } = req.body || {};

  if (!plan || !PLAN_PRICES[plan]) return res.status(400).json({ error: 'Plan inválido' });
  if (!phone?.trim()) return res.status(400).json({ error: 'Número de WhatsApp requerido' });

  const user      = Users.getById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const basePrice = PLAN_PRICES[plan];
  let couponData  = null, discount = 0, finalPrice = basePrice;

  if (couponCode) {
    const coupon = Coupons.getAll().find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (coupon) {
      if (!coupon.maxUses || coupon.uses < coupon.maxUses) {
        discount   = Math.round(basePrice * coupon.discountPercent / 100);
        finalPrice = basePrice - discount;
        couponData = { id: coupon.id, code: coupon.code, discountPercent: coupon.discountPercent };
        Coupons.update(coupon.id, { uses: coupon.uses + 1 });
      }
    }
  }

  const firstName = req.body.name?.trim() || user.name;

  // Actualizar datos del usuario
  Users.update(user.id, {
    name:     firstName,
    lastName: lastName?.trim() || user.lastName || '',
    phone:    phone.trim(),
    plan,
    status:   'active',
  });

  const order = Orders.create({
    userId:          user.id,
    userName:        firstName + (lastName ? ' ' + lastName.trim() : ''),
    userEmail:       user.email,
    userPhone:       phone.trim(),
    plan,
    planPrice:       basePrice,
    coupon:          couponData ? couponData.code : null,
    discountPercent: couponData ? couponData.discountPercent : 0,
    discountAmount:  discount,
    finalPrice,
    preferences:     preferences || {},
    status:          'paid',
    readByAdmin:     false,
  });

  res.status(201).json({ order: { ...order, orderNumber: orderNumber(order.id) } });
});

// ── Pedidos: los míos (usuario) ───────────────────────────────────────────────

app.get('/api/orders/mine', auth, (req, res) => {
  const myOrders = Orders.find(o => o.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(o => ({ ...o, orderNumber: orderNumber(o.id) }));
  res.json({ orders: myOrders });
});

// ── Admin: Estadísticas ──────────────────────────────────────────────────────

app.get('/api/admin/stats', adminOnly, (req, res) => {
  const usrs  = Users.getAll().filter(u => u.role !== 'admin');
  const byPlan   = { structure: 0, performance: 0, full_system: 0, none: 0 };
  const byStatus = { active: 0, pending: 0, inactive: 0 };
  usrs.forEach(u => {
    const p = u.plan || 'none';
    if (p in byPlan) byPlan[p]++; else byPlan.none++;
    const s = u.status || 'pending';
    if (s in byStatus) byStatus[s]++; else byStatus.pending++;
  });
  res.json({ total: usrs.length, byPlan, byStatus });
});

// ── Admin: Usuarios ──────────────────────────────────────────────────────────

app.get('/api/admin/users', adminOnly, (req, res) => {
  const list = Users.getAll()
    .filter(u => u.role !== 'admin')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(safeUser);
  res.json({ users: list });
});

app.post('/api/admin/users', adminOnly, (req, res) => {
  const { name, email, password, plan, status, notes } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  if (Users.getByEmail(email))
    return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
  const user = Users.create({
    name: name.trim(), lastName: '', email: email.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'user', plan: plan || null, status: status || 'pending', notes: notes || '', phone: '',
  });
  res.status(201).json({ user: safeUser(user) });
});

app.put('/api/admin/users/:id', adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, password, plan, status, notes } = req.body || {};
  const existing = Users.getById(id);
  if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });
  const conflict = Users.getByEmail(email);
  if (conflict && conflict.id !== id)
    return res.status(409).json({ error: 'Ese email ya pertenece a otra cuenta' });
  const updates = {
    name:   name?.trim()              || existing.name,
    email:  email?.trim().toLowerCase() || existing.email,
    plan:   plan  || null,
    status: status || existing.status,
    notes:  notes  ?? existing.notes,
  };
  if (password) updates.passwordHash = bcrypt.hashSync(password, 10);
  res.json({ user: safeUser(Users.update(id, updates)) });
});

app.delete('/api/admin/users/:id', adminOnly, (req, res) => {
  const id   = parseInt(req.params.id);
  const user = Users.getById(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.role === 'admin') return res.status(403).json({ error: 'No se puede eliminar al administrador' });
  Users.delete(id);
  res.json({ ok: true });
});

// ── Admin: Pedidos ───────────────────────────────────────────────────────────

app.get('/api/admin/orders', adminOnly, (req, res) => {
  const list = Orders.getAll()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(o => ({ ...o, orderNumber: orderNumber(o.id) }));
  res.json({ orders: list });
});

app.get('/api/admin/orders/unread', adminOnly, (req, res) => {
  const count = Orders.find(o => !o.readByAdmin).length;
  res.json({ count });
});

app.put('/api/admin/orders/:id', adminOnly, (req, res) => {
  const id    = parseInt(req.params.id);
  const order = Orders.getById(id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  const { status, readByAdmin } = req.body || {};
  const updates = {};
  if (status)           updates.status      = status;
  if (readByAdmin !== undefined) updates.readByAdmin = readByAdmin;
  const updated = Orders.update(id, updates);
  res.json({ order: { ...updated, orderNumber: orderNumber(updated.id) } });
});

app.delete('/api/admin/orders/:id', adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  if (!Orders.getById(id)) return res.status(404).json({ error: 'Pedido no encontrado' });
  Orders.delete(id);
  res.json({ ok: true });
});

// ── Admin: Cupones ───────────────────────────────────────────────────────────

app.get('/api/admin/coupons', adminOnly, (req, res) => {
  res.json({ coupons: Coupons.getAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.post('/api/admin/coupons', adminOnly, (req, res) => {
  const { code, discountPercent, maxUses } = req.body || {};
  if (!code?.trim() || !discountPercent)
    return res.status(400).json({ error: 'Código y descuento son obligatorios' });
  if (discountPercent < 1 || discountPercent > 100)
    return res.status(400).json({ error: 'El descuento debe ser entre 1 y 100' });
  const exists = Coupons.getAll().find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  if (exists) return res.status(409).json({ error: 'Ya existe un cupón con ese código' });
  const coupon = Coupons.create({
    code: code.trim().toUpperCase(),
    discountPercent: parseInt(discountPercent),
    active: true,
    uses: 0,
    maxUses: maxUses ? parseInt(maxUses) : null,
  });
  res.status(201).json({ coupon });
});

app.put('/api/admin/coupons/:id', adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  const c  = Coupons.getById(id);
  if (!c) return res.status(404).json({ error: 'Cupón no encontrado' });
  const { code, discountPercent, maxUses, active } = req.body || {};
  const updates = {};
  if (code)             updates.code            = code.trim().toUpperCase();
  if (discountPercent)  updates.discountPercent = parseInt(discountPercent);
  if (maxUses !== undefined) updates.maxUses    = maxUses ? parseInt(maxUses) : null;
  if (active  !== undefined) updates.active     = Boolean(active);
  res.json({ coupon: Coupons.update(id, updates) });
});

app.delete('/api/admin/coupons/:id', adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  if (!Coupons.getById(id)) return res.status(404).json({ error: 'Cupón no encontrado' });
  Coupons.delete(id);
  res.json({ ok: true });
});

// ── Inicio ───────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log('\x1b[32m%s\x1b[0m', `
  ╔════════════════════════════════════════╗
  ║      FUELHAUS — Sistema activo         ║
  ║                                        ║
  ║  Web:    http://localhost:${PORT}         ║
  ║  Home:   http://localhost:${PORT}/home    ║
  ║  Admin:  http://localhost:${PORT}/admin   ║
  ║                                        ║
  ║  Admin: admin@fuelhaus.com             ║
  ║  Pass:  Fuelhaus2025                   ║
  ╚════════════════════════════════════════╝
  `);
});
