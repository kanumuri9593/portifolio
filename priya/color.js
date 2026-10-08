/* Priya colour layer: smooth scroll, Holi colour + petal bursts, self-drawing rangoli, colour-ink headlines.
   Libraries (vendor/): GSAP 3.13 + ScrollTrigger, SplitText, DrawSVGPlugin; Lenis. */
(()=>{
  if(!window.gsap)return;
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paused=()=>root.classList.contains('motion-paused');
  const desktop=matchMedia('(min-width: 761px) and (pointer: fine)');
  gsap.registerPlugin(ScrollTrigger,SplitText,DrawSVGPlugin);
  root.classList.add('colour');
  const PAL=['#e8327c','#ff7a1a','#f4b400','#3fae49','#0f9b8e','#5b3fd1','#d81b60','#ffb300'];
  const pick=()=>PAL[Math.random()*PAL.length|0];

  /* 1. Smooth scroll (desktop wheel only; touch keeps native scrolling). */
  if(!reduced&&window.Lenis){
    const lenis=new Lenis({lerp:.1,anchors:{offset:-90}});
    lenis.on('scroll',ScrollTrigger.update);
    gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('dialog').forEach(d=>d.setAttribute('data-lenis-prevent',''));
    new MutationObserver(()=>document.body.classList.contains('modal-open')?lenis.stop():lenis.start())
      .observe(document.body,{attributes:true,attributeFilter:['class']});
    window.priyaLenis=lenis;
  }

  /* 2. Holi: gulal powder and marigold petals on a single fixed canvas. */
  const cv=Object.assign(document.createElement('canvas'),{className:'holi-canvas'});
  cv.setAttribute('aria-hidden','true');document.body.append(cv);
  const ctx=cv.getContext('2d');let W=0,H=0,parts=[],raf=0;
  function size(){const d=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);}
  size();addEventListener('resize',size,{passive:true});
  const sprites={};// soft powder puffs, pre-rendered once per colour
  function sprite(c){
    if(sprites[c])return sprites[c];
    const s=document.createElement('canvas');s.width=s.height=64;const g=s.getContext('2d');
    const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,c);r.addColorStop(.45,c+'cc');r.addColorStop(1,c+'00');
    g.fillStyle=r;g.fillRect(0,0,64,64);return sprites[c]=s;
  }
  function burst(x,y,{powder=44,petals=12,power=1}={}){
    if(reduced||paused())return;
    const add=(n,kind)=>{for(let i=0;i<n;i++){
      const a=Math.random()*6.283,v=(1.5+Math.random()*6.5)*power;
      parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(kind==='petal'?3.2:1.4),
        r:kind==='petal'?5+Math.random()*5:8+Math.random()*16,c:pick(),life:0,max:kind==='petal'?110+Math.random()*60:55+Math.random()*45,
        kind,rot:Math.random()*6.283,vr:(Math.random()-.5)*.28,ph:Math.random()*6.283});
    }};
    add(powder,'powder');add(petals,'petal');
    if(parts.length>420)parts.splice(0,parts.length-420);
    if(!raf)raf=requestAnimationFrame(tick);
  }
  function tick(){
    ctx.clearRect(0,0,W,H);
    parts=parts.filter(p=>++p.life<p.max);
    for(const p of parts){
      const petal=p.kind==='petal',t=p.life/p.max;
      p.vx*=petal?.965:.9;p.vy=p.vy*(petal?.965:.9)+(petal?.11:.035);
      if(petal)p.vx+=Math.sin(p.life*.12+p.ph)*.12;
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;
      const a=t<.08?t/.08:1-(t-.08)/.92;
      if(petal){
        ctx.globalAlpha=a;ctx.fillStyle=p.c;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
        ctx.scale(1,.55+.45*Math.abs(Math.sin(p.life*.09+p.ph)));// petals flip as they fall
        ctx.beginPath();ctx.ellipse(0,0,p.r,p.r*.48,0,0,6.283);ctx.fill();
        ctx.globalAlpha=a*.35;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(-p.r*.25,-p.r*.1,p.r*.45,p.r*.14,0,0,6.283);ctx.fill();ctx.restore();
      }else{
        const r=p.r*(1+t*2.2);ctx.globalAlpha=a*.5;ctx.drawImage(sprite(p.c),p.x-r,p.y-r,r*2,r*2);
      }
    }
    ctx.globalAlpha=1;raf=parts.length?requestAnimationFrame(tick):0;
  }
  window.priyaBurst=burst;
  const hot='.button,.text-link,.nav-cta,[data-enquire],[data-world],.pour-btn,.character-hello,.gallery-filters button,.invitation-links a';
  document.addEventListener('pointerdown',e=>{if(e.target.closest(hot))burst(e.clientX,e.clientY);},{passive:true});
  // A shower of petals when the lens reopens on a new season.
  const open=window.priyaShutterOpen;
  if(open)window.priyaShutterOpen=(...a)=>{
    const r=document.querySelector('.scene-window')?.getBoundingClientRect();
    if(r&&r.bottom>0&&r.top<H)burst(r.left+r.width/2,r.top+r.height*.35,{powder:30,petals:34,power:1.25});
    return open(...a);
  };

  /* 3. Colour halo behind the hero scene. */
  const stage=document.querySelector('.world-stage');
  if(stage)stage.prepend(Object.assign(document.createElement('div'),{className:'colour-halo'}));

  /* 4. Rangoli that draws itself, then fills with colour. */
  function rangoli(cls){
    const P=(a,r)=>`${(Math.cos(a)*r).toFixed(2)} ${(Math.sin(a)*r).toFixed(2)}`;
    const petal=(a,r1,r2,r3,w)=>`M${P(a,r1)} Q${P(a-w,r2)} ${P(a,r3)} Q${P(a+w,r2)} ${P(a,r1)}Z`;
    let s=`<svg class="rangoli ${cls}" viewBox="-115 -115 230 230" aria-hidden="true">`;
    const ring=(n,r1,r2,r3,w,off,cols)=>{for(let i=0;i<n;i++){const a=i/n*6.283+off;s+=`<path class="rg" d="${petal(a,r1,r2,r3,w)}" fill="${cols[i%cols.length]}" fill-opacity="1"/>`;}};
    s+=`<circle class="rg-line" r="104"/><circle class="rg-line" r="63"/>`;
    ring(16,64,90,101,.17,0,['#e8327c','#ff7a1a','#f4b400','#0f9b8e']);
    ring(16,66,80,90,.09,6.283/32,['#5b3fd1','#3fae49']);
    ring(8,20,44,60,.38,0,['#ff7a1a','#d81b60','#f4b400','#0f9b8e']);
    ring(8,22,36,46,.3,6.283/16,['#3fae49','#5b3fd1']);
    for(let i=0;i<32;i++){const a=i/32*6.283;s+=`<circle class="rg rg-dot" cx="${(Math.cos(a)*110).toFixed(2)}" cy="${(Math.sin(a)*110).toFixed(2)}" r="2.6" fill="${PAL[i%PAL.length]}" fill-opacity="1"/>`;}
    s+=`<circle class="rg" r="15" fill="#f4b400" fill-opacity="1"/><circle class="rg" r="7" fill="#d81b60" fill-opacity="1"/></svg>`;
    const t=document.createElement('template');t.innerHTML=s;return t.content.firstChild;
  }
  function drawIn(svg,trigger,scrub){
    const shapes=svg.querySelectorAll('.rg,.rg-line');
    if(reduced)return;
    const tl=gsap.timeline({scrollTrigger:{trigger,start:'top 85%',end:'top 35%',scrub}});
    tl.from(shapes,{drawSVG:0,duration:1,stagger:.012,ease:'none'})
      .from(svg.querySelectorAll('.rg'),{attr:{'fill-opacity':0},duration:.6,stagger:{each:.01,from:'center'}},.35);
  }
  const art=document.querySelector('#art .art-header');
  if(art){
    const wrap=Object.assign(document.createElement('div'),{className:'rangoli-divider'});
    const svg=rangoli('rangoli-art');wrap.append(svg);art.before(wrap);drawIn(svg,wrap,1);
  }
  const inv=document.querySelector('#connect');
  if(inv){const svg=rangoli('rangoli-bg');inv.prepend(svg);drawIn(svg,inv,1.5);}

  /* 5. Headlines arrive letter by letter, each dipped in a different colour. */
  if(!reduced){
    document.fonts?.ready.then(()=>{
      document.querySelectorAll('#photography h2,#art .art-header h2,#table .section-heading h2,#about h2,#connect h2,.pour-copy h3').forEach(h=>{
        const split=SplitText.create(h,{type:'words,chars',charsClass:'ink-char'});
        gsap.from(split.chars,{scrollTrigger:{trigger:h,start:'top 88%'},yPercent:60,rotate:()=>gsap.utils.random(-14,14),
          opacity:0,color:pick,duration:1.1,ease:'back.out(1.6)',stagger:.028,
          onComplete:()=>gsap.set(split.chars,{clearProps:'color,transform'})});
      });
      ScrollTrigger.refresh();
    });
  }

  /* 6. Scroll velocity gives the ribbon a little swing; photos drift at different depths. */
  if(!reduced){
    const ribbon=document.querySelector('.love-ribbon');
    if(ribbon){
      const skew=gsap.quickTo(ribbon,'skewY',{duration:.5,ease:'power3'});
      ScrollTrigger.create({onUpdate:self=>skew(gsap.utils.clamp(-4,4,self.getVelocity()/-260))});
    }
    gsap.matchMedia().add('(min-width: 761px) and (pointer: fine)',()=>{
      gsap.utils.toArray('.floating-print').forEach((el,i)=>gsap.to(el,{y:i?-70:-40,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}}));
      gsap.utils.toArray('.recipe-card').forEach((el,i)=>gsap.from(el,{y:60+i*30,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'top 45%',scrub:true}}));
    });
  }
})();
