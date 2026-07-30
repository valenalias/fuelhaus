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
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, stagger: 0.15, ease: 'power3.out' }
    )
    /* Los íconos hacen un pequeño rebote propio, superpuesto a la
       aparición de la card — solo escala/rotación, sin tocar opacity,
       para no sumarse a la opacity ya animada de la card (se verían
       más lentos si se dejan competir por el mismo canal). */
    .fromTo('.step-icon',
      { scale: 0.4, rotate: -8 },
      { scale: 1, rotate: 0, duration: 0.55, stagger: 0.15, ease: 'back.out(1.6)' },
      '-=0.55'
    )
    /* Las flechas descansan a opacity:0.4 por diseño (ver style.css) —
       el reveal tiene que terminar ahí, no en 1. */
    .fromTo('.step-arrow',
      { opacity: 0, scale: 0.5 },
      { opacity: 0.4, scale: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out' },
      '-=0.5'
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

/* ─── GALLERY ─────────────────────────────── */
function initGallery() {
  if (reduced) return;
  gsap.fromTo('.gallery-img',
    { opacity: 0, scale: 1.04 },
    {
      opacity: 1, scale: 1,
      duration: 0.75, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.gallery-section', start: 'top 82%' },
    }
  );
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
  initPlans();
  initGallery();
  initFood();
  initAbout();
  initAboutStats();
  initCta();
  initMagnetic();

  runLoader();
});
