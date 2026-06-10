/* ════════════════════════════════════════════════════════
   FUELHAUS Admin — JavaScript
════════════════════════════════════════════════════════ */

const API  = '';   // mismo origen
let allUsers = []; // cache de usuarios

/* ── Helpers ────────────────────────────────────────────────────────────────
*/

function token() {
  return localStorage.getItem('fh_token') || '';
}

function authHeader() {
  return { 'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json' };
}

async function apiFetch(method, path, body) {
  const opts = { method, headers: authHeader() };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(API + path, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

function redirect(url) { window.location.href = url; }

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const PLAN_LABELS = {
  structure:   'Structure',
  performance: 'Performance',
  full_system: 'Full System',
  '':           'Sin plan',
  null:         'Sin plan',
};
const STATUS_LABELS = {
  active:   'Activo',
  pending:  'Pendiente',
  inactive: 'Inactivo',
};

function planBadge(plan) {
  const key   = plan || 'none';
  const label = PLAN_LABELS[plan] || 'Sin plan';
  return `<span class="badge badge-${key}">${label}</span>`;
}

function statusBadge(status) {
  const s     = status || 'pending';
  const label = STATUS_LABELS[s] || s;
  return `<span class="badge badge-${s}">${label}</span>`;
}

function userInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/* ── Autenticación ──────────────────────────────────────────────────────────
*/

async function checkAuth() {
  if (!token()) return redirect('/login');
  const { ok, data } = await apiFetch('GET', '/api/auth/me');
  if (!ok || !data.user || data.user.role !== 'admin') return redirect('/login');
  document.getElementById('admin-name').textContent   = data.user.name;
  document.getElementById('admin-avatar').textContent = userInitials(data.user.name);
}

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('fh_token');
  localStorage.removeItem('fh_user');
  redirect('/login');
});

/* ── Navegación ─────────────────────────────────────────────────────────────
*/

const sectionTitles = { dashboard: 'Dashboard', users: 'Clientes', orders: 'Pedidos', coupons: 'Cupones' };

function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-section]').forEach(n => n.classList.remove('active'));

  const section = document.getElementById('section-' + name);
  const navItem = document.querySelector('.nav-item[data-section="' + name + '"]');
  if (section) section.classList.add('active');
  if (navItem) navItem.classList.add('active');

  document.getElementById('topbar-title').textContent = sectionTitles[name] || '';
  closeSidebar();
}

document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const s = btn.dataset.section;
    showSection(s);
    if (s === 'users')   renderUsersTable();
    if (s === 'orders')  { loadOrders(); markOrdersRead(); }
    if (s === 'coupons') loadCoupons();
  });
});

document.querySelectorAll('.btn-link[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    showSection(btn.dataset.section);
    if (btn.dataset.section === 'users') renderUsersTable();
  });
});

/* ── Sidebar móvil ──────────────────────────────────────────────────────────
*/

const backdrop = document.createElement('div');
backdrop.className = 'sidebar-backdrop';
document.body.appendChild(backdrop);

document.getElementById('hamburger-btn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('open');
  backdrop.classList.add('visible');
});
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  backdrop.classList.remove('visible');
}
backdrop.addEventListener('click', closeSidebar);

/* ── Dashboard: Stats ───────────────────────────────────────────────────────
*/

async function loadStats() {
  const { ok, data } = await apiFetch('GET', '/api/admin/stats');
  if (!ok) return;

  document.getElementById('s-total').textContent    = data.total;
  document.getElementById('s-active').textContent   = data.byStatus.active   || 0;
  document.getElementById('s-pending').textContent  = data.byStatus.pending  || 0;
  document.getElementById('s-inactive').textContent = data.byStatus.inactive || 0;

  document.getElementById('s-structure').textContent   = data.byPlan.structure   || 0;
  document.getElementById('s-performance').textContent = data.byPlan.performance || 0;
  document.getElementById('s-full_system').textContent = data.byPlan.full_system || 0;
  document.getElementById('s-none').textContent        = data.byPlan.none        || 0;
}

/* ── Usuarios ───────────────────────────────────────────────────────────────
*/

async function loadUsers() {
  const { ok, data } = await apiFetch('GET', '/api/admin/users');
  if (!ok) return;
  allUsers = data.users || [];
  renderRecentTable();
  renderUsersTable();
}

function renderRecentTable() {
  const tbody   = document.getElementById('recent-tbody');
  const recent  = allUsers.slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:1.5rem">Sin clientes aún</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(u => `
    <tr>
      <td><div class="user-cell">
        <div class="user-avatar">${userInitials(u.name)}</div>
        <span class="user-name">${escapeHtml(u.name)}</span>
      </div></td>
      <td style="color:var(--gray)">${escapeHtml(u.email)}</td>
      <td>${planBadge(u.plan)}</td>
      <td>${statusBadge(u.status)}</td>
      <td class="date-cell">${formatDate(u.createdAt)}</td>
    </tr>
  `).join('');
}

function getFilteredUsers() {
  const search = (document.getElementById('search-input')?.value || '').toLowerCase();
  const plan   = document.getElementById('filter-plan')?.value   || '';
  const status = document.getElementById('filter-status')?.value || '';

  return allUsers.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
    const matchPlan   = !plan   || (plan === 'none' ? !u.plan : u.plan === plan);
    const matchStatus = !status || u.status === status;
    return matchSearch && matchPlan && matchStatus;
  });
}

function renderUsersTable() {
  const tbody    = document.getElementById('users-tbody');
  const empty    = document.getElementById('empty-state');
  const counter  = document.getElementById('users-count');
  const filtered = getFilteredUsers();

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    counter.textContent = '';
    return;
  }

  empty.style.display = 'none';
  counter.textContent  = filtered.length + ' cliente' + (filtered.length !== 1 ? 's' : '');

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td><div class="user-cell">
        <div class="user-avatar">${userInitials(u.name)}</div>
        <span class="user-name">${escapeHtml(u.name)}</span>
      </div></td>
      <td style="color:var(--gray);font-size:0.85rem">${escapeHtml(u.email)}</td>
      <td>${planBadge(u.plan)}</td>
      <td>${statusBadge(u.status)}</td>
      <td class="date-cell">${formatDate(u.createdAt)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-action" title="Editar" onclick="openModal(${u.id})">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-action delete" title="Eliminar" onclick="deleteUser(${u.id}, '${escapeHtml(u.name)}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Filtros en tiempo real
['search-input', 'filter-plan', 'filter-status'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', renderUsersTable);
});

/* ── Modal: Abrir / Cerrar ──────────────────────────────────────────────────
*/

function openModal(userId = null) {
  const overlay  = document.getElementById('modal-overlay');
  const title    = document.getElementById('modal-title');
  const form     = document.getElementById('user-form');
  const passHint = document.getElementById('pass-hint');
  const passField= document.getElementById('u-pass');

  clearModalError();
  form.reset();
  document.getElementById('user-id').value = '';

  if (userId) {
    const u = allUsers.find(x => x.id === userId);
    if (!u) return;
    title.textContent = 'Editar cliente';
    document.getElementById('user-id').value    = u.id;
    document.getElementById('u-name').value     = u.name;
    document.getElementById('u-email').value    = u.email;
    document.getElementById('u-plan').value     = u.plan || '';
    document.getElementById('u-status').value   = u.status || 'pending';
    document.getElementById('u-notes').value    = u.notes || '';
    passField.placeholder = '••••••••';
    passField.required    = false;
    passHint.style.display = 'block';
  } else {
    title.textContent = 'Nuevo cliente';
    document.getElementById('u-status').value = 'pending';
    passField.required    = true;
    passField.placeholder = 'Mínimo 6 caracteres';
    passHint.style.display = 'none';
  }

  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

document.getElementById('modal-close').addEventListener('click',  closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});
document.getElementById('new-user-btn').addEventListener('click', () => openModal());

function clearModalError() {
  const el = document.getElementById('modal-error');
  el.textContent = '';
  el.classList.remove('visible');
}
function showModalError(msg) {
  const el = document.getElementById('modal-error');
  el.textContent = msg;
  el.classList.add('visible');
}

/* ── Modal: Submit ──────────────────────────────────────────────────────────
*/

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearModalError();

  const saveBtn  = document.getElementById('modal-save');
  saveBtn.disabled = true;
  const origText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…';

  const id       = document.getElementById('user-id').value;
  const name     = document.getElementById('u-name').value.trim();
  const email    = document.getElementById('u-email').value.trim();
  const password = document.getElementById('u-pass').value;
  const plan     = document.getElementById('u-plan').value;
  const status   = document.getElementById('u-status').value;
  const notes    = document.getElementById('u-notes').value.trim();

  const body = { name, email, plan, status, notes };
  if (password) body.password = password;

  let result;
  if (id) {
    result = await apiFetch('PUT', `/api/admin/users/${id}`, body);
  } else {
    if (!password) {
      showModalError('La contraseña es obligatoria para nuevos clientes');
      saveBtn.disabled = false;
      saveBtn.innerHTML = origText;
      return;
    }
    result = await apiFetch('POST', '/api/admin/users', body);
  }

  saveBtn.disabled = false;
  saveBtn.innerHTML = origText;

  if (!result.ok) {
    showModalError(result.data.error || 'Error al guardar');
    return;
  }

  closeModal();
  showToast(id ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
  await loadUsers();
  await loadStats();
});

/* ── Eliminar usuario ───────────────────────────────────────────────────────
*/

async function deleteUser(id, name) {
  if (!confirm(`¿Eliminar al cliente "${name}"? Esta acción no se puede deshacer.`)) return;

  const { ok, data } = await apiFetch('DELETE', `/api/admin/users/${id}`);
  if (!ok) {
    showToast(data.error || 'Error al eliminar', true);
    return;
  }

  showToast(`"${name}" eliminado`);
  await loadUsers();
  await loadStats();
}

/* ── XSS: escapar HTML ──────────────────────────────────────────────────────
*/

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════════════════════════════
   PEDIDOS
════════════════════════════════════════════════════════ */

const ORDER_STATUS_LABELS  = { paid: 'Pagado', processing: 'En proceso', delivered: 'Entregado', cancelled: 'Cancelado' };
const PLAN_NAMES_ADMIN     = { structure: 'Structure', performance: 'Performance', full_system: 'Full System' };
const GOAL_NAMES_ADMIN     = { fat_loss: 'Perder grasa', muscle_gain: 'Ganar músculo', maintenance: 'Mantenerme', healthy: 'Comer saludable' };
const DIET_NAMES_ADMIN     = { none: 'Sin preferencia', high_protein: 'Alta proteína', low_carb: 'Baja en carbos', keto: 'Keto', vegan: 'Vegano', vegetarian: 'Vegetariano', paleo: 'Paleo', mediterranean: 'Mediterránea' };

let allOrders  = [];
let editingOrderId = null;

async function loadOrders() {
  const { ok, data } = await apiFetch('GET', '/api/admin/orders');
  if (!ok) return;
  allOrders = data.orders || [];
  renderOrderStats();
  renderOrdersTable();
}

function renderOrderStats() {
  const counts = { paid: 0, processing: 0, delivered: 0, cancelled: 0 };
  allOrders.forEach(o => { if (o.status in counts) counts[o.status]++; });
  document.getElementById('os-total').textContent     = allOrders.length;
  document.getElementById('os-paid').textContent      = counts.paid;
  document.getElementById('os-processing').textContent= counts.processing;
  document.getElementById('os-delivered').textContent = counts.delivered;
}

function getFilteredOrders() {
  const search = (document.getElementById('order-search')?.value || '').toLowerCase();
  const status = document.getElementById('order-filter-status')?.value || '';
  return allOrders.filter(o => {
    const matchS = !search || o.orderNumber?.toLowerCase().includes(search) ||
      o.userName?.toLowerCase().includes(search) || o.userEmail?.toLowerCase().includes(search);
    const matchSt = !status || o.status === status;
    return matchS && matchSt;
  });
}

function renderOrdersTable() {
  const tbody   = document.getElementById('orders-tbody');
  const empty   = document.getElementById('orders-empty');
  const counter = document.getElementById('orders-count-footer');
  const filtered = getFilteredOrders();

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    counter.textContent = '';
    return;
  }
  empty.style.display = 'none';
  counter.textContent = filtered.length + ' pedido' + (filtered.length !== 1 ? 's' : '');

  tbody.innerHTML = filtered.map(o => `
    <tr class="${!o.readByAdmin ? 'new-row' : ''}">
      <td style="font-weight:700;font-family:monospace">${escapeHtml(o.orderNumber)}${!o.readByAdmin ? ' <span style="background:#e74c3c;color:#fff;font-size:0.6rem;padding:0.1rem 0.4rem;border-radius:4px;font-family:sans-serif">Nuevo</span>' : ''}</td>
      <td><div class="user-cell"><div class="user-avatar">${userInitials(o.userName)}</div><div><div class="user-name">${escapeHtml(o.userName)}</div><div style="font-size:0.78rem;color:var(--gray)">${escapeHtml(o.userEmail)}</div></div></div></td>
      <td>${planBadge(o.plan)}</td>
      <td style="font-weight:700">$${o.finalPrice}</td>
      <td style="font-size:0.8rem;color:var(--gray)">${o.coupon ? '<span style="font-family:monospace;font-weight:700;color:var(--dark-green)">' + escapeHtml(o.coupon) + '</span> (−' + o.discountPercent + '%)' : '—'}</td>
      <td><span class="badge badge-order-${escapeHtml(o.status)}">${ORDER_STATUS_LABELS[o.status] || o.status}</span></td>
      <td class="date-cell">${formatDate(o.createdAt)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-action" title="Ver detalle" onclick="openOrderDetail(${o.id})"><i class="fa-solid fa-eye"></i></button>
          <button class="btn-action delete" title="Eliminar" onclick="deleteOrder(${o.id}, '${escapeHtml(o.orderNumber)}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

['order-search', 'order-filter-status'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', renderOrdersTable);
});

async function markOrdersRead() {
  const unread = allOrders.filter(o => !o.readByAdmin);
  await Promise.all(unread.map(o => apiFetch('PUT', '/api/admin/orders/' + o.id, { readByAdmin: true })));
  allOrders = allOrders.map(o => ({ ...o, readByAdmin: true }));
  updateOrdersBadge(0);
}

function updateOrdersBadge(count) {
  const badge = document.getElementById('orders-badge');
  if (count > 0) { badge.textContent = count; badge.style.display = 'inline-block'; }
  else           { badge.style.display = 'none'; }
}

async function refreshOrdersBadge() {
  const { ok, data } = await apiFetch('GET', '/api/admin/orders/unread');
  if (ok) updateOrdersBadge(data.count);
}

/* ── Detalle de pedido ───────────────────────────────────────────────────────
*/

function openOrderDetail(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;
  editingOrderId = id;

  document.getElementById('order-modal-title').textContent = 'Pedido ' + order.orderNumber;
  const prefs = order.preferences || {};
  const waLink = 'https://api.whatsapp.com/send?phone=' + (order.userPhone || '').replace(/\D/g,'') + '&text=Hola+' + encodeURIComponent(order.userName);

  document.getElementById('order-modal-body').innerHTML = `
    <div class="od-section">
      <h4>Cliente</h4>
      <div class="od-grid">
        <div class="od-item"><span class="od-label">Nombre</span><span class="od-value">${escapeHtml(order.userName)}</span></div>
        <div class="od-item"><span class="od-label">Email</span><span class="od-value">${escapeHtml(order.userEmail)}</span></div>
        <div class="od-item full"><span class="od-label">WhatsApp</span><span class="od-value"><a href="${waLink}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> ${escapeHtml(order.userPhone || '—')}</a></span></div>
      </div>
    </div>
    <div class="od-section">
      <h4>Pedido</h4>
      <div class="od-grid">
        <div class="od-item"><span class="od-label">Plan</span><span class="od-value">${PLAN_NAMES_ADMIN[order.plan] || order.plan}</span></div>
        <div class="od-item"><span class="od-label">Precio base</span><span class="od-value">$${order.planPrice}/sem</span></div>
        ${order.coupon ? `<div class="od-item"><span class="od-label">Cupón</span><span class="od-value" style="font-family:monospace;font-weight:700">${escapeHtml(order.coupon)} (−${order.discountPercent}%)</span></div>` : ''}
        <div class="od-item"><span class="od-label">Total abonado</span><span class="od-value" style="font-weight:800;font-size:1rem">$${order.finalPrice}/sem</span></div>
      </div>
    </div>
    <div class="od-section">
      <h4>Preferencias</h4>
      <div class="od-grid">
        <div class="od-item"><span class="od-label">Objetivo</span><span class="od-value">${GOAL_NAMES_ADMIN[prefs.goal] || prefs.goal || '—'}</span></div>
        <div class="od-item"><span class="od-label">Dieta</span><span class="od-value">${DIET_NAMES_ADMIN[prefs.diet] || prefs.diet || '—'}</span></div>
        <div class="od-item full"><span class="od-label">Alergias / restricciones</span><span class="od-value">${escapeHtml(prefs.allergies || 'Ninguna')}</span></div>
        <div class="od-item full"><span class="od-label">Alimentos a evitar</span><span class="od-value">${escapeHtml(prefs.avoid || 'Ninguno')}</span></div>
      </div>
    </div>
    <div class="od-section">
      <div class="od-status-wrap">
        <label>Estado del pedido</label>
        <select id="od-status-select">
          <option value="paid"       ${order.status==='paid'       ?'selected':''}>Pagado</option>
          <option value="processing" ${order.status==='processing' ?'selected':''}>En proceso</option>
          <option value="delivered"  ${order.status==='delivered'  ?'selected':''}>Entregado</option>
          <option value="cancelled"  ${order.status==='cancelled'  ?'selected':''}>Cancelado</option>
        </select>
      </div>
    </div>
  `;

  document.getElementById('order-overlay').classList.add('open');
}

document.getElementById('order-modal-close').addEventListener('click',  () => document.getElementById('order-overlay').classList.remove('open'));
document.getElementById('order-modal-cancel').addEventListener('click', () => document.getElementById('order-overlay').classList.remove('open'));
document.getElementById('order-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('order-overlay')) document.getElementById('order-overlay').classList.remove('open');
});

document.getElementById('od-save-btn').addEventListener('click', async () => {
  if (!editingOrderId) return;
  const status  = document.getElementById('od-status-select').value;
  const { ok, data } = await apiFetch('PUT', '/api/admin/orders/' + editingOrderId, { status });
  if (!ok) { showToast(data.error || 'Error al guardar', true); return; }
  document.getElementById('order-overlay').classList.remove('open');
  showToast('Estado actualizado');
  await loadOrders();
});

document.getElementById('od-delete-btn').addEventListener('click', async () => {
  if (!editingOrderId) return;
  const order = allOrders.find(o => o.id === editingOrderId);
  if (!confirm('¿Eliminar el pedido ' + (order?.orderNumber || '') + '? Esta acción no se puede deshacer.')) return;
  const { ok, data } = await apiFetch('DELETE', '/api/admin/orders/' + editingOrderId);
  if (!ok) { showToast(data.error || 'Error al eliminar', true); return; }
  document.getElementById('order-overlay').classList.remove('open');
  showToast('Pedido eliminado');
  await loadOrders();
});

async function deleteOrder(id, num) {
  if (!confirm('¿Eliminar el pedido ' + num + '?')) return;
  const { ok, data } = await apiFetch('DELETE', '/api/admin/orders/' + id);
  if (!ok) { showToast(data.error || 'Error al eliminar', true); return; }
  showToast('Pedido eliminado');
  await loadOrders();
}

/* ════════════════════════════════════════════════════════
   CUPONES
════════════════════════════════════════════════════════ */

let allCoupons = [];
let editingCouponId = null;

async function loadCoupons() {
  const { ok, data } = await apiFetch('GET', '/api/admin/coupons');
  if (!ok) return;
  allCoupons = data.coupons || [];
  renderCouponsTable();
}

function renderCouponsTable() {
  const tbody = document.getElementById('coupons-tbody');
  const empty = document.getElementById('coupons-empty');
  if (allCoupons.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = allCoupons.map(c => `
    <tr>
      <td class="coupon-code-cell">${escapeHtml(c.code)}</td>
      <td style="font-weight:700">${c.discountPercent}%</td>
      <td>${c.uses}</td>
      <td>${c.maxUses || '∞ Ilimitado'}</td>
      <td><span class="${c.active ? 'badge-coupon-active' : 'badge-coupon-inactive'}">${c.active ? 'Activo' : 'Inactivo'}</span></td>
      <td class="date-cell">${formatDate(c.createdAt)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-action" title="Editar" onclick="openCouponModal(${c.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-toggle" onclick="toggleCoupon(${c.id})">${c.active ? 'Desactivar' : 'Activar'}</button>
          <button class="btn-action delete" title="Eliminar" onclick="deleteCoupon(${c.id}, '${escapeHtml(c.code)}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openCouponModal(id = null) {
  const form = document.getElementById('coupon-form');
  form.reset();
  document.getElementById('c-id').value = '';
  document.getElementById('coupon-error').textContent = '';
  document.getElementById('coupon-error').classList.remove('visible');

  if (id) {
    const c = allCoupons.find(x => x.id === id);
    if (!c) return;
    editingCouponId = id;
    document.getElementById('coupon-modal-title').textContent = 'Editar cupón';
    document.getElementById('c-id').value       = c.id;
    document.getElementById('c-code').value     = c.code;
    document.getElementById('c-discount').value = c.discountPercent;
    document.getElementById('c-maxuses').value  = c.maxUses || '';
  } else {
    editingCouponId = null;
    document.getElementById('coupon-modal-title').textContent = 'Nuevo cupón';
  }
  document.getElementById('coupon-overlay').classList.add('open');
}

document.getElementById('new-coupon-btn').addEventListener('click', () => openCouponModal());
document.getElementById('coupon-modal-close').addEventListener('click',  () => document.getElementById('coupon-overlay').classList.remove('open'));
document.getElementById('coupon-modal-cancel').addEventListener('click', () => document.getElementById('coupon-overlay').classList.remove('open'));
document.getElementById('coupon-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('coupon-overlay')) document.getElementById('coupon-overlay').classList.remove('open');
});

document.getElementById('coupon-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl  = document.getElementById('coupon-error');
  errEl.textContent = ''; errEl.classList.remove('visible');
  const saveBtn = document.getElementById('coupon-save');
  saveBtn.disabled = true;

  const id          = document.getElementById('c-id').value;
  const code        = document.getElementById('c-code').value.trim().toUpperCase();
  const discount    = parseInt(document.getElementById('c-discount').value);
  const maxUses     = parseInt(document.getElementById('c-maxuses').value) || 0;

  if (!code || !discount) {
    errEl.textContent = 'Código y descuento son obligatorios';
    errEl.classList.add('visible');
    saveBtn.disabled = false;
    return;
  }

  const body = { code, discountPercent: discount, maxUses: maxUses || null };
  const { ok, data } = id
    ? await apiFetch('PUT', '/api/admin/coupons/' + id, body)
    : await apiFetch('POST', '/api/admin/coupons', body);

  saveBtn.disabled = false;
  if (!ok) { errEl.textContent = data.error || 'Error al guardar'; errEl.classList.add('visible'); return; }

  document.getElementById('coupon-overlay').classList.remove('open');
  showToast(id ? 'Cupón actualizado' : 'Cupón creado');
  await loadCoupons();
});

async function toggleCoupon(id) {
  const c = allCoupons.find(x => x.id === id);
  if (!c) return;
  const { ok, data } = await apiFetch('PUT', '/api/admin/coupons/' + id, { active: !c.active });
  if (!ok) { showToast(data.error || 'Error', true); return; }
  showToast(data.coupon.active ? 'Cupón activado' : 'Cupón desactivado');
  await loadCoupons();
}

async function deleteCoupon(id, code) {
  if (!confirm('¿Eliminar el cupón "' + code + '"?')) return;
  const { ok, data } = await apiFetch('DELETE', '/api/admin/coupons/' + id);
  if (!ok) { showToast(data.error || 'Error al eliminar', true); return; }
  showToast('Cupón "' + code + '" eliminado');
  await loadCoupons();
}

/* ── Init ───────────────────────────────────────────────────────────────────
*/

(async function init() {
  await checkAuth();
  showSection('dashboard');
  await Promise.all([loadStats(), loadUsers(), refreshOrdersBadge()]);
})();
