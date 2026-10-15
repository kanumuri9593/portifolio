/* The Overlook on Swart Hollow — motion + tools. Vanilla JS, GSAP, Lenis. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (x, a, b) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const root = document.documentElement;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (RM) root.classList.add('rm');
const SMALL = () => innerWidth < 700;

/* ---------- personalisation: ?owner=Jane&for=Ana%20%26%20Sam ---------- */
const params = new URLSearchParams(location.search);
const clean = s => (s || '').replace(/[<>]/g, '').trim().slice(0, 40);
const OWNER = clean(params.get('owner'));
const COUPLE = clean(params.get('for'));

/* ---------- sun math for the hilltop (NOAA sunrise equation) ---------- */
const LAT = 42.462, LON = -75.0;
const TZ = 'America/New_York';
const rad = Math.PI / 180;
function sunEvent(date, altitude) {
  const noon = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 17));
  const jd = noon / 86400000 + 2440587.5;
  const n = Math.round(jd - 2451545.0 + 0.0008);
  const Js = n - LON / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const L = (M + C + 180 + 102.9372) % 360;
  const Jt = 2451545 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
  const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad));
  const cosW = (Math.sin(altitude * rad) - Math.sin(LAT * rad) * Math.sin(dec)) / (Math.cos(LAT * rad) * Math.cos(dec));
  const w = Math.acos(clamp(cosW, -1, 1)) / rad;
  return new Date((Jt + w / 360 - 2440587.5) * 86400000);
}
const fmtTime = d => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).format(d).replace(' AM', ' am').replace(' PM', ' pm');
const fmtDate = d => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d);
const fmtDateShort = d => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(d);
const addMin = (d, m) => new Date(d.getTime() + m * 60000);
const round15 = d => new Date(Math.round(d.getTime() / 900000) * 900000);
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
function secondSaturday(year, month) {
  const d = new Date(year, month, 1, 12);
  const first = (6 - d.getDay() + 7) % 7;
  return new Date(year, month, 1 + first + 7, 12);
}
function nextSecondSaturday(month) {
  const now = new Date();
  let d = secondSaturday(now.getFullYear(), month);
  if (d < now) d = secondSaturday(now.getFullYear() + 1, month);
  return d;
}

/* ---------- seasons ---------- */
const MONTHS = [
  ['Jan', 'Snow-globe elopements', 'Fresh snow on the hill, a fire in the pit and portraits in the blue hour. Winter is for small, magical days; the big tent returns in May.', 'snow', ['#3d6a9e', '#8fb8de', '#eef3f7'], 29, 12],
  ['Feb', 'Winter weekends', "Valentine's elopements and cosy cabin weekends, with sunset before six.", 'snow', ['#7a4b8a', '#d98fb0', '#f3eef4'], 32, 13],
  ['Mar', 'Sugaring season', 'Maple taps in the trees and the first thaw. Perfect for an intimate engagement shoot.', 'snow', ['#8a5a32', '#c9a06a', '#f3ede4'], 41, 21],
  ['Apr', 'First green', 'The meadow wakes up. Showers, engagement parties and smaller gatherings.', 'petals', ['#4f7f3c', '#a9c97e', '#eef4e6'], 55, 32],
  ['May', 'Blossom season', 'Apple blossom in the hollows and long, soft evenings. Tent season opens.', 'petals', ['#c95f78', '#f3a98c', '#fbeff0'], 67, 42],
  ['Jun', 'Longest light', 'Sunset after half past eight. Say your vows at six and still catch golden hour.', 'petals', ['#cf7a2c', '#f2c14e', '#fdf3e1'], 75, 51],
  ['Jul', 'Summer on the hill', 'Fireflies over the meadow after dark and warm nights made for dancing.', 'summer', ['#2f7a6a', '#8fcf9c', '#e9f5ef'], 79, 56],
  ['Aug', 'Late-summer gold', 'Hay bales in the fields, sweet corn on the menu and stars by ten.', 'summer', ['#bb7424', '#efc35a', '#fbf1dc'], 77, 54],
  ['Sep', 'First colour', 'Cool nights, warm days and the first red maples along the ridge.', 'leaves', ['#b5502a', '#e8a33d', '#f8ece0'], 70, 47],
  ['Oct', 'Peak foliage', 'The whole valley turns red and gold, usually in the first two weeks. Couples book a year ahead.', 'leaves', ['#c8551e', '#e8a33d', '#f6e7d4'], 58, 37],
  ['Nov', 'Harvest and candlelight', 'Bare branches, big skies and an early sunset that makes dinner glow.', 'leaves', ['#8a4a2a', '#c98a4a', '#f1e6dc'], 46, 29],
  ['Dec', 'Holiday gatherings', 'Company parties and family reunions by firelight, with snow most years.', 'snow', ['#2f4f6a', '#c94a4a', '#eef1f4'], 34, 18]
];
const state = { date: nextSecondSaturday(9), month: 9 };
const listeners = [];
const onDate = fn => listeners.push(fn);
function setDate(d, fromMonth) {
  state.date = d; state.month = d.getMonth();
  const sunset = sunEvent(d, -0.833);
  const golden = sunEvent(d, 6);
  state.sunset = sunset; state.golden = golden;
  listeners.forEach(fn => fn(d, sunset, golden, fromMonth));
}

/* ---------- smooth scroll ---------- */
gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });
let lenis = null;
if (!RM && window.Lenis) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = $(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.6 });
  else t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
}));
history.scrollRestoration = 'manual';
scrollTo(0, 0);

/* ---------- ridgeline of the real view (traced from the photo) ---------- */
const RIDGE = 'M0,325 L24,325 L48,323 L72,321 L96,320 L120,321 L144,322 L168,322 L192,323 L216,326 L240,327 L264,326 L288,323 L312,322 L336,320 L360,318 L384,318 L408,320 L432,323 L456,325 L480,327 L504,330 L528,332 L552,330 L576,330 L600,329 L624,326 L648,325 L672,322 L696,319 L720,319 L744,319 L768,319 L792,317 L816,318 L840,319 L864,320 L888,320 L912,313 L936,307 L960,305 L984,305 L1008,307 L1032,309 L1056,310 L1080,310 L1104,310 L1128,310 L1152,311 L1176,311 L1200,309 L1224,307 L1248,304 L1272,301 L1296,298 L1320,298 L1344,295 L1368,293 L1384,292 L1391,268 L1392,268 L1399,293 L1416,294 L1440,298 L1464,304 L1488,311 L1512,313 L1536,314 L1560,312 L1584,310 L1608,311 L1632,309 L1656,308 L1680,307 L1704,306 L1728,306 L1752,306 L1776,306 L1800,305 L1824,305 L1848,305 L1872,304 L1896,304 L1920,304';
const RIDGE_PTS = RIDGE.slice(1).split(' L').map(p => p.split(',').map(Number));
$('#ridgePath').setAttribute('d', RIDGE);
$('#footRidge').setAttribute('d', RIDGE + ' L1920,360 L0,360 Z');

/* ---------- hero frames: keep sky and land locked together ---------- */
const hero = $('#hero');
function layoutFrames() {
  const W = innerWidth, H = hero.clientHeight;
  const fw = Math.max(W, H * 1.2);
  const fl = Math.min(0, Math.max(W - fw, W / 2 - fw * 0.6));
  root.style.setProperty('--fw', fw + 'px');
  root.style.setProperty('--fl', fl + 'px');
}
layoutFrames();
addEventListener('resize', layoutFrames);

/* town lights on the far hills, seeded so they always land in the same places */
(function town() {
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const box = $('#town'); const zones = [[40, 600, 340, 400, 22], [640, 1360, 330, 405, 12], [1420, 1900, 335, 415, 18]];
  zones.forEach(([x0, x1, y0, y1, n]) => {
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      el.style.left = (lerp(x0, x1, rnd()) / 19.2) + '%';
      el.style.top = (lerp(y0, y1, rnd()) / 8.88) + '%';
      el.style.animationDelay = (rnd() * 3).toFixed(2) + 's';
      el.style.transform = `scale(${(0.6 + rnd() * 0.8).toFixed(2)})`;
      box.appendChild(el);
    }
  });
})();

function starfield(canvas, count) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const c = canvas.getContext('2d'); c.scale(dpr, dpr);
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < count; i++) {
    const x = rnd() * w, y = Math.pow(rnd(), 1.6) * h * 0.75, r = rnd() * 1.3 + 0.2;
    c.globalAlpha = 0.35 + rnd() * 0.65;
    c.fillStyle = rnd() > 0.85 ? '#ffe9c4' : '#ffffff';
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  // a faint Milky Way smudge
  const g = c.createLinearGradient(w * 0.2, 0, w * 0.8, h * 0.6);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(190,200,255,0.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, w, h);
}
const starsCanvas = $('#stars');
const tentStars = $('#tentStars');
function drawStars() { starfield(starsCanvas, SMALL() ? 160 : 320); starfield(tentStars, 140); }
addEventListener('resize', drawStars);

/* one shared light model: minutes from sunset -> layer strengths */
function light(m) {
  const gold = ramp(m, -170, -70) * (1 - ramp(m, -10, 30));
  const dusk = ramp(m, -40, 0) * (1 - ramp(m, 20, 60));
  const night = ramp(m, 10, 65);
  return {
    gold, dusk, night,
    skyImg: 1 - ramp(m, -25, 30),
    lgold: gold * 0.85,
    ldusk: dusk * 0.75 + night * 0.25,
    lnight: night * 0.78,
    lights: ramp(m, 12, 55),
    stars: ramp(m, 18, 65)
  };
}
const set = (el, p, v) => { if (el) el.style[p] = v; };

const H = {
  gold: $('.g--gold'), dusk: $('.g--dusk'), night: $('.g--night'), sky: $('.frame__sky'),
  tg: $('.tint--gold'), td: $('.tint--dusk'), tn: $('.tint--night'), town: $('#town'), mast: $('.mast'),
  sun: $('#sun'), time: $('#heroTime'), phase: $('#heroPhase'), land: $('#heroLand'), dot: $('.clock__dot'), scrim: $('.hero__scrim')
};
const HERO_FROM = -400, HERO_TO = 150;
const hourOf = d => +new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ }).format(d);
function phaseName(m) {
  if (m < -75) return state.sunset && hourOf(addMin(state.sunset, m)) < 12 ? 'Morning on the hill' : 'Afternoon light';
  if (m < -12) return 'Golden hour';
  if (m < 22) return 'Sunset over the valley';
  if (m < 55) return 'Blue hour';
  return 'Stars over Oneonta';
}
function applyHero(p) {
  const m = lerp(HERO_FROM, HERO_TO, p);
  const L = light(m);
  set(H.gold, 'opacity', L.gold); set(H.dusk, 'opacity', L.dusk); set(H.night, 'opacity', L.night);
  set(H.sky, 'opacity', L.skyImg); set(starsCanvas, 'opacity', L.stars);
  set(H.tg, 'opacity', L.lgold); set(H.td, 'opacity', L.ldusk); set(H.tn, 'opacity', L.lnight);
  set(H.town, 'opacity', L.lights); set(H.mast, 'opacity', L.lights);
  // the sun arcs west and sets exactly on the traced ridge
  const a = clamp(-m / 420, -0.2, 1);
  set(H.sun, 'left', lerp(61, 84, a) + '%');
  set(H.sun, 'top', (34.5 - Math.sin(a * Math.PI / 2) * 34) + '%');
  set(H.sun, 'opacity', 1 - ramp(m, 8, 25));
  set(H.land, 'transform', `scale(${1 + p * 0.06})`);
  if (state.sunset) H.time.textContent = fmtTime(addMin(state.sunset, m));
  H.phase.textContent = phaseName(m);
  H.dot.style.background = L.night > 0.5 ? '#cdd6ff' : L.dusk > 0.4 ? '#ff9a5a' : '#ffd36b';
  H.dot.style.boxShadow = `0 0 10px ${H.dot.style.background}`;
}

/* ---------- loader + hero intro ---------- */
const heroSplit = new SplitText('#heroTitle .l1', { type: 'chars' });
function intro() {
  document.body.classList.remove('is-loading');
  drawStars(); applyHero(0); ScrollTrigger.refresh();
  if (RM) { $('#loader')?.remove(); return; }
  const tl = gsap.timeline();
  tl.from(heroSplit.chars, { yPercent: 110, opacity: 0, rotate: 8, stagger: 0.035, duration: 1, ease: 'expo.out' }, 0.15)
    .from('#heroTitle .l2', { y: 30, opacity: 0, duration: 1, ease: 'expo.out' }, 0.55)
    .from(['#heroKicker', '#heroSub', '.hero__cta', '#heroClock', '.cue'], { y: 24, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out' }, 0.7)
    .fromTo('#heroLand', { yPercent: 6 }, { yPercent: 0, duration: 1.8, ease: 'expo.out' }, 0)
    .fromTo('.frame__sky', { scale: 1.08 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0);
}
(function loader() {
  const el = $('#loader');
  if (RM || !el) { intro(); return; }
  const path = $('#ridgePath');
  const len = path.getTotalLength();
  path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    ...['img/valley-land.webp', 'img/valley-sky.webp'].map(src => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = src; }))
  ]);
  const tl = gsap.timeline();
  tl.to(path, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' })
    .to('.loader__word', { opacity: 1, y: -6, duration: 0.6, ease: 'power2.out' }, 0.7);
  Promise.all([ready, new Promise(r => tl.eventCallback('onComplete', r))]).then(() => {
    gsap.to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: 'expo.inOut', onComplete: () => el.remove() });
    gsap.delayedCall(0.35, intro);
  });
  setTimeout(() => { if (document.body.classList.contains('is-loading')) { el.remove(); intro(); } }, 6000);
})();

/* personalise hero */
if (OWNER) $('#heroKicker').innerHTML = `Hosted by <span class="hi">${OWNER}</span> &middot; Oneonta, NY`;
if (COUPLE) $('#heroSub').textContent = `${COUPLE}, picture your day on this hill: vows at golden hour, dinner under the canvas, sparklers under the stars.`;
if (OWNER) $('#hostName').innerHTML = `Hosted by <em class="owner-name">${OWNER}</em>`;

/* hero scroll: a whole day passes */
ScrollTrigger.create({
  trigger: hero, start: 'top top', end: () => '+=' + innerHeight * 1.7, pin: true, scrub: true,
  onUpdate: s => applyHero(s.progress)
});
gsap.to('.hero__copy', { yPercent: -18, opacity: 0.0, ease: 'none', scrollTrigger: { trigger: hero, start: () => 'top+=' + innerHeight * 1.25 + ' top', end: () => 'top+=' + innerHeight * 1.7 + ' top', scrub: true } });

/* header turns solid after the hero */
ScrollTrigger.create({ trigger: '#intro', start: 'top 70px', onToggle: s => $('#top').classList.toggle('is-solid', s.isActive || s.progress > 0), end: 'max' });

/* ---------- intro words + counters ---------- */
const lede = new SplitText('.intro__lede', { type: 'words', wordsClass: 'w' });
gsap.to(lede.words, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '.intro__lede', start: 'top 80%', end: 'bottom 45%', scrub: true } });
$$('[data-count]').forEach(el => {
  const to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, suf = el.dataset.suffix || '';
  const o = { v: 0 };
  ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec) + suf; } }) });
});

/* ---------- the day, hour by hour ---------- */
const BEATS = [
  ['Ceremony at the meadow’s edge', 'Chairs on the grass, the whole valley behind your vows.', s => addMin(s, -150)],
  ['Cocktail hour by the barrels', 'Local cider, Ommegang on tap and lawn games.', s => addMin(s, -110)],
  ['Golden hour portraits', 'The light your photographer drove up for.', (s, g) => addMin(g, -10)],
  ['Dinner under the canvas', 'Long tables, curtains tied back to the sunset.', s => addMin(s, -5)],
  ['First dance under bistro lights', 'The tent glows; the valley goes blue.', s => addMin(s, 75)],
  ['Bonfire and s’mores', 'Stars over Oneonta and a fire for the late crowd.', s => addMin(s, 140)],
  ['Sparkler send-off', 'A tunnel of light down to the lantern path.', s => addMin(s, Math.max(205, 270 - (s.getHours() - 16) * 30))]
];
const BEAT_AT = [0, 0.15, 0.3, 0.45, 0.62, 0.78, 0.92];
let beatTimes = [];
const beatList = $('#beatList');
beatList.innerHTML = BEATS.map(b => `<li><b></b><div><span>${b[0]}</span><small>${b[1]}</small></div></li>`).join('');
const beatLis = $$('li', beatList);
onDate((d, sunset, golden) => {
  beatTimes = BEATS.map(b => b[2](sunset, golden));
  beatLis.forEach((li, i) => { $('b', li).textContent = fmtTime(beatTimes[i]); });
  $('#beatDate').textContent = fmtDateShort(d);
  applyDay(dayProgress);
});

const T = {
  stage: $('#tentStage'), gold: $('.g--gold2'), dusk: $('.g--dusk2'), night: $('.g--night2'), sky: $('.ts__sky'),
  tg: $('.tint2--gold'), td: $('.tint2--dusk'), tn: $('.tint2--night'), glow: $('.ts__glow'), lights: $('.ts__lights'),
  time: $('#beatTime'), bar: $('#beatBar')
};
let dayProgress = 0, dayMinutes = -150, sparkle = 0, fireflies = 0, dayActive = false, fxRun = false;
function applyDay(p) {
  dayProgress = p;
  if (!beatTimes.length) return;
  let i = 0; while (i < BEAT_AT.length - 1 && p >= BEAT_AT[i + 1]) i++;
  const a = BEAT_AT[i], b = BEAT_AT[i + 1] ?? 1, tA = beatTimes[i], tB = beatTimes[i + 1] ?? addMin(beatTimes[i], 30);
  const t = new Date(lerp(tA.getTime(), tB.getTime(), clamp((p - a) / (b - a))));
  dayMinutes = (t - state.sunset) / 60000;
  const L = light(dayMinutes);
  set(T.gold, 'opacity', L.gold); set(T.dusk, 'opacity', L.dusk); set(T.night, 'opacity', L.night);
  set(T.sky, 'opacity', L.skyImg); set(tentStars, 'opacity', L.stars);
  set(T.tg, 'opacity', L.lgold); set(T.td, 'opacity', L.ldusk); set(T.tn, 'opacity', L.lnight);
  set(T.glow, 'opacity', L.lights * 0.95); set(T.lights, 'opacity', L.lights);
  T.time.textContent = fmtTime(t);
  T.bar.style.width = (p * 100).toFixed(1) + '%';
  beatLis.forEach((li, k) => { li.classList.toggle('is-on', k <= i); li.classList.toggle('is-cur', k === i); });
  sparkle = ramp(p, 0.9, 0.96);
  fireflies = L.lights;
}
ScrollTrigger.create({
  trigger: '#day', start: 'top top', end: () => '+=' + innerHeight * (SMALL() ? 2.6 : 2.2), pin: '.day__pin', scrub: true,
  onUpdate: s => applyDay(s.progress),
  onToggle: s => { dayActive = s.isActive; if (dayActive) startTentFx(); }
});

/* string lights swagged under the tent roof */
(function bulbs() {
  const g = $('#bulbs'); const ns = 'http://www.w3.org/2000/svg';
  ['M310,354 Q394,378 478,359 Q563,378 652,352', 'M318,368 Q398,390 478,374 Q558,390 646,366'].forEach((d, k) => {
    const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); g.appendChild(p);
    const len = p.getTotalLength();
    for (let l = 8; l < len; l += 19) {
      const pt = p.getPointAtLength(l);
      const h = document.createElementNS(ns, 'circle'); h.setAttribute('class', 'halo'); h.setAttribute('cx', pt.x); h.setAttribute('cy', pt.y + 3); h.setAttribute('r', 5.5);
      const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y + 3); c.setAttribute('r', 1.9);
      if (!RM) gsap.to(h, { opacity: 0.35, duration: 0.8 + Math.random(), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: Math.random() });
      g.append(h, c);
    }
  });
})();

/* fireflies + sparkler send-off */
const fx = $('#tentFx');
const flies = Array.from({ length: 26 }, () => ({ x: 60 + Math.random() * 720, y: 420 + Math.random() * 240, p: Math.random() * 6.28, s: 0.3 + Math.random() * 0.5 }));
const sparks = [];
const SPARKLERS = Array.from({ length: 16 }, (_, i) => { const row = i % 2; const k = Math.floor(i / 2); return { r: row ? 20 : 14, x: 200 + k * (62 + row * 8) + row * 4 + (Math.random() - 0.5) * 18, y: 548 + row * 70 + (Math.random() - 0.5) * 14 - Math.abs(k - 3.5) * 4, h: 22 + Math.random() * 16 }; });
function startTentFx() {
  if (fxRun || RM) return; fxRun = true;
  const c = fx.getContext('2d');
  const step = () => {
    if (!dayActive) { fxRun = false; c.clearRect(0, 0, fx.width, fx.height); return; }
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = fx.clientWidth, h = fx.clientHeight;
    if (fx.width !== Math.round(w * dpr)) { fx.width = Math.round(w * dpr); fx.height = Math.round(h * dpr); }
    const sx = fx.width / 828, sy = fx.height / 689;
    c.setTransform(sx, 0, 0, sy, 0, 0);
    c.clearRect(0, 0, 828, 689);
    c.globalCompositeOperation = 'lighter';
    if (fireflies > 0.02) {
      flies.forEach(f => {
        f.p += 0.02; f.x += Math.cos(f.p * 0.7) * f.s; f.y += Math.sin(f.p) * f.s * 0.6;
        const a = fireflies * (0.4 + 0.6 * Math.max(0, Math.sin(f.p * 2.3)));
        const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 9);
        g.addColorStop(0, `rgba(230,255,150,${a})`); g.addColorStop(1, 'rgba(230,255,150,0)');
        c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, 9, 0, 7); c.fill();
      });
    }
    if (sparkle > 0.01) {
      SPARKLERS.forEach(sp => {
        for (let n = 0; n < 3 * sparkle; n++) {
          const ang = Math.random() * 6.28, v = (1 + Math.random() * 3) * sp.r / 20;
          sparks.push({ x: sp.x + Math.sin(performance.now() / 300 + sp.x) * 4, y: sp.y - sp.h, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 0.6, life: 1 });
        }
        const g = c.createRadialGradient(sp.x, sp.y - sp.h, 0, sp.x, sp.y - sp.h, sp.r);
        g.addColorStop(0, `rgba(255,240,200,${0.9 * sparkle})`); g.addColorStop(1, 'rgba(255,170,60,0)');
        c.fillStyle = g; c.beginPath(); c.arc(sp.x, sp.y - sp.h, sp.r, 0, 7); c.fill();
      });
    }
    for (let k = sparks.length - 1; k >= 0; k--) {
      const s = sparks[k]; s.x += s.vx; s.y += s.vy; s.vy += 0.09; s.life -= 0.045;
      if (s.life <= 0) { sparks.splice(k, 1); continue; }
      c.strokeStyle = `rgba(255,${200 + 55 * s.life | 0},${120 + 120 * s.life | 0},${s.life})`;
      c.lineWidth = 1.4; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2); c.stroke();
    }
    if (sparks.length > 1600) sparks.splice(0, sparks.length - 1600);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- events ---------- */
const ICONS = {
  rings: '<circle cx="18" cy="29" r="10"/><circle cx="30" cy="29" r="10"/><path d="M24 7l4 5-4 5-4-5z"/>',
  peak: '<path d="M4 40L18 18l8 12 6-8 12 18z"/><path d="M24 14c-2-3-7-2-6 2 1 3 6 5 6 5s5-2 6-5c1-4-4-5-6-2z"/>',
  glasses: '<path d="M10 6h10l-1 10a4 4 0 0 1-8 0zM15 20v16M10 36h10"/><path d="M28 10h10l-1 10a4 4 0 0 1-8 0zM33 24v16M28 40h10"/>',
  cup: '<path d="M8 20h24v10a10 10 0 0 1-10 10h-4A10 10 0 0 1 8 30z"/><path d="M32 23h4a5 5 0 0 1 0 10h-4"/><path d="M15 7c-2 3 2 5 0 8M23 7c-2 3 2 5 0 8"/>',
  laptop: '<rect x="8" y="10" width="32" height="21" rx="2"/><path d="M3 36h42"/><path d="M18 21l4 4 8-8"/>',
  family: '<circle cx="12" cy="17" r="5"/><circle cx="24" cy="13" r="6"/><circle cx="36" cy="17" r="5"/><path d="M3 38c0-7 4-11 9-11s8 4 8 11M14 41c0-9 4-14 10-14s10 5 10 14M28 38c0-7 4-11 8-11s9 4 9 11"/>',
  cake: '<path d="M8 26h32v14H8zM8 32c4 3 8 3 12 0s8-3 12 0 6 2 8 1"/><path d="M16 26v-6M24 26v-6M32 26v-6"/><path d="M16 12c-2 2.5 0 4.5 0 4.5s2-2 0-4.5zM24 12c-2 2.5 0 4.5 0 4.5s2-2 0-4.5zM32 12c-2 2.5 0 4.5 0 4.5s2-2 0-4.5z"/>',
  gift: '<rect x="8" y="18" width="32" height="22" rx="2"/><path d="M6 18h36M24 18v22M24 18c-4-8-12-8-10-2 1 3 10 2 10 2zM24 18c4-8 12-8 10-2-1 3-10 2-10 2z"/>',
  cap: '<path d="M3 18l21-9 21 9-21 9z"/><path d="M12 22v9c0 3 6 6 12 6s12-3 12-6v-9"/><path d="M45 18v12"/>'
};
const EVENTS = [
  ['Weddings', 'Ceremony on the meadow, dinner under the canvas, dancing until the stars come out.', 'Up to 250', 'rings', 'img/barrels.webp'],
  ['Elopements and micro weddings', 'Just the two of you, an officiant, a photographer and that view.', '2 to 30', 'peak', 'img/path.webp'],
  ['Rehearsal dinners', 'Long tables, wood-fired food and toasts as the sun drops.', '20 to 120', 'glasses', '#b5502a'],
  ['Welcome parties and farewell brunches', 'Bookend the wedding weekend with the people who travelled for you.', '20 to 200', 'cup', '#d58a2a'],
  ['Corporate retreats', 'An offsite that feels off-site. Workshops in the tent, dinner by the fire.', '10 to 150', 'laptop', '#2f5d8a'],
  ['Family reunions', 'Lawn games, a pig roast and a group photo with the whole valley behind you.', '20 to 250', 'family', '#4e7a3a'],
  ['Milestone birthdays and anniversaries', 'Fiftieth birthdays, fortieth anniversaries and every big number in between.', '10 to 200', 'cake', '#7a4b8a'],
  ['Showers and engagement parties', 'Garden-party afternoons with the tent curtains tied back.', '15 to 120', 'gift', '#c95f78'],
  ['Graduation parties', 'SUNY Oneonta and Hartwick families: celebrate up the hill, not in a crowded restaurant.', '20 to 200', 'cap', '#2f7a6a']
];
$('#tiles').innerHTML = EVENTS.map(([t, d, s, ic, bg]) => {
  const photo = bg.startsWith('img/');
  return `<article class="tile${photo ? ' tile--photo' : ''}" ${photo ? '' : `style="background:${bg}"`}>
    ${photo ? `<div class="tile__img"><img src="${bg}" alt="" loading="lazy"></div>` : ''}
    <svg class="tile__icon" viewBox="0 0 48 48" aria-hidden="true">${ICONS[ic]}</svg>
    <h3>${t}</h3><p>${d}</p><span class="tile__size">${s} guests</span></article>`;
}).join('');
$('#eventSelect').innerHTML = EVENTS.map(e => `<option>${e[0]}</option>`).join('') + '<option>Something else</option>';
if (!RM) {
  gsap.from('.tile', { y: 70, rotate: (i) => (i % 2 ? 3 : -3), opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '#tiles', start: 'top 85%' } });
  $$('.tile__icon').forEach(svg => {
    const parts = $$('path,circle,rect', svg);
    parts.forEach(p => { const l = p.getTotalLength ? p.getTotalLength() : 100; p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    ScrollTrigger.create({ trigger: svg, start: 'top 90%', once: true, onEnter: () => gsap.to(parts, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.12 }) });
  });
}

/* ---------- tent planner ---------- */
const plan = $('#plan');
const P = { guests: 120, style: 'farm', add: new Set(['dance', 'bar']) };
const SIZES = [[20, 30], [20, 40], [30, 30], [30, 45], [30, 60], [40, 40], [40, 60], [40, 80], [40, 100], [60, 60], [60, 80], [60, 100], [60, 120]];
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
function needed() {
  const g = P.guests;
  let sq = g * (P.style === 'farm' ? 10 : 12.5);
  if (P.add.has('dance')) sq += Math.max(150, g * 3);
  if (P.add.has('bar')) sq += 140;
  if (P.add.has('lounge')) sq += 180;
  if (P.add.has('band')) sq += 200;
  return SIZES.find(([w, l]) => w * l >= sq) || SIZES[SIZES.length - 1];
}
function layoutTent(tw, tl, tables) {
  const zones = [];
  const pad = 2;
  if (P.add.has('band')) zones.push({ k: 'band', x: tl - 10 - pad, y: tw / 2 - 6, w: 10, h: 12, label: 'Band' });
  if (P.add.has('dance')) { const side = Math.min(tw - 8, Math.max(12, Math.sqrt(Math.max(150, P.guests * 3)))); const bx = P.add.has('band') ? tl - 10 - pad - side - 1 : tl - side - pad; zones.push({ k: 'dance', x: bx, y: (tw - side) / 2, w: side, h: side, label: 'Dance' }); }
  if (P.add.has('bar')) zones.push({ k: 'bar', x: pad, y: pad, w: 12, h: 5, label: 'Bar' });
  if (P.add.has('lounge')) zones.push({ k: 'lounge', x: pad, y: tw - pad - 9, w: 14, h: 9, label: 'Lounge' });
  const hit = (x, y, w, h) => zones.some(z => x < z.x + z.w + 1.5 && x + w > z.x - 1.5 && y < z.y + z.h + 1.5 && y + h > z.y - 1.5);
  const farm = P.style === 'farm';
  const tw_ = farm ? 8 : 5, th_ = farm ? 2.5 : 5, gx = farm ? 10.5 : 9, gy = farm ? 7.5 : 9;
  const placed = [];
  for (let y = pad + 1.5; y + th_ <= tw - pad && placed.length < tables; y += gy) {
    for (let x = pad + 1.5; x + tw_ <= tl - pad && placed.length < tables; x += gx) {
      if (!hit(x, y, tw_, th_)) placed.push([x, y]);
    }
  }
  return { zones, placed, farm, tw_, th_ };
}
function drawPlan(animate) {
  const tables = Math.ceil(P.guests / 8);
  let k = SIZES.indexOf(needed()), L0;
  for (; k < SIZES.length; k++) { L0 = layoutTent(SIZES[k][0], SIZES[k][1], tables); if (L0.placed.length >= tables) break; }
  const [tw, tl] = SIZES[Math.min(k, SIZES.length - 1)];
  $('#gCount').textContent = P.guests;
  $('#pTent').textContent = `${tw} × ${tl}`;
  $('#pTables').textContent = tables;
  $('#pTablesLabel').textContent = P.style === 'farm' ? 'farm tables of 8' : 'round tables of 8';
  $('#pSq').textContent = (tw * tl).toLocaleString();
  const range = $('#guests'); range.style.setProperty('--p', ((P.guests - 10) / 240 * 100) + '%');

  plan.innerHTML = '';
  const defs = mk('defs', {}, plan);
  const pat = mk('pattern', { id: 'parquet', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, defs);
  mk('rect', { width: 8, height: 8, fill: '#b98552' }, pat);
  mk('path', { d: 'M0 0h4v4H0zM4 4h4v4H4z', fill: '#a3713f' }, pat);
  mk('rect', { class: 'grass', x: 0, y: 0, width: 640, height: 440, rx: 16 }, plan);
  const W = 600, Hh = 380; const s = Math.min(W / tl, Hh / tw);
  const pw = tl * s, ph = tw * s, ox = (640 - pw) / 2, oy = (440 - ph) / 2 + 8;
  const g = mk('g', {}, plan);
  mk('rect', { class: 'tentR', x: ox, y: oy, width: pw, height: ph, rx: 4 }, g);
  const ridgeInset = ph / 2;
  mk('path', { class: 'roof', d: `M${ox},${oy} L${ox + ridgeInset},${oy + ph / 2} L${ox + pw - ridgeInset},${oy + ph / 2} L${ox + pw},${oy} M${ox},${oy + ph} L${ox + ridgeInset},${oy + ph / 2} M${ox + pw - ridgeInset},${oy + ph / 2} L${ox + pw},${oy + ph}` }, g);
  for (let x = 0; x <= tl; x += 10) { mk('circle', { class: 'pole', cx: ox + x * s, cy: oy, r: 2.6 }, g); mk('circle', { class: 'pole', cx: ox + x * s, cy: oy + ph, r: 2.6 }, g); }
  mk('text', { class: 'dim', x: ox + pw / 2, y: oy - 10, 'text-anchor': 'middle' }, plan).textContent = `${tl} ft`;
  mk('text', { class: 'dim', x: ox - 10, y: oy + ph / 2, 'text-anchor': 'middle', transform: `rotate(-90 ${ox - 10} ${oy + ph / 2})` }, plan).textContent = `${tw} ft`;

  const { zones, placed, farm, tw_, th_ } = L0;
  zones.forEach(z => {
    const r = mk('rect', { class: z.k === 'dance' ? 'dance' : `zone zone--${z.k}`, x: ox + z.x * s, y: oy + z.y * s, width: z.w * s, height: z.h * s, rx: 3 }, g);
    const t = mk('text', { class: 'lbl' + (z.k === 'dance' ? ' lbl--dark' : ''), x: ox + (z.x + z.w / 2) * s, y: oy + (z.y + z.h / 2) * s + 4, 'text-anchor': 'middle' }, g); t.textContent = z.label;
    if (animate && !RM) gsap.from([r, t], { opacity: 0, scale: 0.6, transformOrigin: 'center', duration: 0.5, ease: 'back.out(2)' });
  });
  const tg = mk('g', {}, g);
  placed.forEach(([x, y], i) => {
    const grp = mk('g', {}, tg);
    if (farm) {
      mk('rect', { class: 'tbl', x: ox + x * s, y: oy + y * s, width: tw_ * s, height: th_ * s, rx: 1.5 }, grp);
      for (let c = 0; c < 4; c++) {
        const cx = ox + (x + 1 + c * 2) * s;
        mk('circle', { class: 'chair', cx, cy: oy + (y - 0.8) * s, r: Math.max(1.2, s * 0.55) }, grp);
        mk('circle', { class: 'chair', cx, cy: oy + (y + th_ + 0.8) * s, r: Math.max(1.2, s * 0.55) }, grp);
      }
    } else {
      const cx = ox + (x + 2.5) * s, cy = oy + (y + 2.5) * s;
      mk('circle', { class: 'tbl', cx, cy, r: 2.5 * s }, grp);
      for (let c = 0; c < 8; c++) { const a = c / 8 * 6.283; mk('circle', { class: 'chair', cx: cx + Math.cos(a) * 3.4 * s, cy: cy + Math.sin(a) * 3.4 * s, r: Math.max(1.2, s * 0.55) }, grp); }
    }
    if (animate && !RM) gsap.from(grp, { opacity: 0, y: -8, duration: 0.45, delay: i * 0.012, ease: 'power3.out' });
  });
}
drawPlan(false);
let planTO;
$('#guests').addEventListener('input', e => { P.guests = +e.target.value; $('#gCount').textContent = P.guests; clearTimeout(planTO); planTO = setTimeout(() => drawPlan(true), 40); });
$$('.seg__b').forEach(b => b.addEventListener('click', () => {
  $$('.seg__b').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); });
  P.style = b.dataset.style; drawPlan(true);
}));
$$('#addons .chip').forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.add; P.add.has(k) ? P.add.delete(k) : P.add.add(k);
  b.classList.toggle('is-on', P.add.has(k)); b.setAttribute('aria-pressed', P.add.has(k)); drawPlan(true);
}));
ScrollTrigger.create({ trigger: '.planner', start: 'top 75%', once: true, onEnter: () => drawPlan(true) });
if (!RM) gsap.from('.nine li', { y: 30, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.nine', start: 'top 85%' } });

/* ---------- seasons ---------- */
const monthsEl = $('#months');
monthsEl.innerHTML = MONTHS.map((m, i) => `<button class="month" role="tab" data-m="${i}" aria-selected="false">${m[0]}</button>`).join('');
$$('.month').forEach(b => b.addEventListener('click', () => setDate(nextSecondSaturday(+b.dataset.m), true)));
$('#datePick').addEventListener('change', e => { if (e.target.value) setDate(fromIso(e.target.value)); });
onDate((d, sunset, golden, fromMonth) => {
  const m = MONTHS[d.getMonth()];
  $$('.month').forEach((b, i) => { const on = i === d.getMonth(); b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); if (on && fromMonth) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); });
  $('#sName').textContent = m[1];
  $('#sNote').textContent = m[2];
  $('#datePick').value = isoDate(d);
  $('#fSet').textContent = fmtTime(sunset);
  $('#fGold').textContent = fmtTime(golden);
  const cer = round15(addMin(sunset, -150));
  $('#fCer').textContent = fmtTime(cer);
  $('#fTemp').textContent = `${m[5]}° / ${m[6]}°`;
  const [a1, a2, bg] = m[4];
  gsap.to(root, { '--accent': a1, '--accent-2': a2, duration: RM ? 0 : 0.8, ease: 'power2.out' });
  $('#seasons').style.background = bg;
  drift.mode(m[3]);
  if (!RM && fromMonth) gsap.fromTo('.season__facts .fact b', { y: 12, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: 'power3.out' });
});

/* ---------- drifting leaves / petals / snow / summer glints ---------- */
const drift = (() => {
  const cv = $('#drift'); const c = cv.getContext('2d');
  let mode = 'leaves', parts = [], w = 0, h = 0, dpr = 1, wind = 0, running = false;
  const PAL = { leaves: ['#d4572a', '#e8a33d', '#b8452a', '#f0c04a', '#9c3b1e', '#c96a2a'], petals: ['#f6b9c9', '#f3a1b6', '#fde2ea', '#ffffff'], snow: ['#ffffff', '#e3edf7'], summer: ['#f5d36b', '#fff1a8', '#c9f08a'] };
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; };
  const spawn = (top) => {
    const pal = PAL[mode];
    return { x: Math.random() * w, y: top ? -20 - Math.random() * h * 0.3 : Math.random() * h, vy: mode === 'snow' ? 0.4 + Math.random() * 0.6 : mode === 'summer' ? -0.15 - Math.random() * 0.25 : 0.55 + Math.random() * 0.8,
      vx: (Math.random() - 0.5) * 0.4, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.05, f: Math.random() * 6.28,
      s: mode === 'leaves' ? 7 + Math.random() * 7 : mode === 'petals' ? 4 + Math.random() * 4 : mode === 'snow' ? 1.4 + Math.random() * 2.6 : 1.2 + Math.random() * 2,
      col: pal[(Math.random() * pal.length) | 0] };
  };
  const count = () => SMALL() ? (mode === 'snow' ? 40 : 12) : (mode === 'snow' ? 80 : 22);
  const reset = () => { parts = Array.from({ length: count() }, () => spawn(false)); };
  function draw(p) {
    c.save(); c.translate(p.x, p.y);
    if (mode === 'leaves' || mode === 'petals') {
      c.rotate(p.r); c.scale(Math.cos(p.f), 1);
      c.fillStyle = p.col; c.globalAlpha = 0.9;
      c.beginPath();
      if (mode === 'leaves') {
        const s = p.s;
        c.moveTo(0, -s); c.quadraticCurveTo(s * 0.95, -s * 0.35, 0, s); c.quadraticCurveTo(-s * 0.95, -s * 0.35, 0, -s); c.fill();
        c.strokeStyle = 'rgba(80,30,10,.45)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -s * 0.8); c.lineTo(0, s * 1.25); c.stroke();
      } else { c.ellipse(0, 0, p.s, p.s * 0.6, 0, 0, 7); c.fill(); }
    } else if (mode === 'snow') {
      c.globalAlpha = 0.85; c.fillStyle = p.col; c.shadowColor = 'rgba(60,90,130,.35)'; c.shadowBlur = 3; c.beginPath(); c.arc(0, 0, p.s, 0, 7); c.fill();
    } else {
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(p.f * 3));
      const g = c.createRadialGradient(0, 0, 0, 0, 0, p.s * 5); g.addColorStop(0, p.col); g.addColorStop(1, 'rgba(255,230,120,0)');
      c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(0, 0, p.s * 5, 0, 7); c.fill();
    }
    c.restore();
  }
  function frame() {
    if (!running) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const v = lenis ? lenis.velocity : 0;
    wind = lerp(wind, clamp(v * 0.08, -6, 6), 0.08);
    parts.forEach((p, i) => {
      p.f += mode === 'leaves' ? 0.03 : 0.02;
      p.x += p.vx + Math.sin(p.f) * (mode === 'snow' ? 0.3 : 0.6) + wind * (mode === 'snow' ? 0.3 : 0.6);
      p.y += p.vy - wind * 0.35; p.r += p.vr + wind * 0.004;
      if (p.y > h + 30 || p.y < -60 || p.x < -40 || p.x > w + 40) parts[i] = mode === 'summer' ? Object.assign(spawn(false), { y: h + 10 }) : spawn(true);
      draw(p);
    });
    requestAnimationFrame(frame);
  }
  function start() { if (running || RM) return; running = true; requestAnimationFrame(frame); }
  function stop() { running = false; c.clearRect(0, 0, cv.width, cv.height); }
  size(); addEventListener('resize', () => { size(); reset(); });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  return { mode(m) { if (m !== mode || !parts.length) { mode = m; reset(); } start(); } };
})();

/* ---------- around Oneonta map ---------- */
const PLACES = [
  { id: 'home', name: 'The Overlook', x: 289, y: 373, c: '#e8a33d', chip: 'You are here', drive: 'Swart Hollow Road', text: 'A private hilltop meadow above Oneonta, with the valley and Franklin Mountain’s tower on the horizon.', home: true },
  { id: 'oneonta', name: 'Downtown Oneonta', x: 226, y: 393, c: '#f08a5d', chip: 'Eat and drink', drive: 'About 10 minutes', text: 'Main Street restaurants, coffee and craft beer, the Foothills Performing Arts Center, and Brooks’ House of Bar-B-Q, feeding the valley since 1951.', lx: -8, anchor: 'end' },
  { id: 'coop', name: 'Cooperstown', x: 337, y: 125, c: '#7cc4e8', chip: 'Day trip', drive: 'About 35 minutes', text: 'The National Baseball Hall of Fame, the Fenimore Art Museum and the Glimmerglass Festival’s summer opera on Otsego Lake.', lx: 12 },
  { id: 'ommegang', name: 'Brewery Ommegang', x: 325, y: 198, c: '#d9778a', chip: 'Drinks', drive: 'About 30 minutes', text: 'Belgian-style ales on a former hop farm, with summer concerts on the lawn.', lx: 12 },
  { id: 'fly', name: 'Fly Creek Cider Mill', x: 283, y: 104, c: '#f2c14e', chip: 'Sweet stop', drive: 'About 40 minutes', text: 'Fresh-pressed cider, cider doughnuts and a mill pond full of ducks. Open seasonally.', lx: -8, anchor: 'end' },
  { id: 'gilbert', name: 'Gilbert Lake State Park', x: 178, y: 261, c: '#8fcf9c', chip: 'Outdoors', drive: 'About 30 minutes', text: 'Lake swims, wooded trails and cabins built by the Civilian Conservation Corps in the 1930s.', lx: -8, anchor: 'end' },
  { id: 'hanford', name: 'Hanford Mills Museum', x: 377, y: 433, c: '#c9a06a', chip: 'History', drive: 'About 20 minutes', text: 'A water-powered sawmill and gristmill in East Meredith, with demonstration days through the warm months.', lx: 12 }
];
(function map() {
  const pinsG = $('#pins'); const hills = $('#mapHills');
  let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 16; k++) {
    const y0 = 20 + k * 32; let d = `M-10 ${y0}`;
    for (let x = 0; x <= 620; x += 40) d += ` Q${x + 20} ${y0 + (rnd() - 0.5) * 34} ${x + 40} ${y0 + (rnd() - 0.5) * 14}`;
    mk('path', { d }, hills);
  }
  PLACES.forEach(p => {
    const g = mk('g', { class: 'pin' + (p.home ? ' pin--home' : ''), tabindex: 0, role: 'button', 'aria-label': p.name, style: `--c:${p.c}` }, pinsG);
    mk('circle', { class: 'hit', cx: p.x, cy: p.y, r: 22 }, g);
    mk('circle', { class: 'ring', cx: p.x, cy: p.y, r: 9 }, g);
    mk('circle', { class: 'dot', cx: p.x, cy: p.y, r: p.home ? 9 : 7 }, g);
    const t = mk('text', { x: p.x + (p.lx ?? 14), y: p.y + 4.5, 'text-anchor': p.anchor || 'start' }, g); t.textContent = p.name;
    g.addEventListener('click', () => pick(p.id));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p.id); } });
    p.el = g;
  });
  const route = $('#routeCoop');
  const placeEl = $('#place');
  const home = PLACES[0];
  function pick(id) {
    const p = PLACES.find(q => q.id === id);
    PLACES.forEach(q => q.el.classList.toggle('is-on', q === p));
    placeEl.innerHTML = `<span class="place__chip" style="--c:${p.c}">${p.chip}</span><h3>${p.name}</h3><p class="place__drive">${p.drive}</p><p>${p.text}</p>
      <div class="place__dots">${PLACES.map(q => `<button data-id="${q.id}" class="${q === p ? 'is-on' : ''}">${q.home ? 'The Overlook' : q.name.replace(' State Park', '').replace(' Museum', '')}</button>`).join('')}</div>`;
    $$('.place__dots button', placeEl).forEach(b => b.addEventListener('click', () => pick(b.dataset.id)));
    if (!RM) gsap.from(placeEl.children, { y: 14, opacity: 0, stagger: 0.05, duration: 0.5, ease: 'power3.out' });
    if (p.home) { route.style.opacity = 0; return; }
    const mx = (home.x + p.x) / 2 + (p.y < home.y ? 40 : -30), my = (home.y + p.y) / 2;
    route.setAttribute('d', `M${home.x} ${home.y} Q${mx} ${my} ${p.x} ${p.y}`);
    const len = route.getTotalLength(); route.style.opacity = 1;
    route.style.strokeDasharray = len; route.style.strokeDashoffset = len;
    gsap.to(route, { strokeDashoffset: 0, duration: RM ? 0 : 1.1, ease: 'power2.inOut' });
  }
  const draws = $$('.map .draw:not(#routeCoop)');
  draws.forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = p.classList.contains('map__road') ? '10 7' : l; if (!p.classList.contains('map__road')) p.style.strokeDashoffset = l; });
  ScrollTrigger.create({ trigger: '#map', start: 'top 75%', once: true, onEnter: () => {
    gsap.to('.map__river', { strokeDashoffset: 0, duration: RM ? 0 : 2.2, ease: 'power2.inOut' });
    if (!RM) gsap.from('.pin', { scale: 0, transformOrigin: 'center', opacity: 0, stagger: 0.08, duration: 0.6, ease: 'back.out(2)', delay: 0.4 });
    gsap.delayedCall(RM ? 0 : 0.9, () => pick('coop'));
  } });
  pick('home');
})();

/* ---------- voices marquee ---------- */
const QUOTES = [
  ['We said our vows at four and by six the whole valley had turned gold. Our photographer cried. So did my dad.', 'Hannah & Luis', 'Wedding, October'],
  ['Three generations, sixty-two cousins and one tent. Grandma still calls it “the hill party.”', 'The Russo family', 'Reunion, August'],
  ['We eloped on a Tuesday with eight people, and it was the most beautiful day of our lives.', 'Jess & Amara', 'Elopement, May'],
  ['Our team got more done in two days on that hill than in a quarter of meetings.', 'Marcus T.', 'Leadership retreat, September'],
  ['Guests flew in from Seattle and London, and every one of them asked how we found this place.', 'Claire & Tom', 'Wedding, June'],
  ['The sparkler send-off under all those stars is the photo on our wall now.', 'Dev & Rina', 'Wedding, September']
];
const qEl = $('#quotes');
const qHtml = QUOTES.map(q => `<blockquote class="quote"><p>${q[0]}</p><footer>${q[1]}<span>${q[2]}</span></footer></blockquote>`).join('');
qEl.innerHTML = qHtml + qHtml;
if (!RM) {
  const mq = gsap.to(qEl, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
  ScrollTrigger.create({ trigger: '#voices', start: 'top bottom', end: 'bottom top', onUpdate: s => { mq.timeScale(1 + Math.min(6, Math.abs(s.getVelocity()) / 300)); gsap.to(mq, { timeScale: 1, duration: 1.2, overwrite: true }); } });
} else { qEl.style.flexWrap = 'wrap'; qEl.style.width = 'auto'; qEl.style.padding = '20px var(--pad)'; qEl.innerHTML = qHtml; }

/* hosts photo parallax */
if (!RM) gsap.fromTo('.hosts__photo img', { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.hosts', start: 'top bottom', end: 'bottom top', scrub: true } });

/* ---------- save-the-date card ---------- */
const std = (() => {
  const cv = $('#stdCanvas'); const c = cv.getContext('2d');
  const img = new Image(); img.src = 'img/valley.webp';
  const names = $('#stdNames'), dateIn = $('#stdDate');
  if (COUPLE) names.value = COUPLE;
  let ready = false;
  img.onload = () => { ready = true; draw(); };
  (document.fonts ? document.fonts.load('italic 300 120px Fraunces').then(() => document.fonts.load('400 40px Fraunces')).then(() => document.fonts.load('600 30px Manrope')) : Promise.resolve()).then(draw).catch(draw);
  function draw() {
    if (!ready) return;
    const W = 1080, Hc = 1350;
    // crop the panorama around the tower peak
    const sh = 888, sw = sh * W / Hc, sx = 1150 - sw / 2;
    c.clearRect(0, 0, W, Hc);
    c.drawImage(img, sx, 0, sw, sh, 0, 0, W, Hc);
    // golden-hour grade
    c.globalCompositeOperation = 'soft-light';
    const gg = c.createLinearGradient(0, 0, 0, Hc); gg.addColorStop(0, '#5a6fb5'); gg.addColorStop(0.45, '#ffb35a'); gg.addColorStop(1, '#7a3a1a');
    c.fillStyle = gg; c.fillRect(0, 0, W, Hc);
    c.globalCompositeOperation = 'source-over';
    const sh2 = c.createLinearGradient(0, Hc * 0.45, 0, Hc); sh2.addColorStop(0, 'rgba(18,12,8,0)'); sh2.addColorStop(1, 'rgba(18,12,8,.82)');
    c.fillStyle = sh2; c.fillRect(0, 0, W, Hc);
    const top = c.createLinearGradient(0, 0, 0, 420); top.addColorStop(0, 'rgba(10,20,50,.45)'); top.addColorStop(1, 'rgba(10,20,50,0)');
    c.fillStyle = top; c.fillRect(0, 0, W, 420);
    // gold ridge traced from the real horizon
    c.strokeStyle = 'rgba(255,214,140,.95)'; c.lineWidth = 3; c.shadowColor = 'rgba(255,190,90,.9)'; c.shadowBlur = 14;
    c.beginPath(); RIDGE_PTS.filter(([x]) => x < 1386 || x > 1397).forEach(([x, y], i) => { const X = (x - sx) * W / sw, Y = y * Hc / sh - 6; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke();
    c.shadowBlur = 0;
    // text
    const d = dateIn.value ? fromIso(dateIn.value) : state.date;
    const sunset = sunEvent(d, -0.833);
    c.textAlign = 'center'; c.fillStyle = '#fff';
    c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 24;
    c.font = '600 30px Manrope, sans-serif'; c.letterSpacing = '10px';
    c.fillText('SAVE THE DATE', W / 2 + 5, 150);
    c.letterSpacing = '0px';
    const nm = (names.value.trim() || 'Your names here');
    let fs = 128; c.font = `italic 300 ${fs}px Fraunces, Georgia, serif`;
    while (c.measureText(nm).width > W - 140 && fs > 54) { fs -= 4; c.font = `italic 300 ${fs}px Fraunces, Georgia, serif`; }
    c.fillText(nm, W / 2, 300);
    c.font = '400 54px Fraunces, Georgia, serif';
    c.fillText(fmtDate(d), W / 2, Hc - 250);
    c.font = '600 26px Manrope, sans-serif'; c.letterSpacing = '6px'; c.fillStyle = '#ffe0a8';
    c.fillText('THE OVERLOOK ON SWART HOLLOW', W / 2 + 3, Hc - 180);
    c.letterSpacing = '2px'; c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '500 26px Manrope, sans-serif';
    c.fillText(`Oneonta, New York  ·  sunset ${fmtTime(sunset)}`, W / 2 + 1, Hc - 130);
    c.letterSpacing = '0px'; c.shadowBlur = 0;
  }
  names.addEventListener('input', draw);
  dateIn.addEventListener('change', draw);
  const blob = () => new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
  const fname = () => 'save-the-date-' + (names.value.trim() || 'overlook').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg';
  async function save() { const b = await blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fname(); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  $('#stdSave').addEventListener('click', save);
  $('#stdShare').addEventListener('click', async () => {
    const b = await blob(); const f = new File([b], fname(), { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: 'Save the date' }); } catch (e) {} }
    else save();
  });
  if (!RM) gsap.fromTo('.std__card canvas', { rotate: -9, y: 60, opacity: 0 }, { rotate: -2, y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.std__card', start: 'top 85%' } });
  return { draw, setDate: d => { dateIn.value = isoDate(d); draw(); } };
})();
onDate(d => std.setDate(d));

/* ---------- tour form ---------- */
onDate(d => { $('#tourDate').value = isoDate(d); });
$('#tourForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target; let ok = true;
  ['name', 'email'].forEach(n => { const el = f.elements[n]; const bad = !el.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)); el.classList.toggle('is-bad', bad); if (bad) ok = false; });
  if (!ok) { f.querySelector('.is-bad').focus(); return; }
  const first = f.elements.name.value.trim().split(/\s+/)[0];
  const when = f.elements.date.value ? fromIso(f.elements.date.value) : null;
  $('#thanksTitle').textContent = `Thank you, ${first}.`;
  $('#thanksMsg').textContent = `${OWNER || 'We'} will reply within a day to set up your tour${when ? `. On ${fmtDateShort(when)} the sun sets at ${fmtTime(sunEvent(when, -0.833))}, so come an hour before and you'll see the hill at its best.` : '.'}`;
  gsap.to(f, { opacity: 0, y: -10, duration: 0.4, onComplete: () => {
    f.hidden = true; const t = $('#thanks'); t.hidden = false;
    gsap.from(t.children, { opacity: 0, y: 20, stagger: 0.1, duration: 0.7, ease: 'power3.out' });
    const box = $('#lanterns');
    for (let i = 0; i < 14; i++) {
      const l = document.createElement('i'); l.className = 'lantern'; l.style.left = (8 + Math.random() * 84) + '%'; box.appendChild(l);
      gsap.fromTo(l, { y: 60, opacity: 0, scale: 0.6 + Math.random() * 0.6 }, { y: -320 - Math.random() * 200, x: (Math.random() - 0.5) * 80, opacity: 1, duration: 5 + Math.random() * 3, delay: i * 0.18, ease: 'sine.out', onComplete: () => gsap.to(l, { opacity: 0, duration: 1 }) });
    }
  } });
});

/* nav highlight, created after the pins so their spacing is counted */
$$('.top__nav a').forEach(a => {
  const t = $(a.getAttribute('href'));
  ScrollTrigger.create({ trigger: t, start: 'top 50%', end: 'bottom 50%', onToggle: s => a.classList.toggle('is-here', s.isActive) });
});

/* ---------- go ---------- */
setDate(state.date, true);
addEventListener('load', () => ScrollTrigger.refresh());
})();
