/* ==========================================================
   The Six — Interacciones del sitio
   ========================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupNavbarScroll();
    setupMobileMenu();
    setupScrollReveal();
    setupCarousel();
    setupContactForm();
  }

  /* ----------------------------------------------------------
     1. Navbar: agrega sombra al hacer scroll
     ---------------------------------------------------------- */
  function setupNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 12);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------
     2. Menú mobile: toggle del hamburguesa
     ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     3. Animación de revelado al hacer scroll
        IntersectionObserver para mejor performance
     ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     4. Carrusel infinito del equipo
        Técnica: clones al inicio y al final del track.
        - Al wrappear forward: anima al bloque de trailing clones
          (idéntico visualmente a pos=0), luego teleporta sin
          animación a la posición real.
        - Al wrappear backward: ídem con leading clones → maxPos.
     ---------------------------------------------------------- */
  function setupCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('carouselDots');
    if (!track || !prevBtn || !nextBtn) return;

    const GAP = 20;
    const SLIDE_DUR = 480;
    const WRAP_DUR  = 600;

    let pos = 0;
    let busy = false;
    let autoplayId;

    // Guardamos los slides originales antes de clonar
    const origSlides = Array.from(track.children);
    const N = origSlides.length;

    function vis() {
      const w = window.innerWidth;
      return w >= 1024 ? 4 : w >= 768 ? 3 : 2;
    }
    function maxPos() { return Math.max(0, N - vis()); }

    // Reconstruye el DOM con v clones delante y v clones detrás
    function buildDOM() {
      while (track.firstChild) track.removeChild(track.firstChild);
      const v = vis();
      for (let i = N - v; i < N; i++) {               // leading clones
        const c = origSlides[i].cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      }
      origSlides.forEach(s => track.appendChild(s.cloneNode(true))); // reales
      for (let i = 0; i < v; i++) {                   // trailing clones
        const c = origSlides[i].cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      }
    }

    function sw() {
      const child = track.firstElementChild;
      return child ? child.getBoundingClientRect().width + GAP : 0;
    }

    // offsetFor(p) → p=0 es el primer slide real (saltando los v leading clones)
    function offsetFor(p) { return sw() * (p + vis()); }

    function setInstant(p) {
      track.style.transition = 'none';
      track.style.transform  = `translateX(-${offsetFor(p)}px)`;
    }

    function animateTo(offset, dur, onDone) {
      track.style.transition = `transform ${dur}ms cubic-bezier(0.25,0.46,0.45,0.94)`;
      track.style.transform  = `translateX(-${offset}px)`;
      setTimeout(onDone, dur + 20);
    }

    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      for (let i = 0; i <= maxPos(); i++) {
        const d = document.createElement('button');
        d.className = 'carousel-dot';
        d.setAttribute('aria-label', `Ir al slide ${i + 1}`);
        d.addEventListener('click', () => {
          if (busy) return;
          busy = true;
          pos = i;
          animateTo(offsetFor(pos), SLIDE_DUR, () => { busy = false; });
          syncDots();
          startAutoplay();
        });
        dotsContainer.appendChild(d);
      }
      syncDots();
    }

    function syncDots() {
      if (!dotsContainer) return;
      [...dotsContainer.children].forEach((d, i) => d.classList.toggle('active', i === pos));
    }

    function next() {
      if (busy) return;
      busy = true;
      const v = vis(), max = maxPos();

      if (pos < max) {
        pos++;
        animateTo(offsetFor(pos), SLIDE_DUR, () => { busy = false; });
        syncDots();
      } else {
        // Anima hasta los trailing clones (visualmente = pos 0), luego teleporta
        const wrapOffset = sw() * (N + v + v); // offsetFor(N) = (N + v) * sw → trailing block
        pos = 0;
        syncDots();
        animateTo(wrapOffset, WRAP_DUR, () => {
          setInstant(0);
          busy = false;
        });
      }
    }

    function prev() {
      if (busy) return;
      busy = true;

      if (pos > 0) {
        pos--;
        animateTo(offsetFor(pos), SLIDE_DUR, () => { busy = false; });
        syncDots();
      } else {
        // Anima hasta los leading clones (visualmente = maxPos), luego teleporta
        // offsetFor(-v) = sw() * (-v + v) = 0  → inicio del track = leading clones block
        pos = maxPos();
        syncDots();
        animateTo(0, WRAP_DUR, () => {
          setInstant(maxPos());
          busy = false;
        });
      }
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayId = setInterval(next, 4000);
    }
    function stopAutoplay() { clearInterval(autoplayId); }

    function init() {
      pos  = 0;
      busy = false;
      buildDOM();
      buildDots();
      setInstant(0);
      startAutoplay();
    }

    nextBtn.addEventListener('click', () => { next(); startAutoplay(); });
    prevBtn.addEventListener('click', () => { prev(); startAutoplay(); });
    track.parentElement.addEventListener('mouseenter', stopAutoplay);
    track.parentElement.addEventListener('mouseleave', startAutoplay);

    let rTimer;
    window.addEventListener('resize', () => {
      clearTimeout(rTimer);
      rTimer = setTimeout(init, 150);
    });

    let tx = 0;
    track.addEventListener('touchstart', e => {
      tx = e.touches[0].clientX;
      stopAutoplay();
    }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = tx - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
      startAutoplay();
    });

    init();
  }

  /* ----------------------------------------------------------
     5. Formulario + modal de especialidades
        Al enviar: valida → abre popup → usuario elige
        especialidad → abre WhatsApp del profesional
     ---------------------------------------------------------- */
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
        wa:     '5491100000001', // ← reemplazar con número real
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
                 <path stroke-linecap="round" d="M12 2a5 5 0 00-5 5c0 1.5.5 2.5 1 4 .5 1.5 1 4 1 7 0 2 1 4 2 4s1-2 1-4 1-2 1 0 0 4 1 4 2-2 2-4c0-3 .5-5.5 1-7 .5-1.5 1-2.5 1-4a5 5 0 00-5-5z"/>
               </svg>`,
      },
      {
        nombre: 'Pediatría',
        prof:   'Dra. Romero',
        wa:     '5491100000002', // ← reemplazar con número real
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/>
               </svg>`,
      },
      {
        nombre: 'Kinesiología',
        prof:   'Lic. R. Romero',
        wa:     '5491100000003', // ← reemplazar con número real
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M9 11V7a3 3 0 016 0v4M5 11h14l-1 9H6l-1-9z"/>
               </svg>`,
      },
      {
        nombre: 'Alto Rendimiento',
        prof:   'Lic. N. Romero',
        wa:     '5491100000004', // ← reemplazar con número real
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

      const nombre   = form.nombre.value.trim();
      const apellido = form.apellido.value.trim();
      const telefono = form.telefono.value.trim();
      const consulta = form.consulta.value.trim();

      const waText = encodeURIComponent(
        `Hola! Me comunico desde la web de The Six.\n\nNombre: ${nombre} ${apellido}\nTeléfono: ${telefono}\n\nConsulta: ${consulta}`
      );

      openModal(waText);
    });

    form.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => {
        input.closest('.form-field').classList.remove('error');
      });
    });
  }

})();
