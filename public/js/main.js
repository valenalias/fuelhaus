/* ============================================
   FUELHAUS — Animaciones GSAP
============================================ */

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Hero mobile (≤768px) usa una foto a sangre completa: la rotación y el
   deslizamiento lateral pensados para la card angulada de escritorio se
   ven rotos ahí, así que se desactivan y se reemplazan por un fade simple. */
const heroMobile = window.matchMedia('(max-width: 768px)').matches;

/* ─── LOADER ──────────────────────────────── */
function runLoader() {
  const loader   = document.getElementById('loader');
  const brand    = document.querySelector('.loader-brand');
  const lineFill = document.querySelector('.loader-line-fill');
  if (!loader) return;

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(loader, {
        yPercent: -100,
        duration: 0.9,
        ease: 'power4.inOut',
        onComplete: () => {
          loader.classList.add('hidden');
          initHero();
        },
      });
    },
  });

  tl
    .to(lineFill, { scaleX: 1, duration: 1.4, ease: 'power2.inOut' })
    .to(brand, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.8')
    .to([brand, lineFill.parentElement], { opacity: 0, duration: 0.35, ease: 'power2.in' }, '+=0.5');
}

/* ─── HERO TEXT REVEAL ────────────────────── */
function initHero() {
  if (reduced) return;
  const tl = gsap.timeline({ delay: 0.05 });
  tl
    .fromTo('.hero-eyebrow',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }
    )
    .fromTo('.reveal-inner',
      { y: '110%' },
      { y: '0%', duration: 1, stagger: 0.12, ease: 'power4.out' },
      '-=0.3'
    )
    .fromTo('.hero-sub',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' },
      '-=0.5'
    )
    .fromTo('.hero-actions',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' },
      '-=0.45'
    )
    .fromTo('.hero-proof',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' },
      '-=0.4'
    )
    .fromTo('.hero-img-wrap',
      heroMobile
        ? { opacity: 0, y: 24 }
        : { opacity: 0, x: 40, rotate: 3 },
      heroMobile
        ? { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }
        : { opacity: 1, x: 0, rotate: 1.5, duration: 1.1, ease: 'power3.out' },
      0.2
    )
    .fromTo('.hero-badge',
      { opacity: 0, scale: 0.9, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.5)' },
      '-=0.4'
    );
}

/* ─── HERO IMG FLOAT ──────────────────────── */
function initFloat() {
  if (reduced || heroMobile) return;
  gsap.to('.hero-img-wrap', {
    y: -10,
    rotation: 2.5,
    duration: 3.2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });

  /* Parallax contenido: la foto interna se agranda un poco (scale) para
     tener margen de sobra dentro del marco con overflow:hidden, y ese
     margen se recorre con el scroll — nunca se ve un borde ni un hueco.
     Solo desktop: en mobile la foto vive sin recorte a propósito. */
  gsap.set('.hero-img', { scale: 1.14 });
  gsap.to('.hero-img', {
    y: 26,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/* ─── HEADER SCROLL ───────────────────────── */
ScrollTrigger.create({
  start: 'top -8',
  onEnter: () => document.getElementById('header').classList.add('scrolled'),
  onLeaveBack: () => document.getElementById('header').classList.remove('scrolled'),
});

/* ─── PROCESS STEPS ───────────────────────── */
function initProcess() {
  if (reduced) return;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '.process-section', start: 'top 80%' },
  });
  tl
    .fromTo('.step-card',
      { y: 60, opacity: 0, scale: 0.94 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.18, ease: 'power3.out' }
    )
    /* Los íconos hacen un rebote propio, superpuesto a la aparición de
       la card — solo escala/rotación, sin tocar opacity, para no
       sumarse a la opacity ya animada de la card (se verían más lentos
       si compiten por el mismo canal). */
    .fromTo('.step-icon',
      { scale: 0.3, rotate: -15 },
      { scale: 1, rotate: 0, duration: 0.6, stagger: 0.18, ease: 'back.out(1.8)' },
      '-=0.7'
    )
    /* Las flechas descansan a opacity:0.4 por diseño (ver style.css) —
       el reveal tiene que terminar ahí, no en 1. */
    .fromTo('.step-arrow',
      { opacity: 0, scale: 0.3 },
      { opacity: 0.4, scale: 1, duration: 0.55, stagger: 0.18, ease: 'back.out(2)' },
      '-=0.55'
    );

  /* Los pulsos infinitos van AFUERA de tl, como tweens propias con su
     propio delay — no encadenadas dentro del timeline de entrada. Dos
     tweens con repeat:-1 conviviendo en el mismo timeline (aunque
     arranquen en la misma etiqueta) generan estados inconsistentes al
     buscar una posición puntual; como tweens sueltas, cada una calcula
     su propio ciclo de forma independiente sin ambigüedad — mismo
     patrón ya probado en el pulso del botón de WhatsApp. Nada de esto
     depende de mouse ni touch, así que se ve igual en mobile y
     desktop — la inclinación con el mouse (initTilt) es la única parte
     de esta sección que sí es solo desktop. */
  gsap.to('.step-arrow', {
    scale: 1.4,
    opacity: 0.85,
    duration: 0.85,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 1.6,
    stagger: { each: 0.25, repeat: -1 },
  });
  /* A diferencia de la flecha, el ícono respira solo un par de veces
     y se queda quieto (repeat finito) — un pulso eterno en un ícono
     tan grande se leía como que la página estaba trabada, no como
     un detalle sutil. */
  gsap.to('.step-icon', {
    scale: 1.08,
    duration: 1.4,
    ease: 'sine.inOut',
    repeat: 3,
    yoyo: true,
    delay: 1.6,
    stagger: 0.2,
  });
}

/* ─── MENÚ (PREVIEW SIN LOGIN) ─────────────── */
function initMenuPreview() {
  if (reduced) return;
  gsap.fromTo('.menu-preview-card',
    { y: 40, opacity: 0, scale: 0.96 },
    {
      y: 0, opacity: 1, scale: 1,
      duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '.menu-preview-grid', start: 'top 85%' },
    }
  );
}

/* ─── PLANES ──────────────────────────────── */
function initPlans() {
  if (reduced) return;
  gsap.fromTo('.plan-card',
    { y: 50, opacity: 0 },
    {
      y: 0, opacity: 1,
      duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.plans-grid', start: 'top 82%' },
    }
  );

  /* Los precios cuentan desde 0 al aparecer — mismo recurso que ya usa
     "Nosotros" para 50+/100%/0, aplicado acá donde el usuario está
     mirando el precio con más atención. */
  document.querySelectorAll('.price-num').forEach((el) => {
    const target = parseInt(el.textContent.trim(), 10);
    if (!target) return;
    el.textContent = '0';
    const counter = { val: 0 };
    gsap.to(counter, {
      val: target,
      duration: 1.1,
      ease: 'power2.out',
      delay: 0.15,
      scrollTrigger: { trigger: '.plans-grid', start: 'top 82%', once: true },
      onUpdate: () => { el.textContent = Math.round(counter.val); },
    });
  });
}

/* ─── COMPARADOR DE PLANES ─────────────────── */
function initCompareTable() {
  if (reduced) return;
  gsap.fromTo('.compare-wrap',
    { y: 30, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.compare-wrap', start: 'top 85%' },
    }
  );
  /* Brillo único (no en loop) sobre la columna destacada, para guiar el
     ojo hacia el plan recomendado apenas se termina de revelar la tabla. */
  gsap.fromTo('.compare-featured-col',
    { filter: 'brightness(1)' },
    {
      filter: 'brightness(1.35)', duration: 0.5, ease: 'power2.out',
      yoyo: true, repeat: 1,
      scrollTrigger: { trigger: '.compare-wrap', start: 'top 80%', once: true },
      delay: 0.5,
    }
  );
}

/* ─── BADGES ──────────────────────────────── */
function initBadges() {
  if (reduced) return;
  gsap.fromTo('.badge-item',
    { opacity: 0, y: 14 },
    {
      opacity: 1, y: 0,
      duration: 0.55, stagger: 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: '.badges-section', start: 'top 90%' },
    }
  );
}

/* ─── TRUST BAR ───────────────────────────── */
function initTrustBar() {
  if (reduced) return;
  gsap.fromTo('.trust-item',
    { opacity: 0, y: 14 },
    {
      opacity: 1, y: 0,
      duration: 0.55, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.trust-bar', start: 'top 92%' },
    }
  );
}

/* ─── GALLERY ─────────────────────────────── */
function initGallery() {
  if (reduced) return;
  /* Ojo: el selector .gallery-img era de una versión anterior con 4
     fotos — la sección actual es un banner único (.gallery-banner) y
     esta animación nunca se ejecutaba. Se corrige y de paso se agrega
     parallax: la foto se agranda un poco (scale, gestionado por GSAP
     para no pisar el resto de las propiedades) para tener margen
     dentro del overflow:hidden de la sección, y ese margen se recorre
     con el scroll. */
  gsap.set('.gallery-banner', { scale: 1.1 });
  gsap.fromTo('.gallery-banner',
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.gallery-section', start: 'top 82%' },
    }
  );
  gsap.to('.gallery-banner', {
    y: 30,
    ease: 'none',
    scrollTrigger: {
      trigger: '.gallery-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/* ─── STRIP INGREDIENTES ─────────────────── */
function initStrip() {
  if (reduced) return;
  gsap.fromTo('.strip-quote',
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0,
      duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.strip-section', start: 'top 70%' },
    }
  );
  gsap.fromTo('.strip-tags',
    { opacity: 0, y: 16 },
    {
      opacity: 1, y: 0,
      duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '.strip-section', start: 'top 65%' },
      delay: 0.3,
    }
  );
  gsap.to('.strip-inner', {
    backgroundPosition: 'center 55%',
    ease: 'none',
    scrollTrigger: {
      trigger: '.strip-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/* ─── FOOD SECTION ────────────────────────── */
function initFood() {
  if (reduced) return;
  gsap.fromTo('.food-text-col > *',
    { x: 40, opacity: 0 },
    {
      x: 0, opacity: 1,
      duration: 0.75, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.food-section', start: 'top 75%' },
    }
  );
  /* La foto no tenía ninguna entrada — solo el texto. Se le suma un
     fade, y un zoom lento tipo "Ken Burns" (imperceptible salvo que te
     quedes mirando) mientras la sección está en pantalla. Reemplaza el
     hover-zoom anterior, que en mobile no existía. */
  gsap.fromTo('.food-photo',
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.food-section', start: 'top 75%' },
    }
  );
  gsap.to('.food-photo', {
    scale: 1.06,
    duration: 14,
    ease: 'none',
    scrollTrigger: { trigger: '.food-section', start: 'top bottom', once: true },
  });
}

/* ─── NOSOTROS ────────────────────────────── */
function initAbout() {
  if (reduced) return;
  gsap.fromTo('.about-text > *',
    { x: -36, opacity: 0 },
    {
      x: 0, opacity: 1,
      duration: 0.75, stagger: 0.09, ease: 'power3.out',
      scrollTrigger: { trigger: '.about-section', start: 'top 80%' },
    }
  );
  gsap.fromTo('.about-img-col',
    { x: 36, opacity: 0 },
    {
      x: 0, opacity: 1,
      duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: '.about-section', start: 'top 80%' },
    }
  );
}

/* ─── ABOUT STATS COUNTER ─────────────────── */
function initAboutStats() {
  if (reduced) return;
  document.querySelectorAll('.stat-num').forEach((el) => {
    const match = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) return;
    const target = parseInt(match[1], 10);
    const suffix = match[2];
    if (target === 0) return;

    el.textContent = '0' + suffix;
    const counter = { val: 0 };
    gsap.to(counter, {
      val: target,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.about-stats', start: 'top 85%', once: true },
      onUpdate: () => { el.textContent = Math.round(counter.val) + suffix; },
    });
  });
}

/* ─── CTA ─────────────────────────────────── */
function initCta() {
  if (reduced) return;
  gsap.fromTo('.cta-inner > *',
    { y: 28, opacity: 0 },
    {
      y: 0, opacity: 1,
      duration: 0.7, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.cta-section', start: 'top 82%' },
    }
  );
  /* El zoom de fondo pasa de "al pasar el mouse" a "al entrar en
     pantalla" — mismo efecto, dispara solo con scroll, visible en
     mobile también (antes dependía de hover). */
  gsap.set('.cta-bg', { scale: 1.05 });
  gsap.to('.cta-bg', {
    scale: 1,
    duration: 8,
    ease: 'power1.out',
    scrollTrigger: { trigger: '.cta-section', start: 'top 85%', once: true },
  });
}

/* ─── FOOTER ──────────────────────────────── */
function initFooter() {
  if (reduced) return;
  gsap.fromTo('.footer-top, .footer-bottom',
    { opacity: 0, y: 20 },
    {
      opacity: 1, y: 0,
      duration: 0.7, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#footer', start: 'top 92%' },
    }
  );
}

/* ─── WHATSAPP FLOTANTE ───────────────────── */
function initWhatsApp() {
  const el = document.querySelector('.whatsapp-float');
  if (!el || reduced) return;

  gsap.set(el, { scale: 0, opacity: 0 });
  gsap.to(el, {
    scale: 1, opacity: 1,
    duration: 0.6, delay: 1.1,
    ease: 'back.out(1.6)',
  });

  /* Pulso de atención bien espaciado — un respiro suave cada ~7s, no
     un rebote constante. Es el botón de contacto principal del sitio
     y hoy es 100% estático; con el tiempo se vuelve invisible a la
     vista ("ceguera a los banners"). */
  gsap.timeline({ repeat: -1, repeatDelay: 6, delay: 2.6 })
    .to(el, { scale: 1.15, duration: 0.4, ease: 'sine.out' })
    .to(el, { scale: 1, duration: 0.5, ease: 'sine.inOut' });

  /* El hover pasa a manejarlo GSAP (en vez del :hover de CSS) porque
     va a competir por la misma propiedad transform que el pulso de
     arriba — así GSAP puede resolver el conflicto entre ambos. */
  el.addEventListener('mouseenter', () => {
    gsap.to(el, { scale: 1.15, duration: 0.2, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { scale: 1, duration: 0.3, ease: 'power2.out' });
  });
}

/* ─── MAGNETIC BUTTONS ────────────────────── */
function initMagnetic() {
  if (reduced) return;
  document.querySelectorAll('.btn-mag').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.3;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.3;
      gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ─── TILT CON EL MOUSE (planes + pasos) ──── */
function tiltify(selector, strength) {
  document.querySelectorAll(selector).forEach((card) => {
    /* Se apaga solo en touch: mousemove no dispara sin mouse, así que
       en celular la card queda tal cual está en el CSS, sin código
       aparte para "desactivarlo". */
    card.addEventListener('mousemove', (e) => {
      const r  = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, {
        rotateY: px * strength,
        rotateX: -py * strength,
        y: -4,
        transformPerspective: 700,
        transformOrigin: 'center',
        duration: 0.4,
        ease: 'power2.out',
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.5, ease: 'power2.out' });
    });
  });
}

function initTilt() {
  if (reduced) return;
  tiltify('.plan-card', 9);
  tiltify('.step-card', 7);
}

/* ─── MOBILE NAV ──────────────────────────── */
const hamburger = document.getElementById('hamburger');
const nav       = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  hamburger.classList.toggle('active', open);
  hamburger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});
nav.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    nav.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

/* ─── INIT ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!reduced) {
    gsap.set('.hero-eyebrow, .hero-sub, .hero-actions, .hero-proof', { opacity: 0, y: 16 });
    gsap.set('.reveal-inner', { y: '110%' });
    gsap.set('.hero-img-wrap', heroMobile ? { opacity: 0, y: 24 } : { opacity: 0, x: 40 });
    gsap.set('.hero-badge', { opacity: 0 });
  }

  initFloat();
  initBadges();
  initStrip();
  initProcess();
  initMenuPreview();
  initPlans();
  initCompareTable();
  initTrustBar();
  initGallery();
  initFood();
  initAbout();
  initAboutStats();
  initCta();
  initFooter();
  initWhatsApp();
  initMagnetic();
  initTilt();

  runLoader();
});
