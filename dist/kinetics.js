/* Kinetic details, dependency-free: rolling mileage odometers and velocity-reactive journal prints.
   Content is final in the HTML; motion only plays when it is allowed and the element is on screen. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;

  // Mileage odometers: 10K, 50MI, 202MI roll up from zero the first time each row is seen.
  const ease = t => 1 - Math.pow(1 - t, 4);
  const roll = (node, target, duration) => {
    const start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / duration);
      node.nodeValue = String(Math.round(ease(p) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const odometers = [...document.querySelectorAll('.mi-distance:not(.mi-word)')].map(el => {
    const node = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue));
    return node && { el, node, target: parseInt(node.nodeValue, 10) };
  }).filter(Boolean);
  const seen = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const item = odometers.find(o => o.el === entry.target);
    seen.unobserve(entry.target);
    entry.target.classList.add('is-rolling');
    roll(item.node, item.target, 900 + item.target * 4);
  }), { threshold: 0.6 });
  odometers.forEach(o => seen.observe(o.el));
  const word = document.querySelector('.mi-word');
  if (word) new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    word.classList.add('is-rolling');
    obs.disconnect();
  }, { threshold: 0.6 }).observe(word);

  // Journal strip: prints lean into the direction of travel and settle when it stops.
  const strip = document.querySelector('.journal-strip');
  if (strip) {
    let last = strip.scrollLeft, skew = 0, frame = 0;
    const settle = () => {
      const delta = strip.scrollLeft - last;
      last = strip.scrollLeft;
      skew += (Math.max(-8, Math.min(8, delta * -0.35)) - skew) * 0.2;
      strip.style.setProperty('--lean', skew.toFixed(2) + 'deg');
      frame = Math.abs(skew) > 0.02 || delta ? requestAnimationFrame(settle) : 0;
      if (!frame) strip.style.setProperty('--lean', '0deg');
    };
    strip.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(settle); }, { passive: true });
  }
})();
