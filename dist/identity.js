(() => {
 const stage=document.querySelector('.id-stage');if(!stage)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 let tx=0,ty=0,x=0,y=0,raf=0;
 function paint(){x+=(tx-x)*.1;y+=(ty-y)*.1;stage.style.setProperty('--portrait-dx',`${x*13}px`);stage.style.setProperty('--portrait-dy',`${y*8}px`);stage.style.setProperty('--portrait-rx',`${-y*3}deg`);stage.style.setProperty('--portrait-ry',`${x*5}deg`);stage.style.setProperty('--portrait-x',`${50+x*27}%`);stage.style.setProperty('--portrait-y',`${38+y*22}%`);if(Math.abs(tx-x)+Math.abs(ty-y)>.001)raf=requestAnimationFrame(paint);else raf=0}
 function aim(a,b){if(reduce.matches)return;tx=a;ty=b;if(!raf)raf=requestAnimationFrame(paint)}
 stage.addEventListener('pointermove',e=>{if(!fine.matches)return;const r=stage.getBoundingClientRect();aim((e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1)});
 stage.addEventListener('pointerleave',()=>aim(0,0));stage.addEventListener('focus',()=>aim(.4,-.2));stage.addEventListener('blur',()=>aim(0,0));reduce.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;tx=ty=x=y=0;stage.removeAttribute('style')});
})();
