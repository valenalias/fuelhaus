const test = require('node:test');
const assert = require('node:assert');
const { calcCouponDiscount, resolveCoupon, findActiveCoupon } = require('./coupon-eligibility');

const CRUNCH = { id: 1, code: 'CRUNCHERS20', discountType: 'fixed', discountValue: 20,
                 minOrderAmount: null, maxUses: 250, uses: 0, active: true, firstOrderOnly: true };
const BIENVENIDA = { id: 2, code: 'BIENVENIDA', discountType: 'percent', discountValue: 10,
                     minOrderAmount: null, maxUses: null, uses: 0, active: true, firstOrderOnly: false };

test('calcCouponDiscount: monto fijo', () => {
  assert.equal(calcCouponDiscount(CRUNCH, 190), 20);
});

test('calcCouponDiscount: el monto fijo nunca supera al precio del plan', () => {
  assert.equal(calcCouponDiscount(CRUNCH, 15), 15);
});

test('calcCouponDiscount: porcentaje', () => {
  assert.equal(calcCouponDiscount(BIENVENIDA, 190), 19);
});

test('calcCouponDiscount: no llega a la compra mínima -> null', () => {
  assert.equal(calcCouponDiscount({ ...CRUNCH, minOrderAmount: 200 }, 190), null);
});

test('findActiveCoupon: no distingue mayúsculas ni espacios al borde', () => {
  assert.equal(findActiveCoupon([CRUNCH], '  crunchers20 ').id, 1);
});

test('findActiveCoupon: ignora los inactivos', () => {
  assert.equal(findActiveCoupon([{ ...CRUNCH, active: false }], 'CRUNCHERS20'), null);
});

test('firstOrderOnly: primera compra de la persona -> aplica', () => {
  const r = resolveCoupon({ coupons: [CRUNCH], code: 'CRUNCHERS20', basePrice: 190, previousOrderCount: 0 });
  assert.equal(r.discount, 20);
  assert.equal(r.error, undefined);
});

test('firstOrderOnly: la persona ya compró antes -> rechaza', () => {
  const r = resolveCoupon({ coupons: [CRUNCH], code: 'CRUNCHERS20', basePrice: 190, previousOrderCount: 1 });
  assert.equal(r.discount, undefined);
  assert.match(r.error, /primera compra/);
});

test('sin firstOrderOnly: un cliente con pedidos previos lo sigue pudiendo usar', () => {
  const r = resolveCoupon({ coupons: [BIENVENIDA], code: 'BIENVENIDA', basePrice: 190, previousOrderCount: 5 });
  assert.equal(r.discount, 19);
});

test('el tope global maxUses se chequea antes que firstOrderOnly', () => {
  const r = resolveCoupon({ coupons: [{ ...CRUNCH, uses: 250 }], code: 'CRUNCHERS20',
                            basePrice: 190, previousOrderCount: 0 });
  assert.match(r.error, /límite de usos/);
});

test('código inexistente -> 404', () => {
  const r = resolveCoupon({ coupons: [CRUNCH], code: 'NOEXISTE', basePrice: 190 });
  assert.equal(r.status, 404);
});

test('sin código -> 404, no rompe', () => {
  assert.equal(resolveCoupon({ coupons: [CRUNCH], code: null, basePrice: 190 }).status, 404);
});

test('previousOrderCount por defecto es 0: no bloquea a quien nunca compró', () => {
  assert.equal(resolveCoupon({ coupons: [CRUNCH], code: 'CRUNCHERS20', basePrice: 190 }).discount, 20);
});

// ── FIRSTWEEK20: tarjeta First Week Pass (impresa, entrega personal) ───────────
const FIRSTWEEK = { id: 3, code: 'FIRSTWEEK20', discountType: 'fixed', discountValue: 20,
                    minOrderAmount: null, maxUses: 200, uses: 0, active: true, firstOrderOnly: true };

test('FIRSTWEEK20: $20 off en la primera compra, con cualquier plan', () => {
  for (const price of [120, 190, 265]) {
    const r = resolveCoupon({ coupons: [FIRSTWEEK], code: 'firstweek20', basePrice: price, previousOrderCount: 0 });
    assert.equal(r.discount, 20);
  }
});

test('FIRSTWEEK20: una persona que ya compró no puede usarlo', () => {
  const r = resolveCoupon({ coupons: [FIRSTWEEK], code: 'FIRSTWEEK20', basePrice: 190, previousOrderCount: 1 });
  assert.equal(r.status, 400);
  assert.match(r.error, /primera compra/);
});

test('FIRSTWEEK20: se corta al llegar al límite de usos', () => {
  const r = resolveCoupon({ coupons: [{ ...FIRSTWEEK, uses: 200 }], code: 'FIRSTWEEK20', basePrice: 190, previousOrderCount: 0 });
  assert.equal(r.status, 400);
  assert.match(r.error, /límite de usos/);
});

test('FIRSTWEEK20: desactivado desde el admin deja de valer', () => {
  const r = resolveCoupon({ coupons: [{ ...FIRSTWEEK, active: false }], code: 'FIRSTWEEK20', basePrice: 190, previousOrderCount: 0 });
  assert.equal(r.status, 404);
});
