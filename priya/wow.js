/* Priya v2 motion layer: a lens aperture between worlds, Tanjore gold that catches the light,
   photographs that develop like film, and a latte-art pour. Everything degrades to the
   static page when motion is reduced or paused. */
(() => {
  'use strict';
  const $ = (q, r = document) => r.querySelector(q);
  const $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduced.matches || document.documentElement.classList.contains('motion-paused');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const dpr = () => Math.min(devicePixelRatio || 1, 2);
  document.documentElement.classList.add('wow');

  /* ---------- 1. Lens aperture between worlds ---------- */
  const win = $('.scene-window'), layer = $('.character-layer');
  if (win) {
    const cv = Object.assign(document.createElement('canvas'), { className: 'lens-iris' });
    cv.setAttribute('aria-hidden', 'true');
    win.append(cv);
    const c = cv.getContext('2d');
    let closed = 0;
    const size = () => { const r = win.getBoundingClientRect(), d = dpr(); cv.width = Math.max(2, r.width * d | 0); cv.height = Math.max(2, r.height * d | 0); draw(); };
    function draw() {
      const W = cv.width, H = cv.height;
      c.clearRect(0, 0, W, H);
      if (closed <= .002) return;
      const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) * .58, r = R * (1 - closed), rot = closed * 1.15;
      c.save();
      c.fillStyle = '#121513';
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'destination-out';
      c.beginPath();
      for (let k = 0; k < 6; k++) { const a = rot + k * Math.PI / 3; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
      c.closePath(); c.fill();
      c.restore();
      for (let k = 0; k < 6; k++) {
        const a = rot + k * Math.PI / 3, b = rot + (k + 1) * Math.PI / 3;
        const x1 = cx + Math.cos(a) * r, y1 = cy + Math.sin(a) * r, x2 = cx + Math.cos(b) * r, y2 = cy + Math.sin(b) * r;
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ex = x2 + dx / L * R * 2, ey = y2 + dy / L * R * 2, nx = -dy / L, ny = dx / L;
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(ex, ey); c.lineTo(ex + nx * R * .5, ey + ny * R * .5); c.lineTo(x1 + nx * R * .1, y1 + ny * R * .1); c.closePath();
        const g = c.createLinearGradient(x1, y1, x1 + nx * R * .45, y1 + ny * R * .45);
        g.addColorStop(0, 'rgba(255,240,210,.16)'); g.addColorStop(.35, 'rgba(255,255,255,.03)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.fill();
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(ex, ey); c.lineWidth = 1.6 * dpr(); c.strokeStyle = 'rgba(237,194,83,.38)'; c.stroke();
      }
    }
    function tween(to, ms) {
      return new Promise(done => {
        const from = closed, t0 = performance.now();
        const step = t => { const k = clamp((t - t0) / ms, 0, 1); closed = from + (to - from) * ease(k); draw(); k < 1 ? requestAnimationFrame(step) : done(); };
        requestAnimationFrame(step);
      });
    }
    window.priyaShutter = async () => {
      if (still()) return;
      layer?.classList.add('swap-out');
      win.classList.add('is-shutting');
      await tween(1, 340);
    };
    window.priyaShutterOpen = async () => {
      if (closed <= 0) { layer?.classList.remove('swap-out'); return; }
      const flash = $('.camera-flash');
      if (flash) { flash.classList.remove('flash'); void flash.offsetWidth; flash.classList.add('flash'); }
      layer?.classList.remove('swap-out');
      layer?.classList.add('swap-in');
      await new Promise(r => setTimeout(r, 70));
      await tween(0, 620);
      win.classList.remove('is-shutting');
      setTimeout(() => layer?.classList.remove('swap-in'), 700);
    };
    new ResizeObserver(size).observe(win);
    size();
  }

  /* ---------- 2. Tanjore gold: gesso beads and glass stones that catch the light ---------- */
  const art = $('.art-world');
  if (art) {
    const cv = Object.assign(document.createElement('canvas'), { className: 'tanjore-gold' });
    cv.setAttribute('aria-hidden', 'true');
    art.append(cv);
    const c = cv.getContext('2d');
    let W = 0, H = 0, D = 1, lx = .3, ly = -.6, tx = lx, ty = ly, dirty = true, beads = [], gems = [];
    function layout() {
      const r = art.getBoundingClientRect(); D = dpr();
      W = cv.width = Math.max(2, r.width * D | 0); H = cv.height = Math.max(2, r.height * D | 0);
      const m = Math.min(W, H) * .045, band = Math.max(18 * D, Math.min(W, H) * .034);
      const x0 = m, x1 = W - m, y1 = H - m, archR = (x1 - x0) / 2, top = m + Math.min(archR * .42, H * .34);
      // Tanjore prabhavali: straight sides, a shallow pointed arch on top.
      const path = [];
      const N = 360;
      for (let i = 0; i <= N; i++) {
        const t = i / N; let x, y;
        if (t < .25) { x = x0; y = y1 - (y1 - top) * (t / .25); }
        else if (t < .75) {
          const u = (t - .25) / .5, a = Math.PI * (1 - u);
          x = (x0 + x1) / 2 + Math.cos(a) * archR;
          const lift = Math.sin(a) * (top - m);
          const point = Math.pow(1 - Math.abs(u - .5) * 2, 6) * (top - m) * .35;
          y = top - lift - point;
        } else { x = x1; y = top + (y1 - top) * ((t - .75) / .25); }
        path.push([x, y]);
      }
      beads = []; gems = [];
      let acc = 0; const step = band * .62;
      for (let i = 1; i < path.length; i++) {
        const [ax, ay] = path[i - 1], [bx, by] = path[i]; const seg = Math.hypot(bx - ax, by - ay);
        acc += seg;
        while (acc >= step) {
          acc -= step; const k = 1 - acc / seg, x = ax + (bx - ax) * k, y = ay + (by - ay) * k;
          const nx = -(by - ay) / seg, ny = (bx - ax) / seg;
          beads.push([x + nx * band * .52, y + ny * band * .52, band * .2]);
          beads.push([x - nx * band * .52, y - ny * band * .52, band * .2]);
        }
      }
      for (let g = 0; g < 9; g++) {
        const p = path[Math.round((g + .5) / 9 * N)]; gems.push([p[0], p[1], band * .42, g % 2 ? '#1c8a52' : '#c8202a']);
      }
      cv._path = path; cv._band = band; dirty = true;
    }
    function sphere(x, y, r, base, hi) {
      const g = c.createRadialGradient(x - lx * r * .55, y - (-ly) * r * .55, r * .08, x, y, r);
      g.addColorStop(0, hi); g.addColorStop(.35, base); g.addColorStop(1, 'rgba(60,35,5,.95)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    }
    function draw() {
      dirty = false; c.clearRect(0, 0, W, H);
      const path = cv._path, band = cv._band; if (!path) return;
      // the gold band: a metal gradient whose bright streak follows the light
      const ang = Math.atan2(-ly, lx), len = Math.hypot(W, H);
      const gx = W / 2 + Math.cos(ang) * len * .5, gy = H / 2 - Math.sin(ang) * len * .5;
      const g = c.createLinearGradient(W - gx, H - gy, gx, gy);
      const s = clamp(.5 + (lx * .35), .15, .85);
      g.addColorStop(0, '#7a5216'); g.addColorStop(clamp(s - .18, 0, 1), '#c99a3a'); g.addColorStop(s, '#fff1b8'); g.addColorStop(clamp(s + .06, 0, 1), '#e7b94c'); g.addColorStop(1, '#8a5d1a');
      c.lineJoin = 'round';
      c.beginPath(); path.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.lineWidth = band * 1.5; c.strokeStyle = 'rgba(25,15,5,.45)'; c.stroke();
      c.lineWidth = band; c.strokeStyle = g; c.stroke();
      c.lineWidth = band * .16; c.strokeStyle = 'rgba(120,70,15,.55)'; c.stroke();
      for (const [x, y, r] of beads) sphere(x, y, r, '#d9a441', '#fffbe6');
      for (const [x, y, r, col] of gems) {
        c.beginPath(); c.arc(x, y, r * 1.28, 0, 7); c.fillStyle = '#e9b949'; c.fill();
        c.lineWidth = r * .14; c.strokeStyle = '#7a5216'; c.stroke();
        sphere(x, y, r, col, 'rgba(255,255,255,.95)');
        c.beginPath(); c.arc(x - lx * r * .38, y + ly * r * .38, r * .18, 0, 7); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill();
      }
    }
    function tick() {
      lx += (tx - lx) * .12; ly += (ty - ly) * .12;
      if (Math.abs(tx - lx) > .002 || Math.abs(ty - ly) > .002) dirty = true;
      if (dirty) draw();
      requestAnimationFrame(tick);
    }
    art.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const r = art.getBoundingClientRect();
      tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); ty = clamp(-((e.clientY - r.top) / r.height * 2 - 1), -1, 1);
    });
    addEventListener('scroll', () => {
      if (still()) return;
      const r = art.getBoundingClientRect(), p = clamp(1 - (r.top + r.height / 2) / innerHeight, -.5, 1.5);
      tx = clamp(p * 2 - 1, -1, 1); ty = -.4 + Math.sin(p * 3) * .3;
    }, { passive: true });
    new ResizeObserver(layout).observe(art);
    layout(); requestAnimationFrame(tick);
  }

  /* ---------- 3. Photographs develop like film as they arrive ---------- */
  const photos = $('#photography');
  if (photos && !reduced.matches) {
    photos.classList.add('darkroom');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const card = e.target; io.unobserve(card);
      const i = [...card.parentNode.children].indexOf(card) % 3;
      setTimeout(() => card.classList.add('is-developed'), 160 + i * 220);
    }), { threshold: .35 });
    const watch = () => $$('.photo-card:not([data-dev])', photos).forEach(card => { card.dataset.dev = '1'; io.observe(card); });
    new MutationObserver(watch).observe(photos, { childList: true, subtree: true });
    watch();
  }

  /* ---------- 4. Pour a latte ---------- */
  const spread = $('.table-spread');
  if (spread) {
    const block = document.createElement('div');
    block.className = 'pour-block';
    block.innerHTML = `<div class="pour-cup"><canvas width="760" height="760" role="img" aria-label="A cup of coffee with latte art"></canvas></div>
      <div class="pour-copy"><p class="eyebrow">COFFEE ART, FROM MY COUNTER</p><h3>Pour one <em>with me.</em></h3>
      <p>Every cup at my table gets a little drawing. Press pour and watch the milk find its shape.</p>
      <div class="pour-row"><button class="button button-dark pour-btn">Pour <span aria-hidden="true">✳</span></button><span class="handwritten pour-name">a lotus, for Padma</span></div></div>`;
    spread.after(block);
    const cv = $('canvas', block), c = cv.getContext('2d'), S = cv.width, R = S * .3, cx = S / 2, cy = S / 2;
    const designs = ['lotus', 'heart', 'rosetta', 'tulip'], names = { lotus: 'a lotus, for Padma', heart: 'a heart', rosetta: 'a rosetta', tulip: 'a tulip' };
    let d = 0, t = 1, run = false;
    const sm = x => x * x * (3 - 2 * x), cl = x => clamp(x, 0, 1);
    function heart(x, y, s) { c.beginPath(); c.moveTo(x, y + s * .9); c.bezierCurveTo(x - s * 1.4, y, x - s * .8, y - s * 1.1, x, y - s * .4); c.bezierCurveTo(x + s * .8, y - s * 1.1, x + s * 1.4, y, x, y + s * .9); c.fill(); }
    function cup() {
      c.clearRect(0, 0, S, S);
      c.fillStyle = 'rgba(38,58,45,.18)'; c.beginPath(); c.ellipse(cx + 18, cy + 22, S * .43, S * .41, 0, 0, 7); c.fill();
      c.fillStyle = '#fbf6e9'; c.beginPath(); c.arc(cx, cy, S * .43, 0, 7); c.fill();
      c.strokeStyle = '#edc253'; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, S * .41, 0, 7); c.stroke();
      c.fillStyle = '#a94d33'; for (let a = 0; a < 44; a++) { c.beginPath(); c.arc(cx + Math.cos(a / 44 * 6.283) * S * .42, cy + Math.sin(a / 44 * 6.283) * S * .42, 3, 0, 7); c.fill(); }
      c.fillStyle = '#fbf6e9'; c.beginPath(); c.roundRect(S * .87, S * .45, S * .12, S * .1, 26); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, S * .35, 0, 7); c.fill();
      const g = c.createRadialGradient(cx, cy, 10, cx, cy, R); g.addColorStop(0, '#b0703f'); g.addColorStop(.85, '#7a4424'); g.addColorStop(1, '#55290f');
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    }
    function milk(p) {
      const k = designs[d]; c.fillStyle = '#f7ead8';
      if (k === 'lotus') {
        const pts = [-1.57, -2.2, -.94, -2.8, -.34, -3.3, .16], g = cl(p / .85);
        pts.forEach((a, i) => { const u = sm(cl(g * pts.length - i)); if (u <= 0) return; c.save(); c.translate(cx, cy + R * .32); c.rotate(a + 1.57); const L = R * (i === 0 ? .82 : .68 - i * .03) * u, w = R * .19 * u; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(w, -L * .5, 0, -L); c.quadraticCurveTo(-w, -L * .5, 0, 0); c.fill(); c.restore(); });
        const q = sm(cl((p - .85) / .15)); if (q > 0) { c.fillStyle = '#edc253'; [-1, 0, 1].forEach(j => { c.beginPath(); c.arc(cx + j * R * .18 * q, cy + R * .5, R * .028, 0, 7); c.fill(); }); }
      }
      if (k === 'heart') {
        const g = sm(cl(p / .65)), q = sm(cl((p - .65) / .35)), s = R * .55 * g; c.beginPath();
        for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); c.lineTo(cx + (Math.sin(a) * 16 + (hx - Math.sin(a) * 16) * q) * s / 16, cy + (-Math.cos(a) * 16 + (hy + Math.cos(a) * 16) * q) * s / 16); }
        c.fill();
      }
      if (k === 'rosetta') {
        const n = 8, g = cl(p / .75);
        for (let i = 0; i < n; i++) { const u = cl(g * n - i); if (u <= 0) break; const y = cy + R * .6 - i * R * .15, w = R * (.78 - i * .07) * sm(u); c.beginPath(); c.moveTo(cx - w, y); c.quadraticCurveTo(cx, y + R * .2, cx + w, y); c.quadraticCurveTo(cx, y + R * .07, cx - w, y); c.lineWidth = R * .07; c.strokeStyle = '#f7ead8'; c.stroke(); }
        const q = cl((p - .78) / .22); if (q > 0) { c.strokeStyle = '#7a4424'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, cy - R * .5); c.lineTo(cx, cy - R * .5 + q * R * 1.2); c.stroke(); heart(cx, cy - R * .55, R * .13 * q); }
      }
      if (k === 'tulip') {
        const n = 4, g = cl(p / .8);
        for (let i = 0; i < n; i++) { const u = sm(cl(g * n - i)); if (u <= 0) break; const y = cy + R * .42 - i * R * .27, rx = R * (.5 - i * .08) * u; c.beginPath(); c.ellipse(cx, y, rx, rx * .62, 0, 0, 7); c.fill(); c.strokeStyle = '#7a4424'; c.lineWidth = 4; c.beginPath(); c.ellipse(cx, y + rx * .25, rx * .7, rx * .35, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      }
    }
    function frame(ts) {
      if (run) { t += 1 / 60 / 2.4; if (t >= 1) { t = 1; run = false; } }
      cup(); milk(t);
      if (run) { const x = cx + (designs[d] === 'rosetta' ? Math.sin(t * 40) * S * .03 : 0); c.strokeStyle = '#f7ead8'; c.lineWidth = 11; c.beginPath(); c.moveTo(S * .64, 0); c.quadraticCurveTo(x + 40, cy - 120, x, cy + S * .08); c.stroke(); requestAnimationFrame(frame); }
    }
    $('.pour-btn', block).addEventListener('click', () => {
      if (run) return;
      d = (d + 1) % designs.length; $('.pour-name', block).textContent = names[designs[d]];
      if (still()) { t = 1; frame(); return; }
      t = 0; run = true; requestAnimationFrame(frame);
    });
    frame();
  }
})();
