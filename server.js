require('dotenv').config();

const express = require('express');
const path    = require('path');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { Users, Orders, Coupons, orderNumber } = require('./db');

const app        = express();
const PORT       = process.env.PORT || 3000;
const ROOT       = path.join(__dirname, 'public');
const JWT_SECRET = process.env.JWT_SECRET || 'fuelhaus_jwt_2025_secret';

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
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

// ── Páginas ──────────────────────────────────────────────────────────────────

app.get('/login', (_req, res) => res.sendFile(path.join(ROOT, 'login.html')));
app.get('/home',  (_req, res) => res.sendFile(path.join(ROOT, 'home.html')));

// ── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    if (password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    if (await Users.getByEmail(email))
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const user  = await Users.create({
      name: name.trim(), lastName: '', email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role: 'user', plan: null, status: 'pending', notes: '', phone: '',
    });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    const user = await Users.getByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await Users.getById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Cupones: validar (usuario) ───────────────────────────────────────────────

app.post('/api/coupons/validate', auth, async (req, res) => {
  try {
    const { code, plan } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Código requerido' });

    const all    = await Coupons.getAll();
    const coupon = all.find(c => c.code.toUpperCase() === code.toUpperCase() && c.active);
    if (!coupon) return res.status(404).json({ error: 'Cupón inválido o inactivo' });
    if (coupon.maxUses && coupon.uses >= coupon.maxUses)
      return res.status(400).json({ error: 'Este cupón ya alcanzó su límite de usos' });

    const basePrice = PLAN_PRICES[plan] || 0;
    const discount  = Math.round(basePrice * coupon.discountPercent / 100);
    const final     = basePrice - discount;

    res.json({ valid: true, coupon: { id: coupon.id, code: coupon.code, discountPercent: coupon.discountPercent }, discount, final });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Pedidos: crear (usuario) ──────────────────────────────────────────────────

app.post('/api/orders', auth, async (req, res) => {
  try {
    const { plan, lastName, phone, preferences, couponCode } = req.body || {};

    if (!plan || !PLAN_PRICES[plan]) return res.status(400).json({ error: 'Plan inválido' });
    if (!phone?.trim()) return res.status(400).json({ error: 'Número de WhatsApp requerido' });

    const user = await Users.getById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const basePrice = PLAN_PRICES[plan];
    let couponData  = null, discount = 0, finalPrice = basePrice;

    if (couponCode) {
      const all    = await Coupons.getAll();
      const coupon = all.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
      if (coupon && (!coupon.maxUses || coupon.uses < coupon.maxUses)) {
        discount   = Math.round(basePrice * coupon.discountPercent / 100);
        finalPrice = basePrice - discount;
        couponData = { id: coupon.id, code: coupon.code, discountPercent: coupon.discountPercent };
        await Coupons.update(coupon.id, { uses: coupon.uses + 1 });
      }
    }

    const firstName = req.body.name?.trim() || user.name;

    await Users.update(user.id, {
      name:     firstName,
      lastName: lastName?.trim() || user.lastName || '',
      phone:    phone.trim(),
      plan,
      status:   'active',
    });

    const order = await Orders.create({
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Pedidos: los míos (usuario) ───────────────────────────────────────────────

app.get('/api/orders/mine', auth, async (req, res) => {
  try {
    const myOrders = (await Orders.find(o => o.userId === req.user.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(o => ({ ...o, orderNumber: orderNumber(o.id) }));
    res.json({ orders: myOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Admin: Estadísticas ──────────────────────────────────────────────────────

app.get('/api/admin/stats', adminOnly, async (req, res) => {
  try {
    const usrs   = (await Users.getAll()).filter(u => u.role !== 'admin');
    const byPlan   = { structure: 0, performance: 0, full_system: 0, none: 0 };
    const byStatus = { active: 0, pending: 0, inactive: 0 };
    usrs.forEach(u => {
      const p = u.plan || 'none';
      if (p in byPlan) byPlan[p]++; else byPlan.none++;
      const s = u.status || 'pending';
      if (s in byStatus) byStatus[s]++; else byStatus.pending++;
    });
    res.json({ total: usrs.length, byPlan, byStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Admin: Usuarios ──────────────────────────────────────────────────────────

app.get('/api/admin/users', adminOnly, async (req, res) => {
  try {
    const list = (await Users.getAll()).filter(u => u.role !== 'admin').map(safeUser);
    res.json({ users: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/admin/users', adminOnly, async (req, res) => {
  try {
    const { name, email, password, plan, status, notes } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    if (await Users.getByEmail(email))
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    const user = await Users.create({
      name: name.trim(), lastName: '', email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role: 'user', plan: plan || null, status: status || 'pending', notes: notes || '', phone: '',
    });
    res.status(201).json({ user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/admin/users/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, password, plan, status, notes } = req.body || {};
    const existing = await Users.getById(id);
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });
    const conflict = await Users.getByEmail(email);
    if (conflict && conflict.id !== id)
      return res.status(409).json({ error: 'Ese email ya pertenece a otra cuenta' });
    const updates = {
      name:   name?.trim()               || existing.name,
      email:  email?.trim().toLowerCase() || existing.email,
      plan:   plan  || null,
      status: status || existing.status,
      notes:  notes  ?? existing.notes,
    };
    if (password) updates.passwordHash = await bcrypt.hash(password, 10);
    const updated = await Users.update(id, updates);
    res.json({ user: safeUser(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.delete('/api/admin/users/:id', adminOnly, async (req, res) => {
  try {
    const id   = parseInt(req.params.id);
    const user = await Users.getById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.role === 'admin') return res.status(403).json({ error: 'No se puede eliminar al administrador' });
    await Users.delete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Admin: Pedidos ───────────────────────────────────────────────────────────

app.get('/api/admin/orders', adminOnly, async (req, res) => {
  try {
    const list = (await Orders.getAll()).map(o => ({ ...o, orderNumber: orderNumber(o.id) }));
    res.json({ orders: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/admin/orders/unread', adminOnly, async (req, res) => {
  try {
    const count = (await Orders.find(o => !o.readByAdmin)).length;
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/admin/orders/:id', adminOnly, async (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const order = await Orders.getById(id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    const { status, readByAdmin } = req.body || {};
    const updates = {};
    if (status !== undefined)       updates.status      = status;
    if (readByAdmin !== undefined)  updates.readByAdmin = readByAdmin;
    const updated = await Orders.update(id, updates);
    res.json({ order: { ...updated, orderNumber: orderNumber(updated.id) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.delete('/api/admin/orders/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!(await Orders.getById(id))) return res.status(404).json({ error: 'Pedido no encontrado' });
    await Orders.delete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Admin: Cupones ───────────────────────────────────────────────────────────

app.get('/api/admin/coupons', adminOnly, async (req, res) => {
  try {
    res.json({ coupons: await Coupons.getAll() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/admin/coupons', adminOnly, async (req, res) => {
  try {
    const { code, discountPercent, maxUses } = req.body || {};
    if (!code?.trim() || !discountPercent)
      return res.status(400).json({ error: 'Código y descuento son obligatorios' });
    if (discountPercent < 1 || discountPercent > 100)
      return res.status(400).json({ error: 'El descuento debe ser entre 1 y 100' });
    const all    = await Coupons.getAll();
    const exists = all.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (exists) return res.status(409).json({ error: 'Ya existe un cupón con ese código' });
    const coupon = await Coupons.create({
      code: code.trim().toUpperCase(),
      discountPercent: parseInt(discountPercent),
      active: true,
      uses: 0,
      maxUses: maxUses ? parseInt(maxUses) : null,
    });
    res.status(201).json({ coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/admin/coupons/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const c  = await Coupons.getById(id);
    if (!c) return res.status(404).json({ error: 'Cupón no encontrado' });
    const { code, discountPercent, maxUses, active } = req.body || {};
    const updates = {};
    if (code)              updates.code            = code.trim().toUpperCase();
    if (discountPercent)   updates.discountPercent = parseInt(discountPercent);
    if (maxUses !== undefined) updates.maxUses     = maxUses ? parseInt(maxUses) : null;
    if (active  !== undefined) updates.active      = Boolean(active);
    res.json({ coupon: await Coupons.update(id, updates) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.delete('/api/admin/coupons/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!(await Coupons.getById(id))) return res.status(404).json({ error: 'Cupón no encontrado' });
    await Coupons.delete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Inicio (local) / Export (Vercel) ────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\x1b[32m%s\x1b[0m', `
  ╔════════════════════════════════════════╗
  ║      FUELHAUS — Sistema activo         ║
  ║                                        ║
  ║  Web:    http://localhost:${PORT}         ║
  ║  Home:   http://localhost:${PORT}/home    ║
  ║  Admin:  http://localhost:${PORT}/admin   ║
  ╚════════════════════════════════════════╝
  `);
  });
}

module.exports = app;
