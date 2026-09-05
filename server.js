require('dotenv').config();

const express = require('express');
const path    = require('path');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Stripe  = require('stripe');
const { Users, Orders, Coupons, orderNumber } = require('./db');
const { MEALS, PLAN_MEAL_COUNTS } = require('./meals');

const app        = express();
const PORT       = process.env.PORT || 3000;
const ROOT       = path.join(__dirname, 'public');
const JWT_SECRET = process.env.JWT_SECRET || 'fuelhaus_jwt_2025_secret';

const PLAN_PRICES = { structure: 120, performance: 190, full_system: 225, full_week: 265 };
const PLAN_LABELS = { structure: 'Plan Structure', performance: 'Plan Performance', full_system: 'Plan Full System', full_week: 'Plan Full Week' };

const MEAL_BY_ID = Object.fromEntries(MEALS.map(m => [m.id, m]));

// Valida que la selección de "Build your week" sume exacto la cantidad de
// comidas del plan, con ids reales y cantidades enteras positivas.
function isValidMealSelection(plan, meals) {
  const required = PLAN_MEAL_COUNTS[plan];
  if (!required || !Array.isArray(meals) || meals.length === 0) return false;
  let total = 0;
  for (const m of meals) {
    if (!m || !MEAL_BY_ID[m.id] || !Number.isInteger(m.qty) || m.qty <= 0) return false;
    total += m.qty;
  }
  return total === required;
}

// Reconstruye la selección con el nombre canónico del catálogo (nunca el que
// mande el cliente) para que quede legible en el pedido guardado.
function resolveMealsForStorage(meals) {
  return (meals || [])
    .filter(m => m && MEAL_BY_ID[m.id] && Number.isInteger(m.qty) && m.qty > 0)
    .map(m => ({ id: m.id, name: MEAL_BY_ID[m.id].name, qty: m.qty }));
}

// Reconstruye preferencias + meals resueltos a partir de los campos JSON
// (truncados a 490 caracteres) guardados en el metadata de Stripe — mismo
// formato tanto en el metadata de la Checkout Session como en el de la
// suscripción, así que este parser sirve para los dos casos.
function parsePreferencesFromMeta(meta) {
  let preferences = {};
  try { preferences = meta.preferences ? JSON.parse(meta.preferences) : {}; } catch { /* corrupto: seguimos con {} */ }
  let meals = [];
  try { meals = meta.meals ? JSON.parse(meta.meals) : []; } catch { /* corrupto: seguimos con [] */ }
  return { ...preferences, meals: resolveMealsForStorage(meals) };
}

// Calcula el descuento en dólares de un cupón sobre el precio de un plan.
// Devuelve null si el cupón no aplica (no llega al monto mínimo de compra) —
// eso se trata igual que "cupón inválido" en los callers.
function calcCouponDiscount(coupon, basePrice) {
  if (coupon.minOrderAmount && basePrice < coupon.minOrderAmount) return null;
  if (coupon.discountType === 'fixed') return Math.min(coupon.discountValue, basePrice);
  return Math.round(basePrice * coupon.discountValue / 100);
}

// Valida los campos de descuento de un cupón (alta/edición desde el admin).
function isValidDiscountFields(discountType, discountValue) {
  if (discountType !== 'percent' && discountType !== 'fixed') return false;
  if (!(discountValue > 0)) return false;
  if (discountType === 'percent' && discountValue > 100) return false;
  return true;
}

// Día de corte y de cobro semanal para TODOS los suscriptores (sin importar
// qué día se hayan suscripto originalmente) — necesario porque hay una sola
// entrega compartida los domingos y cocina necesita la lista con margen.
// 0=domingo … 2=martes.
const BILLING_DAY_OF_WEEK = 2;

// Timestamp Unix (segundos) del próximo martes estrictamente posterior a
// ahora. Se usa como `billing_cycle_anchor` de Stripe para que la
// suscripción cobre el precio completo ahora (cubre desde hoy hasta ese
// martes) y de ahí en más siempre los martes.
function nextTuesdayAnchor(now = new Date()) {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0); // mediodía para no pisarse con cambios de horario
  let daysUntil = (BILLING_DAY_OF_WEEK - d.getDay() + 7) % 7;
  if (daysUntil === 0) daysUntil = 7; // si hoy ya es martes, el próximo, no hoy
  d.setDate(d.getDate() + daysUntil);
  return Math.floor(d.getTime() / 1000);
}

// Cuántos días hasta el próximo domingo para el que un cliente NUEVO que se
// registra hoy todavía llega a tiempo. Cocina necesita la lista el miércoles,
// así que la ventana de pedido para el domingo más cercano es de lunes a
// miércoles inclusive; de jueves a sábado (o si hoy ya es domingo) el pedido
// pasa directamente al domingo siguiente al inmediato.
const DAYS_UNTIL_FIRST_DELIVERY = { 0: 7, 1: 6, 2: 5, 3: 4, 4: 10, 5: 9, 6: 8 };

function firstDeliverySundayDate(now = new Date()) {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + DAYS_UNTIL_FIRST_DELIVERY[d.getDay()]);
  return d;
}

// Sincroniza el estado de la suscripción de Stripe sobre el usuario —
// usado por checkout.session.completed y por los webhooks de
// customer.subscription.* para que el admin vea todo sin llamar a Stripe.
//
// OJO: en versiones recientes de la API de Stripe (confirmado con la API
// 2026-07-29 en uso acá) `current_period_end` ya NO está en la raíz del
// objeto subscription — se movió a `items.data[0].current_period_end`. Y
// `cancel_at_period_end` quedó siempre en `false`; lo que realmente indica
// que la cancelación quedó programada para el fin del período es
// `cancel_at` (timestamp), no ese booleano.
async function syncSubscriptionFields(userId, subscription) {
  const periodEnd = subscription.items?.data?.[0]?.current_period_end || null;
  await Users.update(userId, {
    stripeSubscriptionId:            subscription.id,
    subscriptionStatus:              subscription.status,
    subscriptionCurrentPeriodEnd:    periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    subscriptionCancelAtPeriodEnd:   Boolean(subscription.cancel_at),
  });
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// `verify` guarda el body crudo en req.rawBody sin dejar de parsear el JSON
// normal para el resto de las rutas — lo necesita el webhook de Stripe para
// validar la firma (stripe.webhooks.constructEvent exige el buffer exacto).
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
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

// ── Catálogo de comidas (público, solo lectura) ───────────────────────────────

app.get('/api/meals', (_req, res) => {
  res.json({ meals: MEALS, planMealCounts: PLAN_MEAL_COUNTS });
});

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

// Sin envío de emails todavía (no hay dominio propio verificado en Resend):
// deja constancia en las notas internas del cliente para que el admin lo
// resetee a mano desde "Editar usuario" — el aviso en tiempo real llega por
// WhatsApp (ver login.html), esto es solo el rastro por si no llega por ahí.
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email?.trim()) return res.status(400).json({ error: 'Email requerido' });

    const user = await Users.getByEmail(email.trim());
    if (user) {
      const stamp = new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const note  = `🔐 Pidió recuperar su contraseña el ${stamp}\n` + (user.notes || '');
      await Users.update(user.id, { notes: note });
    }
    // Responde ok exista o no el email, para no revelar qué emails están registrados.
    res.json({ ok: true });
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
    const discount  = calcCouponDiscount(coupon, basePrice);
    if (discount === null)
      return res.status(400).json({ error: `Este cupón requiere una compra mínima de $${coupon.minOrderAmount}` });
    const final = basePrice - discount;

    res.json({
      valid: true,
      coupon: { id: coupon.id, code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
      discount, final,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Pedidos: crear (usuario) ──────────────────────────────────────────────────

app.post('/api/orders', auth, async (req, res) => {
  try {
    const { plan, lastName, phone, preferences, couponCode, meals } = req.body || {};

    if (!plan || !PLAN_PRICES[plan]) return res.status(400).json({ error: 'Plan inválido' });
    if (!phone?.trim()) return res.status(400).json({ error: 'Número de WhatsApp requerido' });
    if (!isValidMealSelection(plan, meals)) return res.status(400).json({ error: 'Selección de comidas inválida' });

    const user = await Users.getById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const basePrice = PLAN_PRICES[plan];
    let couponData  = null, discount = 0, finalPrice = basePrice;

    if (couponCode) {
      const all    = await Coupons.getAll();
      const coupon = all.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
      if (coupon && (!coupon.maxUses || coupon.uses < coupon.maxUses)) {
        const calc = calcCouponDiscount(coupon, basePrice);
        if (calc !== null) {
          discount   = calc;
          finalPrice = basePrice - discount;
          couponData = coupon;
          await Coupons.update(coupon.id, { uses: coupon.uses + 1 });
        }
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
      discountPercent: couponData && couponData.discountType === 'percent' ? couponData.discountValue : 0,
      discountAmount:  discount,
      finalPrice,
      preferences:     { ...(preferences || {}), meals: resolveMealsForStorage(meals) },
      status:          'paid',
      readByAdmin:     false,
    });

    res.status(201).json({ order: { ...order, orderNumber: orderNumber(order.id) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Pedidos: checkout con Stripe (usuario) ────────────────────────────────────
// Crea una Stripe Checkout Session y redirige ahí; el pedido recién se crea en
// Supabase cuando llega el webhook `checkout.session.completed` (o de forma
// directa acá mismo si el cupón deja el precio en $0, sin pasar por Stripe).

async function finalizeOrder(meta) {
  const user = await Users.getById(meta.userId);
  if (!user) throw new Error('Usuario no encontrado para la orden: ' + meta.userId);

  let couponData = null, discount = 0;
  if (meta.couponCode) {
    const all    = await Coupons.getAll();
    const coupon = all.find(c => c.code.toUpperCase() === meta.couponCode.toUpperCase() && c.active);
    if (coupon) {
      const calc = calcCouponDiscount(coupon, meta.basePrice);
      if (calc !== null) {
        discount   = calc;
        couponData = coupon;
        await Coupons.update(coupon.id, { uses: coupon.uses + 1 });
      }
    }
  }

  await Users.update(user.id, {
    name:     meta.name || user.name,
    lastName: meta.lastName || user.lastName || '',
    phone:    meta.phone,
    plan:     meta.plan,
    status:   'active',
  });

  const order = await Orders.create({
    userId:                 user.id,
    userName:               meta.name + (meta.lastName ? ' ' + meta.lastName : ''),
    userEmail:              user.email,
    userPhone:              meta.phone,
    plan:                   meta.plan,
    planPrice:              meta.basePrice,
    coupon:                 couponData ? couponData.code : null,
    discountPercent:        couponData && couponData.discountType === 'percent' ? couponData.discountValue : 0,
    discountAmount:         discount,
    finalPrice:             meta.finalPrice,
    preferences:            { ...(meta.preferences || {}), meals: resolveMealsForStorage(meta.meals || []) },
    status:                 'paid',
    readByAdmin:            false,
    stripeSessionId:        meta.stripeSessionId || null,
    stripePaymentIntentId:  meta.stripePaymentIntentId || null,
    stripeInvoiceId:        meta.stripeInvoiceId || null,
  });

  return order;
}

app.post('/api/orders/checkout', auth, async (req, res) => {
  try {
    const { plan, lastName, phone, preferences, couponCode, meals } = req.body || {};

    if (!plan || !PLAN_PRICES[plan]) return res.status(400).json({ error: 'Plan inválido' });
    if (!phone?.trim()) return res.status(400).json({ error: 'Número de WhatsApp requerido' });
    if (!isValidMealSelection(plan, meals)) return res.status(400).json({ error: 'Selección de comidas inválida' });

    const user = await Users.getById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const basePrice  = PLAN_PRICES[plan];
    const firstName  = req.body.name?.trim() || user.name;
    const cleanLastName = lastName?.trim() || user.lastName || '';
    const cleanPhone    = phone.trim();

    // Precio estimado solo para decidir si hace falta pasar por Stripe — el
    // descuento real (y el consumo del cupón) se aplica siempre en finalizeOrder.
    let estimatedFinal = basePrice;
    if (couponCode) {
      const all    = await Coupons.getAll();
      const coupon = all.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active && (!c.maxUses || c.uses < c.maxUses));
      if (coupon) {
        const calc = calcCouponDiscount(coupon, basePrice);
        if (calc !== null) estimatedFinal = basePrice - calc;
      }
    }

    if (estimatedFinal <= 0) {
      const order = await finalizeOrder({
        userId: user.id, plan, name: firstName, lastName: cleanLastName, phone: cleanPhone,
        couponCode, preferences, meals, basePrice, finalPrice: 0,
      });
      return res.status(201).json({ order: { ...order, orderNumber: orderNumber(order.id) } });
    }

    if (!stripe) return res.status(500).json({ error: 'Los pagos todavía no están configurados' });

    const origin = req.headers.origin || `https://${req.get('host')}`;

    // La suscripción en sí NO cobra nada hoy — se crea con billing_cycle_anchor
    // en el próximo martes (proration_behavior:'none', sin generar ninguna
    // factura por la diferencia) para que TODAS las renovaciones futuras,
    // desde la primera, caigan siempre ese día sin importar qué día se haya
    // registrado el cliente. El cobro de HOY (precio completo, ya con el
    // descuento del cupón aplicado si corresponde) se hace aparte, como una
    // factura manual de una sola vez, en el webhook checkout.session.completed
    // — Stripe no permite reprogramar billing_cycle_anchor a una fecha futura
    // arbitraria sobre una suscripción ya creada (probado en real: solo
    // acepta 'now'/'unchanged' en subscriptions.update), así que la única
    // forma de tener "cobro completo hoy" + "ancla futura común" es separar
    // ambos cobros en dos objetos de Stripe distintos.
    const sessionParams = {
      mode:                'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency:     'usd',
          product_data: { name: PLAN_LABELS[plan] || plan },
          unit_amount:  Math.round(basePrice * 100),
          recurring:    { interval: 'week' },
        },
        quantity: 1,
      }],
      metadata: {
        userId:      String(user.id),
        plan,
        name:        firstName,
        lastName:    cleanLastName,
        phone:       cleanPhone,
        couponCode:  couponCode || '',
        basePrice:   String(basePrice),
        finalPrice:  String(estimatedFinal),
        preferences: JSON.stringify(preferences || {}).slice(0, 490),
        // Campo propio (no el de `preferences`, que ya se trunca a 490
        // caracteres) para que la selección de comidas nunca se corte.
        meals:       JSON.stringify(meals).slice(0, 490),
      },
      subscription_data: {
        billing_cycle_anchor: nextTuesdayAnchor(),
        proration_behavior:   'none',
        metadata: {
          userId:      String(user.id),
          plan,
          name:        firstName,
          lastName:    cleanLastName,
          phone:       cleanPhone,
          preferences: JSON.stringify(preferences || {}).slice(0, 490),
          meals:       JSON.stringify(meals).slice(0, 490),
        },
      },
      success_url: `${origin}/home?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/home?checkout=cancelled`,
    };
    if (user.stripeCustomerId) sessionParams.customer = user.stripeCustomerId;
    else sessionParams.customer_email = user.email;

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Stripe: webhook ───────────────────────────────────────────────────────────
// Público (sin JWT) — Stripe se autentica con la firma del header, no con
// nuestro auth normal. Acá es donde el pedido se crea de verdad.

app.post('/api/stripe/webhook', async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(500).end();

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook de Stripe con firma inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // checkout.session.completed llega apenas se confirma la suscripción — la
  // suscripción en sí todavía no cobró nada (billing_cycle_anchor futuro, ver
  // /api/orders/checkout). Acá activamos al usuario, sincronizamos
  // customer/subscription, y hacemos el cobro de HOY como una factura manual
  // de una sola vez (precio completo con el descuento del cupón ya aplicado)
  // — el pedido de este primer cobro se crea directo acá mismo, no en
  // invoice.paid (esa factura manual no tiene suscripción asociada, así que
  // invoice.paid la ignora a propósito, ver más abajo). Las renovaciones
  // semanales de ahí en más sí las crea invoice.paid, cuando Stripe cobra
  // solo la propia suscripción cada martes.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const meta = session.metadata || {};
      const user = await Users.getById(meta.userId);
      if (!user) {
        console.error('checkout.session.completed: usuario no encontrado', meta.userId);
      } else {
        // Activación (nombre/plan/status/cupón consumido) — protegida por
        // este chequeo porque consumir el cupón (uses+1) NO es idempotente;
        // en un reintento del webhook ya no vuelve a entrar acá.
        if (!user.stripeSubscriptionId || user.stripeSubscriptionId !== session.subscription) {
          if (meta.couponCode) {
            const all    = await Coupons.getAll();
            const coupon = all.find(c => c.code.toUpperCase() === meta.couponCode.toUpperCase() && c.active);
            if (coupon) await Coupons.update(coupon.id, { uses: coupon.uses + 1 });
          }

          await Users.update(user.id, {
            name:             meta.name || user.name,
            lastName:         meta.lastName || user.lastName || '',
            phone:            meta.phone || user.phone,
            plan:             meta.plan,
            status:           'active',
            stripeCustomerId: session.customer || user.stripeCustomerId || null,
          });

          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            await syncSubscriptionFields(user.id, subscription);
          }
        }

        // Cobro de HOY (factura manual, precio completo ya con el descuento
        // del cupón aplicado) — a propósito FUERA del if de arriba: si un
        // intento anterior activó al usuario pero se cayó antes de llegar
        // acá (ya pasó una vez en real), un reintento del webhook tiene que
        // poder retomar el cobro igual. Las idempotencyKey atadas al id de
        // la Checkout Session hacen que reintentar estas dos llamadas a
        // Stripe sea seguro (devuelven el mismo invoice item/factura ya
        // creados en vez de duplicarlos) y el dedup real de "ya se creó el
        // pedido" lo da la restricción UNIQUE de stripe_invoice_id.
        const basePrice  = Number(meta.basePrice) || 0;
        const finalPrice = Number(meta.finalPrice) || 0;
        if (session.customer && finalPrice > 0) {
          let couponData = null;
          if (meta.couponCode) {
            const all = await Coupons.getAll();
            couponData = all.find(c => c.code.toUpperCase() === meta.couponCode.toUpperCase()) || null;
          }

          await stripe.invoiceItems.create({
            customer:    session.customer,
            amount:      Math.round(finalPrice * 100),
            currency:    'usd',
            description: `${PLAN_LABELS[meta.plan] || meta.plan} — primera semana`,
          }, { idempotencyKey: `fh_invitem_${session.id}` });

          let invoice = await stripe.invoices.create({
            customer:          session.customer,
            collection_method: 'charge_automatically',
            auto_advance:      false,
            metadata:          { userId: String(user.id), plan: meta.plan },
          }, { idempotencyKey: `fh_invoice_${session.id}` });

          if (invoice.status === 'draft') {
            invoice = await stripe.invoices.finalizeInvoice(invoice.id);
          }
          // Al finalizar una factura con collection_method:'charge_automatically'
          // Stripe ya intenta cobrarla en el momento (probado en real: para
          // cuando llegamos a pagarla explícito, ya estaba paid y .pay()
          // tiraba "Invoice is already paid") — solo llamamos a .pay() si
          // finalizeInvoice la dejó todavía sin cobrar, y ante cualquier
          // error ahí (incluida esa carrera) recién confiamos en el estado
          // real de la factura, no en si la llamada tiró excepción o no.
          if (invoice.status !== 'paid') {
            try {
              invoice = await stripe.invoices.pay(invoice.id);
            } catch {
              invoice = await stripe.invoices.retrieve(invoice.id);
            }
          }

          if (invoice.status === 'paid') {
            try {
              await Orders.create({
                userId:          user.id,
                userName:        meta.name + (meta.lastName ? ' ' + meta.lastName : ''),
                userEmail:       user.email,
                userPhone:       meta.phone,
                plan:            meta.plan,
                planPrice:       basePrice,
                coupon:          couponData ? couponData.code : null,
                discountPercent: couponData && couponData.discountType === 'percent' ? couponData.discountValue : 0,
                discountAmount:  Math.max(0, basePrice - finalPrice),
                finalPrice,
                preferences:     parsePreferencesFromMeta(meta),
                status:          'paid',
                readByAdmin:     false,
                stripeInvoiceId: invoice.id,
              });
            } catch (err) {
              if (!(err && err.code === '23505')) throw err; // 23505 = ya existe, ok (reintento del webhook)
            }
          } else {
            // No debería pasar (Checkout ya validó la tarjeta) pero si la
            // factura queda sin pagar (ej. fondos insuficientes recién ahora)
            // no se crea ningún pedido — Valen lo ve porque el usuario queda
            // "active" sin ningún pedido asociado, y lo resuelve por WhatsApp.
            console.error('checkout.session.completed: la factura del primer cobro no quedó pagada', invoice.id, invoice.status);
          }
        }
      }
    } catch (err) {
      console.error('Error procesando checkout.session.completed:', err);
      return res.status(500).end();
    }
  }

  // Acá se crean los pedidos de las renovaciones semanales (el martes) — el
  // primer cobro (factura manual, sin suscripción asociada) ya se procesó
  // aparte en checkout.session.completed, así que esta factura sin
  // `invoice.subscription` se ignora a propósito, sin loguear error.
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    try {
      if (!invoice.subscription) {
        // Factura manual del primer cobro (u otra factura suelta) — nada que hacer acá.
      } else {
        const existing = await Orders.find(o => o.stripeInvoiceId === invoice.id);
        if (existing.length === 0) {
          const user = (await Users.getAll()).find(u => u.stripeSubscriptionId === invoice.subscription);
          if (!user) {
            console.error('invoice.paid: no se encontró ningún usuario para la suscripción', invoice.subscription);
          } else {
            const [latest] = (await Orders.find(o => o.userId === user.id))
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            let plan, preferences, userName, userPhone;
            if (latest) {
              plan = latest.plan;
              preferences = latest.preferences;
              userName = latest.userName;
              userPhone = latest.userPhone;
            } else {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
              const subMeta = subscription.metadata || {};
              plan = subMeta.plan || user.plan;
              preferences = parsePreferencesFromMeta(subMeta);
              userName = subMeta.name ? (subMeta.name + (subMeta.lastName ? ' ' + subMeta.lastName : '')) : (user.name + (user.lastName ? ' ' + user.lastName : ''));
              userPhone = subMeta.phone || user.phone;
              if (!subMeta.plan) console.error('invoice.paid: primer cobro sin metadata de la suscripción, usando datos del usuario como fallback', invoice.subscription);
            }

            await Orders.create({
              userId:          user.id,
              userName,
              userEmail:       user.email,
              userPhone,
              plan,
              planPrice:       PLAN_PRICES[plan] || 0,
              coupon:          null,
              discountPercent: 0,
              discountAmount:  0,
              finalPrice:      (invoice.amount_paid || 0) / 100,
              preferences,
              status:          'paid',
              readByAdmin:     false,
              stripeInvoiceId: invoice.id,
            });
          }
        }
      }
    } catch (err) {
      // Choque de la restricción UNIQUE de stripe_invoice_id: otra entrega
      // del webhook ya creó este pedido — no es un error real, no reintentar.
      if (err && err.code === '23505') { /* ya existe, ok */ }
      else {
        console.error('Error creando el pedido desde invoice.paid:', err);
        return res.status(500).end();
      }
    }
  }

  // Cambios de estado de la suscripción (incluye cancel_at_period_end al
  // cancelar desde el Customer Portal) — se reflejan en el usuario para que
  // el admin los vea sin tener que entrar a Stripe.
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    try {
      const user = (await Users.getAll()).find(u => u.stripeSubscriptionId === subscription.id);
      if (user) await syncSubscriptionFields(user.id, subscription);
    } catch (err) {
      console.error('Error sincronizando customer.subscription.updated:', err);
      return res.status(500).end();
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    try {
      const user = (await Users.getAll()).find(u => u.stripeSubscriptionId === subscription.id);
      if (user) await Users.update(user.id, { subscriptionStatus: 'canceled', status: 'inactive' });
    } catch (err) {
      console.error('Error procesando customer.subscription.deleted:', err);
      return res.status(500).end();
    }
  }

  res.json({ received: true });
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

// ── Suscripción: portal de Stripe (gestionar/cancelar) ────────────────────────

app.post('/api/subscription/portal', auth, async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Los pagos todavía no están configurados' });
    const user = await Users.getById(req.user.id);
    if (!user?.stripeCustomerId) return res.status(400).json({ error: 'Todavía no tenés una suscripción activa' });

    const origin = req.headers.origin || `https://${req.get('host')}`;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${origin}/home`,
    });
    res.json({ url: portalSession.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Admin: Estadísticas ──────────────────────────────────────────────────────

app.get('/api/admin/stats', adminOnly, async (req, res) => {
  try {
    const usrs   = (await Users.getAll()).filter(u => u.role !== 'admin');
    const byPlan   = { structure: 0, performance: 0, full_system: 0, full_week: 0, none: 0 };
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
    const { code, discountType, discountValue, minOrderAmount, maxUses } = req.body || {};
    if (!code?.trim() || !discountValue)
      return res.status(400).json({ error: 'Código y descuento son obligatorios' });
    if (!isValidDiscountFields(discountType, Number(discountValue)))
      return res.status(400).json({ error: 'El descuento no es válido para ese tipo' });
    const all    = await Coupons.getAll();
    const exists = all.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (exists) return res.status(409).json({ error: 'Ya existe un cupón con ese código' });
    const coupon = await Coupons.create({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
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
    const { code, discountType, discountValue, minOrderAmount, maxUses, active } = req.body || {};
    const updates = {};
    if (code) updates.code = code.trim().toUpperCase();
    if (discountType || discountValue) {
      const nextType  = discountType || c.discountType;
      const nextValue = discountValue !== undefined ? Number(discountValue) : c.discountValue;
      if (!isValidDiscountFields(nextType, nextValue))
        return res.status(400).json({ error: 'El descuento no es válido para ese tipo' });
      updates.discountType  = nextType;
      updates.discountValue = nextValue;
    }
    if (minOrderAmount !== undefined) updates.minOrderAmount = minOrderAmount ? Number(minOrderAmount) : null;
    if (maxUses !== undefined) updates.maxUses = maxUses ? parseInt(maxUses) : null;
    if (active  !== undefined) updates.active  = Boolean(active);
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
