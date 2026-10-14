/* Cloudflare Pages worker for Priya's site (published as _worker.js).
   Serves the static site, the photo library from R2 (binding PHOTOS) and Priya's private studio API
   (guarded by the STUDIO_KEY secret). Without those bindings the site still works from the built-in photos. */

const SEED_CATEGORIES = [
  { id: 'people', label: 'People', hue: 338 },
  { id: 'places', label: 'Places', hue: 196 },
  { id: 'details', label: 'Little things', hue: 42 },
];
const META = 'meta/library.json';
const MAX_BYTES = 12 * 1024 * 1024;
const TYPES = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png' };

const json = (body, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache, 'x-content-type-options': 'nosniff' } });
const text = (value, max) => String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const slug = value => text(value, 40).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/photos' && request.method === 'GET') return json(publicView(await library(env, request), env), 200, 'public, max-age=20');
      if (pathname.startsWith('/img/')) return image(pathname.slice(5), env);
      if (pathname.startsWith('/api/studio/')) return studio(request, env, pathname.slice(12));
    } catch (error) {
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
    // _routes.json sends only /api/* and /img/* here; everything else is served as static files.
    return env.ASSETS.fetch(request);
  },
};

/* The library: categories, photos (newest first) and the call link. Starts from the built-in photos. */
async function library(env, request) {
  const stored = env.PHOTOS && await env.PHOTOS.get(META);
  if (stored) return stored.json();
  const seedUrl = new URL('/gallery-seed.json', request.url);
  const seed = await (await env.ASSETS.fetch(new Request(seedUrl))).json().catch(() => ({ items: [] }));
  const items = (seed.items || []).filter(item => item.category === 'photography').map(item => ({
    id: item.id, url: '/' + String(item.url).replace(/^\.?\//, ''), title: item.title || '', caption: item.caption || '',
    category: SEED_CATEGORIES.some(c => c.id === item.group) ? item.group : 'details', position: item.position || 'center', createdAt: 0,
  }));
  return { categories: SEED_CATEGORIES, items, config: { callUrl: '' } };
}

function publicView(lib, env) {
  return {
    categories: lib.categories,
    items: lib.items.filter(item => !item.hidden).map(({ id, url, thumb, title, caption, category, position, featured, w, h }) => ({ id, url, thumb: thumb || '', title, caption, category, position, featured: !!featured, w, h })),
    config: { callUrl: lib.config?.callUrl || '' },
    studio: !!(env.PHOTOS && env.STUDIO_KEY),
  };
}

async function image(name, env) {
  if (!env.PHOTOS || !/^[a-f0-9-]{36}(-t)?\.(webp|jpg|png)$/.test(name)) return new Response('Not found', { status: 404 });
  const object = await env.PHOTOS.get('img/' + name);
  if (!object) return new Response('Not found', { status: 404 });
  return new Response(object.body, { headers: { 'content-type': TYPES[name.split('.').pop()], 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff', etag: object.httpEtag || '' } });
}

/* Priya's studio. Every call needs the passcode. */
async function studio(request, env, route) {
  if (!env.PHOTOS || !env.STUDIO_KEY) return json({ error: 'setup', message: 'The studio is not switched on yet.' }, 503);
  if (!(await sameKey(request.headers.get('x-studio-key') || '', env.STUDIO_KEY))) return json({ error: 'passcode', message: 'That passcode did not match.' }, 401);
  const lib = await library(env, request);
  const save = async () => { await env.PHOTOS.put(META, JSON.stringify(lib), { httpMetadata: { contentType: 'application/json' } }); return json(lib); };

  if (route === 'library' && request.method === 'GET') return json(lib);

  if (route === 'upload' && request.method === 'POST') {
    const form = await request.formData();
    const full = form.get('file'), thumb = form.get('thumb');
    if (!(full instanceof File) || !TYPES[ext(full.type)] || full.size > MAX_BYTES) return json({ error: 'file', message: 'Please choose a JPEG, PNG or WebP under 12 MB.' }, 400);
    const id = crypto.randomUUID(), kind = ext(full.type);
    await env.PHOTOS.put(`img/${id}.${kind}`, full.stream(), { httpMetadata: { contentType: full.type } });
    let thumbUrl = '';
    if (thumb instanceof File && TYPES[ext(thumb.type)] && thumb.size < MAX_BYTES) {
      await env.PHOTOS.put(`img/${id}-t.${ext(thumb.type)}`, thumb.stream(), { httpMetadata: { contentType: thumb.type } });
      thumbUrl = `/img/${id}-t.${ext(thumb.type)}`;
    }
    const category = lib.categories.some(c => c.id === form.get('category')) ? form.get('category') : lib.categories[0]?.id || '';
    lib.items.unshift({
      id, url: `/img/${id}.${kind}`, thumb: thumbUrl, title: text(form.get('title'), 80), caption: text(form.get('caption'), 400),
      category, position: 'center', w: Number(form.get('w')) || 0, h: Number(form.get('h')) || 0, createdAt: Date.now(), uploaded: true,
    });
    return save();
  }

  const itemMatch = route.match(/^items\/([\w-]{1,64})$/);
  if (itemMatch) {
    const index = lib.items.findIndex(item => item.id === itemMatch[1]);
    if (index < 0) return json({ error: 'missing', message: 'That photo is no longer here.' }, 404);
    const item = lib.items[index];
    if (request.method === 'PATCH') {
      const patch = await request.json();
      if ('title' in patch) item.title = text(patch.title, 80);
      if ('caption' in patch) item.caption = text(patch.caption, 400);
      if ('category' in patch && lib.categories.some(c => c.id === patch.category)) item.category = patch.category;
      if ('featured' in patch) { lib.items.forEach(other => { other.featured = false; }); item.featured = !!patch.featured; }
      if ('hidden' in patch) item.hidden = !!patch.hidden;
      if (Number.isInteger(patch.moveTo)) { lib.items.splice(index, 1); lib.items.splice(Math.max(0, Math.min(lib.items.length, patch.moveTo)), 0, item); }
      return save();
    }
    if (request.method === 'DELETE') {
      lib.items.splice(index, 1);
      if (item.uploaded) await env.PHOTOS.delete([item.url, item.thumb].filter(Boolean).map(url => url.replace(/^\/img\//, 'img/')));
      return save();
    }
  }

  if (route === 'categories' && request.method === 'PUT') {
    const incoming = (await request.json()).categories;
    if (!Array.isArray(incoming) || !incoming.length || incoming.length > 24) return json({ error: 'categories', message: 'Keep between 1 and 24 categories.' }, 400);
    const seen = new Set(), next = [];
    for (const raw of incoming) {
      const label = text(raw.label, 32);
      const id = raw.id && lib.categories.some(c => c.id === raw.id) ? raw.id : slug(label);
      if (!label || !id || seen.has(id)) continue;
      seen.add(id);
      next.push({ id, label, hue: Math.max(0, Math.min(359, Math.round(Number(raw.hue) || 0))) });
    }
    if (!next.length) return json({ error: 'categories', message: 'Each category needs a name.' }, 400);
    lib.categories = next;
    lib.items.forEach(item => { if (!seen.has(item.category)) item.category = next[0].id; });
    return save();
  }

  if (route === 'config' && request.method === 'PUT') {
    const { callUrl } = await request.json();
    const value = text(callUrl, 300);
    if (value && !/^https:\/\/[^\s]+$/.test(value)) return json({ error: 'config', message: 'The booking link should start with https://' }, 400);
    lib.config = { ...lib.config, callUrl: value };
    return save();
  }

  return json({ error: 'route', message: 'Unknown studio action.' }, 404);
}

const ext = type => ({ 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' })[type] || '';

async function sameKey(given, expected) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([given, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0 && given.length > 0;
}
