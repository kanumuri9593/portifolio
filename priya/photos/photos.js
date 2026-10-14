/* Shine with Shutter: Priya's photo page. Data comes from /api/photos (her studio library),
   falling back to the built-in collection when the studio isn't switched on. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EMAIL = 'priyajampana.portraits@gmail.com';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* Aperture blades: N twisted half-planes around an opening of radius r. */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function blades(group, n = 6, twist = .5, reach = 200) {
    group.replaceChildren(...Array.from({ length: n }, () => document.createElementNS(SVGNS, 'path')));
    return r => {
      [...group.children].forEach((path, i) => {
        const a = i / n * Math.PI * 2, t = a + twist;
        const px = Math.cos(a) * r, py = Math.sin(a) * r, dx = -Math.sin(t) * reach, dy = Math.cos(t) * reach, nx = Math.cos(t) * reach, ny = Math.sin(t) * reach;
        path.setAttribute('d', `M${px - dx} ${py - dy}L${px + dx} ${py + dy}L${px + dx + nx} ${py + dy + ny}L${px - dx + nx} ${py - dy + ny}Z`);
      });
    };
  }
  document.querySelectorAll('.mark svg, .fab svg').forEach((svg, k) => {
    const id = 'clip' + k, clip = document.createElementNS(SVGNS, 'clipPath'), c = document.createElementNS(SVGNS, 'circle');
    clip.id = id; c.setAttribute('r', 46); clip.append(c); svg.prepend(clip);
    const g = svg.querySelector('.blades'); g.setAttribute('clip-path', `url(#${id})`);
    blades(g, 6, .55, 60)(17);
  });
  const OPEN = 80;
  const tween = (draw, from, to, ms, ease = t => 1 - Math.pow(1 - t, 3)) => new Promise(done => {
    if (reduced) { draw(to); return done(); }
    const start = performance.now();
    const step = now => { const t = Math.min(1, (now - start) / ms); draw(from + (to - from) * ease(t)); t < 1 ? requestAnimationFrame(step) : done(); };
    requestAnimationFrame(step);
  });
  const irisGroup = $('.iris-blades'), iris = blades(irisGroup, 7, .62);
  const shutterGroup = $('.shutter-blades'), shutterDraw = blades(shutterGroup, 7, .62), shutter = $('.shutter');
  const spin = (g, r) => g.setAttribute('transform', `rotate(${(1 - r / OPEN) * 50})`);
  iris(0);

  /* Data */
  let lib = { categories: [], items: [], config: {} }, active = 'all', list = [];
  async function load() {
    try {
      const res = await fetch('/api/photos', { headers: { accept: 'application/json' } });
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) return await res.json();
    } catch {}
    const seed = await (await fetch('../gallery-seed.json')).json();
    const categories = [{ id: 'people', label: 'People', hue: 338 }, { id: 'places', label: 'Places', hue: 196 }, { id: 'details', label: 'Little things', hue: 42 }];
    return { categories, config: {}, items: seed.items.filter(i => i.category === 'photography').map(i => ({ ...i, url: '../' + i.url.replace(/^\.?\//, ''), category: categories.some(c => c.id === i.group) ? i.group : 'details' })) };
  }
  const src = (item, small) => {
    const url = small && item.thumb ? item.thumb : item.url;
    return url.startsWith('/') && location.protocol === 'file:' ? '..' + url : url;
  };
  const cat = id => lib.categories.find(c => c.id === id) || { label: '', hue: 42 };

  /* Chips */
  const chips = $('#chips');
  const light = Object.assign(document.createElement('span'), { className: 'chip-light' });
  function renderChips() {
    const counts = lib.items.reduce((m, i) => (m[i.category] = (m[i.category] || 0) + 1, m), {});
    const all = [{ id: 'all', label: 'All', hue: 42 }, ...lib.categories.filter(c => counts[c.id])];
    chips.innerHTML = all.map(c => `<button class="chip" role="tab" data-cat="${esc(c.id)}" style="--h:${c.hue}" aria-selected="${c.id === active}"><i></i>${esc(c.label)}<small>${c.id === 'all' ? lib.items.length : counts[c.id]}</small></button>`).join('');
    chips.prepend(light);
    placeLight(false);
  }
  function placeLight(animate = true) {
    const on = chips.querySelector(`[data-cat="${CSS.escape(active)}"]`) || chips.querySelector('.chip');
    if (!on) return;
    light.style.transition = animate ? '' : 'none';
    light.style.left = on.offsetLeft + 'px'; light.style.width = on.offsetWidth + 'px';
    root.style.setProperty('--hue', active === 'all' ? 42 : cat(active).hue);
    if (animate) on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }
  chips.addEventListener('click', async e => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.dataset.cat === active) return;
    navigator.vibrate?.(8);
    active = chip.dataset.cat;
    chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-selected', c === chip));
    placeLight();
    history.replaceState(null, '', active === 'all' ? location.pathname : '#' + active);
    // Close the shutter, swap the sheet, open again.
    shutter.classList.add('on');
    await tween(r => { shutterDraw(r); spin(shutterGroup, r); }, OPEN, 0, 260, t => t * t);
    renderGrid();
    const top = $('.chips').getBoundingClientRect().top + scrollY - 64;
    if (scrollY > top) scrollTo({ top, behavior: 'instant' });
    await tween(r => { shutterDraw(r); spin(shutterGroup, r); }, 0, OPEN, 520);
    shutter.classList.remove('on');
  });

  /* Grid with a darkroom "develop" as each photo comes into view */
  const grid = $('#grid');
  const develop = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const tile = e.target, img = tile.querySelector('img');
    const go = () => setTimeout(() => tile.classList.add('dev'), 80);
    img.complete ? go() : img.addEventListener('load', go, { once: true });
    develop.unobserve(tile);
  }), { threshold: .25 });
  function renderGrid() {
    list = active === 'all' ? lib.items : lib.items.filter(i => i.category === active);
    grid.innerHTML = list.map((item, i) => `<button class="tile" type="button" data-i="${i}" style="--n:${Math.min(i, 8)}">
      <span class="frame"><img src="${esc(src(item, true))}" alt="${esc(item.title || 'Photograph by Priya')}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" style="object-position:${esc(item.position || 'center')}"></span>
      <span class="meta"><b>${esc(item.title)}</b><span>${esc(cat(item.category).label)}</span></span></button>`).join('');
    $('#empty').hidden = list.length > 0;
    grid.querySelectorAll('.tile').forEach(t => develop.observe(t));
  }
  grid.addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) openLightbox(+t.dataset.i); });

  /* Lightbox: swipe sideways for the next frame, pull down to close */
  const lb = $('#lightbox'), stage = $('#lb-stage'), img = $('#lb-img'), strip = $('#strip');
  let at = 0;
  function show(i, dir = 0) {
    at = (i + list.length) % list.length;
    const item = list[at];
    img.src = src(item); img.alt = item.title || 'Photograph by Priya';
    $('#lb-title').textContent = item.title; $('#lb-caption').textContent = item.caption || '';
    $('#lb-cat').textContent = cat(item.category).label; $('#lb-count').textContent = `${String(at + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    root.style.setProperty('--hue', cat(item.category).hue);
    strip.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', k === at));
    strip.children[at]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    if (dir && !reduced) img.animate([{ transform: `translateX(${dir * 60}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.22,.72,.12,1)' });
    [1, -1].forEach(d => { const n = list[(at + d + list.length) % list.length]; if (n) new Image().src = src(n); });
  }
  function openLightbox(i) {
    strip.innerHTML = list.map((item, k) => `<button type="button" data-k="${k}" aria-label="${esc(item.title || 'Photograph')}"><img src="${esc(src(item, true))}" alt="" loading="lazy"></button>`).join('');
    lb.showModal(); document.body.style.overflow = 'hidden';
    show(i);
  }
  const closeLb = () => { lb.close(); document.body.style.overflow = ''; root.style.setProperty('--hue', active === 'all' ? 42 : cat(active).hue); };
  $('#lb-close').onclick = closeLb;
  lb.addEventListener('cancel', e => { e.preventDefault(); closeLb(); });
  $('#lb-prev').onclick = () => show(at - 1, -1);
  $('#lb-next-btn').onclick = () => show(at + 1, 1);
  strip.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.k, +b.dataset.k > at ? 1 : -1); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(at + 1, 1); if (e.key === 'ArrowLeft') show(at - 1, -1); });
  let drag = null;
  stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; stage.setPointerCapture(e.pointerId); img.style.transition = 'none'; });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = Math.max(0, e.clientY - drag.y), down = dy > Math.abs(dx);
    img.style.transform = down ? `translateY(${dy}px) scale(${1 - Math.min(.25, dy / 1200)})` : `translateX(${dx}px) rotate(${dx / 40}deg)`;
    lb.style.background = down ? `rgba(11,9,8,${1 - Math.min(.7, dy / 400)})` : '';
  });
  stage.addEventListener('pointerup', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = null;
    img.style.transition = 'transform .35s cubic-bezier(.22,.72,.12,1)'; img.style.transform = ''; lb.style.background = '';
    if (dy > 110 && dy > Math.abs(dx)) closeLb();
    else if (Math.abs(dx) > 60) { navigator.vibrate?.(6); show(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }
  });
  stage.addEventListener('pointercancel', () => { drag = null; img.style.transform = ''; lb.style.background = ''; });

  /* Let's chat: her booking page when she has one, otherwise a two-tap request by email */
  const chat = $('#chat'), form = $('#chat-form');
  function openChat() {
    const url = lib.config?.callUrl;
    $('#chat-book').innerHTML = url ? `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Pick a time on my calendar <span aria-hidden="true">✳</span></a>` : '';
    form.hidden = !!url;
    chat.showModal(); document.body.style.overflow = 'hidden';
  }
  const closeChat = () => { chat.close(); document.body.style.overflow = ''; };
  document.querySelectorAll('[data-chat]').forEach(b => b.addEventListener('click', openChat));
  $('#chat-close').onclick = closeChat;
  chat.addEventListener('click', e => { if (e.target === chat) closeChat(); });
  chat.addEventListener('cancel', e => { e.preventDefault(); closeChat(); });
  const days = $('#days'), fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  days.innerHTML = Array.from({ length: 10 }, (_, k) => { const d = new Date(Date.now() + (k + 1) * 864e5);
    return `<label><input type="radio" name="day" value="${d.toDateString()}"${k ? '' : ' checked'}><span>${fmt.format(d)}<b>${d.getDate()}</b></span></label>`; }).join('');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const body = `Hi Priya,\n\nI'd love a quick call.\n\nWhen: ${f.get('day')}, ${f.get('slot')}\nAbout: ${f.get('idea') || 'Just saying hello'}\n\n${f.get('name')}`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Let's chat · ${f.get('name')}`)}&body=${encodeURIComponent(body)}`;
  });

  /* Chrome that reacts to scrolling */
  const bar = $('.bar'), fab = $('.fab'), outroBtn = $('.outro .btn');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    bar.classList.toggle('solid', scrollY > 40);
    fab.classList.toggle('tuck', scrollY > lastY && scrollY > 200);
    const r = outroBtn.getBoundingClientRect();
    fab.classList.toggle('hide', r.top < innerHeight && r.bottom > 0);
    lastY = scrollY;
  }, { passive: true });
  addEventListener('resize', () => placeLight(false));
  document.fonts?.ready.then(() => placeLight(false));

  /* Start: open the iris on the featured photograph */
  load().then(data => {
    lib = { categories: data.categories || [], items: data.items || [], config: data.config || {} };
    const want = location.hash.slice(1);
    if (lib.categories.some(c => c.id === want)) active = want;
    $('#count').textContent = String(lib.items.length).padStart(2, '0');
    $('#cats').textContent = lib.categories.filter(c => lib.items.some(i => i.category === c.id)).length;
    renderChips(); renderGrid();
    const hero = lib.items.find(i => i.featured) || lib.items.find(i => i.id === 'bridge') || lib.items[0];
    const photo = $('.lens-photo');
    const open = () => { root.classList.add('ready'); tween(r => { iris(r); spin(irisGroup, r); }, 0, OPEN, 1400); };
    if (!hero) return open();
    photo.style.objectPosition = hero.position || 'center';
    photo.src = src(hero);
    photo.decode().then(open, open);
  });
})();
