// stripe-invoice.js — lectura tolerante de facturas de Stripe, sin dependencias.
//
// Desde la versión de API 2025-03-31 (basil) Stripe SACÓ `invoice.subscription`
// y movió ese dato a `invoice.parent.subscription_details.subscription`. El
// webhook de FuelHaus recibe eventos con la versión de API del endpoint
// (2026-07-29.dahlia), así que leer solo `invoice.subscription` daba
// `undefined` y el handler de `invoice.paid` ignoraba TODA renovación en
// silencio (respondía 200 sin crear el pedido — caso Axel, 2026-09-22).
// Se aceptan los dos formatos para no depender de la versión de API.

function idOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof value.id === 'string') return value.id;
  return null;
}

// ID de la suscripción que originó la factura, o null si es una factura suelta.
function getInvoiceSubscriptionId(invoice) {
  if (!invoice) return null;
  const details = invoice.parent && invoice.parent.subscription_details;
  return idOf(details && details.subscription) || idOf(invoice.subscription);
}

// Metadata de la suscripción que Stripe copia dentro de la factura (formato
// nuevo). {} si no está — el caller decide si hace falta ir a buscarla.
function getInvoiceSubscriptionMetadata(invoice) {
  const details = invoice && invoice.parent && invoice.parent.subscription_details;
  return (details && details.metadata) || {};
}

// ¿Esta factura pagada representa una semana real para preparar? Las facturas
// de $0 (p. ej. la que Stripe emite al CREAR la suscripción con
// billing_cycle_anchor + proration none, cuyo cobro real ya entró por
// checkout.session.completed) NO deben generar pedido ni avisar al OS.
function isPayableRenewalInvoice(invoice) {
  return !!invoice && Number(invoice.amount_paid) > 0;
}

module.exports = { getInvoiceSubscriptionId, getInvoiceSubscriptionMetadata, isPayableRenewalInvoice };
