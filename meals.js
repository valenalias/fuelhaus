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
];

// Cantidad de comidas (sin contar activate shots) que trae cada plan — es lo
// que el usuario tiene que completar exacto en "Build your week".
const PLAN_MEAL_COUNTS = { structure: 5, performance: 10, full_system: 13, full_week: 15 };

module.exports = { MEALS, PLAN_MEAL_COUNTS };
