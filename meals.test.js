const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MEALS, PUBLIC_MEALS, PLAN_MEAL_COUNTS } = require('./meals');
const { buildPayload } = require('./fuelhaus-os-sync');

const AXEL_SELECTION = [
  { id: 'axel_chicken_milanesa_roasted_potatoes', qty: 3 },
  { id: 'axel_chicken_milanesa_rice', qty: 2 },
  { id: 'axel_sirloin_quinoa_bowl', qty: 3 },
  { id: 'axel_sirloin_roasted_potatoes', qty: 2 },
];

test('ids del catálogo únicos', () => {
  assert.equal(new Set(MEALS.map(m => m.id)).size, MEALS.length);
});

test('los meals exclusivos de Axel no salen en el catálogo público y los globales siguen intactos', () => {
  assert.equal(PUBLIC_MEALS.length, 8);
  assert.ok(PUBLIC_MEALS.every(m => !m.id.startsWith('axel_')));
  for (const s of AXEL_SELECTION) {
    const meal = MEALS.find(m => m.id === s.id);
    assert.ok(meal, s.id);
    assert.equal(meal.exclusiveUserId, 19);
  }
});

test('la selección permanente de Axel suma 10 (plan performance)', () => {
  assert.equal(AXEL_SELECTION.reduce((a, m) => a + m.qty, 0), PLAN_MEAL_COUNTS.performance);
});

test('un renovación clona la selección de Axel tal cual hacia el payload del OS', () => {
  const order = { id: 99, createdAt: '2026-09-22T13:00:36Z', userName: 'Axel Lema', userEmail: 'a@b.c', plan: 'performance', finalPrice: 190,
    preferences: { meals: AXEL_SELECTION.map(m => ({ ...m, name: 'x' })) } };
  const payload = buildPayload(order, { id: 19 });
  assert.deepEqual(payload.meals, AXEL_SELECTION.map(m => ({ externalMealId: m.id, quantity: m.qty })));
});
