/* A translucent wash of moving light. Original Canvas 2D artwork. */
(() => {
  'use strict';
  const canvas = document.getElementById('atmosphere');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const home = document.getElementById('hero-stage') || canvas.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  const themes = {
    kandavalli: { light: [220, 171, 89], shade: [95, 124, 86], accent: [174, 119, 70], count: 32, motion: 'rain' },
    nyc: { light: [181, 180, 133], shade: [72, 118, 122], accent: [105, 128, 134], count: 21, motion: 'petal' },
    oneonta: { light: [227, 163, 74], shade: [112, 134, 91], accent: [186, 106, 59], count: 19, motion: 'leaf' },
    winter: { light: [199, 215, 223], shade: [121, 149, 164], accent: [129, 154, 170], count: 32, motion: 'snow' }
  };
  let world = 'kandavalli', previousWorld = world, blend = 1;
  let width = 1, height = 1, clock = 0, last = 0, frame = 0;
  let paused = false, visible = true, dirty = true;
  let pointerX = .64, pointerY = .32, smoothX = .64, smoothY = .32;
  const random = n => { const value = Math.sin(n * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
  const rgba = (color, alpha) => `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
  const lerp = (a, b, t) => a + (b - a) * t;
  const colorMix = (a, b, t) => a.map((value, index) => Math.round(lerp(value, b[index], t)));
  const media = themes.kandavalli;
  let currentColors = { light: media.light, shade: media.shade, accent: media.accent };

  function wash(x, y, radius, color, opacity) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, rgba(color, opacity));
    gradient.addColorStop(.48, rgba(color, opacity * .45));
    gradient.addColorStop(1, rgba(color, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    const theme = themes[world], former = themes[previousWorld];
    const ease = 1 - Math.pow(1 - blend, 3);
    for (const key of ['light', 'shade', 'accent']) currentColors[key] = colorMix(former[key], theme[key], ease);
    const span = Math.max(width, height);
    // At most a soft, translucent tint; the page's own paper remains visible.
    wash(width * smoothX, height * smoothY, span * .67, currentColors.light, .115);
    wash(width * (.86 + Math.sin(time * .07) * .04), height * .81, span * .43, currentColors.shade, .065);
    wash(width * (.14 + Math.cos(time * .05) * .03), height * .14, span * .42, currentColors.light, .038);

    context.save();
    context.lineCap = 'round';
    // Contour-like glints stretch across the paper without becoming scenery.
    for (let ribbon = 0; ribbon < 4; ribbon++) {
      context.beginPath();
      const base = height * (.19 + ribbon * .17);
      for (let step = 0; step <= 36; step++) {
        const x = width * (step / 36);
        const y = base + Math.sin(step / 36 * 5 + ribbon * .7 + time * .09) * height * .037 + (smoothY - .32) * 13;
        if (!step) context.moveTo(x, y); else context.lineTo(x, y);
      }
      const glint = context.createLinearGradient(0, 0, width, 0);
      glint.addColorStop(0, rgba(currentColors.light, 0));
      glint.addColorStop(.55, rgba(currentColors.light, .11));
      glint.addColorStop(1, rgba(currentColors.light, 0));
      context.strokeStyle = glint;
      context.lineWidth = ribbon % 2 ? .7 : 1.2;
      context.stroke();
    }

    for (let index = 0; index < theme.count; index++) {
      const seed = random(index + 13), speed = .9 + random(index + 89) * 1.7;
      const x = ((random(index + 30) * (width + 80) + Math.sin(time * .16 + index) * 14 + time * speed * .8) % (width + 80)) - 40;
      const drift = theme.motion === 'rain' ? time * speed * 18 : time * speed * 2.7;
      const y = ((random(index + 100) * (height + 90) + drift) % (height + 90)) - 45;
      const opacity = .12 + seed * .14;
      context.save();
      context.translate(x + (smoothX - .64) * (5 + seed * 8), y);
      if (theme.motion === 'rain') {
        context.strokeStyle = rgba(currentColors.accent, opacity * .8);
        context.lineWidth = .65;
        context.beginPath();context.moveTo(0, 0);context.lineTo(-2.1, 7 + seed * 11);context.stroke();
      } else if (theme.motion === 'snow') {
        context.fillStyle = rgba(currentColors.accent, opacity);
        context.beginPath();context.arc(0, 0, .75 + seed * 1.45, 0, Math.PI * 2);context.fill();
      } else {
        const size = 3 + seed * 5;
        context.rotate(Math.sin(time * .2 + index) * .9 + index);
        context.scale(1, .55 + Math.sin(time * .3 + index) * .22);
        context.fillStyle = rgba(currentColors.accent, opacity);
        context.beginPath();
        context.moveTo(-size, 0);
        context.bezierCurveTo(-size * .5, -size, size * .65, -size * .6, size, 0);
        context.bezierCurveTo(size * .25, size * .65, -size * .4, size * .55, -size, 0);
        context.fill();
      }
      context.restore();
    }
    // Sparse fixed fibers lend a paper feel, with no per-frame random flicker.
    context.fillStyle = rgba(currentColors.shade, .032);
    for (let index = 0; index < 85; index++) context.fillRect(random(index + 251) * width, random(index + 491) * height, 1 + random(index) * 1.5, .55);
    context.restore();
  }

  function canAnimate() { return !paused && !reduced.matches && visible && !document.hidden; }
  function requestDraw() { dirty = true; if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick); }
  function tick(now) {
    frame = 0;
    const active = canAnimate();
    const dt = Math.min(.05, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    if (active) {
      clock += dt;
      blend = Math.min(1, blend + dt * .7);
      const follow = 1 - Math.exp(-dt * 2.5);
      smoothX = lerp(smoothX, pointerX, follow);
      smoothY = lerp(smoothY, pointerY, follow);
    } else if (dirty) blend = 1;
    if (active || dirty) { draw(clock); dirty = false; }
    if (active) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const rect = home.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    const dpr = Math.min(devicePixelRatio || 1, width < 700 ? 1.5 : 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = '100%'; canvas.style.height = '100%';
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    requestDraw();
  }
  window.setAtmosphere = next => {
    if (!Object.prototype.hasOwnProperty.call(themes, next)) return;
    if (next !== world) { previousWorld = world; world = next; blend = 0; }
    requestDraw();
  };
  home.addEventListener('pointermove', event => {
    if (!fine.matches || !canAnimate()) return;
    const rect = home.getBoundingClientRect();
    pointerX = .35 + Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * .45;
    pointerY = .16 + Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) * .42;
  }, { passive: true });
  home.addEventListener('pointerleave', () => { pointerX = .64; pointerY = .32; });
  window.addEventListener('priya:motion', event => { paused = Boolean(event.detail?.paused); last = 0; requestDraw(); });
  document.addEventListener('visibilitychange', () => { last = 0; if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else requestDraw(); });
  reduced.addEventListener('change', () => { last = 0; requestDraw(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    last = 0;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; } else requestDraw();
  }, { rootMargin: '40px' }).observe(home);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(home);
  else window.addEventListener('resize', resize, { passive: true });
  resize();
})();
