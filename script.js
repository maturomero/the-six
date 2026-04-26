

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupNavbarScroll();
    setupMobileMenu();
    setupScrollReveal();
    setupScrollSpy();
    setupCarousel();
    setupContactForm();
  }

  
     //Navbar: agrega sombra al hacer scroll
  function setupNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 12);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // marca el link activo según la sección visible
     
  function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('header nav a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    function setActive(id) {
      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('nav-active', isActive);
      });
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, {
      rootMargin: '-40% 0px -55% 0px',
      threshold: 0,
    });

    sections.forEach(s => observer.observe(s));
  }

  // menu hamburguesa
  function setupMobileMenu() {
    const btn = document.getElementById('menuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => menu.classList.toggle('hidden'));

    // Cerrar el menú al tocar cualquier link
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => menu.classList.add('hidden'));
    });
  }

// scroll
  function setupScrollReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -60px 0px',
    });

    targets.forEach(el => observer.observe(el));
  }

  /* -- Carrusel infinito del equipo -- */
  function setupCarousel() {
    const track         = document.getElementById('carouselTrack');
    const prevBtn       = document.getElementById('prevBtn');
    const nextBtn       = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('carouselDots');
    const topBar        = document.getElementById('carouselTopBar');
    const bottomBar     = document.getElementById('carouselBottomBar');
    if (!track || !prevBtn || !nextBtn) return;

    const orig     = Array.from(track.children);
    const N        = orig.length;
    const carousel = track.parentElement;
    let domPos     = N; // posición actual en DOM; N..2N-1 = slides reales
    let correcting = false;

    function slideW() {
      const s = track.firstElementChild;
      return s ? s.getBoundingClientRect().width + 20 : 0;
    }
    function realIdx(dp) { return ((dp - N) % N + N) % N; }

    // DOM layout: [N pre-clones] [N slides reales] [N post-clones]
    function buildDOM() {
      Array.from(track.children).forEach(c => { if (c.dataset.clone) c.remove(); });
      orig.forEach(s => {
        const c = s.cloneNode(true);
        c.dataset.clone = '1';
        c.setAttribute('aria-hidden', 'true');
        track.insertBefore(c, orig[0]);
      });
      orig.forEach(s => {
        const c = s.cloneNode(true);
        c.dataset.clone = '1';
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      });
    }

    function moveTo(dp, instant) {
      if (instant) { track.style.transition = 'none'; void track.offsetWidth; }
      else           track.style.transition = '';
      track.style.transform = `translateX(-${slideW() * dp}px)`;
    }

    track.addEventListener('transitionend', () => {
      if (correcting) return;
      if (domPos < N || domPos >= 2 * N) {
        correcting = true;
        domPos = N + realIdx(domPos);
        moveTo(domPos, true);
        correcting = false;
      }
    });

    function goTo(dp) {
      domPos = dp;
      moveTo(dp, false);
      syncDots();
      resetBarsAnimation();
    }

    function next() { goTo(domPos + 1); }
    function prev() { goTo(domPos - 1); }

    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      for (let i = 0; i < N; i++) {
        const d = document.createElement('button');
        d.className = 'carousel-dot';
        d.setAttribute('aria-label', `Ir al slide ${i + 1}`);
        d.addEventListener('click', () => goTo(N + i));
        dotsContainer.appendChild(d);
      }
      syncDots();
    }

    function syncDots() {
      if (!dotsContainer) return;
      const ri = realIdx(domPos);
      [...dotsContainer.children].forEach((d, i) => d.classList.toggle('active', i === ri));
    }

    function startBarsAnimation() {
      [topBar, bottomBar].forEach(bar => {
        if (!bar) return;
        const fill = bar.querySelector('.carousel-bar-fill');
        if (!fill) return;
        fill.style.transition = 'width 10s linear';
        fill.style.width = '0';
      });
    }

    function resetBarsAnimation() {
      [topBar, bottomBar].forEach(bar => {
        if (!bar) return;
        const fill = bar.querySelector('.carousel-bar-fill');
        if (!fill) return;
        fill.style.transition = 'none';
        fill.style.width = '100%';
        void fill.offsetWidth;
      });
      setTimeout(startBarsAnimation, 50);
    }

    // Drag / swipe
    let startX = 0, dragging = false, dragDelta = 0;

    function onStart(x) {
      startX = x; dragging = true; dragDelta = 0;
      track.style.transition = 'none';
      carousel.classList.add('is-dragging');
    }
    function onMove(x) {
      if (!dragging) return;
      dragDelta = x - startX;
      track.style.transform = `translateX(${-(slideW() * domPos) + dragDelta}px)`;
    }
    function onEnd() {
      if (!dragging) return;
      dragging = false;
      carousel.classList.remove('is-dragging');
      const sw = slideW();
      if (sw) goTo(Math.round(domPos - dragDelta / sw));
    }

    carousel.addEventListener('touchstart', e => onStart(e.touches[0].clientX),   { passive: true });
    carousel.addEventListener('touchmove',  e => onMove(e.touches[0].clientX),    { passive: true });
    carousel.addEventListener('touchend',   () => onEnd());
    carousel.addEventListener('mousedown',  e => { e.preventDefault(); onStart(e.clientX); });
    window.addEventListener('mousemove',    e => onMove(e.clientX));
    window.addEventListener('mouseup',      () => onEnd());

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    let rTimer;
    window.addEventListener('resize', () => {
      clearTimeout(rTimer);
      rTimer = setTimeout(() => {
        const ri = realIdx(domPos);
        buildDOM();
        domPos = N + ri;
        buildDots();
        moveTo(domPos, true);
      }, 150);
    });

    buildDOM();
    buildDots();
    moveTo(domPos, true);
    resetBarsAnimation();
  }

  /* --5. Formulario + modal de especialidades-- */
  function setupContactForm() {
    const form    = document.getElementById('contactForm');
    const modal   = document.getElementById('specialtyModal');
    const closeBtn = document.getElementById('modalClose');
    const list    = document.getElementById('specialtyList');
    if (!form || !modal) return;

    const ESPECIALIDADES = [
      {
        nombre: 'Odontología',
        prof:   'Dra. Szyszka',
        wa:     '5491136373969', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
                 <path stroke-linecap="round" d="M12 2a5 5 0 00-5 5c0 1.5.5 2.5 1 4 .5 1.5 1 4 1 7 0 2 1 4 2 4s1-2 1-4 1-2 1 0 0 4 1 4 2-2 2-4c0-3 .5-5.5 1-7 .5-1.5 1-2.5 1-4a5 5 0 00-5-5z"/>
               </svg>`,
      },
      {
        nombre: 'Pediatría',
        prof:   'Dra. Romero',
        wa:     '5491136197463', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/>
               </svg>`,
      },
      {
        nombre: 'Kinesiología',
        prof:   'Lic. R. Romero',
        wa:     '5491159822880', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 013 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"/>
               </svg>`,
      },
      {
        nombre: 'Alto Rendimiento',
        prof:   'Lic. N. Romero',
        wa:     '5491135683328', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
               </svg>`,
      },
    ];

    let pendingMessage = '';

    // Construye los botones del modal
    ESPECIALIDADES.forEach(esp => {
      const btn = document.createElement('button');
      btn.className = 'specialty-btn';
      btn.innerHTML = `
        <span class="spec-icon">${esp.icon}</span>
        <span class="spec-name">${esp.nombre}</span>
        <span class="spec-prof">${esp.prof}</span>
      `;
      btn.addEventListener('click', () => {
        window.open(`https://wa.me/${esp.wa}?text=${pendingMessage}`, '_blank');
        closeModal();
        form.reset();
      });
      list.appendChild(btn);
    });

    function openModal(message) {
      pendingMessage = message;
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Submit del formulario
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      form.querySelectorAll('input[required], textarea[required]').forEach(field => {
        const wrapper = field.closest('.form-field');
        if (!field.value.trim()) {
          wrapper.classList.add('error');
          isValid = false;
        } else {
          wrapper.classList.remove('error');
        }
      });
      if (!isValid) return;

      const nombre   = form.nombre   ? form.nombre.value.trim()   : '';
      const apellido = form.apellido ? form.apellido.value.trim() : '';
      const consulta = form.consulta ? form.consulta.value.trim() : '';

      const lineas = [
        `Hola! Me comunico desde la web de The Six.`,
        ``,
        nombre || apellido ? `Nombre: ${nombre} ${apellido}`.trim() : null,
        consulta           ? `\nConsulta: ${consulta}`            : null,
      ].filter(l => l !== null).join('\n');

      const waText = encodeURIComponent(lineas);

      openModal(waText);
    });

    form.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => {
        input.closest('.form-field').classList.remove('error');
      });
    });
  }

})();
