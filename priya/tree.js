/* Pip, a little 3D alpine pine who hops along the bottom of the page as you scroll.
   three.js loads lazily, once the visitor scrolls past the hero. Replaces the paper walker. */
(()=>{
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl=document.createElement('canvas').getContext('webgl2');
  if(!gl)return;// keep the original paper walker
  root.classList.add('has-pip');
  const past=()=>{const j=document.querySelector('.hero-journey');return j?j.getBoundingClientRect().bottom<innerHeight*.7:scrollY>innerHeight*.6;};
  let started=false;
  const start=()=>{if(started||!past())return;started=true;removeEventListener('scroll',start);
    import('./vendor/three.module.min.js').then(boot).catch(()=>root.classList.remove('has-pip'));};
  addEventListener('scroll',start,{passive:true});start();

  function boot(T){
    const cv=Object.assign(document.createElement('canvas'),{className:'pip-canvas'});
    cv.setAttribute('aria-hidden','true');document.body.append(cv);
    const renderer=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    const scene=new T.Scene();
    const cam=new T.OrthographicCamera(0,1,1,0,-500,500);cam.position.z=200;
    scene.add(new T.HemisphereLight(0xfff4dc,0x3c5a3a,1.6));
    const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-3,5,6);scene.add(key);
    const rim=new T.DirectionalLight(0xffd27a,1.6);rim.position.set(4,2,-5);scene.add(rim);

    const mat=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:.62,flatShading:true,...o});
    const soft=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:.35,...o});
    const pip=new T.Group(),body=new T.Group();pip.add(body);scene.add(pip);
    // Three tiers of low-poly boughs, each a slightly twisted cone.
    const tiers=[[1.05,1.25,0.55,0x2e7a4c],[0.82,1.05,1.25,0x3a9259],[0.56,0.9,1.88,0x4fae69]].map(([r,h,y,c],i)=>{
      const m=new T.Mesh(new T.ConeGeometry(r,h,8,1),mat(c));m.position.y=y;m.rotation.y=i*.35;body.add(m);return m;});
    const snow=tiers.map(t=>{const g=t.geometry.parameters;const s=new T.Mesh(new T.ConeGeometry(g.radius*.55,g.height*.42,8,1),mat(0xffffff,{roughness:.9}));
      s.position.y=t.position.y+g.height*.3;s.rotation.y=t.rotation.y;s.visible=false;body.add(s);return s;});
    // Little trunk legs with round feet.
    const legs=[-.28,.28].map(x=>{const g=new T.Group();g.position.set(x,0,0);
      const leg=new T.Mesh(new T.CylinderGeometry(.11,.13,.32,8),mat(0x8a5634));leg.position.y=-.1;g.add(leg);
      const foot=new T.Mesh(new T.SphereGeometry(.17,12,8),soft(0x6e4128));foot.scale.set(1,.55,1.35);foot.position.set(0,-.28,.06);g.add(foot);
      pip.add(g);return g;});
    // Face: big glossy eyes, pink cheeks, a smile.
    const face=new T.Group();face.position.set(0,.62,.78);body.add(face);
    const eyes=[-.26,.26].map(x=>{const e=new T.Group();e.position.x=x;
      const white=new T.Mesh(new T.SphereGeometry(.21,20,14),soft(0xffffff));white.scale.z=.55;e.add(white);
      const pupil=new T.Mesh(new T.SphereGeometry(.11,16,12),soft(0x1d1a17,{roughness:.2}));pupil.position.z=.07;pupil.scale.z=.5;e.add(pupil);
      const glint=new T.Mesh(new T.SphereGeometry(.03,8,6),new T.MeshBasicMaterial({color:0xffffff}));glint.position.set(-.035,.04,.12);e.add(glint);
      e.userData={pupil,glint};face.add(e);return e;});
    [-.42,.42].forEach(x=>{const c=new T.Mesh(new T.SphereGeometry(.09,12,8),soft(0xff7b9c,{transparent:true,opacity:.75}));c.scale.set(1.3,.7,.4);c.position.set(x,-.2,-.02);face.add(c);});
    const smile=new T.Mesh(new T.TorusGeometry(.1,.025,6,16,Math.PI),soft(0x5a2a1c));smile.rotation.z=Math.PI;smile.position.set(0,-.2,.03);face.add(smile);
    // A marigold on top.
    const flower=new T.Group();flower.position.y=2.42;body.add(flower);
    for(let i=0;i<10;i++){const p=new T.Mesh(new T.SphereGeometry(.1,10,8),soft(i%2?0xff8a1a:0xffa726));const a=i/10*Math.PI*2;p.position.set(Math.cos(a)*.13,.02,Math.sin(a)*.13);p.scale.set(1,.6,1);flower.add(p);}
    const heart=new T.Mesh(new T.SphereGeometry(.09,10,8),soft(0xffd23f));heart.position.y=.07;flower.add(heart);
    const shadow=new T.Mesh(new T.CircleGeometry(.85,24),new T.MeshBasicMaterial({color:0x1b2a1f,transparent:true,opacity:.18,depthWrite:false}));
    scene.add(shadow);

    let W=0,H=0,S=30,ground=0;
    function size(){W=innerWidth;H=innerWidth<=600?170:240;S=innerWidth<=600?30:44;ground=24;
      renderer.setSize(W,H,false);cv.style.height=H+'px';cam.right=W;cam.top=H;cam.updateProjectionMatrix();}
    size();addEventListener('resize',size,{passive:true});

    // Movement: x follows reading progress; each step is a hop with squash and stretch.
    const margin=()=>Math.min(90,W*.12);
    const target=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);return margin()+(W-2*margin())*Math.min(1,scrollY/max);};
    let x=target(),face_=0,hop=null,lastY=scrollY,vel=0,spinQueued=false,mx=0,my=0,blink=0,nextBlink=2;
    addEventListener('scroll',()=>{vel+=scrollY-lastY;lastY=scrollY;},{passive:true});
    addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});
    new MutationObserver(()=>{const w=root.dataset.world;snow.forEach(s=>s.visible=w==='winter');spinQueued=true;})
      .observe(root,{attributes:true,attributeFilter:['data-world']});
    snow.forEach(s=>s.visible=root.dataset.world==='winter');

    const clock=new T.Clock();let t=0;
    function frame(){
      requestAnimationFrame(frame);
      if(document.hidden)return;
      const dt=Math.min(.05,clock.getDelta());
      const still=reduced||root.classList.contains('motion-paused');
      const show=past();cv.classList.toggle('is-visible',show);
      if(!show&&!hop)return;
      t+=still?0:dt;
      const goal=target(),gap=goal-x;
      vel*=.9;
      if(!hop&&!still&&(Math.abs(gap)>3||spinQueued)){
        const step=Math.sign(gap)*Math.min(Math.abs(gap),W<=600?42:64);
        const energy=Math.min(1,Math.abs(vel)/400);
        hop={from:x,to:x+step,t:0,dur:.46,h:(W<=600?18:26)*(.75+energy*.9),spin:spinQueued||energy>.85};spinQueued=false;
        if(Math.abs(step)>1)face_=Math.sign(step);
      }
      if(still&&Math.abs(gap)>0)x=goal;
      let lift=0,sx=1,sy=1,spin=0;
      if(hop){
        hop.t+=dt/hop.dur;const p=Math.min(1,hop.t);
        // anticipation (0-.18), flight (.18-.82), landing (.82-1)
        if(p<.18){const k=p/.18;sx=1+.16*Math.sin(k*Math.PI/2);sy=1-.2*Math.sin(k*Math.PI/2);}
        else if(p<.82){const k=(p-.18)/.64;lift=Math.sin(k*Math.PI)*hop.h;x=hop.from+(hop.to-hop.from)*(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2);
          sy=1+.12*Math.sin(k*Math.PI);sx=1-.07*Math.sin(k*Math.PI);if(hop.spin)spin=k*Math.PI*2;}
        else{const k=(p-.82)/.18;x=hop.to;sx=1+.14*Math.sin(k*Math.PI);sy=1-.16*Math.sin(k*Math.PI);}
        legs.forEach((l,i)=>l.rotation.x=p>.18&&p<.82?(i?.5:-.5)*Math.sin((p-.18)/.64*Math.PI):0);
        if(p>=1)hop=null;
      }else{sy=1+.025*Math.sin(t*2.4);sx=1-.012*Math.sin(t*2.4);}
      pip.position.set(x,ground+lift,0);pip.scale.set(S*sx,S*sy,S*sx);
      pip.rotation.y+=((face_*.55+spin)-pip.rotation.y)*(spin?1:.12);pip.rotation.x=.18;
      tiers.forEach((m,i)=>m.rotation.z=Math.sin(t*1.7+i)*.03*(i+1)+(hop?-face_*.06*(i+1):0));
      shadow.position.set(x,ground-.2*S,-50);const sh=Math.max(.35,1-lift/60);shadow.scale.set(S*sh,S*sh*.2,1);shadow.material.opacity=.2*sh;
      // eyes look toward the pointer, blink now and then
      const eyeY=innerHeight-(ground+lift+1.2*S),ex=Math.max(-1,Math.min(1,(mx-x)/300)),ey=Math.max(-1,Math.min(1,(my-eyeY)/300));
      if(t>nextBlink){blink=1;nextBlink=t+2.5+Math.random()*3;}
      blink=Math.max(0,blink-dt*7);
      eyes.forEach(e=>{e.userData.pupil.position.set(ex*.05,-ey*.04,.07);e.userData.glint.position.set(-.035+ex*.04,.04-ey*.03,.12);e.scale.y=1-.9*Math.sin(blink*Math.PI);});
      flower.rotation.y=t*.8;
      renderer.render(scene,cam);
    }
    frame();
  }
})();
