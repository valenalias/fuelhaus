// Tests de fuelhaus-os-sync.js con el test runner nativo de Node (sin
// dependencias nuevas — este repo no tenía suite de tests todavía).
const { test } = require('node:test');
const assert = require('node:assert/strict');

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = global.fetch;

function resetEnv() {
  process.env.FUELHAUS_OS_INGEST_URL = 'https://os.example.com';
  process.env.FUELHAUS_OS_INGEST_TOKEN = 'test-token';
}
function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
  global.fetch = ORIGINAL_FETCH;
}

function order(overrides = {}) {
  return {
    id: 42,
    createdAt: '2026-09-08T12:00:00.000Z',
    userName: 'Ana Pérez',
    userEmail: 'ana@example.com',
    userPhone: '+13051234567',
    preferences: { meals: [{ id: 'sirloin_quinoa_bowl', name: 'Sirloin Quinoa Bowl', qty: 3 }] },
    ...overrides,
  };
}
const user = { id: 7 };

// Reimportar en cada test (require cachea el módulo, pero notifyOsOrderPaid
// lee process.env en cada llamada, no en el require — no hace falta
// invalidar el cache).
const { notifyOsOrderPaid, buildPayload } = require('./fuelhaus-os-sync');

test('buildPayload: mapea los campos del pedido al contrato del OS', () => {
  const payload = buildPayload(order(), user);
  assert.equal(payload.externalOrderId, '42');
  assert.equal(payload.externalSource, 'fuelhaus_web');
  assert.equal(payload.paidAt, '2026-09-08T12:00:00.000Z');
  assert.equal(payload.customerExternalId, '7');
  assert.deepEqual(payload.meals, [{ externalMealId: 'sirloin_quinoa_bowl', quantity: 3 }]);
});

test('buildPayload: sin usuario, customerExternalId queda undefined (no lanza)', () => {
  const payload = buildPayload(order(), null);
  assert.equal(payload.customerExternalId, undefined);
});

test('buildPayload: filtra líneas de meals corruptas (sin id o qty inválido)', () => {
  const payload = buildPayload(order({ preferences: { meals: [{ id: 'a', qty: 2 }, { id: null, qty: 1 }, { id: 'b', qty: 0 }, { id: 'c', qty: -1 }] } }), user);
  assert.deepEqual(payload.meals, [{ externalMealId: 'a', quantity: 2 }]);
});

test('buildPayload: preferences.meals ausente da un array vacío, no lanza', () => {
  const payload = buildPayload(order({ preferences: {} }), user);
  assert.deepEqual(payload.meals, []);
});

test('notifyOsOrderPaid: sin FUELHAUS_OS_INGEST_URL/TOKEN configurados, se omite sin llamar fetch', async (t) => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.FUELHAUS_OS_INGEST_URL;
  delete process.env.FUELHAUS_OS_INGEST_TOKEN;
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; };

  const result = await notifyOsOrderPaid(order(), user);
  assert.equal(result.skipped, true);
  assert.equal(fetchCalled, false);
  restoreEnv();
});

test('notifyOsOrderPaid: respuesta 200 del OS -> ok:true', async () => {
  resetEnv();
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, created: true }) });

  const result = await notifyOsOrderPaid(order(), user);
  assert.equal(result.ok, true);
  restoreEnv();
});

test('notifyOsOrderPaid: OS caído (fetch rechaza) -> nunca lanza, devuelve ok:false', async () => {
  resetEnv();
  global.fetch = async () => { throw new Error('ECONNREFUSED'); };

  await assert.doesNotReject(() => notifyOsOrderPaid(order(), user));
  const result = await notifyOsOrderPaid(order(), user);
  assert.equal(result.ok, false);
  assert.match(result.error, /ECONNREFUSED/);
  restoreEnv();
});

test('notifyOsOrderPaid: el OS responde con error (ej. 503 sin production week) -> ok:false, no lanza', async () => {
  resetEnv();
  global.fetch = async () => ({ ok: false, status: 503, json: async () => ({ ok: false, reason: 'no_assignable_week' }) });

  const result = await notifyOsOrderPaid(order(), user);
  assert.equal(result.ok, false);
  assert.equal(result.status, 503);
  restoreEnv();
});

test('notifyOsOrderPaid: manda el token compartido en el header x-fuelhaus-token', async () => {
  resetEnv();
  let capturedHeaders = null;
  global.fetch = async (url, init) => {
    capturedHeaders = init.headers;
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  };

  await notifyOsOrderPaid(order(), user);
  assert.equal(capturedHeaders['x-fuelhaus-token'], 'test-token');
  restoreEnv();
});
