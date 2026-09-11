// subscription-reconcile.js — autocorrige el caso descubierto con Axel
// Lema (FH-0012, 2026-09-10): el webhook `checkout.session.completed`
// crea el pedido y DESPUÉS intenta crear la suscripción semanal en la
// misma llamada — si esa segunda parte falla (ej. la función de Vercel
// corta a los 10s del plan Hobby por la cadena de ~9 llamadas seguidas a
// Stripe/Supabase), el pedido queda bien pero el cliente se queda sin
// autopay, sin que nadie se entere hasta que reclama.
//
// Este módulo busca usuarios en esa situación y les crea la suscripción
// que falta, replicando la MISMA lógica de `checkout.session.completed`
// (reusada vía `billingInternals` de server.js, nunca duplicada) — no
// depende de que el webhook reintente, corre por su cuenta.
//
// Señal correcta de "nunca se creó": `stripeSubscriptionId == null`. Un
// usuario que canceló sigue teniendo guardado el id de su suscripción ya
// cancelada — nunca es null — así que este módulo nunca lo toca.
//
// Un pedido con `stripeSessionId == null` es un pedido de cupón 100%
// (`finalizeOrder()` en /api/orders/checkout, sin pasar por Stripe) — se
// descarta a propósito: esos clientes NUNCA deben tener una suscripción
// real, cobrarles sería un error grave, no una corrección.
//
// Dependencias inyectables (mismo patrón que
// lib/fuelhaus/services/ingest-web-order.ts del lado del OS) para poder
// testear toda la orquestación con fakes, sin Stripe/Supabase reales.

function createReconciler(deps) {
  const { Users, Orders, stripe, PLAN_PRICES, ensurePlanProductId, nextTuesdayAnchor, firstDeliverySundayDate, syncSubscriptionFields } = deps;

  /**
   * Un usuario entra en la lista si: tiene `stripeCustomerId` (pasó por
   * Stripe alguna vez), NO tiene `stripeSubscriptionId` (nunca se le creó
   * o se le canceló y perdió el id — este segundo caso no debería
   * ocurrir nunca en la práctica, `customer.subscription.deleted` no
   * borra el id, solo cambia el status) y tiene al menos un pedido pagado
   * de verdad por Stripe (`stripeSessionId` no nulo). Si tiene varios, se
   * usa el más reciente para plan/fecha de referencia.
   */
  async function findUsersMissingSubscription() {
    const [users, orders] = await Promise.all([Users.getAll(), Orders.getAll()]);

    const latestRealOrderByUser = new Map();
    for (const order of orders) {
      if (!order.stripeSessionId) continue;
      const existing = latestRealOrderByUser.get(order.userId);
      if (!existing || new Date(order.createdAt) > new Date(existing.createdAt)) {
        latestRealOrderByUser.set(order.userId, order);
      }
    }

    const candidates = [];
    for (const user of users) {
      if (user.stripeSubscriptionId) continue;
      if (!user.stripeCustomerId) continue;
      const order = latestRealOrderByUser.get(user.id);
      if (!order) continue;
      candidates.push({ user, order });
    }
    return candidates;
  }

  /**
   * Crea la suscripción faltante para UN candidato. Nunca lanza por
   * condiciones de negocio esperables (ya resuelto mientras tanto, sin
   * payment_method) — esos casos vuelven en `skipped`/`reason`. Sí puede
   * lanzar ante un error real de Stripe/Supabase (lo maneja el caller).
   */
  async function reconcileOne({ user, order }) {
    // Re-chequeo justo antes de tocar Stripe: si el webhook, un reintento
    // suyo, u otra corrida de este mismo script ya lo resolvieron
    // mientras se armaba la lista, no duplicar nada.
    const fresh = await Users.getById(user.id);
    if (fresh.stripeSubscriptionId) {
      return { userId: user.id, skipped: true, reason: 'already_resolved' };
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    const paymentMethod = paymentIntent.payment_method;
    if (!paymentMethod) {
      return { userId: user.id, skipped: true, reason: 'no_payment_method' };
    }

    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethod },
    });

    // Misma fecha de "primera entrega" que hubiera calculado el webhook
    // en su momento (desde el pago original) — si para cuando corre esto
    // esa fecha ya quedó en el pasado, se recalcula con la MISMA fórmula
    // que cualquier alta nueva, nunca se fuerza un anchor vencido (Stripe
    // lo rechazaría, y tampoco tendría sentido de negocio).
    let firstDeliveryDate = firstDeliverySundayDate(new Date(order.createdAt));
    if (firstDeliveryDate.getTime() <= Date.now()) {
      firstDeliveryDate = firstDeliverySundayDate();
    }

    const productId = await ensurePlanProductId(order.plan);
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      default_payment_method: paymentMethod,
      items: [{
        price_data: {
          currency: 'usd',
          product: productId,
          unit_amount: Math.round(PLAN_PRICES[order.plan] * 100),
          recurring: { interval: 'week' },
        },
      }],
      billing_cycle_anchor: nextTuesdayAnchor(firstDeliveryDate),
      proration_behavior: 'none',
      metadata: {
        userId: String(user.id),
        plan: order.plan,
        name: user.name,
        lastName: user.lastName || '',
        phone: user.phone || '',
        reconciledFromOrderId: String(order.id),
      },
    }, { idempotencyKey: `fh_sub_reconcile_${order.id}` });

    await syncSubscriptionFields(user.id, subscription);
    return { userId: user.id, skipped: false, subscriptionId: subscription.id };
  }

  async function reconcileAll() {
    const candidates = await findUsersMissingSubscription();
    const results = [];
    for (const candidate of candidates) {
      try {
        results.push(await reconcileOne(candidate));
      } catch (err) {
        results.push({ userId: candidate.user.id, skipped: true, reason: 'error', error: err.message });
      }
    }
    return results;
  }

  return { findUsersMissingSubscription, reconcileOne, reconcileAll };
}

function defaultDeps() {
  const { Users, Orders } = require('./db');
  const { billingInternals } = require('./server');
  return { Users, Orders, ...billingInternals };
}

module.exports = { createReconciler, defaultDeps };

// ── CLI: node subscription-reconcile.js [--dry-run] ─────────────────────────
// Mismo criterio que el cron diario y el botón de Admin (ver
// /api/admin/reconcile-subscriptions en server.js) — pensado para poder
// correrlo a mano si hace falta revisar algo puntual.
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  const reconciler = createReconciler(defaultDeps());

  (async () => {
    const candidates = await reconciler.findUsersMissingSubscription();
    if (candidates.length === 0) {
      console.log('[subscription-reconcile] nada para reconciliar.');
      return;
    }
    console.log(`[subscription-reconcile] ${candidates.length} usuario(s) con pedido pagado sin suscripción.`);

    if (dryRun) {
      for (const { user, order } of candidates) {
        console.log(`[subscription-reconcile] (dry-run) crearía suscripción para userId=${user.id} plan=${order.plan} order=${order.id}`);
      }
      return;
    }

    const results = await reconciler.reconcileAll();
    for (const r of results) console.log('[subscription-reconcile]', JSON.stringify(r));
    const failed = results.filter((r) => r.reason === 'error');
    if (failed.length > 0) process.exitCode = 1;
  })().catch((err) => {
    console.error('[subscription-reconcile] error fatal:', err);
    process.exit(1);
  });
}
