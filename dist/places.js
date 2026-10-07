/* Original procedural scenery, drawn in CSS pixels. No assets or dependencies. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const palettes = {
    0: { sky: '#eeeede', haze: '#e6e7d9', far: '#9daea4', city: '#6d8980', near: '#3f635c', water: '#c5d6d0', earth: '#d2d8bf' },
    2: { sky: '#d9e3eb', haze: '#d2dfe7', far: '#a0b0ba', city: '#748d9c', near: '#496976', water: '#aec8d3', earth: '#cedbdc' },
    1: { sky: '#e9e7d5', haze: '#eee4cd', far: '#b2b5a0', city: '#8b977a', near: '#647354', water: '#b9c7b0', earth: '#cebb95' },
    3: { sky: '#e7eee9', haze: '#dae6df', far: '#a3bfb7', city: '#759d94', near: '#467d72', water: '#acd2cf', earth: '#bacfc4' },
    4: { sky: '#e9eef0', haze: '#e1e8eb', far: '#b7c8ce', city: '#93aeba', near: '#5d8190', water: '#cadbe1', earth: '#e6edec' }
  };
  function shape(c, pts, color) { c.beginPath(); pts.forEach((p,i) => i ? c.lineTo(p[0],p[1]) : c.moveTo(p[0],p[1])); c.closePath(); c.fillStyle=color; c.fill(); }
  function line(c, pts, color, width=1) { c.beginPath(); pts.forEach((p,i) => i ? c.lineTo(p[0],p[1]) : c.moveTo(p[0],p[1])); c.strokeStyle=color; c.lineWidth=width; c.stroke(); }
  function oval(c,x,y,rx,ry,color) { c.beginPath(); c.ellipse(x,y,rx,ry,0,0,TAU); c.fillStyle=color;c.fill(); }
  function noise(i) { const n=Math.sin(i*127.1+71.3)*43758.5453; return n-Math.floor(n); }
  function pine(c,x,y,height,color,snow=false) {
    c.fillStyle=color;c.fillRect(x-height*.017,y-height*.1,height*.035,height*.1);
    for(let tier=0;tier<4;tier++){const top=y-height+tier*height*.175, half=height*(.12+tier*.034);shape(c,[[x,top],[x-half,top+height*.35],[x+half,top+height*.35]],color);if(snow)line(c,[[x-half*.7,top+height*.26],[x,top+height*.045],[x+half*.35,top+height*.18]],'#dce9e9',Math.max(1,height*.025));}
  }
  function skyscraper(c,x,base,width,height,kind,color) {
    const top=base-height;
    if(kind==='wtc') {
      shape(c,[[x-width*.47,base],[x-width*.38,top+height*.17],[x-width*.2,top+height*.07],[x+width*.22,top+height*.07],[x+width*.44,top+height*.17],[x+width*.49,base]],color);
      shape(c,[[x-width*.2,top+height*.07],[x,top+height*.17],[x-width*.47,base]],'#e4e8db40');
      line(c,[[x,top+height*.07],[x,top-height*.14]],color,Math.max(1,width*.032));
      line(c,[[x-width*.14,top+height*.065],[x+width*.15,top+height*.065]],color,2);
      line(c,[[x,top+height*.18],[x+width*.18,base]],'#dce4dc55',1);
    } else if(kind==='empire') {
      const pts=[[-.5,1],[-.5,.52],[-.38,.52],[-.38,.25],[-.23,.25],[-.23,.12],[-.095,.12],[-.095,.035],[.095,.035],[.095,.12],[.23,.12],[.23,.25],[.38,.25],[.38,.52],[.5,.52],[.5,1]];
      shape(c,pts.map(([a,b])=>[x+a*width,top+b*height]),color);
      line(c,[[x,top+height*.04],[x,top-height*.1]],color,Math.max(1,width*.037));
      for(let k=-2;k<=2;k++)line(c,[[x+k*width*.12,top+height*.3],[x+k*width*.12,base]],'#e3e6d735',1);
    } else if(kind==='chrysler') {
      shape(c,[[x-width*.5,base],[x-width*.5,top+height*.35],[x-width*.3,top+height*.35],[x-width*.3,top+height*.2],[x-width*.12,top+height*.08],[x,top],[x+width*.12,top+height*.08],[x+width*.3,top+height*.2],[x+width*.3,top+height*.35],[x+width*.5,top+height*.35],[x+width*.5,base]],color);
      for(let j=0;j<3;j++)line(c,[[x-width*.22,top+height*(.2+j*.055)],[x,top+height*(.15+j*.055)],[x+width*.22,top+height*(.2+j*.055)]],'#d9e0d444',1);
    } else {
      c.fillStyle=color;c.fillRect(x-width/2,top,width,height);
      if(kind==='step')c.fillRect(x-width*.34,top-height*.11,width*.68,height*.12);
      if(kind==='slope')shape(c,[[x-width/2,top],[x+width/2,top-height*.25],[x+width/2,top]],color);
    }
    // Sparse window columns give a city its grain without a generic checkerboard.
    if(width>14)for(let col=1;col<4;col++)for(let row=2;row<Math.min(13,height/7);row++){if(noise(row*13+col+Math.floor(x))>.44){c.fillStyle='#edf0dc30';c.fillRect(x-width*.48+col*width*.23,top+height*.42+row*height*.037,Math.max(1,width*.045),Math.max(1,height*.015));}}
  }
  function city(c,t,mode,w,h,b,p) {
    const mobile=w<700,scale=mobile?.75:1,shore=b-h*.125;
    const drift=Math.sin(t*.045)*2;
    c.save();c.translate(drift,0);
    // Manhattan recedes across the Hudson; taller monuments sit beyond the portrait.
    c.globalAlpha*=.46;
    for(let i=0;i<35;i++){const x=w*(.34+i*.02),height=h*(.035+noise(i)*.092)*scale;skyscraper(c,x,shore,w*(.009+noise(i+4)*.012),height,i%5===0?'step':'flat',p.far);}
    c.restore();
    c.save();c.globalAlpha*=.64;
    const buildings=[[.43,.037,.105,'step'],[.47,.025,.16,'slope'],[.51,.027,.13,'step'],[.555,.033,.315,'wtc'],[.60,.025,.118,'flat'],[.635,.03,.18,'step'],[.677,.025,.10,'flat'],[.718,.03,.135,'slope'],[.764,.029,.21,'chrysler'],[.81,.037,.29,'empire'],[.855,.025,.14,'step'],[.89,.026,.18,'slope'],[.93,.03,.15,'step'],[.97,.025,.11,'flat']];
    buildings.forEach(([x,ww,hh,kind])=>skyscraper(c,w*x+drift,shore,w*ww,h*hh*scale,kind,p.city));
    line(c,[[w*.34,shore],[w,shore]],p.near,2);c.restore();
    // The broad water plane is deliberately calm under the silhouette.
    const water=c.createLinearGradient(0,shore,0,b+12);water.addColorStop(0,p.water);water.addColorStop(1,p.haze);c.fillStyle=water;c.fillRect(0,shore,w,b+12-shore);
    c.save();c.globalAlpha*=.32;
    for(let i=0;i<52;i++){const y=shore+7+noise(i+80)*(b-shore-12),x=w*(.3+noise(i+150)*.72)+Math.sin(t*.23+i)*3,len=8+noise(i+7)*42;line(c,[[x,y],[x+len,y]],i%3?'#f7f3df':p.city,.7);}
    // Broken vertical reflections of the two iconic towers.
    for(const x of [.555,.81])for(let j=0;j<9;j++){const len=w*(.004+j*.0012);line(c,[[w*x-len+Math.sin(j+t)*2,shore+7+j*4],[w*x+len,shore+7+j*4]],p.city,.8);}
    c.restore();
    bridge(c,w,h,b,p);
    // Waterfront promenade, broad path and rail. Keep the left text area low contrast.
    shape(c,[[0,b+4],[w,b-3],[w,h],[0,h]],p.earth);
    line(c,[[0,b+5],[w,b-2]],'#7c928266',1.2);
    line(c,[[w*.45,b-11],[w,b-16]],p.near,1.6);
    for(let i=0;i<15;i++){const x=w*(.45+i*.04);line(c,[[x,b-11-i*.35],[x,b+2-i*.3]],p.near,1);}
    // Path perspective joints, not a scrolling treadmill.
    c.save();c.globalAlpha*=.14;for(let i=0;i<9;i++){const x=w*(.36+i*.1);line(c,[[x,b+8],[x+(x-w*.5)*.22,h]],p.near,.8);}c.restore();
  }
  function bridge(c,w,h,b,p){
    const y=b-h*.18,x1=w*.13,x2=w*.345,deck=b-h*.08,top=y-h*.055;
    c.save();c.globalAlpha*=.28;
    for(const x of [x1,x2]){c.fillStyle=p.near;c.fillRect(x-4,top,3,deck-top+8);c.fillRect(x+4,top,3,deck-top+8);line(c,[[x-5,top+6],[x+7,top+6]],p.near,2);line(c,[[x-5,top+20],[x+7,top+20]],p.near,2);}
    const pts=[];for(let i=0;i<=30;i++){const x=w*(-.02+i*.016),phase=(x-x1)/(x2-x1);const yy=top+5+(deck-top-12)*Math.sin(Math.PI*Math.max(0,Math.min(1,phase)));pts.push([x,phase<0?top+5+(x1-x)*.25:phase>1?top+5+(x-x2)*.25:yy]);}
    line(c,pts,p.near,1.3);line(c,[[-20,deck],[w*.48,deck]],p.near,2);
    for(let i=0;i<pts.length;i+=2)line(c,[pts[i],[pts[i][0],deck]],p.near,.65);c.restore();
  }
  function ridgeline(w,h,base,depth,shift){
    const anchors=[[-.08,.14],[.02,.24],[.10,.19],[.19,.34],[.26,.30],[.35,.48],[.41,.40],[.49,.62],[.57,.44],[.63,.49],[.70,.77],[.77,.56],[.84,.64],[.93,.40],[1.04,.58]];
    return anchors.map(([x,y],i)=>[w*x+shift,base-h*(y*depth+Math.sin(i*1.8)*.009)]);
  }
  function mountains(c,t,mode,w,h,b,p){
    const snow=mode===4, lake=mode===3, mobile=w<700;
    const horizon=lake?b-h*.19:b;
    // Three uneven ridgelines: distant haze, middle folds, then the close face.
    for(let layer=0;layer<3;layer++){
      const depth=(mobile?.38:.57)-layer*.075;
      const shift=(layer-1)*w*.1+Math.sin(t*.035)*(layer+1)*1.4;
      const pts=ridgeline(w,h,horizon+layer*16,depth,shift);
      const colors=[p.far,p.city,p.near];c.save();c.globalAlpha*=layer===2?.7:.48;
      shape(c,[[pts[0][0],h],...pts,[w*1.2,h]],colors[layer]);
      if(snow&&layer<2){for(let i=2;i<pts.length-1;i+=3){const a=pts[i],l=pts[i-1],r=pts[i+1];shape(c,[[a[0],a[1]],[a[0]+(r[0]-a[0])*.48,a[1]+(r[1]-a[1])*.48],[a[0]+7,a[1]+h*.032],[a[0]-5,a[1]+h*.02],[a[0]+(l[0]-a[0])*.38,a[1]+(l[1]-a[1])*.38]],'#f5f6ed');}}
      // Angular face shadows read as geology, not sine-wave hills.
      for(let i=3;i<pts.length-1;i+=3){const a=pts[i];shape(c,[a,[a[0]+w*.09,horizon+25],[a[0]+w*.035,a[1]+h*.08]],snow?'#63849428':'#3d574d20');}
      c.restore();
    }
    const mist=c.createLinearGradient(0,horizon-h*.18,0,horizon+30);mist.addColorStop(0,'#eceddf00');mist.addColorStop(1,p.haze+'ac');c.fillStyle=mist;c.fillRect(0,horizon-h*.18,w,h*.22+30);
    if(lake){
      const surface=horizon+2;const water=c.createLinearGradient(0,surface,0,h);water.addColorStop(0,p.water);water.addColorStop(1,'#c6ddcd');c.fillStyle=water;c.fillRect(0,surface,w,h-surface);
      c.save();c.globalAlpha*=.18;for(let j=0;j<24;j++){const y=surface+9+j*8;const span=w*(.10+j*.008);line(c,[[w*.71-span+Math.sin(t*.8+j)*4,y],[w*.71+span,y]],j%3===0?'#fafff2':p.near,j%4===0?2:1);}c.restore();
      for(let i=0;i<18;i++){const x=w*(.80+i*.014);pine(c,x,surface+2,h*(.025+noise(i+98)*.055),p.near);}
      shape(c,[[0,surface-8],[w*.13,surface],[w*.22,surface+14],[0,surface+25]],p.city);
      return;
    }
    // Near-side trail traverses the frame exactly beneath the character’s feet.
    shape(c,[[0,b-3],[w*.25,b-13],[w*.58,b+4],[w*.81,b-3],[w,b+4],[w,h],[0,h]],p.earth);
    shape(c,[[w*.42,b+7],[w*.81,b-4],[w,b+3],[w,b+24],[w*.6,b+29],[w*.42,b+45]],snow?'#f3f6ef':'#e6d6b4');
    line(c,[[w*.42,b+45],[w*.6,b+29],[w,b+24]],snow?'#bfd1d6':'#9a98715e',1);
    // Trees frame, rather than cover, the athlete and typography.
    for(let i=0;i<13;i++){const x=w*(.86+i*.013),height=h*(.06+noise(i+9)*.10);pine(c,x,b+3,height,snow?'#719099':'#65785a',snow);}
    c.save();c.globalAlpha*=.43;for(let i=0;i<9;i++)pine(c,w*(.39+i*.023),b-12,h*(.025+noise(i+39)*.07),p.city,snow);c.restore();
    if(!snow){for(let i=0;i<16;i++){const x=w*(.49+noise(i+100)*.50),y=b+8+noise(i+200)*36;oval(c,x,y,2+noise(i)*3,.8,i%3?'#b99b6266':'#ca784a88');}}
    else{for(let i=0;i<8;i++){const x=w*(.64+i*.024);oval(c,x,b+15+i*1.2,3.2,1.2,'#91aeba35');}}
  }
  function draw(c,t,mode,w,h){
    if(!c||!w||!h)return;
    mode=Number(mode);const p=palettes[mode]||palettes[0],b=h*(w<700?.57:.8);
    c.save();
    const sky=c.createLinearGradient(0,h*.25,0,b);sky.addColorStop(0,p.sky+'00');sky.addColorStop(.7,p.haze+'99');sky.addColorStop(1,p.haze);c.fillStyle=sky;c.fillRect(0,0,w,h);
    if(mode===0||mode===2)city(c,t,mode,w,h,b,p);else mountains(c,t,mode,w,h,b,p);
    // A quiet left-hand light veil protects the editorial copy without a hard box.
    const veil=c.createLinearGradient(0,0,w*.56,0);veil.addColorStop(0,p.sky+'ed');veil.addColorStop(.5,p.sky+'a8');veil.addColorStop(1,p.sky+'00');c.fillStyle=veil;c.fillRect(0,0,w*.56,h);
    c.restore();
  }
  window.PortfolioPlaces={draw};
})();
