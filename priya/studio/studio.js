/* Priya's studio: add photographs from her phone, set or create categories, arrange the page, set the call link. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const HUES = [338, 18, 42, 96, 160, 196, 230, 275];
  const NEW = '__new__';
  let key = '', lib = null;
  try { key = localStorage.getItem('studio-key') || ''; } catch {}

  const toast = (text, ms = 2200) => { const t = $('#toast'); t.textContent = text; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms); };
  async function api(path, options = {}) {
    const res = await fetch('/api/studio/' + path, { ...options, headers: { 'x-studio-key': key, ...(options.body && !(options.body instanceof FormData) ? { 'content-type': 'application/json' } : {}), ...options.headers } });
    const data = await res.json().catch(() => ({ message: 'The studio could not be reached.' }));
    if (!res.ok) throw Object.assign(new Error(data.message || 'Something went wrong.'), { code: data.error, status: res.status });
    return data;
  }

  /* Passcode gate */
  async function enter() {
    try {
      lib = await api('library');
      try { localStorage.setItem('studio-key', key); } catch {}
      $('#gate').hidden = true; $('#app').hidden = false;
      render();
    } catch (error) {
      $('#gate').hidden = false; $('#app').hidden = true;
      $('#gate-msg').textContent = error.code === 'setup' ? 'The studio isn’t switched on yet. Varma needs to finish the one-time setup.' : key ? error.message : '';
    }
  }
  $('#gate-form').addEventListener('submit', e => { e.preventDefault(); key = $('#key').value.trim(); enter(); });
  $('#sign-out').onclick = () => { try { localStorage.removeItem('studio-key'); } catch {} location.reload(); };

  /* Tabs */
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
    document.querySelectorAll('.tabs button').forEach(o => o === b ? o.setAttribute('aria-current', 'page') : o.removeAttribute('aria-current'));
    document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== 'panel-' + b.dataset.tab);
    if (b.dataset.tab === 'cats') renderCats();
    scrollTo({ top: 0 });
  });

  const catOptions = (selected, withNew = true) => lib.categories.map(c => `<option value="${esc(c.id)}"${c.id === selected ? ' selected' : ''}>${esc(c.label)}</option>`).join('') + (withNew ? `<option value="${NEW}">+ New category…</option>` : '');
  const hueOf = id => (lib.categories.find(c => c.id === id) || {}).hue ?? 42;
  // Choosing "+ New category…" in any picker asks for a name and creates it straight away.
  async function maybeNewCategory(select, fallback) {
    if (select.value !== NEW) return;
    const label = (prompt('Name the new category') || '').trim();
    if (!label) { select.value = fallback || lib.categories[0].id; return; }
    const categories = [...lib.categories, { label, hue: HUES[lib.categories.length % HUES.length] }];
    try {
      lib = await api('categories', { method: 'PUT', body: JSON.stringify({ categories }) });
      const made = lib.categories[lib.categories.length - 1];
      document.querySelectorAll('select.cat-select').forEach(s => { const v = s === select ? made.id : s.value; s.innerHTML = catOptions(v); });
      renderFilter(); toast(`“${made.label}” added`);
    } catch (error) { toast(error.message); select.value = fallback || lib.categories[0].id; }
  }
  document.addEventListener('focusin', e => { if (e.target.matches('select.cat-select')) e.target.dataset.prev = e.target.value; });
  document.addEventListener('change', e => { if (e.target.matches('select.cat-select')) maybeNewCategory(e.target, e.target.dataset.prev); });

  /* Library */
  function renderFilter() {
    const f = $('#filter'), v = f.value || 'all';
    f.innerHTML = `<option value="all">All</option>` + catOptions(v, false);
    f.value = [...f.options].some(o => o.value === v) ? v : 'all';
  }
  $('#filter').onchange = () => renderLibrary();
  function render() { renderFilter(); renderLibrary(); $('#call-url').value = lib.config?.callUrl || ''; }
  function renderLibrary() {
    const f = $('#filter').value || 'all';
    const items = lib.items.filter(i => f === 'all' || i.category === f);
    $('#lib-count').textContent = `${lib.items.filter(i => !i.hidden).length} showing`;
    $('#library').innerHTML = items.map(i => {
      const c = lib.categories.find(c => c.id === i.category) || {};
      return `<button class="lib${i.hidden ? ' hidden' : ''}" type="button" data-id="${esc(i.id)}"><img src="${esc(i.thumb || i.url)}" alt="${esc(i.title)}" loading="lazy" style="object-position:${esc(i.position || 'center')}">${i.featured ? '<span class="star">Cover</span>' : ''}<span class="dot"><i style="background:hsl(${c.hue ?? 42} 85% 55%)"></i>${esc(c.label || '')}</span></button>`;
    }).join('') || '<p class="hint">No photographs in this category yet.</p>';
  }
  $('#library').addEventListener('click', e => { const b = e.target.closest('.lib'); if (b) openEdit(b.dataset.id); });

  /* Edit sheet */
  const edit = $('#edit'), form = $('#edit-form');
  let editing = null;
  function openEdit(id) {
    editing = lib.items.find(i => i.id === id);
    if (!editing) return;
    $('#edit-img').src = editing.url;
    form.title.value = editing.title || ''; form.caption.value = editing.caption || '';
    form.category.innerHTML = catOptions(editing.category);
    form.featured.checked = !!editing.featured; form.hidden.checked = !!editing.hidden;
    edit.showModal();
  }
  $('#edit-close').onclick = () => edit.close();
  edit.addEventListener('click', e => { if (e.target === edit) edit.close(); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.category.value === NEW) return;
    const patch = { title: form.title.value, caption: form.caption.value, category: form.category.value, hidden: form.hidden.checked };
    if (form.featured.checked !== !!editing.featured) patch.featured = form.featured.checked;
    try { lib = await api('items/' + encodeURIComponent(editing.id), { method: 'PATCH', body: JSON.stringify(patch) }); edit.close(); renderLibrary(); toast('Saved'); }
    catch (error) { toast(error.message); }
  });
  $('#delete').onclick = async () => {
    if (!confirm('Remove this photograph from your page?')) return;
    try { lib = await api('items/' + encodeURIComponent(editing.id), { method: 'DELETE' }); edit.close(); renderLibrary(); toast('Removed'); }
    catch (error) { toast(error.message); }
  };

  /* Uploads: resized on the phone, then sent one by one with progress */
  async function resize(file, max, quality) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) });
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/webp', quality));
    const out = blob && blob.type === 'image/webp' ? blob : await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
    return { blob: out, w: canvas.width, h: canvas.height };
  }
  const queue = $('#queue');
  let pending = [];
  $('#files').addEventListener('change', e => {
    const last = $('#filter').value !== 'all' ? $('#filter').value : lib.categories[0].id;
    for (const file of e.target.files) {
      if (!file.type.startsWith('image/')) continue;
      const entry = { file, url: URL.createObjectURL(file) };
      const el = document.createElement('div'); el.className = 'q';
      el.innerHTML = `<img src="${entry.url}" alt=""><div class="fields"><input placeholder="Title (optional)" maxlength="80" class="t"><select class="cat-select">${catOptions(last)}</select><button type="button" class="rm">Remove</button></div><div class="bar"><i></i></div>`;
      el.querySelector('.rm').onclick = () => { pending = pending.filter(p => p !== entry); el.remove(); syncQueue(); };
      entry.el = el; pending.push(entry); queue.append(el);
    }
    e.target.value = '';
    syncQueue();
  });
  const go = Object.assign(document.createElement('button'), { className: 'btn', type: 'button' });
  function syncQueue() {
    if (pending.length) { go.textContent = `Upload ${pending.length} photograph${pending.length > 1 ? 's' : ''}`; queue.append(go); } else go.remove();
  }
  function send(form, bar) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('POST', '/api/studio/upload'); x.setRequestHeader('x-studio-key', key);
      x.upload.onprogress = e => { if (e.lengthComputable) bar.style.width = (e.loaded / e.total * 100) + '%'; };
      x.onload = () => { let data = {}; try { data = JSON.parse(x.responseText); } catch {}
        x.status < 300 ? resolve(data) : reject(new Error(data.message || 'Upload failed.')); };
      x.onerror = () => reject(new Error('Upload failed. Check your connection.'));
      x.send(form);
    });
  }
  go.onclick = async () => {
    go.disabled = true;
    let done = 0;
    for (const entry of [...pending]) {
      const el = entry.el, bar = el.querySelector('.bar i'), category = el.querySelector('select').value;
      if (category === NEW) continue;
      try {
        go.textContent = `Preparing ${done + 1} of ${pending.length}…`;
        const [full, thumb] = await Promise.all([resize(entry.file, 2400, .86), resize(entry.file, 720, .8)]);
        const data = new FormData();
        data.append('file', full.blob, 'photo'); data.append('thumb', thumb.blob, 'thumb');
        data.append('title', el.querySelector('.t').value); data.append('category', category);
        data.append('w', full.w); data.append('h', full.h);
        go.textContent = `Uploading ${done + 1} of ${pending.length}…`;
        lib = await send(data, bar);
        el.classList.add('done'); done++;
        pending = pending.filter(p => p !== entry);
        setTimeout(() => el.remove(), 900);
      } catch (error) { toast(error.message, 4000); break; }
    }
    go.disabled = false; syncQueue(); renderLibrary();
    if (done) toast(`${done} photograph${done > 1 ? 's' : ''} added to your page ✳`);
  };

  /* Categories */
  let draft = [];
  function renderCats() {
    draft = lib.categories.map(c => ({ ...c }));
    drawCats();
  }
  function drawCats() {
    const counts = lib.items.reduce((m, i) => (m[i.category] = (m[i.category] || 0) + 1, m), {});
    $('#cats').innerHTML = draft.map((c, i) => `<div class="cat" data-i="${i}">
      <button type="button" class="hue" style="background:hsl(${c.hue} 85% 55%)" aria-label="Change colour"></button>
      <input value="${esc(c.label)}" maxlength="32" aria-label="Category name">
      <button type="button" class="up" aria-label="Move up">↑</button><button type="button" class="down" aria-label="Move down">↓</button><button type="button" class="del" aria-label="Remove category">✕</button>
      <small>${counts[c.id] || 0} photographs</small></div>`).join('');
  }
  $('#cats').addEventListener('input', e => { const row = e.target.closest('.cat'); if (row) draft[row.dataset.i].label = e.target.value; });
  $('#cats').addEventListener('click', e => {
    const row = e.target.closest('.cat'); if (!row) return;
    const i = +row.dataset.i, b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('hue')) draft[i].hue = HUES[(HUES.indexOf(draft[i].hue) + 1) % HUES.length];
    if (b.classList.contains('up') && i > 0) [draft[i - 1], draft[i]] = [draft[i], draft[i - 1]];
    if (b.classList.contains('down') && i < draft.length - 1) [draft[i + 1], draft[i]] = [draft[i], draft[i + 1]];
    if (b.classList.contains('del')) { if (draft.length === 1) return toast('Keep at least one category'); draft.splice(i, 1); }
    drawCats();
  });
  $('#add-cat').onclick = () => { draft.push({ label: '', hue: HUES[draft.length % HUES.length] }); drawCats(); $('#cats .cat:last-child input').focus(); };
  $('#save-cats').onclick = async () => {
    try { lib = await api('categories', { method: 'PUT', body: JSON.stringify({ categories: draft.filter(c => c.label.trim()) }) }); renderCats(); render(); toast('Categories saved'); }
    catch (error) { toast(error.message); }
  };

  /* Call link */
  $('#save-call').onclick = async () => {
    try { lib = await api('config', { method: 'PUT', body: JSON.stringify({ callUrl: $('#call-url').value.trim() }) }); toast($('#call-url').value.trim() ? 'Booking link saved' : 'Visitors will email a request'); }
    catch (error) { toast(error.message); }
  };

  if (key) enter(); else $('#key').focus();
})();
