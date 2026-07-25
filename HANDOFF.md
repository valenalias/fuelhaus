# HANDOFF — Rediseño premium landing FuelHaus

Última actualización: 2026-07-25

## Contexto

Rediseño de la landing de FuelHaus para que se vea premium y esté lista para
mostrarle a inversores. Se hizo en base a una auditoría completa (UX/UI,
ecommerce, branding, dirección de arte, conversión, mobile, performance)
comparando el sitio contra el `BRANDING/FUEL-HAUS-BRANDING.pdf` (Brand
Proposal), que se usó como fuente de identidad de marca.

- **Deploy:** https://fuelhaus.vercel.app (auto-deploy vía Vercel, conectado
  a GitHub, rama `main`)
- **Repo:** https://github.com/valenalias/fuelhaus
- Todos los cambios de esta sesión están commiteados y pusheados a `main`.

## Proceso seguido

1. Auditoría completa del sitio actual vs. el Brand Proposal (fortalezas,
   debilidades, oportunidades, qué sobra, qué falta).
2. Roadmap en etapas, revisado y aprobado por el cliente antes de tocar código.
3. Implementación etapa por etapa, con checkpoints y capturas de pantalla
   (desktop y mobile) antes de cada commit.

## Decisiones del cliente (para no repreguntar)

- **No mencionar al chef Michelin** del Brand Proposal — el storytelling de
  fundación es solo "personal trainers y nutricionistas".
- **Fotos:** usar las del Brand Proposal (extraídas del PDF en alta
  resolución) + stock premium como puente donde falte.
- **Catálogo futuro** (drinks funcionales, postres altos en proteína, açaí
  bowls del Brand Proposal): **no se venden todavía**. Quedan fuera de la web
  por ahora — no prometer algo que no se puede entregar. Se pueden mencionar
  en el pitch a inversores como roadmap de producto, pero no en el sitio.
- **Idioma:** español, pero neutralizado — sin voseo rioplatense marcado, para
  no excluir a mexicanos/colombianos/venezolanos de la comunidad hispana de
  Miami (no solo argentinos).
- **Política de cancelación real:** la membresía es **mensual**. Se puede
  cancelar hasta una semana antes del primer domingo del mes.

## Qué se hizo

### Commit `d06517f` — Rediseño premium de landing

- Reemplazo de fotos de stock (Unsplash) y una foto no relacionada con la
  marca (un puesto de snacks/Nutella que estaba en "Nosotros") por
  fotografía real extraída en alta resolución del Brand Proposal PDF
  (con PyMuPDF, extrayendo las imágenes embebidas, no renders de página):
  - `hero-wrap.jpg` — hero
  - `gallery-meals.jpg` — banner de galería (reemplaza el grid de 4 fotos)
  - `food-real.jpg` — sección "Comida real"
  - `about-trainer.jpg` — sección "Nosotros"
  - `cta-lifestyle.jpg` — fondo del CTA final
  - `strip-meals.jpg` — fondo de la sección de cita ("Ingredientes reales...")
- Historia de fundación agregada en "Nosotros" (personal trainers y
  nutricionistas, sin chef).
- Logo: de `LOGO.jpeg` (JPEG borroso con hack de `mix-blend-mode`) a wordmark
  de texto + CSS (clase `.brand-wordmark`), consistente en header, loader y
  footer, funciona en fondos claros y oscuros.
- Contador animado (GSAP ScrollTrigger) en los números de "Nosotros"
  (50+, 100%, 0) — cuentan desde 0 al hacer scroll.
- Neutralización de voseo rioplatense y del término "vianda" en **todo** el
  sitio (`index.html`, `home.html`) + metadatos SEO + JSON-LD +
  `lang="es-US"` (antes `es-AR`).
- Optimización de imágenes (el hero pasó de 2.4MB/3840×5120px a 115KB).
- Eliminación de ~1100 líneas de CSS muerto (componentes Spin, Cleo,
  Calculadora, Arch, Stats, Newsletter de una iteración anterior, sin uso en
  el HTML actual).
- Nueva sección **"Así llega tu semana"** — preview de menú sin necesidad de
  login, reutilizando fotos reales que ya existían pero no se usaban
  (`MENU-PLANES-COMIDA1.jpeg`, `MENU-PLANES-COMIDA3.jpeg`,
  `MENU-PLANES-COMIDA4-CONSHOTS.jpeg`).
- **Comparador de planes en tabla** ("Compará en detalle") debajo de las 3
  cards de planes.
- **Trust bar** (zona de entrega, membresía mensual, política de
  cancelación real).
- **Botón de WhatsApp flotante** (visible en todo momento).
- Sección de **testimonios construida pero comentada** en el HTML — buscar
  `TESTIMONIOS (pendiente de activar)` en `index.html`. Activar cuando haya
  2-3 citas reales de clientes.

### Commit `d85ec4e` — Fix mobile: tabla comparadora

La tabla no entraba en pantallas de celular (<600px): quedaba cortada
mostrando solo la primera columna, sin ninguna pista de que había más
contenido. Se agregó una versión compacta (padding y tipografía reducidos,
los labels largos hacen wrap) que entra completa sin scroll horizontal desde
360px de ancho.

### Commit `7ecc576` — Fix tablet/laptop chica: foto de "Nosotros"

Entre 768px y 1024px la foto de entrenamiento quedaba en una caja muy ancha
y baja, cortando la cara y las pesas (solo se veía el torso). En desktop
completo (1440px+) y en mobile se veía bien. Se ajustó el alto y el
`object-position` específicamente en ese rango.

## Pendiente / próximos pasos

1. **Testimonios** — sección lista pero comentada (`index.html`, buscar el
   comentario que dice `TESTIMONIOS (pendiente de activar)`). Falta
   contenido real: pedirle al cliente 2-3 mensajes de WhatsApp o reviews de
   clientes reales, con nombre (o iniciales) y plan.

2. **Sección "Próximamente" (catálogo futuro)** — pendiente por decisión del
   cliente. Ya están procesadas y guardadas (sin usar todavía en el HTML)
   las fotos:
   - `public/img/soon-drinks.jpg` (shots Immunity/Glow/Detox + smoothies)
   - `public/img/soon-desserts.jpg` (postres altos en proteína)
   - `public/img/soon-acai.jpg` (açaí bowl)

   Falta armar la sección en `index.html` + CSS, enmarcada como
   "próximamente"/roadmap de producto, **sin CTA de compra**.

3. **Modelo de cobro semanal vs. mensual** — el sitio dice precios "por
   semana" en todos lados (hero, plan cards, tabla comparadora, checkout en
   `home.html`), pero la política real es de membresía **mensual** (se
   cancela con una semana de anticipación al primer domingo del mes). Se le
   avisó al cliente; no se tocó porque es una decisión de negocio, no de
   diseño. Si decide aclararlo en la web, hay que revisar el copy en varios
   lugares.

4. **Limpieza opcional de archivos no usados** — siguen en `public/img/` sin
   usarse: `LOGO.jpeg`, `MENU-PLANES-COMIDA2.jpeg` (2.4MB), y
   `NOSOTROS-STAND.jpeg` (la foto del puesto de snacks, no es de FuelHaus).
   No se borraron por las dudas — se pueden limpiar cuando el cliente
   confirme que no los necesita para otra cosa.

5. **Re-extraer fotos del Brand Proposal si hace falta** — el PDF tiene 9
   páginas con fotografía de estudio de calidad (incluye las de drinks,
   postres y açaí ya usadas para "Próximamente", y otras sin usar todavía,
   como una foto de manos cortando ingredientes). Proceso: PyMuPDF (`fitz`)
   para extraer las imágenes embebidas del PDF (no renderizar la página
   completa, que da menor resolución) vía `doc.extract_image(xref)` por cada
   `page.get_images(full=True)`.

## Notas técnicas

- **Deploy:** Vercel conectado a GitHub, auto-deploy en cada push a `main`.
- **Probar localmente sin Supabase:** `python3 -m http.server` dentro de
  `public/` sirve la landing estática (el login/checkout de `/home` no
  funciona sin un `.env` real con credenciales de Supabase).
- **Server completo:** `node server.js` (requiere `.env` con `SUPABASE_URL`,
  `SUPABASE_SERVICE_KEY`, `JWT_SECRET` — ver `.env.example`).
