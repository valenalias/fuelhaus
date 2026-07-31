# HANDOFF — FuelHaus

Última actualización: 2026-07-31

## Contexto

- **Deploy:** https://fuelhaus.vercel.app (auto-deploy vía Vercel, conectado
  a GitHub, rama `main`)
- **Repo:** https://github.com/valenalias/fuelhaus
- **Admin:** admin@fuelhaus.com / Fuelhaus2025

## 🔴 Lo más urgente — sistema de cuentas caído en producción

El login y "crear cuenta" en `fuelhaus.vercel.app` **no funcionan ahora
mismo**. No es un bug de código: la base de datos de Supabase es
inalcanzable — `ohnedhcnqcmhaggyddjx.supabase.co` no resuelve ni siquiera a
nivel DNS ("dominio inexistente"), confirmado con los logs de Vercel
(`vercel logs`) y probando la resolución del dominio desde afuera de Vercel.

Causa más probable: el proyecto de Supabase (plan gratuito) se pausó por
inactividad y, si quedó pausado mucho tiempo, puede haber sido eliminado.

**Acción pendiente del cliente:** entrar a supabase.com, revisar si el
proyecto aparece pausado (reactivar) o si ya no está (crear uno nuevo y
volver a cargar `supabase-schema.sql`). Sin esto resuelto, nadie puede
loguearse ni registrarse en producción, aunque el resto del sitio funcione
perfecto.

De paso se encontró y corrigió un bug relacionado en `db.js`: las funciones
que leen usuarios/pedidos/cupones ignoraban el `error` que devuelve
Supabase y solo miraban `data` — si la conexión fallaba, se comportaban
igual que "no existe", ocultando el problema real. Ya corregido (los
errores de conexión ahora se propagan como error real, no como "no
encontrado").

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

5. **Stripe** — pendiente de una segunda etapa, el cliente todavía no creó
   la cuenta.

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
