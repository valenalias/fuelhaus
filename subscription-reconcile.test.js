// Tests de subscription-reconcile.js con el test runner nativo de Node,
// mismo criterio que fuelhaus-os-sync.test.js — deps 100% fake, sin
// Stripe/Supabase reales.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createReconciler } = require('./subscription-reconcile');

function user(overrides = {}) {
  return {
    id: 19, name: 'Axel', lastName: 'Lema', phone: '7542613905',
    stripeCustomerId: 'cus_test', stripeSubscriptionId: null,
    ...overrides,
  };
}

function order(overrides = {}) {
  return {
    id: 12, userId: 19, plan: 'performance',
    stripeSessionId: 'cs_test_1', stripePaymentIntentId: 'pi_test_1',
    createdAt: '2026-09-10T13:47:44.000Z',
    ...overrides,
  };
}

function fakeUsers(users) {
  return {
    async getAll() { return users; },
    async getById(id) { return users.find((u) => u.id === id); },
  };
}
function fakeOrders(orders) {
  return { async getAll() { return orders; } };
}

function fakeDeps(overrides = {}) {
  return {
    Users: fakeUsers([user()]),
    Orders: fakeOrders([order()]),
    stripe: {
      paymentIntents: { retrieve: async () => ({ payment_method: 'pm_test' }) },
      customers: { update: async () => ({}) },
      subscriptions: { create: async () => ({ id: 'sub_test', status: 'active', items: { data: [{ current_period_end: 1789473600 }] } }) },
    },
    PLAN_PRICES: { performance: 190 },
    ensurePlanProductId: async (plan) => `fuelhaus_plan_${plan}`,
    nextTuesdayAnchor: (d) => Math.floor(d.getTime() / 1000) + 2 * 86400,
    firstDeliverySundayDate: (now = new Date('2026-09-10T12:00:00Z')) => new Date(now.getTime() + 3 * 86400000),
    syncSubscriptionFields: async () => {},
    ...overrides,
  };
}

// ---- findUsersMissingSubscription ------------------------------------------

test('findUsersMissingSubscription: usuario con pedido real y sin suscripción entra en la lista', async () => {
  const reconciler = createReconciler(fakeDeps());
  const candidates = await reconciler.findUsersMissingSubscription();
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].user.id, 19);
  assert.equal(candidates[0].order.id, 12);
});

test('findUsersMissingSubscription: usuario CON stripeSubscriptionId (activa o cancelada) nunca entra', async () => {
  const deps = fakeDeps({ Users: fakeUsers([user({ stripeSubscriptionId: 'sub_old' })]) });
  const reconciler = createReconciler(deps);
  assert.deepEqual(await reconciler.findUsersMissingSubscription(), []);
});

test('findUsersMissingSubscription: sin stripeCustomerId (nunca pasó por Stripe) nunca entra', async () => {
  const deps = fakeDeps({ Users: fakeUsers([user({ stripeCustomerId: null })]) });
  const reconciler = createReconciler(deps);
  assert.deepEqual(await reconciler.findUsersMissingSubscription(), []);
});

test('findUsersMissingSubscription: pedido de cupón 100% (sin stripeSessionId) se descarta, nunca genera una suscripción real', async () => {
  const deps = fakeDeps({ Orders: fakeOrders([order({ stripeSessionId: null })]) });
  const reconciler = createReconciler(deps);
  assert.deepEqual(await reconciler.findUsersMissingSubscription(), []);
});

test('findUsersMissingSubscription: con varios pedidos reales, usa el más reciente', async () => {
  const deps = fakeDeps({
    Orders: fakeOrders([
      order({ id: 10, plan: 'structure', createdAt: '2026-09-01T00:00:00Z' }),
      order({ id: 12, plan: 'performance', createdAt: '2026-09-10T13:47:44Z' }),
    ]),
  });
  const reconciler = createReconciler(deps);
  const [candidate] = await reconciler.findUsersMissingSubscription();
  assert.equal(candidate.order.id, 12);
  assert.equal(candidate.order.plan, 'performance');
});

test('findUsersMissingSubscription: usuario sin ningún pedido real no entra (nada para reconciliar)', async () => {
  const deps = fakeDeps({ Orders: fakeOrders([]) });
  const reconciler = createReconciler(deps);
  assert.deepEqual(await reconciler.findUsersMissingSubscription(), []);
});

// ---- reconcileOne -----------------------------------------------------------

test('reconcileOne: caso feliz, crea la suscripción y sincroniza el usuario', async () => {
  let syncedArgs = null;
  const deps = fakeDeps({ syncSubscriptionFields: async (userId, sub) => { syncedArgs = { userId, sub }; } });
  const reconciler = createReconciler(deps);
  const result = await reconciler.reconcileOne({ user: user(), order: order() });
  assert.equal(result.skipped, false);
  assert.equal(result.subscriptionId, 'sub_test');
  assert.equal(syncedArgs.userId, 19);
  assert.equal(syncedArgs.sub.id, 'sub_test');
});

test('reconcileOne: re-chequeo justo antes de crear — si ya se resolvió mientras tanto, no duplica', async () => {
  let subscriptionCreateCalled = false;
  const deps = fakeDeps({
    Users: fakeUsers([user({ stripeSubscriptionId: 'sub_ya_creada' })]),
    stripe: {
      paymentIntents: { retrieve: async () => ({ payment_method: 'pm_test' }) },
      customers: { update: async () => ({}) },
      subscriptions: { create: async () => { subscriptionCreateCalled = true; return { id: 'sub_x', items: { data: [{}] } }; } },
    },
  });
  const reconciler = createReconciler(deps);
  const result = await reconciler.reconcileOne({ user: user(), order: order() });
  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'already_resolved');
  assert.equal(subscriptionCreateCalled, false);
});

test('reconcileOne: PaymentIntent sin payment_method, se salta sin crear nada', async () => {
  const deps = fakeDeps({
    stripe: {
      paymentIntents: { retrieve: async () => ({ payment_method: null }) },
      customers: { update: async () => { throw new Error('no debería llamarse'); } },
      subscriptions: { create: async () => { throw new Error('no debería llamarse'); } },
    },
  });
  const reconciler = createReconciler(deps);
  const result = await reconciler.reconcileOne({ user: user(), order: order() });
  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'no_payment_method');
});

test('reconcileOne: fecha de primera entrega calculada desde el pedido si sigue en el futuro', async () => {
  let usedDate = null;
  const deps = fakeDeps({
    firstDeliverySundayDate: (now) => {
      if (now) return new Date('2099-01-04T12:00:00Z'); // futuro, se usa tal cual
      throw new Error('no debería recalcular desde hoy en este caso');
    },
    nextTuesdayAnchor: (d) => { usedDate = d; return 4102444800; },
  });
  const reconciler = createReconciler(deps);
  await reconciler.reconcileOne({ user: user(), order: order() });
  assert.equal(usedDate.toISOString(), '2099-01-04T12:00:00.000Z');
});

test('reconcileOne: si la fecha calculada desde el pedido ya quedó en el pasado, recalcula desde hoy', async () => {
  let callCount = 0;
  const deps = fakeDeps({
    firstDeliverySundayDate: (now) => {
      callCount++;
      if (now) return new Date('2020-01-01T12:00:00Z'); // pasado a propósito
      return new Date('2099-02-02T12:00:00Z'); // fallback "desde hoy"
    },
    nextTuesdayAnchor: () => 4102444800,
  });
  const reconciler = createReconciler(deps);
  const result = await reconciler.reconcileOne({ user: user(), order: order() });
  assert.equal(callCount, 2);
  assert.equal(result.skipped, false);
});

test('reconcileOne: usa idempotencyKey atado al id del pedido, para no duplicar ante reintentos', async () => {
  let capturedOptions = null;
  const deps = fakeDeps({
    stripe: {
      paymentIntents: { retrieve: async () => ({ payment_method: 'pm_test' }) },
      customers: { update: async () => ({}) },
      subscriptions: {
        create: async (_params, options) => { capturedOptions = options; return { id: 'sub_test', items: { data: [{}] } }; },
      },
    },
  });
  const reconciler = createReconciler(deps);
  await reconciler.reconcileOne({ user: user(), order: order({ id: 12 }) });
  assert.equal(capturedOptions.idempotencyKey, 'fh_sub_reconcile_12');
});

// ---- reconcileAll -----------------------------------------------------------

test('reconcileAll: un candidato que lanza un error real no frena a los demás', async () => {
  const deps = fakeDeps({
    Users: fakeUsers([user({ id: 19 }), user({ id: 20, stripeCustomerId: 'cus_20' })]),
    Orders: fakeOrders([order({ id: 12, userId: 19 }), order({ id: 13, userId: 20, stripePaymentIntentId: 'pi_test_2' })]),
    stripe: {
      paymentIntents: {
        retrieve: async (id) => {
          if (id === 'pi_test_1') throw new Error('Stripe caído');
          return { payment_method: 'pm_test' };
        },
      },
      customers: { update: async () => ({}) },
      subscriptions: { create: async () => ({ id: 'sub_test', items: { data: [{}] } }) },
    },
  });
  const reconciler = createReconciler(deps);
  const results = await reconciler.reconcileAll();
  assert.equal(results.length, 2);
  const failed = results.find((r) => r.userId === 19);
  const ok = results.find((r) => r.userId === 20);
  assert.equal(failed.skipped, true);
  assert.equal(failed.reason, 'error');
  assert.match(failed.error, /Stripe caído/);
  assert.equal(ok.skipped, false);
});

test('reconcileAll: sin candidatos, devuelve un array vacío', async () => {
  const deps = fakeDeps({ Orders: fakeOrders([]) });
  const reconciler = createReconciler(deps);
  assert.deepEqual(await reconciler.reconcileAll(), []);
});
