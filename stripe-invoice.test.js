const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getInvoiceSubscriptionId, getInvoiceSubscriptionMetadata, isPayableRenewalInvoice } = require('./stripe-invoice');

test('formato nuevo (dahlia): subscription dentro de parent.subscription_details', () => {
  const invoice = { id: 'in_1', parent: { type: 'subscription_details', subscription_details: { subscription: 'sub_new', metadata: { plan: 'performance' } } } };
  assert.equal(getInvoiceSubscriptionId(invoice), 'sub_new');
  assert.deepEqual(getInvoiceSubscriptionMetadata(invoice), { plan: 'performance' });
});

test('formato viejo: invoice.subscription como string o como objeto expandido', () => {
  assert.equal(getInvoiceSubscriptionId({ subscription: 'sub_old' }), 'sub_old');
  assert.equal(getInvoiceSubscriptionId({ subscription: { id: 'sub_exp' } }), 'sub_exp');
});

test('si vienen los dos, gana el formato nuevo', () => {
  assert.equal(getInvoiceSubscriptionId({ subscription: 'sub_old', parent: { subscription_details: { subscription: 'sub_new' } } }), 'sub_new');
});

test('factura suelta (sin suscripción) o basura: null, nunca lanza', () => {
  assert.equal(getInvoiceSubscriptionId({ id: 'in_x', parent: null }), null);
  assert.equal(getInvoiceSubscriptionId({ parent: { quote_details: {}, subscription_details: null } }), null);
  assert.equal(getInvoiceSubscriptionId(null), null);
  assert.equal(getInvoiceSubscriptionId(undefined), null);
  assert.deepEqual(getInvoiceSubscriptionMetadata({}), {});
});

test('isPayableRenewalInvoice: solo facturas con monto cobrado > 0', () => {
  assert.equal(isPayableRenewalInvoice({ amount_paid: 19000 }), true);
  assert.equal(isPayableRenewalInvoice({ amount_paid: 0 }), false);
  assert.equal(isPayableRenewalInvoice({}), false);
  assert.equal(isPayableRenewalInvoice(null), false);
});
