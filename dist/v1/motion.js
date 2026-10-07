/* Original, dependency-free motion. Content remains readable without JavaScript. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hero = document.querySelector('.hero-name');
  const portrait = document.querySelector('.hero-portrait');
  const chapters = [...document.querySelectorAll('.chapter')];
  const progress = document.querySelector('.scroll-progress');
  const reveals = [...document.querySelectorAll('.reveal')];
  let frame = 0;

  if (hero && !reduced.matches && hero.animate) {
    const letters = hero.querySelectorAll('span');
    (letters.length ? [...letters] : [hero]).forEach((letter, index) => {
      letter.animate([
        { transform: 'translateY(105%) rotate(3deg)', opacity: 0 },
        { transform: 'translateY(0) rotate(0)', opacity: 1 },
      ], { duration: 950, delay: Math.min(index * 55, 440), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
  }

  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('motion-pending');
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });
    reveals.forEach(element => {
      element.classList.add('motion-pending');
      observer.observe(element);
    });
    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        observer.disconnect();
        reveals.forEach(element => element.classList.remove('motion-pending'));
      }
    });
  }

  function updateProgress() {
    frame = 0;
    const viewport = window.innerHeight;
    const travel = document.documentElement.scrollHeight - viewport;
    if (progress) progress.style.setProperty('--scroll-progress', String(travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0));
    chapters.forEach(chapter => {
      const rect = chapter.getBoundingClientRect();
      const value = Math.min(1, Math.max(0, (viewport - rect.top) / (viewport + rect.height)));
      chapter.style.setProperty('--progress', value.toFixed(4));
    });
  }
  function requestUpdate() { if (!frame) frame = requestAnimationFrame(updateProgress); }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('load', requestUpdate, { once: true });
  requestUpdate();

  if (portrait) {
    const stage = portrait.closest('.hero') || portrait.parentElement;
    stage?.addEventListener('pointermove', event => {
      if (reduced.matches || !fine.matches) return;
      const rect = stage.getBoundingClientRect();
      portrait.style.setProperty('--portrait-x', `${((event.clientX - rect.left) / rect.width - .5) * 16}px`);
      portrait.style.setProperty('--portrait-y', `${((event.clientY - rect.top) / rect.height - .5) * 10}px`);
    }, { passive: true });
    stage?.addEventListener('pointerleave', () => {
      portrait.style.setProperty('--portrait-x', '0px');
      portrait.style.setProperty('--portrait-y', '0px');
    });
  }

  document.querySelectorAll('[data-magnetic]').forEach(element => {
    element.addEventListener('pointermove', event => {
      if (reduced.matches || !fine.matches) return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--magnetic-x', `${Math.max(-5, Math.min(5, (event.clientX - rect.left - rect.width / 2) * .09))}px`);
      element.style.setProperty('--magnetic-y', `${Math.max(-5, Math.min(5, (event.clientY - rect.top - rect.height / 2) * .09))}px`);
    }, { passive: true });
    element.addEventListener('pointerleave', () => {
      element.style.setProperty('--magnetic-x', '0px');
      element.style.setProperty('--magnetic-y', '0px');
    });
  });

  const dialog = document.querySelector('#film-dialog');
  const video = document.querySelector('#film-video');
  const title = document.querySelector('#film-title');
  if (dialog && video && typeof dialog.showModal === 'function') {
    let opener;
    if (title) dialog.setAttribute('aria-labelledby', 'film-title');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    document.querySelectorAll('[data-film]').forEach(button => {
      button.setAttribute('aria-haspopup', 'dialog');
      button.addEventListener('click', () => {
        const source = button.dataset.src;
        if (!source) return;
        opener = button;
        if (title) title.textContent = button.dataset.title || 'A moment in motion';
        video.src = source;
        if (!dialog.open) dialog.showModal();
        // Playback is initiated only by the visitor's explicit click.
        const playback = video.play();
        if (playback?.catch) playback.catch(() => { /* Native controls remain available. */ });
      });
    });
    dialog.querySelectorAll('[data-film-close], .film-close').forEach(button => button.addEventListener('click', () => dialog.close()));
    let backdropDown = false;
    dialog.addEventListener('pointerdown', event => {
      const rect = dialog.getBoundingClientRect();
      backdropDown = event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    });
    dialog.addEventListener('click', event => {
      if (!backdropDown) return;
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
      backdropDown = false;
    });
    dialog.addEventListener('close', () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      opener?.focus({ preventScroll: true });
    });
  }
})();
