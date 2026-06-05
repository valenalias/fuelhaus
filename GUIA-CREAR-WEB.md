# GUÍA COMPLETA — Cómo crear una web desde cero
### Para alguien que no sabe absolutamente nada de programación
*Escrita por Claude Code — Junio 2025*

---

## ¿QUÉ VAS A NECESITAR?

Antes de empezar, necesitás tener instalado en tu computadora:

| Programa | Para qué sirve | Cómo conseguirlo |
|---|---|---|
| **Node.js** | Hace correr tu web en tu computadora | nodejs.org → Download |
| **Git** | Guarda versiones de tu código | git-scm.com → Download |
| **GitHub Desktop** (opcional) | Interfaz visual para subir a GitHub | desktop.github.com |
| **Una cuenta en GitHub** | Guarda tu código en la nube | github.com → Sign Up |
| **Una cuenta en Vercel** | Publica tu web en internet | vercel.com → Sign Up |
| **Claude Code** | Tu asistente de programación (esto) | Ya lo tenés |

---

## PARTE 1 — CREAR EL PROYECTO

### Paso 1 — Crear la carpeta del proyecto

1. Andá a tu Escritorio (Desktop)
2. Hacé clic derecho → "Nueva carpeta"
3. Ponele el nombre de tu proyecto, por ejemplo: `mi-nueva-web`

Dentro de esa carpeta vas a necesitar crear esta estructura:

```
mi-nueva-web/
├── public/
│   ├── index.html      ← La página principal
│   ├── css/
│   │   └── style.css   ← Los colores y diseño
│   ├── js/
│   │   └── main.js     ← Las animaciones
│   └── img/            ← Las imágenes
├── server.js           ← El servidor local
└── vercel.json         ← Configuración para publicar
```

### Paso 2 — Crear el servidor local

El servidor local es lo que te permite ver tu web en el navegador mientras la estás creando, sin necesidad de internet.

Creá un archivo llamado `server.js` dentro de tu carpeta con este contenido exacto:

```javascript
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const filePath    = path.join(ROOT, url);
  const ext         = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});
```

### Paso 3 — Crear el archivo vercel.json

Creá un archivo llamado `vercel.json` con este contenido:

```json
{
  "outputDirectory": "public"
}
```

Esto le dice a Vercel que la carpeta `public` es la que tiene que publicar.

### Paso 4 — Crear el .gitignore

Creá un archivo llamado `.gitignore` con esto:

```
node_modules/
.DS_Store
```

Esto le dice a GitHub que ignore ciertos archivos internos que no necesita.

---

## PARTE 2 — DISEÑAR LA WEB

### Paso 5 — Crear el HTML (la estructura)

Creá el archivo `public/index.html`. Este es el esqueleto básico de cualquier página:

```html
<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Título que aparece en Google -->
  <title>Nombre de tu negocio — Lo que hacés</title>

  <!-- Descripción para Google (máximo 160 caracteres) -->
  <meta name="description" content="Descripción de tu negocio para que la vea Google.">

  <!-- Fuentes de Google (las que quieras) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600&display=swap" rel="stylesheet">

  <!-- Iconos -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

  <!-- Tu CSS -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- HEADER — la barra de arriba -->
  <header id="header">
    <div class="header-inner">
      <a href="/" class="logo">MI LOGO</a>
      <nav>
        <a href="#seccion1">Sección 1</a>
        <a href="#seccion2">Sección 2</a>
      </nav>
    </div>
  </header>

  <main>

    <!-- HERO — la primera pantalla grande -->
    <section class="hero" id="hero">
      <h1>El título grande de tu negocio</h1>
      <p>Una descripción corta de lo que hacés.</p>
      <a href="#contacto" class="btn">Contactanos</a>
    </section>

    <!-- SECCIÓN 2 — otra sección -->
    <section id="seccion1">
      <h2>Título de sección</h2>
      <p>Contenido...</p>
    </section>

    <!-- CONTACTO -->
    <section id="contacto">
      <h2>Contacto</h2>
      <a href="https://api.whatsapp.com/send?phone=5491100000000">WhatsApp</a>
    </section>

  </main>

  <!-- FOOTER — el pie de página -->
  <footer>
    <p>Tu negocio © 2025</p>
  </footer>

  <!-- Animaciones GSAP (opcional, para efectos de scroll) -->
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>

  <!-- Tu JavaScript -->
  <script src="js/main.js"></script>
</body>
</html>
```

### Paso 6 — Crear el CSS (el diseño)

Creá el archivo `public/css/style.css`. Este es el mínimo para empezar:

```css
/* Variables — los colores y fuentes de tu marca */
:root {
  --color-principal: #6B8A5E;   /* Verde — cambiá esto por tu color */
  --fondo: #F2EDE4;             /* Fondo crema */
  --negro: #1C1B19;
  --blanco: #ffffff;
  --gris: #888880;
  --fuente: 'DM Sans', system-ui, sans-serif;
}

/* Reset básico — siempre incluilo */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--fuente); background: var(--fondo); color: var(--negro); }
a { text-decoration: none; color: inherit; }
img { display: block; max-width: 100%; }

/* Header */
header {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 72px;
  background: var(--fondo);
  display: flex;
  align-items: center;
  z-index: 100;
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 48px;
}

/* Hero */
.hero {
  min-height: 100dvh;
  padding-top: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 100px 48px;
}
.hero h1 { font-size: clamp(40px, 6vw, 80px); }

/* Botón */
.btn {
  display: inline-block;
  padding: 14px 32px;
  background: var(--color-principal);
  color: var(--blanco);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  border: none;
}
.btn:hover { opacity: 0.85; }

/* Mobile */
@media (max-width: 768px) {
  .header-inner { padding: 0 20px; }
  .hero { padding: 80px 20px; }
  .hero h1 { font-size: clamp(32px, 10vw, 52px); }
}
```

### Paso 7 — Crear el JavaScript (animaciones básicas)

Creá el archivo `public/js/main.js`. Para empezar podés dejarlo vacío o con esto:

```javascript
// Animaciones básicas con GSAP
gsap.registerPlugin(ScrollTrigger);

// Header que cambia al hacer scroll
ScrollTrigger.create({
  start: 'top -10',
  onEnter: () => document.getElementById('header').style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)',
  onLeaveBack: () => document.getElementById('header').style.boxShadow = 'none',
});

// Animación del hero al cargar
gsap.fromTo('h1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
```

---

## PARTE 3 — VER LA WEB EN TU COMPUTADORA

### Paso 8 — Levantar el servidor local

1. Abrí el chat con Claude
2. Escribí este comando:
   ```
   ! node "C:\Users\TU-USUARIO\Desktop\mi-nueva-web\server.js"
   ```
   *(Reemplazá `TU-USUARIO` por tu nombre de usuario de Windows)*

3. Abrí tu navegador y andá a: **http://localhost:3000**
4. ¡Ahí ves tu web!

**Importante:** Cada vez que hagas un cambio en los archivos, recargá el navegador con `F5` para ver los cambios.

---

## PARTE 4 — PEDIRLE CAMBIOS A CLAUDE

### Cómo pedirle cambios (ejemplos)

Claude entiende el español y sabe dónde están todos tus archivos. Podés pedirle cosas así:

- *"Cambiá el color verde del header por azul marino"*
- *"Agregá una sección de testimonios después del hero"*
- *"Hacé que el título del hero sea más grande en mobile"*
- *"Agregá un botón de WhatsApp flotante abajo a la derecha"*
- *"Cambiá la fuente de los títulos por Playfair Display"*
- *"Agregá mi logo — te lo pongo en la carpeta IMAGENES"*

**Consejo:** Cuanto más específico seas, mejor resultado obtenés. En lugar de "mejorá el diseño", decí "cambiá el fondo del hero por un degradado de verde oscuro a negro".

### Si querés mostrarle cómo queda algo en otra web

Decile: *"Quiero que copies el efecto/formato de [pegás el link de la web]"* y describís qué parte exactamente querés copiar.

---

## PARTE 5 — SUBIR LA WEB A INTERNET

### Paso 9 — Subir a GitHub por primera vez

La primera vez que querés publicar tu web, hacé esto en el chat con Claude:

```
! C:\"Program Files"\Git\bin\git.exe -C "C:\Users\TU-USUARIO\Desktop\mi-nueva-web" init
! C:\"Program Files"\Git\bin\git.exe -C "C:\Users\TU-USUARIO\Desktop\mi-nueva-web" add .
! C:\"Program Files"\Git\bin\git.exe -C "C:\Users\TU-USUARIO\Desktop\mi-nueva-web" commit -m "Primera version"
```

Después decile a Claude: *"Subí el repositorio a GitHub, mi usuario es valenalias"* y él hace el resto.

### Paso 10 — Publicar en Vercel

1. Andá a **vercel.com** e iniciá sesión
2. Hacé clic en **"Add New..."** → **"Project"**
3. Buscá tu repositorio y hacé clic en **"Import"**
4. No cambies nada → hacé clic en **"Deploy"**
5. En 2 minutos tenés tu link público

### Paso 11 — Actualizar la web después (cada vez que cambiás algo)

Después de que Claude te haga cambios, corrés esto en el chat:

```
! C:\"Program Files"\Git\bin\git.exe -C "C:\Users\TU-USUARIO\Desktop\mi-nueva-web" add . ; C:\"Program Files"\Git\bin\git.exe -C "C:\Users\TU-USUARIO\Desktop\mi-nueva-web" commit -m "update" ; C:\"Program Files"\Git\bin\git.exe -C "C:\Users\TU-USUARIO\Desktop\mi-nueva-web" push
```

Vercel detecta el cambio y actualiza la web solo en 2 minutos.

---

## PARTE 6 — CHECKLIST DE CADA PROYECTO

Antes de publicar cualquier web, revisá que tenés:

### Contenido
- [ ] Título claro que dice qué es el negocio
- [ ] Descripción que explica el servicio
- [ ] Fotos de buena calidad (no pixeladas)
- [ ] Información de contacto (WhatsApp, email, Instagram)
- [ ] Precios si corresponde

### SEO (para aparecer en Google)
- [ ] `<title>` con el nombre del negocio y lo que hace
- [ ] `<meta name="description">` con descripción de 160 caracteres
- [ ] Texto de la web que menciona las palabras clave
- [ ] Perfil de Google My Business creado
- [ ] Imágenes con nombre descriptivo (ej: `viandas-saludables.jpg` en vez de `IMG_001.jpg`)

### Técnico
- [ ] `vercel.json` con `{"outputDirectory": "public"}`
- [ ] `robots.txt` en la carpeta public
- [ ] `sitemap.xml` en la carpeta public
- [ ] Las imágenes están en `public/img/`
- [ ] La web se ve bien en el celular

### Redes
- [ ] Instagram bio con el link de la web
- [ ] WhatsApp Business con descripción del negocio
- [ ] Google My Business con fotos y descripción

---

## PARTE 7 — GLOSARIO (palabras que vas a escuchar)

| Palabra | Qué significa en simple |
|---|---|
| **HTML** | El esqueleto de la página (la estructura) |
| **CSS** | El maquillaje de la página (colores, fuentes, tamaños) |
| **JavaScript / JS** | El comportamiento de la página (animaciones, interacciones) |
| **GSAP** | Una librería de animaciones muy potente |
| **Repositorio / Repo** | Tu proyecto guardado en GitHub |
| **Commit** | Guardar una versión de tus cambios |
| **Push** | Subir tus cambios guardados a GitHub |
| **Deploy** | Publicar la web en internet |
| **Localhost** | Tu web corriendo solo en tu computadora (no en internet) |
| **Responsive** | Que la web se ve bien en celular, tablet y computadora |
| **SEO** | Optimización para aparecer en Google |
| **Dominio** | El nombre de tu web (ej: fuelhaus.com) |
| **Hosting** | El servicio que hace que tu web esté en internet (Vercel) |
| **Meta tags** | Información oculta que lee Google |
| **Schema** | Código especial que hace que Google muestre info extra |
| **CDN** | Servidores rápidos que guardan tus archivos en todo el mundo |

---

## PARTE 8 — COMANDOS ÚTILES PARA COPIAR Y PEGAR

### Levantar servidor local
```
! node "C:\Users\valen\OneDrive\Desktop\NOMBRE-DE-TU-PROYECTO\server.js"
```

### Subir cambios a GitHub (y Vercel se actualiza solo)
```
! C:\"Program Files"\Git\bin\git.exe -C "C:\Users\valen\OneDrive\Desktop\NOMBRE-DE-TU-PROYECTO" add . ; C:\"Program Files"\Git\bin\git.exe -C "C:\Users\valen\OneDrive\Desktop\NOMBRE-DE-TU-PROYECTO" commit -m "update" ; C:\"Program Files"\Git\bin\git.exe -C "C:\Users\valen\OneDrive\Desktop\NOMBRE-DE-TU-PROYECTO" push
```

### Primera vez que conectás con GitHub
*(Decile a Claude: "Subí el repositorio a GitHub, mi usuario es valenalias")*

---

## CONSEJOS FINALES

**1. Guardá tus fotos con nombres descriptivos**
En vez de `IMG_20241201.jpg` usá `viandas-fitness-buenos-aires.jpg`. Google indexa los nombres de las fotos.

**2. Comprimí las fotos antes de subirlas**
Andá a **tinypng.com** y subí tus fotos. Las comprime sin perder calidad. Las fotos pesadas hacen lenta la web y Google penaliza eso.

**3. Empezá por el contenido, después el diseño**
Primero escribí todos los textos, reuní todas las fotos, definí colores y fuentes. Después pedile a Claude que arme el diseño. Sin contenido no hay diseño.

**4. Pedile a Claude que te explique cualquier cosa**
No importa cuán básica sea la pregunta. Si no entendés algo, preguntá. Claude está para explicarte todo en términos simples.

**5. Hacé backup de tus fotos**
Tus imágenes son lo más valioso. Tenelas guardadas en Google Drive o iCloud además de en la carpeta del proyecto.

**6. Creá el Google My Business apenas publiques la web**
Es gratis y es lo que más impacto tiene para aparecer en búsquedas locales.

---

*Guía creada con Claude Code para Valen — Junio 2025*
*Proyecto de referencia: fuelhaus.vercel.app*
