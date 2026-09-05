# HANDOFF — FuelHaus

Última actualización: 2026-09-05 (simplificación del onboarding a 4 pasos + Delivery details — ver sección "Onboarding simplificado" más abajo, probado de punta a punta local)

## Onboarding simplificado a 4 pasos + Delivery details (sesión 2026-09-05)

**Objetivo:** simplificar el onboarding (sacar objetivo/dieta/alimentos a
evitar, que no modificaban el producto todavía) y en el mismo movimiento
dejar completo el flujo hasta la entrega (dirección, ventana de entrega,
estados del pedido). Sin refactor grande — todo sobre la estructura ya
existente.

**1. Full System oculto (no borrado).** Nuevo `PLAN_ACTIVE` en
`server.js` (`{ structure:true, performance:true, full_system:false,
full_week:true }`) — el checkout rechaza ese plan aunque alguien lo
mande a mano. En el cliente, la card de Full System quedó comentada
(no borrada) en `home.html` e `index.html` — reactivar es sacar el
comentario + poner `full_system:true` en el server. Grillas ajustadas
a 3/2 columnas para que no quede un hueco vacío. Panel admin **no** se
tocó (Valen sigue viendo/gestionando pedidos viejos de Full System si
los hay).

**2. Fix del contador de meals.** `PLAN_MEAL_COUNTS.full_system` estaba
en 13 (contaba los 3 snacks como si fueran meals) — corregido a 10 (5
almuerzos + 5 cenas) en `meals.js`, por prolijidad para cuando se
reactive. Structure(5)/Performance(10)/Full Week(15) ya estaban bien.

**3. Objetivo/dieta/alimentos a evitar: eliminados.** Ya no se piden —
no modificaban ninguna comida todavía. Lo que se pedía en dos pasos
separados ("Tus datos" + "Preferencias") ahora es **un solo paso,
"Delivery details"** (`step-delivery` en `home.html`): nombre/apellido/
email/teléfono (prefilled del perfil si ya existen) + dirección/depto/
ciudad/código postal/instrucciones de entrega + alergias (se mantiene)
+ nota especial (nuevo, reemplaza a "alimentos a evitar"). Se muestra
"Entrega: Domingo por la mañana" fijo (no seleccionable todavía).

**4. Flujo final: Plan → Meals → Delivery details → Pago** (antes eran
5 pasos). Stepper (`PROGRESS_STEPS`, `updateProgress()`) y todos los
`home.stepN_of_5` de `i18n.js` pasaron a `_of_4`. Línea sutil antes de
pagar: "Una decisión menos. Una semana mejor." / "One less decision.
One better week." (`.closing-line`, itálica y chica, no es una pantalla
motivacional).

**5. Persistencia — sin migración de SQL.** Todo lo nuevo (allergies,
specialNote, delivery: {address, apartment, city, zip, instructions,
window}) vive dentro de la misma columna `preferences` JSONB que ya
existía (igual que `meals` ya vivía ahí) — no hizo falta tocar
`supabase-schema.sql`. Validación de dirección/ciudad/código postal
obligatorios se hace en el servidor (`/api/orders/checkout`), arma el
objeto `preferences` ahí mismo (ya no confía en lo que mande el
cliente) y lo pasa igual que antes a `finalizeOrder()` / metadata de
Stripe — el resto del flujo de checkout/webhooks del autopay semanal
**no se tocó**.

**6. Estados del pedido ampliados.** `pending / paid / preparing /
out_for_delivery / delivered / cancelled` (antes: paid/processing/
delivered/cancelled — `processing` pasó a llamarse `preparing`, sin
dato real que migrar porque nunca se usaba). Nueva whitelist
`ORDER_STATUSES` en `server.js`, valida `PUT /api/admin/orders/:id`.

**7. Mensaje automático al marcar "Delivered": preparado, no
conectado.** `notifyOrderDelivered(order)` en `server.js` se dispara
cuando el estado pasa a `delivered` (solo la primera vez, no en cada
re-guardado) — hoy solo loguea el mensaje que habría que mandar ("Tu
pedido de FuelHaus ya llegó. Tu semana está lista. 💚"). No hay ningún
canal de WhatsApp/SMS conectado a FuelHaus todavía (el bot "Juana" es
un proyecto aparte, sin integrar acá) — cuando se decida el canal,
conectarlo ahí mismo, usando `order.userPhone`.

**Panel admin actualizado:** el modal de detalle de pedido cambió
"Objetivo/Dieta" por una sección "Entrega" (dirección, ciudad, código
postal, ventana de entrega, instrucciones) y "Preferencias" ahora
muestra alergias + nota especial (en vez de "alimentos a evitar"). El
selector de estado y los badges tienen los 6 estados nuevos.

**Probado de punta a punta localmente** (servidor local con un stub de
`db.js` en memoria — mismo truco documentado más abajo, sin tocar la
Supabase compartida): registro → plan Structure (solo 3 planes
visibles, Full System no aparece) → exactamente 5 meals requeridos y
bloqueados al llegar al máximo → paso Delivery details con
nombre/apellido/email prefilled del perfil, dirección/ciudad/código
postal obligatorios, alergias/nota especial opcionales, "Entrega:
Domingo por la mañana" visible → pago con cupón FULLHAUS (100%) →
pedido creado y confirmado. Verificado en la base (stub) que
`preferences` quedó con `allergies`, `specialNote` y el objeto
`delivery` completo. Verificado en el panel admin: el pedido se ve con
todos los datos de entrega, cambiar el estado a "Entregado" disparó el
log de `notifyOrderDelivered` con el teléfono y mensaje correctos, y la
vista de cuenta del cliente muestra "Delivered", la dirección combinada
("123 Test Street, Miami 33101"), "Sunday morning" y la nota especial.

## 🌿 Rama `weekly-autopay` — no mergeada a `main` todavía

Todo el trabajo de esta sesión (meals, cupones flexibles, forgot password,
fix de landing, y autopay semanal) vive en la rama `weekly-autopay`
(pusheada a GitHub, no mergeada a `main` — decisión de Valen, no se
mergeó porque el autopay necesitaba probarse de punta a punta primero).

Preview estable de esta rama: https://fuelhaus-git-weekly-autopay-valenalias1.vercel.app

**Antes de mergear a `main` (y por lo tanto a producción):**
1. Confirmar que la migración de Supabase (ver sección de autopay abajo)
   ya está corrida — **ya lo está**, corrida por Valen 2026-09-05.
2. El webhook de Stripe en modo **live** todavía NO tiene los eventos
   nuevos (`invoice.paid`, `customer.subscription.updated`,
   `customer.subscription.deleted`) — solo escucha
   `checkout.session.completed`. Hay que ampliarlo en el Dashboard antes
   de que el autopay funcione en producción real.
3. Activar el Customer Portal en modo **live** (además del de test, que
   ya se probó) con "Cancel at end of billing period".
4. Vercel Deployment Protection: el webhook de producción
   (`fuelhaus.vercel.app`) probablemente NO tiene este problema porque
   los dominios de Production no quedan protegidos por default (ver
   nota técnica abajo) — de todos modos, conviene confirmarlo con un
   evento de prueba antes de dar por sentado que funciona.

## Autopay semanal (suscripciones recurrentes de Stripe) — sesión 2026-09-05

**Objetivo:** el checkout pasó de pago único a **cobro automático semanal
real** (Stripe `mode: 'subscription'`), con una política de cancelación
clara. Plan completo (contexto de negocio, diseño técnico, checklist
manual de Stripe) guardado en
`C:\Users\valen\.claude\plans\reactive-noodling-clock.md` — este resumen
es la versión corta.

**Diseño final (revisado 2026-09-05, ver Addendum 2 más abajo — esto ya
NO es "diferir el primer cobro al martes", es el modelo con cobro
inmediato):**

- **Cliente nuevo:** el cobro de la primera semana se hace **el mismo
  día del registro** (precio completo, con el cupón ya aplicado si
  corresponde) — no espera al martes. Técnicamente es una **factura
  manual aparte** (`stripe.invoiceItems.create` + `stripe.invoices.create`
  + `finalizeInvoice`), no la primera factura de la suscripción — Stripe
  no permite cobrar completo hoy Y converger la suscripción al martes
  con un solo objeto (ver Addendum 2, hallazgo 1). El pedido de esa
  primera semana se crea directo en el webhook `checkout.session.completed`.
- **Fecha de entrega de esa primera semana:** un pedido hecho de **lunes
  a miércoles inclusive** llega para el domingo más próximo; de **jueves
  a sábado** (o si ya es domingo) pasa al domingo siguiente al inmediato
  — porque cocina necesita la lista el miércoles. Es un cutoff
  DISTINTO al de cancelación (ver abajo). Calculado en dos lugares con
  la misma tabla `DAYS_UNTIL_FIRST_DELIVERY` (0=dom…6=sáb → días hasta
  el domingo entregable): `firstDeliverySundayDate()` en `server.js`
  (no se usa para cobrar, solo referencia) y su equivalente en
  `public/home.html` para mostrar "Tu primera entrega será el…" antes de
  pagar.
- **Renovaciones (semana 2 en adelante):** la propia suscripción de
  Stripe se crea con `billing_cycle_anchor` en el próximo martes
  (`nextTuesdayAnchor()`) y `proration_behavior:'none'` — no cobra nada
  el día del signup, converge a TODOS los suscriptores en el mismo
  martes de ahí en más, sin importar qué día se hayan dado de alta.
  Estas sí se crean en `invoice.paid` como siempre.
- **Cancelación de un suscriptor existente:** sigue siendo "antes del
  martes" (Customer Portal, sin cambios — ver más abajo).

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

**Cupón de descuento: solo la primera semana.** El monto ya descontado
se cobra directo en la factura manual de la primera semana (ver arriba)
— la suscripción en sí nunca conoce el cupón, siempre está configurada
al precio COMPLETO del plan, así que el descuento desaparece solo
después de esa primera factura sin ninguna lógica extra.

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

### Addendum — probado de punta a punta con un checkout real en Stripe test, 3 hallazgos importantes

Después de escribir todo lo de arriba se probó con un checkout real
(tarjeta de prueba 4242, rama `weekly-autopay` pusheada a GitHub para
tener una URL de preview estable). Aparecieron 3 problemas reales que ya
están corregidos en el código, pero vale la pena dejarlos anotados
porque no eran obvios de antemano:

**1. Vercel Deployment Protection bloqueaba el webhook (401).** Los
deploys de Preview de este proyecto tienen activada la protección SSO de
Vercel — cualquier request externo (incluido el webhook de Stripe) que
no esté autenticado con una sesión de Vercel recibe un 401 "Protected
deployment" **antes** de llegar a nuestro código (no aparece nada en
`vercel logs`, porque el request nunca llega a la función). Esto es
invisible hasta que efectivamente se prueba un webhook real contra un
deploy de Preview — con `checkout.session.completed` sin webhooks reales
no se nota, pero con autopay (que depende 100% de webhooks) es
bloqueante. **Solución:** activar "Protection Bypass for Automation" en
Vercel (Project → Settings → Deployment Protection), y agregar el
secreto que genera como query param en la URL del webhook de Stripe:
`...?x-vercel-protection-bypass=EL_SECRETO`. El secreto real de este
proyecto quedó guardado en el 1Password/notas de Valen (no en este
archivo). **Esto es específico de Preview** — los dominios de Production
normalmente no tienen esta protección activa por default, pero conviene
confirmarlo antes de asumir que producción no la necesita.

**2. El pedido no puede crearse en `checkout.session.completed` con
`billing_cycle_anchor` futuro.** Con el ancla de facturación en el
próximo martes, Stripe NO genera ninguna factura el día del signup
(`session.invoice` llega `null`, se cobra literalmente $0 ese día) — el
primer cobro real recién pasa el martes. Esto se descubrió recién al
hacer un checkout real: el pedido se creaba igual con
`finalPrice: 120` aunque no se había cobrado nada ese día, y el cobro
real del martes se iba a ignorar (el código asumía que
`billing_reason: 'subscription_create'` ya estaba cubierto por
`checkout.session.completed`, lo cual es falso con ancla futura).
**Fix:** `checkout.session.completed` ya NO crea ningún pedido — solo
activa al usuario y sincroniza `stripeCustomerId`/suscripción. El pedido
(primer cobro real O renovación, tratados exactamente igual) se crea
siempre en `invoice.paid`, sin filtrar por `billing_reason`. Cuando no
hay ningún pedido previo del que clonar meals/preferencias (el primer
cobro), se leen del `metadata` de la propia suscripción de Stripe
(guardado ahí mismo en `/api/orders/checkout`, además de en el metadata
de la sesión). Verificado con eventos `invoice.paid` sintéticos pero
firmados con el secreto real del webhook, contra la suscripción real
creada en el checkout — primer pedido (FH-0005) y renovación (FH-0006)
se crearon correctamente.

**3. Campos de la API de Stripe reciente (`2026-07-29.dahlia`)
distintos a lo documentado en ejemplos viejos.** Confirmado con un
evento real de `customer.subscription.updated` (cancelación desde el
Customer Portal):
- `subscription.current_period_end` **ya no existe en la raíz** del
  objeto — se movió a `subscription.items.data[0].current_period_end`.
- `subscription.cancel_at_period_end` **queda siempre en `false`** en
  esta versión — lo que indica que la cancelación quedó programada para
  el fin del período es `subscription.cancel_at` (timestamp), junto con
  `cancellation_details.reason`.

  `syncSubscriptionFields()` en `server.js` ya usa los campos correctos.
  Si en el futuro Stripe actualiza la API version del proyecto, revisar
  este mapeo de nuevo — son exactamente el tipo de cambios silenciosos
  que no rompen nada visiblemente (el webhook sigue respondiendo 200)
  pero dejan datos vacíos/incorrectos.

**Verificado en el navegador, con Stripe real en modo test:**
suscripción creada con precio y fecha de ancla correctos ("USD 0.00
vence hoy, luego USD 120.00 por semana a partir del 8 de septiembre"),
primer pedido y renovación creados correctamente vía `invoice.paid`,
Customer Portal mostrando el plan/precio/fecha de cobro reales, botón
"Cancelar suscripción" → mensaje de política exacto ("seguirá disponible
hasta el final de tu período... el 8 de septiembre") → webhook
`customer.subscription.updated` sincronizado correctamente → vista de
cuenta mostrando "Se cancela el 08/09/2026 — hasta esa fecha seguís
recibiendo tus entregas ya pagadas". Todos los usuarios/pedidos de
prueba se borraron de la base real al terminar.

### Addendum 2 — rediseño a cobro inmediato (sesión 2026-09-05, más tarde el mismo día)

Después de todo lo de arriba, Valen pidió un cambio de diseño: en vez de
diferir SIEMPRE el primer cobro al martes (lo que significaba que
alguien que se registra un sábado recién paga y sabe si su tarjeta
funciona el martes siguiente), quería que **el cobro de la primera
semana se haga el mismo día del registro**, y que las renovaciones de
ahí en más sí converjan al martes. Después precisó el cutoff de entrega:
"que puedan pedir hasta miércoles inclusive para recibir el domingo, y
ya hacer el pago en el momento; pero para cancelar (cliente existente)
que sea hasta antes del martes" — dos cutoffs distintos a propósito, no
un error.

Se probó en real (mismo patrón: rama `weekly-autopay`, tarjeta 4242,
usuarios `qa-*` descartables borrados al final) y aparecieron 2 bugs
reales más, los dos por asumir mal cómo se comporta la API de Stripe sin
haberlo probado:

**1. `subscriptions.update` NO acepta una fecha futura arbitraria en
`billing_cycle_anchor`** (solo en la creación). El primer intento de
este rediseño fue: crear la suscripción SIN ancla (cobra ya, al precio
completo) y después, en `checkout.session.completed`, reprogramarla al
martes con `subscriptions.update(id, { billing_cycle_anchor:
nextTuesdayAnchor() })`. Stripe lo rechazó con
`StripeInvalidRequestError: When updating an existing subscription,
billing_cycle_anchor must be either unset, 'now', or 'unchanged'` — ese
parámetro solo admite una fecha futura arbitraria al CREAR la
suscripción, no al actualizarla. Tampoco sirve `billing_cycle_anchor_config`
(solo vale para intervalos mensuales/anuales, no semanales — confirmado
en la documentación oficial de Stripe). **Solución final:** la
suscripción se crea con el ancla en el próximo martes desde el
principio (como en el diseño original, no cobra nada hoy) y el cobro de
HOY se hace aparte, como una factura manual de una sola vez
(`invoiceItems.create` + `invoices.create` + `finalizeInvoice`) contra
el mismo customer — dos objetos de Stripe separados en vez de uno.

**2. `finalizeInvoice()` con `collection_method:'charge_automatically'`
ya intenta cobrar la factura como parte de la finalización.** El primer
intento de la factura manual llamaba a `invoices.pay()` después de
`finalizeInvoice()` "por las dudas" — y Stripe tiraba `Invoice is
already paid` porque el cobro ya se había hecho solo, silenciosamente,
dentro de `finalizeInvoice()`. Ese error explotaba ANTES de crear el
pedido, así que el cliente quedaba cobrado de verdad pero sin ningún
pedido para cocina. **Fix:** solo se llama a `.pay()` si la factura
sigue sin estar pagada después de `finalizeInvoice()`, y ante cualquier
error ahí se confía en el estado real de la factura (`retrieve`), nunca
en si la llamada tiró excepción.

**De paso, un tercer problema de diseño (no de la API de Stripe):** el
guard que evita reprocesar `checkout.session.completed` dos veces
(comparando `stripeSubscriptionId`) protegía TODO el bloque, incluido el
cobro de hoy. Como el bug #2 de arriba hacía que el bloque se cayera
justo DESPUÉS de activar al usuario pero ANTES de cobrar, el reintento
automático de Stripe llegaba, veía al usuario "ya activado" y se
saltaba TODO el resto — el cobro nunca se reintentaba, para siempre, sin
ningún error visible (el webhook respondía 200). **Fix:** el guard
ahora protege solo la activación (consumir el cupón no es idempotente);
el cobro de hoy corre siempre que haga falta, protegido por su cuenta
con un `idempotencyKey` atado al id de la Checkout Session (evita
duplicar el invoice item/factura en un reintento real) más la
restricción UNIQUE de `stripe_invoice_id` para el pedido.

**Verificado en real, 3 checkouts de punta a punta** (dos con los bugs
de arriba reproducidos y confirmados en `vercel logs`, el tercero ya con
el fix): suscripción creada con ancla correcta en el próximo martes
("USD 0.00 vence hoy, luego USD 120.00 por semana a partir del 8 de
septiembre de 2026" — probado un sábado), pedido de la primera semana
creado en el momento con `finalPrice` correcto y `stripeInvoiceId` de la
factura manual, sin duplicados. Usuarios/pedidos de prueba borrados de
la base real al terminar (quedaron 2-3 suscripciones huérfanas en modo
test de Stripe, de los intentos fallidos antes del fix — sin impacto,
es modo test, no hace falta limpiarlas a mano).

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
