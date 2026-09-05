# HANDOFF — FuelHaus

Última actualización: 2026-09-05 (ver sección "Autopay semanal (suscripciones)" — sesión más reciente)

## Autopay semanal (suscripciones recurrentes de Stripe) — sesión 2026-09-05

**Objetivo:** el checkout pasó de pago único a **cobro automático semanal
real** (Stripe `mode: 'subscription'`), con una política de cancelación
clara. Plan completo (contexto de negocio, diseño técnico, checklist
manual de Stripe) guardado en
`C:\Users\valen\.claude\plans\reactive-noodling-clock.md` — este resumen
es la versión corta.

**Día de corte = día de cobro = martes** para TODOS los suscriptores, sin
importar qué día se hayan suscripto (investigado: HelloFresh corta 5 días
antes de la entrega, que es exactamente martes para una entrega de
domingo — coincide con lo que cocina necesita, que es la lista 3 días
antes del sábado de prep, o sea miércoles; martes deja 1 día de margen).
Se logra con `subscription_data.billing_cycle_anchor` calculado por
`nextTuesdayAnchor()` en `server.js` — cobra el precio completo ahora
mismo (cubre desde el signup hasta ese martes) y de ahí en más siempre
los martes, sin importar el día de la semana en que alguien se suscriba.

**Cancelación = Stripe Customer Portal** (`POST /api/subscription/portal`,
botón "Gestionar mi suscripción" en la vista de cuenta) — cancela al
final del período ya pagado, nunca inmediato. **Requiere activar el
Portal a mano en el Dashboard de Stripe** (test y live) y elegir
explícitamente "Cancel at end of billing period" — el default de Stripe
NO es ese.

**Meals se repiten automáticamente** cada semana — cada renovación real
(`invoice.paid` con `billing_reason: 'subscription_cycle'`) clona el
pedido más reciente del usuario (mismo plan, mismas preferencias/meals
ya resueltas) en un pedido nuevo, sin que el cliente tenga que volver a
elegir nada. El pedido de la primera semana sigue creándose vía
`checkout.session.completed`, como antes.

**Cupón de descuento: solo la primera semana.** Se aplica como un Stripe
Coupon (`duration: 'once'`) por separado, no se mezcla con el precio
recurrente — la suscripción siempre cobra el precio COMPLETO del plan;
el descuento desaparece solo después de la primera factura.

**Un cupón que deja el precio en $0 sigue siendo un pedido único, sin
suscripción de Stripe** — decisión explícita, no se auto-renueva.

**Clientes que ya pagaron con el flujo viejo (pago único) no se
convierten solos a autopay** — tienen que volver a pasar por el checkout
si Valen quiere pasarlos a suscripción (Stripe no puede convertir un pago
ya hecho).

**Migración de base de datos (correr en Supabase ANTES de deployar):**
```sql
ALTER TABLE users  ADD COLUMN IF NOT EXISTS stripe_customer_id                  TEXT;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS stripe_subscription_id              TEXT;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS subscription_status                 TEXT;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS subscription_current_period_end     TIMESTAMPTZ;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_invoice_id                   TEXT UNIQUE;
```

**De paso se corrigió un bug real en `db.js`:** `Users.getAll/getById/
getByEmail` y sus equivalentes en `Orders`/`Coupons` ignoraban el `error`
que devuelve Supabase en un SELECT — si la conexión fallaba, se
comportaban igual que "no existe" en vez de tirar un error real. Esto
importaba especialmente para la nueva lógica de `invoice.paid` (buscar
el usuario de una suscripción): con el bug, una falla transitoria de
conexión hubiera hecho que un cobro real no genere ningún pedido, sin
ningún rastro del problema. Corregido con `if (error) throw error;` en
los métodos de lectura.

**Checklist manual pendiente en el Dashboard de Stripe (Valen, antes de
que esto funcione de punta a punta):**
1. Ampliar el webhook **live** ya existente (hoy solo escucha
   `checkout.session.completed`) para que también escuche: `invoice.paid`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
2. Crear/ajustar el webhook de **test** (Preview) con los mismos eventos.
3. Activar el **Customer Portal** en test y en live, con cancelación
   configurada como **"Cancel at end of billing period"** (no es el
   default).

**Probado sin tocar Supabase real:** toda la lógica de webhooks
(clonado de renovación, dedup por reintento, choque de restricción
UNIQUE, suscripción huérfana, `customer.subscription.updated/deleted`)
con eventos de Stripe firmados a mano (HMAC-SHA256, mismo esquema que
`stripe.webhooks.constructEvent`) contra la base en memoria — no hace
falta una cuenta de Stripe real para probar esta parte. La función
`nextTuesdayAnchor()` se probó para los 7 días de la semana. Lo que NO
se pudo probar sin claves reales: la creación real de la Checkout
Session en modo suscripción, el Stripe Coupon `duration:'once'`, y el
Customer Portal — para eso hace falta un checkout de verdad en modo
test contra el deploy de preview (ver más abajo).

**Nota aparte, no relacionada:** encontré una sección vieja "🔴 Lo más
urgente — sistema de cuentas caído en producción" en este mismo archivo,
de una sesión anterior — ya estaba resuelta (confirmado hoy: login real
+ lectura de datos reales contra esa misma Supabase funcionó sin
problema en la sesión de ayer). La borré para que no vuelva a confundir
a nadie — si hace falta el detalle histórico, está en el historial de
git de este archivo.

## Fix: botón "Quiero empezar" del formulario de Contacto (sesión 2026-09-04)

Mismo tipo de bug que el de los botones "Elegir plan" (ver sección de
abajo), pero en el formulario genérico de la sección Contacto/CTA
(nombre + email, arriba del footer): también tenía
`onsubmit="return false"`, no hacía nada. A diferencia de los botones de
plan (que ya tienen plan elegido), acá Valen decidió que el destino sea
el mismo: mandarlo a crear cuenta, con nombre y email ya completados —
no un lead manual por WhatsApp.

**Implementación:** `index.html` guarda `{name, email}` en
`sessionStorage.fh_prefill` y redirige a `/login` (sin querystring —
nunca poner email en la URL). `login.html` lo lee una sola vez al cargar
(se borra apenas se usa), precarga el form de "Crear cuenta" y activa esa
pestaña. Mismo patrón que el prefill de `?plan=` ya existente, pero por
sessionStorage en vez de querystring porque acá sí hay un email de por
medio.

**Verificado en navegador:** completar nombre+email en el form de
Contacto → aterriza en `/login` con la pestaña "Crear cuenta" activa y
ambos campos ya completados, solo falta poner contraseña.

## Forgot password + cupones flexibles (sesión 2026-09-04)

**"Olvidé mi contraseña" — flujo manual (no email automático):** en
`login.html` hay un link "¿Olvidaste tu contraseña?" bajo el form de
login. Abre una sub-vista (mismo patrón de tabs que login/registro): pide
el email, llama a `POST /api/auth/request-password-reset` (nuevo,
público, siempre responde `{ok:true}` exista o no el email — evita
enumeración) y muestra un botón de WhatsApp con mensaje prellenado. **No
manda email real** — el reset de Resend (rama vieja `forgot-password`,
sin mergear) sigue bloqueado por falta de dominio propio verificado, y
el usuario decidió explícitamente resolverlo así por ahora en vez de
conseguir el dominio. Del lado del servidor, si el email existe, se
antepone un timestamp a `users.notes` (columna ya existente, sin
migración) — el admin lo ve tal cual al abrir "Editar usuario" en el
panel, y resetea la contraseña ahí mismo (esa función ya existía).

**Cupones con tipo de descuento (porcentaje o monto fijo) + monto mínimo
de compra:** en el panel, "Nuevo cupón" ahora tiene un selector de tipo
("Porcentaje (%)" / "Monto fijo ($)") que cambia el label/placeholder del
campo de descuento en vivo, y un campo opcional "Compra mínima para que
aplique". El cupón solo se aplica si el precio del plan elegido es ≥ ese
mínimo (sino, `/api/coupons/validate` devuelve 400 explicando el motivo).
Un descuento fijo nunca deja el precio en negativo (clamp a `basePrice`).
Se descartó explícitamente "envío gratis" como tipo — no hay costo de
envío separado en este negocio (precio semanal fijo por plan).

**Migración de base de datos (ya corrida en Supabase por Valen,
2026-09-04):**
```sql
ALTER TABLE coupons RENAME COLUMN discount_percent TO discount_value;
ALTER TABLE coupons ALTER COLUMN discount_value TYPE NUMERIC;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percent';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC;
```
El cupón `FULLHAUS` existente no se tocó — con el rename + default
`'percent'` queda migrado solo, sin re-crearlo. La tabla `orders` no
cambió de schema: `discount_percent` (snapshot histórico) queda en 0
para pedidos con cupón de tipo fijo, y `discount_amount` siempre tiene
el monto real descontado en dólares — el admin/cliente lo muestra
correctamente para ambos tipos (`formatOrderDiscount()` en `admin.js`).

**Verificado:** API completa (crear cupón % y fijo, rechazo de % > 100,
validación con mínimo no alcanzado y alcanzado, clamp de fijo mayor al
precio, pedido creado con `discountPercent:0`/`discountAmount` correcto)
+ UI completa en navegador (modal admin, tabla con columna "Mínimo",
resumen de pago del cliente mostrando "$15" en vez de "(0%)", flujo de
"olvidé mi contraseña" de punta a punta incluido el link de WhatsApp) —
todo contra una base en memoria local para no tocar la Supabase
compartida con producción durante el testing.

**Deploy de preview con todo esto (meals + fix de landing + forgot
password + cupones):**
https://fuelhaus-5fd8c06o2-valenalias1.vercel.app — requiere la
migración de arriba ya corrida en Supabase (confirmado por Valen antes
de deployar).

**⚠️ Pendiente de confirmar con Valen:** al verificar este deploy contra
la Supabase real, `admin@fuelhaus.com` / `Fuelhaus2025` (credenciales que
constaban en la nota del vault) devolvió "Email o contraseña
incorrectos". Puede que la contraseña se haya cambiado en algún momento
no registrado, o haber sido un problema puntual — no se insistió
probando más contraseñas. Confirmar la contraseña real del admin antes
de asumir que sigue siendo esa.

## Fix: los botones "Elegir plan" no llevaban a comprar (sesión 2026-09-04)

**Bug preexistente (no introducido hoy) encontrado al testear "Build your
week":** en la landing pública (`index.html`), los 4 botones "Elegir
Structure/Performance/Full System/Full Week" de la sección de planes
apuntaban a `href="#contacto"` — un formulario decorativo de nombre+email
al fondo de la página cuyo `<form onsubmit="return false;">` no hace
absolutamente nada al enviarlo. Un visitante que clickeaba "Elegir X"
nunca podía comprar: caía en un formulario muerto.

**Fix:** esos 4 botones ahora apuntan a `/login?plan={structure|
performance|full_system|full_week}`. Cambios en cadena:
- `login.html`: si hay `?plan=` en la URL, abre directo en la pestaña
  "Crear cuenta" (más probable que un visitante nuevo no tenga cuenta
  todavía) y lo preserva a través del login/registro exitoso —
  `window.location.href = '/home' + planQuery()` en vez de `/home` a
  secas (login) o `/` (registro, antes mandaba de vuelta a la landing en
  vez de al onboarding — también corregido).
- `home.html`: en `init()`, si el usuario no tiene pedidos y llega con
  `?plan=X` válido, lo aplica directo (`applyPreselectedPlan()`) y salta
  a "Arma tu semana" sin volver a mostrarle la grilla de planes — el
  querystring se limpia con `history.replaceState` para no arrastrarlo en
  refresh/back.

**Verificado end-to-end:** navegar a `/login?plan=performance` → pestaña
"Crear cuenta" ya activa → registrar → aterriza directo en "Build your
week" paso 2 de 5 con Performance ya aplicado (10 meals a elegir), sin
tener que re-elegir el plan. El clic real del botón en la landing (con
la animación del loader GSAP) no se pudo confirmar por automation por el
mismo problema de pestaña-en-segundo-plano ya documentado más abajo — es
un artefacto del entorno de testing, no del sitio (el link es un
`<a href>` plano sin JS que lo intercepte, confirmado por grep de
`main.js`).

**Deploy de preview con este fix:**
https://fuelhaus-gn3x5p657-valenalias1.vercel.app (reemplaza al preview
anterior de la sesión, que no tenía este arreglo).

## Build your week (selección de meals) — sesión 2026-09-04

**Objetivo:** después de elegir el plan, el usuario elige exactamente qué
meals quiere dentro de la cantidad incluida (puede repetir platos). Se
implementó como un paso nuevo en el onboarding, entre "Plan" y "Datos".

**Catálogo (`meals.js`, nuevo):** fuente única de los 8 meals iniciales
(Sirloin Quinoa Bowl, Beef Burrito, Beef & Rice, Chicken Rice & Broccoli,
Chicken & Roasted Potatoes, Chicken Milanesa & Rice, Chicken Milanesa &
Roasted Potatoes, Tilapia & Roasted Potatoes) y de `PLAN_MEAL_COUNTS`
(cuántas meals exige cada plan, sin contar shots): `structure: 5,
performance: 10, full_system: 13, full_week: 15`. Cada meal ya trae los
campos `image`, `calories`, `protein`, `carbs`, `fats` en `null` — listos
para completar más adelante sin tocar la estructura ni el resto del código
(cards, admin, Stripe). `server.js` expone `GET /api/meals` (público, sin
auth) para que el cliente lo consuma sin duplicar el catálogo.

**Fotos:** todavía no hay imágenes reales. Mientras `meal.image` sea
`null`, la card muestra un degradé de marca (`--cream-dark` → blanco) con
un ícono de cubiertos centrado — se ve intencional, no roto ni "vacío".
Cuando se cargue una foto real, la card la muestra automáticamente sin
cambios de componente.

**Validación:** el conteo es 100% client-side para la UX (botones +/− se
deshabilitan al llegar al tope, botón "Continuar" solo se habilita con el
total exacto) **y también server-side** (`isValidMealSelection` en
`server.js`, corre antes de tocar Stripe/Supabase en los 3 puntos donde se
puede crear un pedido: `/api/orders`, `/api/orders/checkout` y el webhook
de Stripe) — rechaza sumas incorrectas e ids inventados con
`400 Selección de comidas inválida`.

**Persistencia:** la selección se guarda dentro de `orders.preferences.meals`
(columna JSONB existente, sin migración de schema) como
`[{ id, name, qty }]` — el `name` siempre se resuelve server-side contra el
catálogo (nunca se confía en lo que mande el cliente). En el checkout con
Stripe, la selección viaja en un metadata field propio (`meals`, compacto
como `{id,qty}`) **separado** del campo `preferences` existente (que ya se
trunca a 490 caracteres) — así nunca se corta ni rompe el JSON del webhook
aunque el cliente elija los 8 meals distintos (peor caso medido: ~310
caracteres, límite de Stripe: 500).

**Admin (`admin.js`):** el modal de detalle de pedido ahora muestra
"Comidas seleccionadas" con el formato `Nombre ×cantidad` separado por
comas, leyendo directo de `preferences.meals` (sin necesitar el catálogo).

**i18n:** el onboarding pasó de 4 a 5 pasos (Plan → Comidas → Datos →
Preferencias → Pago) — se renombraron las claves `step*_of_4` a
`step*_of_5` en `i18n.js` (ES y EN) y se agregó `progress_meals`,
`meals_title_html`, `meals_sub`, `meals_progress_line`,
`meals_remaining_btn`, `err_meals_incomplete`, `w_step2` (welcome ahora
lista 5 pasos). El texto dinámico de la barra inferior de conteo (igual
que `pay-plan-name`/cupón) solo se re-traduce en la próxima interacción
del usuario, no al vuelo al tocar ES/EN — mismo comportamiento preexistente
del resto del flujo, no es una regresión nueva.

**Probado (ver playbook de testing local sin Supabase más abajo):** los 4
planes con distintas combinaciones (Structure 5, Performance 10 con 3
meals distintos, Full System 13, Full Week 15 con 5 meals distintos),
intentar continuar incompleto (bloqueado por UI y por API), ids
inventados (rechazado 400), y verificación end-to-end en navegador real
incluyendo el panel admin y el toggle ES/EN. Precio/Stripe/planes
existentes no se tocaron — se verificó que el summary de pago sigue
mostrando el precio correcto de cada plan sin cambios.

**Pendiente (no bloqueante):** `PLAN_NAMES_ADMIN` en `admin.js` no incluye
`full_week` (bug preexistente, de cuando se agregó el plan — no se tocó
por estar fuera de alcance de esta sesión) — los pedidos Full Week
muestran el plan como texto crudo `full_week` en vez de "Full Week" en el
modal de detalle del admin.

## Stripe en modo LIVE (sesión 2026-09-04)

Se pasó Stripe de modo test a **modo live** (cobros reales). Se generó la
Secret Key live (`sk_live_...`) y un webhook nuevo en modo live (Developers
→ Webhooks, endpoint `https://fuelhaus.vercel.app/api/stripe/webhook`,
evento `checkout.session.completed`, con su propio `whsec_...`). Ambas
claves se cargaron en Vercel **solo en Production** (Preview se dejó con
las claves de test, así los deploys de preview no arriesgan cobrar de
verdad).

De paso se detectó y arregló un bug del deploy manual (`vercel deploy`):
no respetaba el `.gitignore` e intentaba subir 1.8GB de
`BRANDING/CONTENIDO-NUEVO/` (assets no usados por el sitio), rompiendo el
deploy. Se agregó `.vercelignore` (commit `3a2cd98`).

**Pendiente:** hacer una compra real chica de punta a punta para confirmar
que el webhook crea el pedido en Supabase con las claves live (implica un
cargo real, reembolsable después desde el Dashboard de Stripe si es solo
de prueba) — no se hizo en esta sesión porque involucra plata real.

## Contexto

- **Deploy:** https://fuelhaus.vercel.app (auto-deploy vía Vercel, conectado
  a GitHub, rama `main`)
- **Repo:** https://github.com/valenalias/fuelhaus
- **Admin:** admin@fuelhaus.com / Fuelhaus2026

## Rama abierta sin mergear: `forgot-password`

Preview: https://fuelhaus-git-forgot-password-valenalias1.vercel.app

Construido: link "¿Olvidaste tu contraseña?" en `login.html`, endpoint que
genera un token de un solo uso (vence en 1 hora) y manda un email vía
**Resend** con un link para elegir nueva contraseña, y la pantalla para
definirla. Todo traducido ES/EN.

**No se puede probar de punta a punta ni mergear todavía.** Faltan 3 cosas,
todas fuera del código:

1. Que Supabase vuelva a estar accesible (ver arriba).
2. Correr en el SQL Editor de Supabase (agrega columnas nuevas a `users`
   sin tocar datos existentes, ya está en `supabase-schema.sql`):
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
   ```
3. Crear cuenta gratuita en **resend.com**, verificar el dominio
   `fuelhaus.com` (registros DNS, probablemente en Cloudflare) y cargar
   `RESEND_API_KEY` como variable de entorno en Vercel. Si esta env var no
   está configurada, el endpoint no rompe pero tampoco manda el email
   (queda logueado server-side).

## Qué se hizo en esta etapa (ya en `main`, en producción)

### Mobile UX + fotos reales de marca
- Pase completo de UX mobile (inputs que hacían zoom en iOS, barra de
  progreso del checkout que se cortaba en pantallas chicas, hero
  rediseñado para mobile a sangre completa en vez de la versión de
  escritorio apretada).
- Fotos reales de la marca (de un WeTransfer con 162 archivos) reemplazando
  fotos de stock/corporativas en hero, CTA final y footer. El hero final es
  una foto generada con IA (prompt del cliente) por sobre las fotos reales
  disponibles, que se sentían "de producto" en vez de lifestyle.
- Fix de un bug real de scroll horizontal en iOS: `overflow-x:hidden`
  estaba solo en `body`; en iOS el scroll horizontal lo controla `html`, así
  que el hero full-bleed (`calc(50% - 50vw)`) podía escaparse y dejar la
  página corrida hacia la izquierda de forma permanente durante el scroll.

### Sitio bilingüe ES/EN
- Sistema de traducción propio (`public/js/i18n.js`, sin dependencias) vía
  atributos `data-i18n*` en el HTML. Español siempre por defecto sin
  importar el idioma del navegador (decisión de negocio explícita).
  Selector ES/EN en el header, recordado en `localStorage`.
- Cubre landing, login/registro y todo el flujo de onboarding/checkout de
  `home.html` (incluye textos generados por JS, no solo HTML estático).
- Fix encontrado en QA: el auto-traductor de Chrome traducía por encima del
  sistema propio y corrompía el nombre de marca — se agregó
  `<meta name="google" content="notranslate">`.

### Animaciones (GSAP + ScrollTrigger)
- Revisión completa de motion en todo el sitio: reveals de entrada al
  scrollear, parallax en la sección de ingredientes y el CTA, contador
  animado en "Nosotros", tilt con mouse en cards (desktop), botón de
  WhatsApp con pulso, etc.
- La sección "Tres pasos" tuvo varias rondas de ajuste por feedback directo
  del cliente probando en su celular: pulsos que quedaban infinitos
  (`repeat:-1`) se leían como "la página está trabada" en vez de sutiles —
  se corrigió a repeticiones finitas. Las flechas quedaban tapadas por las
  cards por una regla de stacking de CSS (`.step-card` con
  `position:relative` pinta por encima de elementos sin `position`) — se
  corrigió con `z-index` explícito. El pulso del ícono terminó sacándose
  del todo porque quedaba mal ubicado al escalar dentro de la card.

### Optimización de velocidad de carga
- Dos fotos del menú estaban a una resolución muy por encima de lo que se
  muestra en pantalla (300KB/254KB para una miniatura de ~390×340px) — se
  redimensionaron y recomprimieron sin pérdida visible. En total, casi
  400KB menos en la primera visita.
- La foto del hero (elemento más grande de la primera pantalla / LCP) ahora
  tiene `<link rel="preload" fetchpriority="high">` para que el navegador
  la empiece a bajar antes de terminar de parsear CSS/fuentes.
- Se midió si separar Font Awesome en piezas más chicas ayudaba — no
  (18.9KB comprimido el paquete completo vs 19KB separado en 3 pedidos), no
  se tocó.

## Pendientes de antes, siguen vigentes

1. **Testimonios** — sección lista pero comentada en `index.html`, buscar
   `TESTIMONIOS (pendiente de activar)`. Falta contenido real: 2-3
   mensajes de WhatsApp o reviews de clientes reales, con nombre (o
   iniciales) y plan.

2. **Sección "Próximamente"** (drinks funcionales, postres altos en
   proteína, açaí bowls) — fotos ya procesadas y guardadas sin usar:
   `public/img/soon-drinks.jpg`, `soon-desserts.jpg`, `soon-acai.jpg`.
   Falta armar la sección, enmarcada como roadmap de producto, sin CTA de
   compra.

3. **Precio semanal vs. membresía mensual** — el sitio dice "por semana" en
   todos lados, pero la política real es mensual (se cancela con una
   semana de anticipación al primer domingo del mes). Es decisión de
   negocio del cliente, no se tocó.

4. **Archivos sin usar en `public/img/`** — `LOGO.jpeg`,
   `MENU-PLANES-COMIDA2.jpeg` (2.4MB), `NOSOTROS-STAND.jpeg`,
   `MENU-PLANES.jpeg`, `MENU-PLANES-COMIDA1.jpeg`, `hero-wrap.jpg`. No
   afectan la velocidad de carga (nadie los descarga si no están
   referenciados), pero ocupan espacio de más. No se borraron por las
   dudas.

5. **Stripe** — implementado (ver sección "Stripe Checkout" más abajo, sesión
   2026-08-31). Falta que el cliente termine de configurarlo (SQL, env vars,
   webhook) y probarlo en modo test antes de pasar a claves live.

## Stripe Checkout (sesión 2026-08-31)

**Qué cambió:** el paso "Confirmar pedido" del onboarding (`home.html`) ya no
crea el pedido directo con `status: paid` — ahora crea una Stripe Checkout
Session y redirige ahí. El pedido recién se crea en Supabase cuando llega el
webhook `checkout.session.completed` (o, si un cupón deja el precio en $0,
se crea directo sin pasar por Stripe). Cobro **único por pedido** (no
suscripción recurrente) — coherente con el modelo actual de "un pedido por
selección de plan"; la membresía mensual real (ver punto 3 de arriba) sigue
sin resolver y queda fuera de esta etapa.

**Archivos tocados:**
- `server.js`: `POST /api/orders/checkout` (crea la sesión de Stripe o el
  pedido gratis directo) y `POST /api/stripe/webhook` (público, valida firma,
  crea el pedido — idempotente por `stripe_session_id`). Lógica de creación
  de pedido compartida en `finalizeOrder()`. `express.json({ verify })` guarda
  el body crudo en `req.rawBody` para la verificación de firma sin tener que
  reordenar middlewares.
- `db.js`: mapeo `stripeSessionId`/`stripePaymentIntentId` ↔
  `stripe_session_id`/`stripe_payment_intent_id`.
- `supabase-schema.sql`: columnas nuevas en `orders` (`stripe_session_id`
  UNIQUE, `stripe_payment_intent_id`) — **falta correr el ALTER en la DB real
  de producción**, ver abajo.
- `public/home.html`: `confirmOrder()` ahora llama a `/api/orders/checkout`;
  si devuelve `url` redirige a Stripe; si devuelve `order` (cupón 100%) va
  directo a la pantalla de confirmación. Nuevo paso `step-processing`
  (spinner "Confirmando tu pago…") para la vuelta desde Stripe. El estado del
  flujo (plan, cupón, datos, preferencias) se guarda en `sessionStorage`
  antes de redirigir a Stripe, para poder restaurarlo si el usuario cancela.
- `public/js/i18n.js`: strings nuevos ES/EN para el paso de "procesando
  pago", el error de "el pago está tardando" y el aviso de pago cancelado.
- `package.json`: dependencia `stripe` (`^22.6.0`).
- `.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

**Pendiente para que funcione en producción (a cargo de Valen):**
1. Correr en el SQL Editor de Supabase (proyecto `ohnedhcnqcmhaggyddjx`):
   ```sql
   ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;
   ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
   ```
2. En el Dashboard de Stripe (modo test primero): Developers → API keys →
   copiar la Secret key (`sk_test_...`).
3. En el Dashboard de Stripe: Developers → Webhooks → Add endpoint → URL
   `https://fuelhaus.vercel.app/api/stripe/webhook` → evento
   `checkout.session.completed` → copiar el Signing secret (`whsec_...`).
4. Cargar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en Vercel
   (Project Settings → Environment Variables, Production y Preview).
5. Probar un pedido completo en modo test (tarjeta `4242 4242 4242 4242`,
   cualquier fecha futura/CVC) de punta a punta antes de pasar a claves live.
6. Recién ahí reemplazar por las claves **live** (`sk_live_...`/
   `whsec_...` del webhook en modo live — es un endpoint nuevo, con su
   propio signing secret) y volver a probar con una tarjeta real.

**No bloqueado por falta de dominio propio** (a diferencia del reset de
contraseña con Resend, ver rama `forgot-password`) — Stripe funciona con
cualquier URL pública, `fuelhaus.vercel.app` alcanza.

## Plan Full Week (sesión 2026-08-31, en producción)

**Cuarto plan:** $265/semana — 15 comidas + 7 activate shots. `PLAN_PRICES`/
`PLAN_LABELS` en `server.js` (usa el mismo checkout de Stripe que los demás,
sin código nuevo ahí).

**Landing page (`index.html`):** no se agregó como cuarta card en la grilla
(quedaba 3+1 descolgada) — se agrega como card **flagship** de ancho
completo debajo de las 3 cards existentes (`.plan-flagship`), con badge
"El más completo" (trophy, fondo `--green-bg`, distinto del `--green` de
"Más elegido" de Performance para no competir visualmente). Incluye
"Valor regular ~~$304~~" tachado chico + "Ahorrás $39/semana" discreto
(sin badges rojos ni % — cálculo: Structure $120 ÷ (5 meals + 5 shots a
$7c/u = $35) → ~$17/meal; 15×$17 + 7×$7 = $304 valor de referencia).
**No se tocó el comparador "Compará en detalle"** (forzar 15 comidas en las
columnas separadas de Almuerzos/Cenas hubiera requerido inventar un split
que el cliente no dio — si en algún momento pide agregarlo ahí, pedirle el
desglose real primero). En mobile (≤1024px) los 3 planes de la grilla
pasan a **carrusel horizontal con scroll-snap** (antes se apilaban en
columna) — el flagship se mantiene aparte, ancho completo, no entra al
carrusel.

**Onboarding (`home.html`):** grilla de planes pasa de 3 a **2×2**
(`.plans-grid { grid-template-columns: repeat(2, 1fr); }`), Full Week con
clase `.flagship` (fondo `--sage`, badge `--dark-green` con trofeo — distinto
del fondo `--dark-green` sólido de "Más elegido"/Performance). Mobile sigue
apilado en una columna (a diferencia de la landing, acá es un paso
transaccional de elegir-y-listo, no una vitrina — no se justificaba el
carrusel).

**Verificado end-to-end:** seleccionar Full Week en el onboarding → resumen
"$265/sem" correcto → Stripe Checkout muestra "Plan Full Week — USD 265.00"
(modo test). Cuenta de prueba usada
(`test.fullweek.fuelhaus@gmail.com`) fue borrada por Valen después de la
prueba.

**Lección de sesión — pestañas en segundo plano rompen Claude in Chrome:**
si la pestaña del navegador queda en background (`document.visibilityState
!== "visible"`), Chrome frena el ticker de GSAP y varias herramientas del
navegador (screenshot, scroll, find, get_page_text) quedan colgadas
indefinidamente esperando `document_idle` — no es un bug del sitio.
Solución: pedirle al usuario que traiga la pestaña al frente: `document.
hasFocus()` en consola confirma. `resize_window` además falla o no aplica
si el tab está oculto, y en esta máquina el monitor físico limita el ancho
CSS real a ~983px con escalado de Windows al 125% (no se puede simular un
verdadero ≥1024px salvo maximizando/enfocando la ventana real).

## Notas técnicas

- **Deploy:** Vercel conectado a GitHub, auto-deploy en cada push a `main`
  (y preview automático en cada push a cualquier otra rama, URL estable
  `https://fuelhaus-git-{rama}-valenalias1.vercel.app`).
- **Ver logs de producción:** `vercel logs https://fuelhaus.vercel.app`
  (útil para diagnosticar errores 500 que no se ven desde el navegador).
- **Server completo:** `node server.js` (requiere `.env` con
  `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, y ahora también
  `RESEND_API_KEY` para el reset de contraseña — ver `.env.example`).
- **Probar localmente sin Supabase:** `python3 -m http.server` dentro de
  `public/` sirve la landing estática (login/checkout no funcionan sin
  Supabase real).
- **Probar el flujo completo (login/checkout/admin) en local SIN tocar la
  base de producción:** Preview y Production comparten el mismo Supabase
  (`vercel env ls` lo confirma), así que ni siquiera un deploy de Preview
  es un ambiente aislado. Además `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`/
  `STRIPE_SECRET_KEY` están marcadas como **Sensitive** en Vercel —
  `vercel env pull` las devuelve vacías, no hay riesgo de que un pull
  local exponga el secreto real. Para probar de punta a punta sin pisar
  datos de clientes reales: 1) `cp db.js db.real.js.bak`, 2) reemplazar
  `db.js` por un stub que implemente `Users`/`Orders`/`Coupons`/
  `orderNumber` en memoria (arrays JS, mismo shape camelCase que ya usa
  `server.js` — no hace falta mapear snake_case), con un admin sembrado
  (`bcrypt.hashSync` de una contraseña de prueba) y el cupón `FULLHAUS`
  100% para poder crear pedidos `$0` sin necesitar claves de Stripe; 3)
  `node server.js` sin `.env` (JWT_SECRET tiene default en el código,
  Stripe queda `null` si falta la key — alcanza para probar todo salvo el
  Checkout Session real); 4) al terminar, `mv db.real.js.bak db.js` y
  `git diff db.js` para confirmar que quedó idéntico al original.
