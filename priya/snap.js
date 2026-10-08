/* Seasons that stop: on touch screens a quick swipe through the hero journey halts at every season
   (scroll-snap with snap-stop), so every visitor sees Kandavalli, New York, Oneonta and At home.
   Snapping is switched on only while the page is inside the journey, so the rest of the site scrolls freely. */
(()=>{
  const root=document.documentElement,journey=document.querySelector('.hero-journey');
  if(!journey||!matchMedia('(pointer: coarse)').matches)return;
  const marks=[0,1,2,3].map(i=>{const m=document.createElement('i');m.className='season-stop';m.setAttribute('aria-hidden','true');journey.prepend(m);return m;});
  let end=0;
  function place(){
    if(root.classList.contains('journey-compact')){root.classList.remove('snap-seasons');marks.forEach(m=>m.hidden=true);end=-1;return;}
    const header=parseFloat(getComputedStyle(root).getPropertyValue('--header-height'))||72;
    const travel=journey.offsetHeight-(innerHeight-header);
    end=journey.getBoundingClientRect().top+scrollY-header+travel;
    marks.forEach((m,i)=>{m.hidden=false;m.style.top=(travel*i/3)+'px';});
    toggle();
  }
  function toggle(){root.classList.toggle('snap-seasons',end>0&&scrollY<end-2);}
  addEventListener('scroll',toggle,{passive:true});
  addEventListener('resize',place,{passive:true});addEventListener('pageshow',place);
  new ResizeObserver(place).observe(journey);place();
})();
