// Sin dependencias externas a propósito (solo Intl/Date nativos) para poder
// testearlo sin arrastrar Supabase/Stripe — mismo criterio que
// subscription-reconcile.js.

// Cuántos días hasta el próximo domingo para el que un cliente NUEVO que se
// registra hoy todavía llega a tiempo. Cocina necesita la lista el miércoles
// a las 15:00, así que la ventana de pedido para el domingo más cercano es
// de lunes a miércoles ANTES de esa hora; de miércoles 15:00 en adelante (o
// de jueves a sábado, o si hoy ya es domingo) el pedido pasa directamente al
// domingo siguiente al inmediato.
const ORDER_CUTOFF_TIMEZONE = 'America/New_York'; // hora de Miami
const ORDER_CUTOFF_WEDNESDAY_HOUR = 15;
const DAYS_UNTIL_FIRST_DELIVERY = { 0: 7, 1: 6, 2: 5, 3: 4, 4: 10, 5: 9, 6: 8 };

// Día de la semana (0=domingo) y fecha de calendario de `now` en hora de
// Miami — sin esto, el corte dependería del huso horario en el que corra el
// server (Vercel corre en UTC), y un pedido de la tarde/noche en Miami podría
// caer del lado equivocado de la fecha.
function miamiDateParts(now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ORDER_CUTOFF_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0; // algunos motores ICU devuelven "24" en vez de "00" a medianoche
  return { year: Number(get('year')), month: Number(get('month')), day: Number(get('day')), weekday: weekdayMap[get('weekday')], hour };
}

function firstDeliverySundayDate(now = new Date()) {
  const { year, month, day, weekday, hour } = miamiDateParts(now);
  let daysUntil = DAYS_UNTIL_FIRST_DELIVERY[weekday];
  if (weekday === 3 && hour >= ORDER_CUTOFF_WEDNESDAY_HOUR) {
    daysUntil += 7; // miércoles después del corte: mismo salto de semana que jueves/viernes/sábado
  }
  // Mediodía UTC de la fecha de calendario de Miami: a esa hora ningún huso
  // horario de América ya cruzó a otro día, así que sumar días acá no se
  // corre por el huso horario en el que ejecute el server.
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  d.setUTCDate(d.getUTCDate() + daysUntil);
  return d;
}

module.exports = { firstDeliverySundayDate };
