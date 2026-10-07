(() => {
 const strip=document.querySelector('.journal-strip');if(!strip)return;
 let down=false,start=0,left=0,moved=false;
 strip.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;down=true;moved=false;start=e.clientX;left=strip.scrollLeft});
 strip.addEventListener('pointermove',e=>{if(!down)return;const d=e.clientX-start;if(Math.abs(d)>6){moved=true;strip.scrollLeft=left-d;strip.style.scrollSnapType='none';strip.style.cursor='grabbing';}});
 function release(){down=false;strip.style.cursor='';strip.style.scrollSnapType=''}
 addEventListener('pointerup',release);strip.addEventListener('pointerleave',release);
 strip.addEventListener('click',e=>{if(moved){e.preventDefault();moved=false}},true);
 strip.addEventListener('dragstart',e=>e.preventDefault());
})();
