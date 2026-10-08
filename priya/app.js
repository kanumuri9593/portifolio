(() => {
  'use strict';
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const worlds = {
    kandavalli: { label:'KANDAVALLI / AFTER THE RAIN', role:'PADMAPRIYA JAMPANA / THE MAKER', headline:'A little world<br>of <em>wonder.</em>', intro:'Indian roots. Paint on my hands. A little everyday beauty, made by hand.', handnote:'There’s always room for a little colour.', cta:'Explore my art', href:'#art', note:'A little piece of home.', image:'assets/courtyard.webp', alt:'An imagined Indian courtyard, inspired by Priya’s roots', character:'assets/priya-artist.webp', characterAlt:'Illustrated Priya in her emerald sari with jhumkas, holding a paintbrush and palette', hello:'A little colour?', message:'A little rain. A little nostalgia. A lot of colour.' },
    nyc: { label:'NEW YORK / FOLLOW THE LIGHT', role:'PADMAPRIYA JAMPANA / THE PHOTOGRAPHER', headline:'Chasing light.<br>Keeping <em>stories.</em>', intro:'Portraits, passing light, and people being themselves. My city, through my lens.', handnote:'The little moments are the big ones.', cta:'See my photographs', href:'#photography', note:'The city is my muse.', image:'assets/portrait-dsc06627.webp', alt:'Golden light on a New York street, photographed by Priya', character:'assets/priya-nyc.webp', characterAlt:'Illustrated Priya in a terracotta city coat, jeans and sneakers, holding her camera', hello:'Say cheese', message:'The best moments usually happen in between.' },
    oneonta: { label:'ONEONTA / TAKE THE SCENIC ROUTE', role:'PADMAPRIYA JAMPANA / THE EXPLORER', headline:'The long way.<br>The best <em>views.</em>', intro:'One more trail. One more photograph. Finding wonder a little further from the everyday.', handnote:'My favourite plans come with a detour.', cta:'Wander through my lens', href:'#photography', filter:'places', note:'Taking the scenic route.', image:'assets/autumn.webp', alt:'An illustrated upstate autumn, with rolling hills and maple trees', character:'assets/priya-hike.webp', characterAlt:'Illustrated Priya in an ochre hiking jacket, walking trousers and boots, carrying a backpack and walking stick', hello:'Shall we wander?', message:'One more trail. One more photograph. One more reason to stay.' },
    winter: { label:'AT HOME / A LITTLE SLOWER', role:'PADMAPRIYA JAMPANA / THE HOST', headline:'Good coffee.<br>Better <em>company.</em>', intro:'Something warm from the oven. Another chair at the table. Come for the coffee; stay for the company.', handnote:'Made with a little extra love.', cta:'Pull up a chair', href:'#table', note:'Stay for one more cup.', image:'assets/winter-studio.webp', alt:'An imagined warm creative studio, with a snowy view beyond the window', character:'assets/priya-winter.webp', characterAlt:'Illustrated Priya in a cream knit sweater and cinnamon apron, holding a warm cup of coffee', hello:'Coffee?', message:'Something warm from the oven. A place at the table.' }
  };
  const worldNames=Object.keys(worlds);
  let currentWorld='kandavalli', requestedWorld=currentWorld, transitionId=0, paused=reduced.matches;
  const journey=$('.hero-journey'), hero=$('#hero-stage'), stage=$('.world-stage'), backdrop=$('#world-backdrop');
  const character=$('#hero-character'), copy=$('#world-copy');
  const nextBackdrop=backdrop.cloneNode(false), nextCharacter=character.cloneNode(false);
  nextBackdrop.id='world-backdrop-next';nextCharacter.id='hero-character-next';
  nextBackdrop.classList.remove('is-active');nextCharacter.classList.remove('is-active');
  nextBackdrop.setAttribute('aria-hidden','true');nextCharacter.setAttribute('aria-hidden','true');
  backdrop.after(nextBackdrop);character.after(nextCharacter);
  let activeLayer=0;
  const backdropLayers=[backdrop,nextBackdrop], characterLayers=[character,nextCharacter];
  let toastTimer, copyTimer;
  function toast(text){const t=$('.hello-toast');t.textContent=text;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3300);}
  const decodedImages=new Map();
  function readyImage(src){
    if(!decodedImages.has(src)){
      const image=new Image();image.src=src;
      const ready=image.decode().then(()=>true).catch(()=>{decodedImages.delete(src);return false});
      decodedImages.set(src,ready);
    }
    return decodedImages.get(src);
  }
  async function setWorld(name){
    if(!worlds[name]||name===requestedWorld)return;
    requestedWorld=name;
    const token=++transitionId,w=worlds[name];
    const loaded=await Promise.all([readyImage(w.image),readyImage(w.character)]);
    if(token!==transitionId)return;
    if(loaded.some(ok=>!ok)){requestedWorld=currentWorld;return;}
    const next=1-activeLayer;
    backdropLayers[next].src=w.image;backdropLayers[next].alt=w.alt;
    characterLayers[next].src=w.character;characterLayers[next].alt=w.characterAlt;
    // Decode both rendered layers before making any part of the next chapter visible.
    await Promise.all([backdropLayers[next].decode(),characterLayers[next].decode()]).catch(()=>{});
    if(token!==transitionId)return;
    currentWorld=name;
    document.documentElement.dataset.world=name;
    window.setAtmosphere?.(name);
    const old=activeLayer;activeLayer=next;
    for(const layers of [backdropLayers,characterLayers]){
      layers[old].classList.remove('is-active');layers[old].setAttribute('aria-hidden','true');
      layers[next].classList.add('is-active');layers[next].removeAttribute('aria-hidden');
    }
    $$('.world-switcher [data-world]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.world===name)));
    $('#world-location').textContent=w.label;$('#world-note').textContent=w.note;
    $('#journey-counter').textContent=`${String(worldNames.indexOf(name)+1).padStart(2,'0')} / 04`;
    $('.hero-copy .eyebrow').textContent=w.role;
    $('#hero-title').innerHTML=w.headline; // Fixed, authored content only.
    $('.hero-intro').textContent=w.intro;$('#world-handnote').textContent=w.handnote;
    $('#world-cta .cta-label').textContent=w.cta;$('#world-cta').href=w.href;
    $('.character-hello').replaceChildren(document.createTextNode(w.hello+' '),Object.assign(document.createElement('span'),{textContent:'✶'}));
    clearTimeout(copyTimer);copy.classList.remove('chapter-enter');
    if(!paused&&!reduced.matches){void copy.offsetWidth;copy.classList.add('chapter-enter');copyTimer=setTimeout(()=>copy.classList.remove('chapter-enter'),850);}
  }
  let journeyStart=0,journeyTravel=1,journeyFrame=0,compact=false;
  const shortViewport=matchMedia('(max-height: 620px), (max-width: 600px) and (max-height: 760px)');
  function updateJourney(){
    journeyFrame=0;
    if(compact)return;
    const progress=Math.max(0,Math.min(1,(scrollY-journeyStart)/journeyTravel));
    hero.style.setProperty('--journey-progress',progress.toFixed(4));
    const phase=progress*3,currentIndex=worldNames.indexOf(requestedWorld),candidate=Math.round(phase);
    // A small dead band keeps a resting finger from flickering between chapters.
    if(candidate!==currentIndex&&(phase>currentIndex+.54||phase<currentIndex-.54))setWorld(worldNames[candidate]);
  }
  function scheduleJourney(){if(!journeyFrame)journeyFrame=requestAnimationFrame(updateJourney);}
  function measureJourney(){
    compact=reduced.matches||shortViewport.matches;
    document.documentElement.classList.toggle('journey-compact',compact);
    const headerHeight=$('.site-header').getBoundingClientRect().height;
    const r=journey.getBoundingClientRect();
    journeyStart=r.top+scrollY-headerHeight;
    journeyTravel=Math.max(1,r.height-hero.getBoundingClientRect().height);
    $('.world-switcher>p em').textContent=compact?'Pick a place. Stay a while.':'Scroll through my world.';
    $('.hero-topline>span:first-child').textContent=compact?'FOUR PLACES. ONE CURIOUS HUMAN. PICK A PLACE.':'FOUR PLACES. ONE CURIOUS HUMAN. SCROLL TO EXPLORE.';
    scheduleJourney();
  }
  $$('.world-switcher [data-world]').forEach(b=>b.addEventListener('click',()=>{
    const name=b.dataset.world;
    if(!compact)window.scrollTo({top:Math.max(0,journeyStart+journeyTravel*worldNames.indexOf(name)/3),behavior:'instant'});
    setWorld(name);
    if(compact)hero.style.setProperty('--journey-progress',worldNames.indexOf(name)/3);
  }));
  $('#world-cta').addEventListener('click',()=>{
    const wanted=worlds[currentWorld].href==='#photography'?(worlds[currentWorld].filter||'all'):null;
    if(wanted)$(`.gallery-filters [data-filter="${wanted}"]`)?.click();
  });
  window.addEventListener('scroll',scheduleJourney,{passive:true});
  window.addEventListener('resize',measureJourney,{passive:true});
  window.addEventListener('pageshow',measureJourney);
  new ResizeObserver(measureJourney).observe(journey);
  function updatePause(){
    document.documentElement.classList.toggle('motion-paused',paused);
    $('#motion-toggle').setAttribute('aria-pressed',String(paused));
    $('#motion-toggle').setAttribute('aria-label',paused?'Resume motion':'Pause motion');
    $('.pause-icon').textContent=paused?'▷':'Ⅱ';
    window.dispatchEvent(new CustomEvent('priya:motion',{detail:{paused}}));
  }
  $('#motion-toggle').addEventListener('click',()=>{paused=!paused;updatePause();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;updatePause();measureJourney();});
  updatePause();measureJourney();
  // Prime the next chapter without delaying the opening scene.
  for(const src of new Set(Object.values(worlds).flatMap(w=>[w.image,w.character])))readyImage(src);
  $('.hero-copy .eyebrow').textContent=worlds.kandavalli.role;
  $('.character-hello').firstChild.textContent=worlds.kandavalli.hello+' ';
  setTimeout(() => { $('.character-layer').style.animation = 'none'; }, 1500);
  let pointerFrame = 0, pointerX = 0, pointerY = 0;
  hero.addEventListener('pointermove', e => {
    if (paused || reduced.matches || e.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    pointerX = (e.clientX - rect.left) / rect.width * 2 - 1;
    pointerY = (e.clientY - rect.top) / rect.height * 2 - 1;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => { stage.style.setProperty('--mx', pointerX.toFixed(3)); stage.style.setProperty('--my', pointerY.toFixed(3)); pointerFrame = 0; });
  }, {passive:true});
  hero.addEventListener('pointerleave', () => { stage.style.setProperty('--mx',0); stage.style.setProperty('--my',0); });
  $('.character-hello').addEventListener('click', () => {
    if (currentWorld === 'nyc' && !paused) { $('.character-layer').classList.remove('flash'); requestAnimationFrame(() => $('.character-layer').classList.add('flash')); setTimeout(() => $('.character-layer').classList.remove('flash'), 700); }
    toast(worlds[currentWorld].message);
  });
  $('.menu-button').addEventListener('click', () => { const open = $('.site-header').classList.toggle('menu-open'); $('.menu-button').setAttribute('aria-expanded', String(open)); });
  $$('.site-header nav a').forEach(a => a.addEventListener('click', () => { $('.site-header').classList.remove('menu-open'); $('.menu-button').setAttribute('aria-expanded','false'); }));
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header')){$('.site-header').classList.remove('menu-open');$('.menu-button').setAttribute('aria-expanded','false');}});
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('seen'); reveal.unobserve(entry.target); } }), {threshold:.12});
  $$('.reveal').forEach(el => reveal.observe(el));
  let artVisible = false, scrollFrame = 0;
  new IntersectionObserver(entries => { artVisible = entries[0].isIntersecting; }, {rootMargin:'100px'}).observe($('.art-world'));
  window.addEventListener('scroll', () => {
    if (scrollFrame || paused || reduced.matches || !artVisible) return;
    scrollFrame = requestAnimationFrame(() => { const r = $('.art-world').getBoundingClientRect(); const t = Math.max(-1,Math.min(1,(innerHeight/2-r.top-r.height/2)/innerHeight)); $('.art-scenery').style.transform = `translate3d(0,${t*60}px,0)`; scrollFrame = 0; });
  }, {passive:true});
  let items = [], filter = 'all', expanded = false, lightboxItems = [], lightboxIndex = 0, previousFocus;
  const lightbox = $('#lightbox');
  function closeDialog(dialog) { dialog.close(); }
  function openDialog(dialog) { previousFocus = document.activeElement; dialog.showModal(); document.body.classList.add('modal-open'); }
  $$('dialog').forEach(dialog => {
    $('.dialog-close',dialog).addEventListener('click',() => closeDialog(dialog));
    dialog.addEventListener('close',() => { document.body.classList.remove('modal-open'); previousFocus?.focus(); if(galleryRefreshPending && !document.querySelector('dialog[open]')) {galleryRefreshPending=false;loadGallery();} });
    dialog.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom||dialog===lightbox) closeDialog(dialog); } });
  });
  function showImage() {
    const item = lightboxItems[lightboxIndex]; if (!item) return;
    $('#lightbox-image').src = item.url; $('#lightbox-image').alt = item.alt || item.title;
    $('#lightbox-title').textContent = item.title; $('#lightbox-caption').textContent = item.caption || 'Photograph by Priya Jampana.';
    $('#lightbox-count').textContent = `${String(lightboxIndex+1).padStart(2,'0')} / ${String(lightboxItems.length).padStart(2,'0')}`;
    const source = $('#lightbox-source'); source.hidden = !item.source; if(item.source)source.href = item.source;
    $('.lightbox-prev').hidden = $('.lightbox-next').hidden = lightboxItems.length < 2;
  }
  function openImage(item,list=items.filter(i=>i.category==='photography')) { lightboxItems=list; lightboxIndex=Math.max(0,list.findIndex(i=>i.id===item.id));showImage();openDialog(lightbox); }
  function nextImage(delta){lightboxIndex=(lightboxIndex+delta+lightboxItems.length)%lightboxItems.length;showImage();}
  $('.lightbox-prev').addEventListener('click',()=>nextImage(-1)); $('.lightbox-next').addEventListener('click',()=>nextImage(1));
  lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();nextImage(1)}if(e.key==='ArrowLeft'){e.preventDefault();nextImage(-1)}});
  let touchStartX=0;lightbox.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].clientX},{passive:true});lightbox.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-touchStartX;if(Math.abs(d)>65)nextImage(d<0?1:-1)},{passive:true});
  function photoCard(item,collection){
    const b=document.createElement('button');b.className='photo-card';b.dataset.galleryId=item.id;b.setAttribute('aria-label',`View ${item.title}`);
    const frame=document.createElement('div');frame.className='photo-frame';
    const img=document.createElement('img');img.src=item.url;img.alt=item.alt||item.title;img.loading='lazy';img.decoding='async';if(item.position)img.style.objectPosition=item.position;
    const label=document.createElement('span');label.className='view-label';label.textContent='Take a look';frame.append(img,label);
    const meta=document.createElement('div');meta.className='photo-meta';const title=document.createElement('strong');title.textContent=item.title;const tag=document.createElement('span');tag.textContent=item.tag||'New piece';meta.append(title,tag);b.append(frame,meta);b.addEventListener('click',()=>openImage(item,collection));return b;
  }
  function renderPhotos(){
    const photos=items.filter(i=>i.category==='photography'&&(filter==='all'||i.group===filter));
    const visible=expanded?photos:photos.slice(0,6);
    $('#photo-gallery').replaceChildren(...visible.map(i=>photoCard(i,photos)));
    $('#photo-count').textContent=`${photos.length} little stories`;
    $('#show-more').hidden=photos.length<=6;$('#show-more').textContent=expanded?'A smaller collection −':'A few more favourites +';
  }
  $$('.gallery-filters button').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;expanded=false;$$('.gallery-filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderPhotos();}));
  $('#show-more').addEventListener('click',()=>{expanded=!expanded;renderPhotos();});
  function renderTable(){
    const table=items.filter(i=>i.category==='table');
    $('#table-gallery').replaceChildren(...table.map(item=>{
      const el=document.createElement(item.source?'a':'button');el.className='recipe-card';el.dataset.galleryId=item.id;if(item.source){el.href=item.source;el.target='_blank';el.rel='noopener'}else el.addEventListener('click',()=>openImage(item,table));
      const frame=document.createElement('div');frame.className='recipe-image';const img=document.createElement('img');img.src=item.url;img.alt=item.alt||item.title;img.loading='lazy';frame.append(img);
      const title=document.createElement('h3');title.textContent=item.title;const meta=document.createElement('div');meta.className='recipe-meta';const label=document.createElement('span');label.textContent=item.tag||'From my table';const cta=document.createElement('span');cta.textContent=item.source?'Read the recipe':'Take a look';meta.append(label,cta);el.append(frame,title,meta);return el;
    }));
  }
  function renderArt(){const art=items.filter(i=>i.category==='art');$('#art-gallery').hidden=!art.length;$('#art-gallery').replaceChildren(...art.map(i=>photoCard(i,art)));}
  let galleryRefreshPending=false;
  async function loadGallery(){
    if(document.querySelector('dialog[open]')){galleryRefreshPending=true;return;}
    try{
      const [seed,uploads]=await Promise.all([fetch('gallery-seed.json').then(r=>{if(!r.ok)throw new Error('Gallery unavailable');return r.json()}),fetch('/api/gallery').then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]}))]);
      if(document.querySelector('dialog[open]')){galleryRefreshPending=true;return;}
      const focusedId=document.activeElement?.closest('[data-gallery-id]')?.dataset.galleryId;
      items=[...(uploads.items||[]).map(i=>({...i,group:['people','places','details'].includes(i.group)?i.group:'',tag:'New work'})),...(seed.items||[])];renderPhotos();renderTable();renderArt();
      if(focusedId) [...document.querySelectorAll('[data-gallery-id]')].find(el=>el.dataset.galleryId===focusedId)?.focus({preventScroll:true});
      $$('.floating-print').forEach((b,index)=>b.onclick=()=>{const id=index?'citylight':'bridge';const i=items.find(x=>x.id===id);if(i)openImage(i);});
    }catch(e){$('#photo-gallery').replaceChildren(Object.assign(document.createElement('p'),{textContent:'The collection could not load. Please refresh, or visit Shine with Shutter.'}));console.error(e);}
  }
  loadGallery();window.addEventListener('focus',()=>loadGallery());
  const enquiry=$('#enquiry-dialog'), form=$('#enquiry-form');
  $$('[data-enquire]').forEach(b=>b.addEventListener('click',()=>{$('#enquiry-type').value=b.dataset.enquire;$('#enquiry-ready').hidden=true;form.hidden=false;openDialog(enquiry);}));
  form.addEventListener('submit',e=>{e.preventDefault();const name=$('#enquiry-name').value.trim(),type=$('#enquiry-type').value,place=$('#enquiry-place').value.trim(),idea=$('#enquiry-message').value.trim();const message=`Hi Priya! I’m ${name}. I found your portfolio and would love to talk about ${type.toLowerCase()}.\n\n${place?'Place / date: '+place+'\n\n':''}${idea}\n\nLooking forward to connecting!`;$('#prepared-message').value=message;form.hidden=true;$('#enquiry-ready').hidden=false;$('#copy-status').textContent='';$('#copy-message').textContent='Copy message';const mail=$('#email-message');if(mail)mail.href='mailto:priyajampana.portraits@gmail.com?subject='+encodeURIComponent('An enquiry: '+type)+'&body='+encodeURIComponent(message);$('#copy-message').focus();});
  $('#copy-message').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#prepared-message').value);$('#copy-message').textContent='Copied';$('#copy-status').textContent='Ready to paste into your Instagram message.'}catch{const t=$('#prepared-message');t.focus();t.select();$('#copy-status').textContent='Select and copy the message above.'}});
  $('#year').textContent=new Date().getFullYear();
})();
