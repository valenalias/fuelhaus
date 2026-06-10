const fs     = require('fs');
const path   = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function store(filename) {
  const file = path.join(DATA_DIR, filename);
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf8');

  const read  = () => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; } };
  const write = d  => fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  const maxId = l  => l.length ? Math.max(...l.map(x => x.id)) : 0;

  return {
    getAll:  ()   => read(),
    getById: (id) => read().find(x => x.id === id),
    find:    (fn) => read().filter(fn),
    create(data) {
      const list = read();
      const item = { ...data, id: maxId(list) + 1, createdAt: new Date().toISOString() };
      list.push(item);
      write(list);
      return item;
    },
    update(id, data) {
      const list = read();
      const idx  = list.findIndex(x => x.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      write(list);
      return list[idx];
    },
    delete(id) { write(read().filter(x => x.id !== id)); },
  };
}

// ── Stores ───────────────────────────────────────────────────────────────────

const Users   = store('users.json');
const Orders  = store('orders.json');
const Coupons = store('coupons.json');

Users.getByEmail = (email) =>
  Users.getAll().find(u => u.email.toLowerCase() === email.toLowerCase());

// Seed: admin por defecto
if (!Users.getAll().find(u => u.role === 'admin')) {
  Users.create({
    name: 'Admin', lastName: '', email: 'admin@fuelhaus.com',
    passwordHash: bcrypt.hashSync('Fuelhaus2025', 10),
    role: 'admin', plan: null, status: 'active', notes: '', phone: '',
  });
}

// Seed: cupón FULLHAUS (100% de descuento)
if (!Coupons.getAll().find(c => c.code === 'FULLHAUS')) {
  Coupons.create({ code: 'FULLHAUS', discountPercent: 100, active: true, uses: 0, maxUses: null });
}

function orderNumber(id) {
  return 'FH-' + String(id).padStart(4, '0');
}

module.exports = { Users, Orders, Coupons, orderNumber };
