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

/* ─── CALCULADORA DE MACROS ──────────────── */
function initCalc() {
  /* Estado */
  const data = { goal: null, gender: null, age: 25, weight: 70, height: 170, activity: null };
  let currentStep = 1;
  const totalSteps = 6;

  /* Elementos */
  const hook      = document.getElementById('calc-hook');
  const wizard    = document.getElementById('calc-wizard');
  const startBtn  = document.getElementById('calc-start-btn');
  const progFill  = document.getElementById('calc-prog-fill');
  const progTxt   = document.getElementById('calc-prog-txt');
  const result    = document.getElementById('calc-result');
  const restartBtn= document.getElementById('calc-restart');

  if (!startBtn) return;

  /* Arrancar wizard */
  startBtn.addEventListener('click', () => {
    gsap.to(hook, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in',
      onComplete: () => {
        hook.style.display = 'none';
        wizard.style.display = 'block';
        gsap.from(wizard, { opacity: 0, y: 30, duration: 0.5, ease: 'power3.out' });
        showStep(1);
      }
    });
  });

  /* Mostrar paso */
  function showStep(n) {
    currentStep = n;
    document.querySelectorAll('.calc-step').forEach(s => s.classList.remove('active'));
    const step = document.getElementById('cstep-' + n);
    if (!step) return;

    step.style.display = 'block';
    step.classList.add('active');
    gsap.from(step, { opacity: 0, x: 40, duration: 0.45, ease: 'power3.out' });

    const pct = ((n - 1) / totalSteps) * 100;
    progFill.style.width = pct + '%';
    progTxt.textContent = 'Paso ' + n + ' de ' + totalSteps;
  }

  /* Avanzar al siguiente paso */
  function goNext(n) {
    const current = document.getElementById('cstep-' + currentStep);
    gsap.to(current, { opacity: 0, x: -30, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        current.style.display = 'none';
        current.classList.remove('active');
        if (n > totalSteps) {
          showResult();
        } else {
          showStep(n);
        }
      }
    });
  }

  /* Opciones de click */
  document.querySelectorAll('.calc-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const field = opt.dataset.field;
      const val   = opt.dataset.val;
      data[field] = val;

      /* Feedback visual */
      const siblings = opt.closest('.calc-opts').querySelectorAll('.calc-opt');
      siblings.forEach(s => s.classList.remove('selected'));
      opt.classList.add('selected');

      gsap.from(opt, { scale: 0.96, duration: 0.2, ease: 'back.out(2)' });

      /* Auto-avanzar */
      const stepMap = { goal: 2, gender: 3, activity: 7 };
      const next = stepMap[field];
      if (next) setTimeout(() => goNext(next), 320);
    });
  });

  /* Botones "Continuar" */
  document.querySelectorAll('.calc-next-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = parseInt(btn.dataset.next);
      goNext(next);
    });
  });

  /* Ajustadores numéricos */
  function setupNum(id, field, min, max) {
    const display = document.getElementById(id + '-val');
    document.getElementById(id + '-minus').addEventListener('click', () => {
      if (data[field] > min) { data[field]--; display.textContent = data[field]; pulse(display); }
    });
    document.getElementById(id + '-plus').addEventListener('click', () => {
      if (data[field] < max) { data[field]++; display.textContent = data[field]; pulse(display); }
    });
  }
  function pulse(el) {
    gsap.from(el, { scale: 1.2, duration: 0.2, ease: 'back.out(2)' });
  }
  setupNum('age',    'age',    10, 99);
  setupNum('weight', 'weight', 30, 250);
  setupNum('height', 'height', 100, 230);

  /* Cálculo BMR (Mifflin-St Jeor) */
  function calcBMR() {
    const base = (10 * data.weight) + (6.25 * data.height) - (5 * data.age);
    return data.gender === 'male' ? base + 5 : base - 161;
  }

  /* Splits de macros según objetivo */
  const splits = {
    lose:     { prot: 0.40, carb: 0.30, fat: 0.30, adj: -400 },
    gain:     { prot: 0.30, carb: 0.45, fat: 0.25, adj:  300 },
    maintain: { prot: 0.25, carb: 0.50, fat: 0.25, adj:    0 },
    healthy:  { prot: 0.25, carb: 0.50, fat: 0.25, adj:    0 },
  };

  /* Planes recomendados por objetivo */
  const planRec = {
    lose:     { name: 'Plan Performance', price: '$190', desc: 'Controlás almuerzos y cenas — las dos comidas que más impactan en tu déficit calórico.' },
    gain:     { name: 'Plan Full System', price: '$225', desc: 'Máxima cobertura calórica y proteica. Almuerzos, cenas, shots y snacks para construir músculo.' },
    maintain: { name: 'Plan Performance', price: '$190', desc: 'El balance ideal entre consistencia y cobertura para mantener tu composición actual.' },
    healthy:  { name: 'Plan Structure',   price: '$120', desc: 'Organizá tu almuerzo diario con comida real, fresca y equilibrada sin complicarte.' },
  };

  /* Mostrar resultado */
  function showResult() {
    const bmr    = calcBMR();
    const tdee   = bmr * parseFloat(data.activity);
    const split  = splits[data.goal] || splits.healthy;
    const cals   = Math.round(tdee + split.adj);
    const prot   = Math.round(cals * split.prot / 4);
    const carb   = Math.round(cals * split.carb / 4);
    const fat    = Math.round(cals * split.fat  / 9);
    const plan   = planRec[data.goal] || planRec.healthy;

    /* Ocultar último step */
    const lastStep = document.getElementById('cstep-6');
    if (lastStep) { lastStep.style.display = 'none'; lastStep.classList.remove('active'); }

    /* Progreso completo */
    progFill.style.width = '100%';
    progTxt.textContent  = '¡Listo! Tu plan personalizado';

    /* Mostrar resultado */
    result.style.display = 'block';
    gsap.from(result, { opacity: 0, y: 40, duration: 0.6, ease: 'power3.out' });

    /* Animar números */
    const calObj  = { v: 0 };
    const protObj = { v: 0 };
    const carbObj = { v: 0 };
    const fatObj  = { v: 0 };

    gsap.to(calObj,  { v: cals, duration: 1.4, ease: 'power2.out', onUpdate: () => { document.getElementById('res-cal').textContent  = Math.round(calObj.v).toLocaleString('es-AR'); }});
    gsap.to(protObj, { v: prot, duration: 1.2, ease: 'power2.out', delay: 0.2, onUpdate: () => { document.getElementById('res-prot').textContent = Math.round(protObj.v) + 'g'; }});
    gsap.to(carbObj, { v: carb, duration: 1.2, ease: 'power2.out', delay: 0.3, onUpdate: () => { document.getElementById('res-carb').textContent = Math.round(carbObj.v) + 'g'; }});
    gsap.to(fatObj,  { v: fat,  duration: 1.2, ease: 'power2.out', delay: 0.4, onUpdate: () => { document.getElementById('res-fat').textContent  = Math.round(fatObj.v)  + 'g'; }});

    /* Barras de macros */
    setTimeout(() => {
      document.getElementById('bar-prot').style.width = Math.round(split.prot * 100) + '%';
      document.getElementById('bar-carb').style.width = Math.round(split.carb * 100) + '%';
      document.getElementById('bar-fat').style.width  = Math.round(split.fat  * 100) + '%';
    }, 600);

    /* Plan recomendado */
    document.getElementById('result-plan-rec').innerHTML = `
      <span class="result-plan-title">Plan recomendado para vos</span>
      <span class="result-plan-name">${plan.name} — ${plan.price}/semana</span>
      <span class="result-plan-desc">${plan.desc}</span>
    `;

    /* CTA con scroll suave a planes */
    document.getElementById('res-cta-btn').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('planes').scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* Reiniciar */
  restartBtn.addEventListener('click', () => {
    data.goal = data.gender = data.activity = null;
    data.age = 25; data.weight = 70; data.height = 170;
    document.getElementById('age-val').textContent    = 25;
    document.getElementById('weight-val').textContent = 70;
    document.getElementById('height-val').textContent = 170;
    document.querySelectorAll('.calc-opt').forEach(o => o.classList.remove('selected'));
    result.style.display = 'none';
    progFill.style.width = '0%';
    showStep(1);
  });

  /* Animación de entrada del hook */
  if (!reduced) {
    gsap.fromTo('#calc-hook',
      { opacity: 0, y: 36 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.calc-section', start: 'top 80%' }
      }
    );
  }
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

  // Calculadora de macros
  initCalc();

  runLoader();
});
