(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  const header = document.querySelector('.site-header');
  const toTop = document.querySelector('.to-top');

  const closeMenu = () => {
    menuButton?.classList.remove('open');
    menu?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-locked');
  };

  menuButton?.addEventListener('click', () => {
    const open = !menuButton.classList.contains('open');
    menuButton.classList.toggle('open', open);
    menu?.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-locked', open);
  });
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  const onScroll = () => {
    const top = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header?.classList.toggle('scrolled', top > 40);
    toTop?.classList.toggle('visible', top > 40);
    root.style.setProperty('--page-progress', (max > 0 ? (top / max) * 100 : 0) + '%');
    root.style.setProperty('--hero-shift', Math.min(top * 0.08, 72) + 'px');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

  const heroImages = [...document.querySelectorAll('.hero-slides .hero-image')];
  if (heroImages.length > 1) {
    let heroActive = 0;
    setInterval(() => {
      if (document.hidden) return;
      heroImages[heroActive].classList.remove('active');
      heroActive = (heroActive + 1) % heroImages.length;
      heroImages[heroActive].classList.add('active');
    }, 5000);
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

  document.querySelectorAll('.product-media').forEach((media) => {
    const images = [...media.querySelectorAll('.product-images img')];
    const dots = [...media.querySelectorAll('.media-dots button')];
    if (images.length < 2) return;
    let active = 0;
    const show = (index) => {
      active = index;
      images.forEach((image, i) => image.classList.toggle('active', i === active));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === active));
      const counter = media.querySelector('.media-index');
      if (counter) counter.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(images.length).padStart(2, '0');
    };
    dots.forEach((dot, index) => dot.addEventListener('click', () => show(index)));
    setInterval(() => {
      if (!document.hidden) show((active + 1) % images.length);
    }, 3800);
  });

  const morphBox = document.querySelector('.hero-morph');
  const morphIcon = morphBox?.querySelector('.hero-morph-stage svg');
  const morphPath = morphIcon?.querySelector('path');
  if (morphIcon && morphPath) {
    const shapes = [
      'M20 18 L100 18 L100 136 L20 136 Z M60 18 L60 136 M20 77 L100 77 M26 24 L94 24',
      'M35 12 L85 12 L85 138 L35 138 Z M39 16 L81 16 M73 73 L79 73 M39 134 L81 134',
      'M15 30 L105 30 L105 120 L15 120 Z M58 30 L58 120 M66 30 L66 120 M49 73 L55 73',
      'M30 10 L90 10 L90 140 L30 140 Z M62 27 L80 27 M62 52 L80 52 M45 67 L45 82',
    ];
    let morphActive = 0;
    setInterval(() => {
      morphActive = (morphActive + 1) % shapes.length;
      morphIcon.classList.remove('morph-swap');
      morphPath.setAttribute('d', shapes[morphActive]);
      void morphIcon.getBoundingClientRect();
      morphIcon.classList.add('morph-swap');
    }, 2600);
  }

  document.querySelectorAll('.video-card').forEach((card) => {
    const video = card.querySelector('video');
    const button = card.querySelector('.video-toggle');
    if (!video || !button) return;
    const icon = (playing) => playing
      ? '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 6v12M16 6v12"></path></svg>'
      : '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 6 9 6-9 6Z"></path></svg>';
    const setState = (playing) => {
      button.innerHTML = icon(playing);
      button.setAttribute('aria-label', playing ? 'Metti in pausa' : 'Riproduci');
    };
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    let inView = false;
    const startVideo = () => {
      video.play().then(() => setState(true)).catch(() => {
        video.addEventListener('canplay', () => {
          if (inView) video.play().then(() => setState(true)).catch(() => {});
        }, { once: true });
      });
    };
    button.addEventListener('click', () => {
      if (video.paused) video.play().then(() => setState(true)).catch(() => {});
      else { video.pause(); setState(false); }
    });
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (entry.isIntersecting) startVideo();
      else { video.pause(); setState(false); }
    }, { threshold: 0.2 });
    observer.observe(video);
  });

  const cards = [...document.querySelectorAll('.gallery-card')];
  let current = 0;
  let lightbox;
  const closeLightbox = () => {
    lightbox?.remove();
    lightbox = undefined;
    document.body.classList.remove('menu-locked');
  };
  const showLightbox = (index) => {
    current = (index + cards.length) % cards.length;
    const source = cards[current].querySelector('img');
    if (!source) return;
    closeLightbox();
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Chiudi">×</button><button class="lightbox-prev" type="button" aria-label="Immagine precedente">←</button><figure><img><figcaption></figcaption></figure><button class="lightbox-next" type="button" aria-label="Immagine successiva">→</button>';
    const image = lightbox.querySelector('img');
    image.src = source.src;
    image.alt = source.alt;
    lightbox.querySelector('figcaption').textContent = source.alt;
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showLightbox(current - 1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => showLightbox(current + 1));
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
    document.body.append(lightbox);
    document.body.classList.add('menu-locked');
  };
  cards.forEach((card, index) => card.addEventListener('click', () => showLightbox(index)));
  window.addEventListener('keydown', (event) => {
    if (!lightbox) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') showLightbox(current + 1);
    if (event.key === 'ArrowLeft') showLightbox(current - 1);
  });

  const form = document.querySelector('.quote form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const original = button?.textContent;
    if (button) { button.disabled = true; button.textContent = 'Invio in corso…'; }
    try {
      await fetch('https://script.google.com/macros/s/AKfycbzh-uwCnC8pgixpJysmbi8alzodswUPN-qUL3k3vXhGu4jEfdXK5Z7bEo-QJDLVkqxaTw/exec', {
        method: 'POST', mode: 'no-cors', body: new URLSearchParams(new FormData(form)),
      });
      form.reset();
      const message = document.createElement('p');
      message.className = 'form-message success';
      message.textContent = 'Richiesta inviata. Ti ricontatteremo al più presto.';
      form.append(message);
    } catch {
      const message = document.createElement('p');
      message.className = 'form-message error';
      message.textContent = 'Invio non riuscito. Puoi chiamarci o scriverci direttamente.';
      form.append(message);
    } finally {
      if (button) { button.disabled = false; button.textContent = original; }
    }
  });
})();
