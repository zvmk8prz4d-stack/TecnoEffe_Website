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

  const phoneLandscape = window.matchMedia('(orientation: landscape) and (max-height: 600px) and (max-width: 1000px)');
  const closeLandscapeMenu = () => {
    if (phoneLandscape.matches) closeMenu();
  };
  closeLandscapeMenu();
  phoneLandscape.addEventListener('change', closeLandscapeMenu);

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
  heroImages.forEach((img, index) => {
    img.classList.add(`hero-image-${index + 1}`);
    if (index === 0) img.classList.add('hero-image-initial');
  });

  const heroVideo = heroImages.find((el) => el.tagName === 'VIDEO');

  // Chi apre il sito in una scheda di sfondo (un ctrl+clic) si vede rifiutare
  // il play: il filmato resta fermo sul poster anche quando la scheda torna in
  // primo piano. Il tentativo va quindi ripetuto al rientro.
  const avviaVideo = () => {
    if (!heroVideo || reducedMotion || !heroVideo.src) return;
    if (heroVideo.classList.contains('active') && heroVideo.paused) {
      // Safari su iOS non guarda l'attributo `muted` scritto nell'HTML: guarda
      // la proprieta' al momento del play. Senza questa riga considera il video
      // sonoro e rifiuta l'avvio automatico.
      heroVideo.muted = true;
      heroVideo.play().catch(() => {});
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) avviaVideo();
  });
  // Ultima rete: in risparmio energetico iOS blocca l'avvio comunque, e l'unico
  // sblocco e' un gesto dell'utente. I listener restano finche' il video non ha
  // girato davvero: con `once` si consumerebbero anche su un tocco arrivato
  // mentre in scena c'e' una foto, cioe' proprio quando non servono a niente.
  if (heroVideo) {
    const tocchi = ['pointerdown', 'touchstart', 'keydown'];
    const smetti = () =>
      tocchi.forEach((e) => document.removeEventListener(e, avviaVideo));
    tocchi.forEach((e) =>
      document.addEventListener(e, avviaVideo, { passive: true })
    );
    heroVideo.addEventListener('playing', smetti, { once: true });
  }

  // Gli slide sono sovrapposti dentro il viewport: loading="lazy" non li
  // rimanderebbe. Il src arriva da data-src quando la pagina e' pronta,
  // cosi' all'apertura si scarica solo il primo.
  const caricaSlideDifferiti = () => {
    // Il video nasce senza src: qui riceve il taglio adatto allo schermo e
    // parte. Con la riduzione delle animazioni attiva non si scarica nulla e
    // resta il poster.
    if (heroVideo && !reducedMotion && !heroVideo.src) {
      heroVideo.src = window.matchMedia('(max-width: 760px)').matches
        ? heroVideo.dataset.videoMobile
        : heroVideo.dataset.videoDesktop;
      // Su iOS un src assegnato da JS a un elemento nato con preload="none" non
      // viene raccolto da solo: senza load() esplicita il play parte a vuoto.
      heroVideo.load();
      avviaVideo();
    }
    heroImages.forEach((img) => {
      if (img.dataset.src) {
        // Va tolto prima del src: assegnarlo a un'immagine nata lazy e senza
        // src non fa ripartire il caricamento, il browser l'ha gia' valutata.
        img.loading = 'eager';
        // Prima il srcset: e' quello che decide il file da scaricare. Se
        // arrivasse dopo il src, il browser partirebbe con il JPG piccolo e
        // poi cambierebbe idea, scaricando due volte.
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          delete img.dataset.srcset;
        }
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
    });
  };
  if (document.readyState === 'complete') caricaSlideDifferiti();
  else window.addEventListener('load', caricaSlideDifferiti, { once: true });
  if (heroImages.length > 1) {
    let heroActive = 0;
    // Le foto restano 5 secondi; il video il tempo di finire, altrimenti si
    // vedrebbe solo il suo primo terzo. Serve un setTimeout ricorsivo: con
    // setInterval la durata sarebbe una sola per tutte le slide.
    const durataSlide = (el) =>
      el === heroVideo && !reducedMotion ? 13000 : 5000;
    const prossimaSlide = () => {
      if (document.hidden) {
        setTimeout(prossimaSlide, 1000);
        return;
      }
      heroImages[heroActive].classList.remove('active');
      // Fuori scena il video non va lasciato girare: consumerebbe batteria per
      // fotogrammi che nessuno vede.
      if (heroImages[heroActive] === heroVideo) heroVideo.pause();
      heroActive = (heroActive + 1) % heroImages.length;
      heroImages[heroActive].classList.add('active');
      if (heroImages[heroActive] === heroVideo && !reducedMotion) {
        heroVideo.currentTime = 0;
        avviaVideo();
      }
      setTimeout(prossimaSlide, durataSlide(heroImages[heroActive]));
    };
    setTimeout(prossimaSlide, durataSlide(heroImages[0]));
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
  let lastFocused;
  const closeLightbox = () => {
    lightbox?.remove();
    lightbox = undefined;
    document.body.classList.remove('menu-locked');
    // Chi naviga da tastiera deve ritrovarsi sulla card da cui era partito,
    // non a inizio pagina.
    lastFocused?.focus();
    lastFocused = undefined;
  };
  const showLightbox = (index) => {
    current = (index + cards.length) % cards.length;
    const source = cards[current].querySelector('img');
    if (!source) return;
    // Va letto prima di closeLightbox: quello rimette il focus e azzera il
    // riferimento. Alla prima apertura e' la card cliccata, dopo va conservato.
    const previous = lastFocused ?? document.activeElement;
    closeLightbox();
    lastFocused = previous;
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
    lightbox.setAttribute('aria-label', source.alt || 'Immagine ingrandita');
    document.body.append(lightbox);
    document.body.classList.add('menu-locked');
    lightbox.querySelector('.lightbox-close').focus();
    // Il dialog e' modale: il Tab non deve poter uscire e finire sui link
    // della pagina sotto, che nel frattempo e' inerte.
    lightbox.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusable = [...lightbox.querySelectorAll('button')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  };
  cards.forEach((card, index) => card.addEventListener('click', () => showLightbox(index)));
  window.addEventListener('keydown', (event) => {
    if (!lightbox) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') showLightbox(current + 1);
    if (event.key === 'ArrowLeft') showLightbox(current - 1);
  });

  const form = document.querySelector('.quote form');

  const mostraEsito = (ok) => {
    // Un solo messaggio per volta: senza questo, invii ripetuti li impilano.
    form.querySelector('.form-message')?.remove();
    const message = document.createElement('p');
    message.className = ok ? 'form-message success' : 'form-message error';
    message.textContent = ok
      ? 'Richiesta inviata. Ti ricontatteremo al più presto.'
      : 'Invio non riuscito. Puoi chiamarci al 348 715 0612 o scriverci via email.';
    message.setAttribute('role', 'status');
    form.append(message);
  };

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const original = button?.textContent;
    if (button) { button.disabled = true; button.textContent = 'Invio in corso…'; }
    // Letto a ogni invio, non una volta sola: e' lo stesso valore che userebbe
    // il browser nel fallback senza JS, e resta vero se l'attributo cambia.
    const endpoint = form.getAttribute('action');
    const body = new URLSearchParams(new FormData(form));
    // Apps Script chiude la richiesta entro pochi secondi: oltre i 15 e' un
    // problema di rete, non lentezza del servizio.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      // Primo tentativo leggibile: se lo script risponde con gli header CORS
      // sappiamo davvero com'e' andata, invece di dichiarare successo al buio.
      const response = await fetch(endpoint, { method: 'POST', body, signal: controller.signal });
      // Risposta leggibile: qui l'esito e' quello vero, nel bene e nel male.
      // Nessun secondo tentativo, altrimenti un 404 o un 500 verrebbero
      // riscritti come successo dalla richiesta opaca.
      if (response.ok) { form.reset(); mostraEsito(true); }
      else mostraEsito(false);
    } catch (error) {
      if (error.name === 'AbortError') {
        mostraEsito(false);
      } else {
        // Qui il fetch non e' nemmeno arrivato a una risposta leggibile: o la
        // rete e' caduta, o mancano gli header CORS. Nel secondo caso la
        // richiesta parte lo stesso, ma l'esito resta opaco: meglio inviare al
        // buio che perdere il contatto.
        try {
          await fetch(endpoint, { method: 'POST', mode: 'no-cors', body });
          form.reset();
          mostraEsito(true);
        } catch {
          mostraEsito(false);
        }
      }
    } finally {
      clearTimeout(timeout);
      if (button) { button.disabled = false; button.textContent = original; }
    }
  });

  // La mappa di Google parte solo su richiesta esplicita: l'iframe imposta
  // cookie di terze parti al primo caricamento.
  const mapBox = document.querySelector('.contact-map[data-map-src]');
  mapBox?.querySelector('.map-consent')?.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.title = 'Posizione Tecnoeffe a Cavedine';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.src = mapBox.dataset.mapSrc;
    mapBox.replaceChildren(frame);
  });

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
})();
