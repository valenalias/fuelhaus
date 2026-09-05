// fuelhaus-os-sync.js — notifica al FuelHaus OS cuando un pedido se paga
// de verdad (invoice.paid). Fire-and-forget desde el punto de vista del
// negocio: NUNCA debe bloquear ni hacer fallar el webhook de Stripe — si
// el OS está caído o tarda, se loguea y listo. Si un pedido queda sin
// sincronizar, la reconciliación es un proceso APARTE que corre del lado
// del OS (scripts/fuelhaus-web-reconcile.ts en ese repo, lee esta misma
// tabla `orders` de solo lectura y reintenta lo que falte) — acá no hay
// cola ni reintento persistente a propósito, para no tener que tocar el
// schema de `orders` ni el flujo de checkout más de lo mínimo.
//
// Requiere FUELHAUS_OS_INGEST_URL y FUELHAUS_OS_INGEST_TOKEN en el entorno
// (ver .env.example) — si falta cualquiera de las dos, se omite la
// sincronización (logueado), no se intenta igual.

const TIMEOUT_MS = 4000;

function buildPayload(order, user) {
  return {
    externalOrderId: String(order.id),
    externalSource: 'fuelhaus_web',
    paidAt: order.createdAt,
    customerExternalId: user ? String(user.id) : undefined,
    customerName: order.userName,
    customerEmail: order.userEmail,
    customerPhone: order.userPhone,
    meals: (order.preferences && Array.isArray(order.preferences.meals) ? order.preferences.meals : [])
      .filter(m => m && m.id && Number.isInteger(m.qty) && m.qty > 0)
      .map(m => ({ externalMealId: m.id, quantity: m.qty })),
  };
}

// Un solo intento con timeout corto — deliberado (ver nota de arriba): no
// reintenta en el propio request para no demorar la respuesta a Stripe.
// Nunca lanza: cualquier falla queda solo logueada.
async function notifyOsOrderPaid(order, user) {
  const url   = process.env.FUELHAUS_OS_INGEST_URL;
  const token = process.env.FUELHAUS_OS_INGEST_TOKEN;
  if (!url || !token) {
    console.error('[fuelhaus-os-sync] FUELHAUS_OS_INGEST_URL/FUELHAUS_OS_INGEST_TOKEN no configurados — se omite la sincronización con el OS para el pedido', order.id);
    return { skipped: true };
  }

  const payload = buildPayload(order, user);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/fuelhaus/orders/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-fuelhaus-token': token },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('[fuelhaus-os-sync] el OS respondió', res.status, 'para el pedido', order.id, '— queda pendiente de reconciliación.', body);
      return { skipped: false, ok: false, status: res.status, body };
    }
    console.log('[fuelhaus-os-sync] OK, pedido', order.id, '->', body);
    return { skipped: false, ok: true, body };
  } catch (err) {
    console.error('[fuelhaus-os-sync] no se pudo contactar al OS para el pedido', order.id, '— queda pendiente de reconciliación.', err.message);
    return { skipped: false, ok: false, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { notifyOsOrderPaid, buildPayload };
