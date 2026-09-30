// coupon-eligibility.js — decide si un cupón aplica, sin tocar la base.
//
// Existe como módulo aparte (igual que stripe-invoice.js) porque es lógica de
// plata y tiene que poder testearse sin Supabase ni Stripe: recibe la lista de
// cupones y la cantidad de pedidos previos del usuario como datos, no los va a
// buscar.
//
// `firstOrderOnly` nació con el flyer de Crunch Fitness (código CRUNCHERS20,
// impreso en papel). Un código impreso no se puede revocar: sin este freno el
// único límite era el contador global `maxUses`, así que el mismo cliente podía
// redimirlo en cada compra. Ahora un cupón marcado así vale una sola vez por
// persona — la primera.

// Descuento en dólares de un cupón sobre el precio de un plan. null = no aplica
// (no llega al monto mínimo de compra); los callers lo tratan igual que
// "cupón inválido".
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

function findActiveCoupon(coupons, code) {
  if (!code) return null;
  const wanted = String(code).trim().toUpperCase();
  return (coupons || []).find(c => c.code.toUpperCase() === wanted && c.active) || null;
}

// Resultado único que usan TODOS los caminos (validar, checkout, finalizar).
// Devuelve { coupon, discount } si aplica, o { error } con el motivo exacto.
// `previousOrderCount` es cuántos pedidos tiene ya esa persona.
function resolveCoupon({ coupons, code, basePrice, previousOrderCount = 0 }) {
  const coupon = findActiveCoupon(coupons, code);
  if (!coupon) return { error: 'Cupón inválido o inactivo', status: 404 };

  if (coupon.maxUses && coupon.uses >= coupon.maxUses)
    return { error: 'Este cupón ya alcanzó su límite de usos', status: 400 };

  if (coupon.firstOrderOnly && previousOrderCount > 0)
    return { error: 'Este cupón es solo para tu primera compra', status: 400 };

  const discount = calcCouponDiscount(coupon, basePrice);
  if (discount === null)
    return { error: `Este cupón requiere una compra mínima de $${coupon.minOrderAmount}`, status: 400 };

  return { coupon, discount };
}

module.exports = { calcCouponDiscount, isValidDiscountFields, findActiveCoupon, resolveCoupon };
