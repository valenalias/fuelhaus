/* ============================================
   FUELHAUS — Animaciones GSAP
============================================ */

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      { opacity: 0, x: 40, rotate: 3 },
      { opacity: 1, x: 0, rotate: 1.5, duration: 1.1, ease: 'power3.out' },
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
  if (reduced) return;
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

/* ─── MARQUEE ─────────────────────────────── */
const marqueeAnim = gsap.to('#marquee-track', {
  xPercent: -50,
  duration: 30,
  ease: 'none',
  repeat: -1,
  paused: reduced,
});
const marqueeOuter = document.getElementById('marquee-outer');
if (marqueeOuter) {
  marqueeOuter.addEventListener('mouseenter', () => marqueeAnim.pause());
  marqueeOuter.addEventListener('mouseleave', () => marqueeAnim.play());
}

/* ─── PROCESS STEPS ───────────────────────── */
function initProcess() {
  if (reduced) return;
  gsap.fromTo('.step-card',
    { y: 40, opacity: 0 },
    {
      y: 0, opacity: 1,
      duration: 0.75, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '.process-section', start: 'top 80%' },
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

/* ─── WHY GRID ────────────────────────────── */
function initWhy() {
  if (reduced) return;
  gsap.fromTo('.why-cell',
    { y: 32, opacity: 0 },
    {
      y: 0, opacity: 1,
      duration: 0.7, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.why-grid', start: 'top 82%' },
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

/* ─── 1. SPIN — Planes (estilo Cartier) ──── */
function initSpin() {
  const scene    = document.getElementById('spin-scene');
  const section  = document.querySelector('.spin-section');
  const items    = document.querySelectorAll('.spin-text-item');
  const dots     = document.querySelectorAll('.spin-dot-item');
  const progress = document.getElementById('spin-progress-fill');
  const imgWrap  = document.getElementById('spin-img-wrap');
  if (!scene || !section) return;

  const planClasses = ['', 'plan-1', 'plan-2'];
  let currentPlan = -1;

  function activatePlan(idx) {
    if (idx === currentPlan) return;
    currentPlan = idx;

    // Cambio de fondo y colores de texto
    scene.classList.remove('plan-0', 'plan-1', 'plan-2');
    if (idx > 0) scene.classList.add(planClasses[idx]);

    // Texto del plan activo
    items.forEach((el, i) => el.classList.toggle('active', i === idx));

    // Dots activos
    dots.forEach((el, i) => el.classList.toggle('active', i === idx));

    // Cambia la imagen visible según el plan
    const imgs = imgWrap.querySelectorAll('.spin-img');
    imgs.forEach((img, i) => {
      img.style.opacity = i === idx ? '1' : '0';
      img.style.position = i === idx ? 'relative' : 'absolute';
    });

    // Animación suave en la imagen
    gsap.fromTo(imgWrap,
      { rotateY: -8, scale: 0.96 },
      { rotateY: 0,  scale: 1, duration: 0.7, ease: 'power3.out' }
    );
  }

  // CSS sticky maneja el pegado — ScrollTrigger solo rastrea el progreso
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;
      if (progress) progress.style.width = (p * 100) + '%';
      const idx = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
      activatePlan(idx);
    },
  });

  // Estado inicial
  activatePlan(0);
}

/* ─── 2. CLEO — Feature cards ────────────── */
function initCleo() {
  const track = document.getElementById('cleo-track');
  const cards = document.querySelectorAll('.cleo-card');
  if (!track || cards.length === 0) return;

  // IntersectionObserver para activar overlay cuando la card está centrada
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('cleo-active', entry.intersectionRatio > 0.55);
    });
  }, {
    root: track,
    threshold: [0, 0.55, 1],
  });
  cards.forEach(card => observer.observe(card));

  // Scroll con arrastre (drag to scroll)
  let isDown = false, startX, scrollLeft;
  track.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    track.style.userSelect = 'none';
  });
  track.addEventListener('mouseleave', () => { isDown = false; });
  track.addEventListener('mouseup', () => { isDown = false; track.style.userSelect = ''; });
  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.2;
  });

  // Animar la entrada de la sección al scroll
  if (!reduced) {
    gsap.fromTo('.cleo-card',
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.cleo-section', start: 'top 85%' },
      }
    );
  }
}

/* ─── 3. ARCH — Reveal ────────────────────── */
function initArch() {
  const scene   = document.querySelector('.arch-scene');
  const section = document.querySelector('.arch-section');
  const overlay = document.getElementById('arch-overlay');
  const photo   = document.querySelector('.arch-photo');
  const archText = document.getElementById('arch-text');
  const wins    = document.querySelectorAll('.arch-win');
  if (!scene || !section) return;

  // Estado inicial: arcos pequeños, overlay visible
  gsap.set(wins, { scale: 1 });
  gsap.set(archText, { opacity: 0, y: 20 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      pin: scene,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        // Revelar la foto gradualmente
        if (photo) photo.style.opacity = Math.min(p * 2, 1);
        // Overlay desaparece
        if (overlay) overlay.style.opacity = Math.max(1 - p * 2.5, 0);
      },
    },
  });

  tl
    .to(wins, {
      scale: 18,
      transformOrigin: 'center bottom',
      ease: 'power2.in',
      stagger: { amount: 0.3, from: 'center' },
      duration: 1,
    })
    .to(archText, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power3.out',
    }, '-=0.1');

  // Sección de título pasante
  if (!reduced) {
    gsap.fromTo('.passing-word',
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0,
        duration: 0.8, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.arch-passing-section', start: 'top 75%' },
      }
    );
  }
}

/* ─── 4. STATS — Contador ────────────────── */
function initStats() {
  const counters = document.querySelectorAll('.stat-counter');
  if (counters.length === 0) return;

  counters.forEach((counter) => {
    const target = parseInt(counter.dataset.target, 10);
    const obj = { val: 0 };

    // Animación de entrada del bloque
    gsap.fromTo(counter.closest('.stat-item'),
      { opacity: 0, y: 28 },
      {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.stats-section', start: 'top 82%' },
      }
    );

    // Contador
    gsap.to(obj, {
      val: target,
      duration: 2.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.stats-section',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        counter.textContent = Math.round(obj.val);
      },
    });
  });
}

/* ─── 5. NEWSLETTER ──────────────────────── */
function initNewsletter() {
  if (reduced) return;
  gsap.fromTo('.nl-inner > *',
    { opacity: 0, y: 28 },
    {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.nl-section', start: 'top 82%' },
    }
  );
}

/* ─── INIT ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!reduced) {
    gsap.set('.hero-eyebrow, .hero-sub, .hero-actions, .hero-proof', { opacity: 0, y: 16 });
    gsap.set('.reveal-inner', { y: '110%' });
    gsap.set('.hero-img-wrap', { opacity: 0, x: 40 });
    gsap.set('.hero-badge', { opacity: 0 });
  }

  initFloat();
  initProcess();
  initPlans();
  initFood();
  initWhy();
  initAbout();
  initCta();
  initMagnetic();

  // 5 efectos nuevos
  initSpin();
  initCleo();
  initArch();
  initStats();
  initNewsletter();

  runLoader();
});
