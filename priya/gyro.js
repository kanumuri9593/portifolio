/* Tilt-to-look: on phones, the hero scene gains depth as the phone moves, and Priya turns toward you.
   Drives the same --mx/--my variables the desktop pointer parallax uses, plus a figure turn. */
(()=>{
  const root=document.documentElement;
  const stage=document.querySelector('.world-stage');
  const touch=matchMedia('(hover: none) and (pointer: coarse)').matches;
  if(!stage||!touch||!('DeviceOrientationEvent' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let base=null,tx=0,ty=0,x=0,y=0,raf=0,live=false;
  const clamp=v=>Math.max(-1,Math.min(1,v));
  function onTilt(e){
    if(e.gamma==null)return;
    if(!base)base={b:e.beta,g:e.gamma};
    tx=clamp((e.gamma-base.g)/22);ty=clamp((e.beta-base.b)/22);
    if(!live){live=true;root.classList.add('tilt-live');}
    if(!raf)raf=requestAnimationFrame(tick);
  }
  function tick(){
    raf=0;
    if(root.classList.contains('motion-paused')){tx=ty=0;}
    x+=(tx-x)*.12;y+=(ty-y)*.12;
    stage.style.setProperty('--mx',x.toFixed(3));stage.style.setProperty('--my',y.toFixed(3));
    stage.style.setProperty('--tilt-x',x.toFixed(3));stage.style.setProperty('--tilt-y',y.toFixed(3));
    dispatchEvent(new CustomEvent('priya-tilt',{detail:{x,y}}));
    if(Math.abs(tx-x)>.002||Math.abs(ty-y)>.002)raf=requestAnimationFrame(tick);
  }
  // Re-centre when the phone settles into a new resting angle (e.g. sitting down).
  setInterval(()=>{if(base&&Math.abs(tx)>.95)base.g+=Math.sign(tx)*4;if(base&&Math.abs(ty)>.95)base.b+=Math.sign(ty)*4;},400);
  const start=()=>addEventListener('deviceorientation',onTilt,{passive:true});
  if(typeof DeviceOrientationEvent.requestPermission==='function'){
    // iOS only allows motion access after a tap. Ask on the first tap anywhere, with no label over the scene.
    const ask=()=>{removeEventListener('click',ask,true);
      DeviceOrientationEvent.requestPermission().then(s=>{if(s==='granted')start();}).catch(()=>{});};
    addEventListener('click',ask,true);
  }else start();
})();
