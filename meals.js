// Catálogo de comidas — fuente única para servidor y cliente (vía /api/meals).
// Cada meal ya trae los campos de imagen y macros preparados para más
// adelante (hoy en null): así se pueden completar sin tocar la estructura.

const MEALS = [
  {
    id: 'sirloin_quinoa_bowl',
    name: 'Sirloin Quinoa Bowl',
    description: 'Grilled sirloin · quinoa · spinach · mushrooms · caramelized onion',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'beef_burrito',
    name: 'Beef Burrito',
    description: 'Lean ground beef · veggie rice · tortillas',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'beef_rice',
    name: 'Beef & Rice',
    description: 'Lean ground beef · veggie rice',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'chicken_rice_broccoli',
    name: 'Chicken Rice & Broccoli',
    description: 'Grilled chicken · veggie rice · broccoli',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'chicken_roasted_potatoes',
    name: 'Chicken & Roasted Potatoes',
    description: 'Grilled chicken · roasted potatoes · spinach · peppers · onion',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'chicken_milanesa_rice',
    name: 'Chicken Milanesa & Rice',
    description: 'Oven-baked chicken milanesa · veggie rice · cabbage · carrot · onion',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'chicken_milanesa_roasted_potatoes',
    name: 'Chicken Milanesa & Roasted Potatoes',
    description: 'Oven-baked chicken milanesa · roasted potatoes · cabbage · carrot · onion',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'tilapia_roasted_potatoes',
    name: 'Tilapia & Roasted Potatoes',
    description: 'Grilled tilapia · roasted potatoes · broccoli',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },

  // ── Meals exclusivos de un cliente (2026-09-25) ─────────────────────────────
  // Variantes con gramajes propios de un cliente. NO salen en el catálogo
  // público (/api/meals los filtra) y solo los puede elegir su dueño
  // (`exclusiveUserId`, ver isValidMealSelection en server.js). Cada uno tiene
  // su propio meal + receta + mapping en el OS, así que NO alteran a los meals
  // globales de arriba. Recetas exactas en el OS (fuelhaus_meals "· Axel").
  {
    id: 'axel_chicken_milanesa_roasted_potatoes',
    exclusiveUserId: 19, // Axel Lema
    name: 'Chicken Milanesa & Roasted Potatoes',
    description: 'Milanesa 180 g · roasted potatoes 170 g · cabbage, carrot & onion mix 130 g',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'axel_chicken_milanesa_rice',
    exclusiveUserId: 19,
    name: 'Chicken Milanesa & Rice',
    description: 'Milanesa 180 g · rice 170 g · broccoli 100 g',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'axel_sirloin_quinoa_bowl',
    exclusiveUserId: 19,
    name: 'Sirloin Quinoa Bowl',
    description: 'Sirloin 180 g · quinoa 170 g · spinach 50 g · mushrooms 40 g · onion 40 g',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
  {
    id: 'axel_sirloin_roasted_potatoes',
    exclusiveUserId: 19,
    name: 'Sirloin & Roasted Potatoes',
    description: 'Sirloin 180 g · roasted potatoes 170 g · spinach 130 g',
    image: null, calories: null, protein: null, carbs: null, fats: null,
  },
];

// Catálogo que ve el público en "Build your week": sin los exclusivos.
const PUBLIC_MEALS = MEALS.filter(m => m.exclusiveUserId === undefined);

// Cantidad de comidas (sin contar activate shots ni snacks) que trae cada
// plan — es lo que el usuario tiene que completar exacto en "Build your
// week". full_system son 5 almuerzos + 5 cenas = 10 (los 3 snacks NO son
// "meals" seleccionables acá, quedaba mal contado en 13 antes de este fix).
const PLAN_MEAL_COUNTS = { structure: 5, performance: 10, full_system: 10, full_week: 15 };

// Cantidad de activate shots que incluye cada plan por semana (mismos números
// que el texto de los planes en home.html/index.html). Es lo que se manda al
// OS como `shotQuantity` para que producción/packaging cuente los shots de
// cada pedido — sin esto eran solo texto de marketing.
const PLAN_SHOT_COUNTS = { structure: 5, performance: 5, full_system: 5, full_week: 7 };

module.exports = { MEALS, PUBLIC_MEALS, PLAN_MEAL_COUNTS, PLAN_SHOT_COUNTS };
