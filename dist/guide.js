(() => {
  const guide=document.querySelector('.little-guide'),canvas=document.querySelector('#guide-canvas'),next=document.querySelector('#guide-next'),restore=document.querySelector('.guide-restore');
  if(!guide||!canvas||!next||!restore)return;
  // Load scoped styles without changing the main thread's page markup.
  const css=document.createElement('link');css.rel='stylesheet';css.href='guide.css?v=companion10';document.head.append(css);
  const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const steps=[['about','Meet the person',0],['baton','Meet Baton',0],['work','Inside the studio',1],['mista','The Mista Eats story',0],['workshop','Into the workshop',1],['practice','Inside the practice',0],['experience','The professional story',0],['stack','Open the toolbox',0],['endurance','Beyond the screen',3],['miles','Follow the milestones',2],['journal','The photo journal',4],['writing','Read the field notes',1],['contact','Say hello',0]];
  const colors=['#c9633d','#aa7c3c','#5b8790','#5293a0','#829bb6'];
  let hidden=false,paused=reduced.matches,t=0,last=0,chapter=-1,enabled=false,activity=0,previous=0,transition=1,dirty=true,raf=0,scrollQueued=false;
  canvas.width=480;canvas.height=480;
  const sheets=['run-ironman','hike-ironman','bike-ironman','swim-ironman','snow-ironman'].map(n=>{const img=new Image();img.onload=()=>{dirty=true;wake()};img.src=`assets/${n}-sheet.webp`;return img});
  function wake(){if(!raf&&enabled&&!document.hidden)raf=requestAnimationFrame(frame)}
  function observe(){
    const marker=innerHeight*.43;let found=-1;
    steps.forEach(([id],i)=>{const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=marker)found=i});
    enabled=found>=0&&found<steps.length-1&&!hidden;
    guide.classList.toggle('is-active',enabled);guide.inert=!enabled;
    restore.hidden=!hidden||found<0||found===steps.length-1;
    if(found!==chapter){
      chapter=found;
      if(found>=0){
        previous=activity;activity=steps[found][2];transition=paused||reduced.matches?1:0;
        const target=steps[Math.min(found+1,steps.length-1)];next.href='#'+target[0];next.textContent=target[1]+'';next.setAttribute('aria-label','Continue to '+target[1]);guide.style.setProperty('--guide-accent',colors[activity]);
      }
      dirty=true;
    }
    if(enabled){dirty=true;wake()}else if(raf){cancelAnimationFrame(raf);raf=0;last=0}
  }
  document.querySelector('#guide-hide').addEventListener('click',()=>{hidden=true;observe();restore.focus()});
  restore.addEventListener('click',()=>{hidden=false;observe();next.focus()});
  next.addEventListener('click',()=>{
    if(reduced.matches||paused)return;
    const destination=document.getElementById(next.hash.slice(1));
    const heading=destination?.querySelector('h2');
    heading?.animate([{opacity:.55,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:220,easing:'cubic-bezier(.2,.8,.2,1)'});
  });
  function motion(value){paused=value;transition=1;dirty=true;wake()}
  document.addEventListener('portfolio-motion',e=>motion(e.detail.paused));reduced.addEventListener('change',()=>motion(reduced.matches));
  addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(()=>{scrollQueued=false;observe()})}},{passive:true});
  addEventListener('resize',observe);document.addEventListener('visibilitychange',()=>{last=0;dirty=true;wake()});
  const cadence=[5.5,3.5,5,3.5,3.7];
  function actor(index,alpha,x,lift){
    const img=sheets[index];if(!img.complete||!img.naturalWidth||alpha<=0)return;
    const f=Math.floor(t*cadence[index])%8,cw=img.naturalWidth/4,ch=img.naturalHeight/2,inset=index===4&&f===3?20:0;
    const phase=t*cadence[index]/8*Math.PI*2;
    const bob=index===0?-Math.abs(Math.sin(phase*2))*1.3:index===1?-Math.abs(Math.sin(phase*2))*.65:0;
    const glide=index===3?Math.sin(phase)*2.17:0;
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(240+x+glide,454-lift+bob);if(index===4)ctx.rotate(Math.sin(phase)*.006);
    ctx.drawImage(img,(f%4)*cw+inset,Math.floor(f/4)*ch,cw-inset,ch,-217+434*inset/cw,-434,434*(1-inset/cw),434);ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,480,480);
    const ease=1-Math.pow(1-transition,3),lift=paused?0:Math.sin(transition*Math.PI)*6;
    // A restrained lit ground plane keeps the character legible on light and dark chapters.
    const glow=ctx.createRadialGradient(240,426,8,240,426,118);glow.addColorStop(0,colors[activity]+'28');glow.addColorStop(1,colors[activity]+'00');ctx.fillStyle=glow;ctx.fillRect(90,305,300,165);
    if(activity!==3){ctx.fillStyle='#17251d22';ctx.beginPath();ctx.ellipse(240,460,75-lift*.5,8,0,0,Math.PI*2);ctx.fill();}
    if(previous!==activity&&ease<1)actor(previous,1-ease,-20*ease,lift);
    actor(activity,previous===activity?1:ease,previous===activity?0:20*(1-ease),lift);
  }
  function frame(now){
    raf=0;if(!enabled||document.hidden){last=0;return}
    const dt=last?Math.min(.06,(now-last)/1000):0;
    if(!last||now-last>=1000/30||dirty){last=now;if(!paused){t+=dt;transition=Math.min(1,transition+dt/0.52)}if(dirty||!paused){draw();dirty=false}}
    if(!paused)wake();
  }
  observe();
})();
