/* Procedural atmosphere, sharing the character clock: no video, WebGL or library. */
window.PortfolioWeather={
 labels:['NYC / FIRST LIGHT','UPSTATE / AUTUMN TRAILS','HUDSON / AFTER THE RAIN','MOUNTAIN LAKE / SUMMER','UPSTATE / FRESH SNOW'],
 draw(c,t,m,w,h,alpha=1){
 c.save();c.globalAlpha=alpha;const mobile=w<700;
 if(m===0){
  const x=w*(.8+Math.sin(t*.08)*.03),y=h*.16;
  const glow=c.createRadialGradient(x,y,2,x,y,w*.7);glow.addColorStop(0,'#fff1aa85');glow.addColorStop(.4,'#ffdd8a25');glow.addColorStop(1,'#ffde8b00');c.fillStyle=glow;c.fillRect(0,0,w,h);
  c.save();c.translate(x,y);c.rotate(Math.sin(t*.1)*.07);for(let i=0;i<3;i++){c.beginPath();c.moveTo(-20,0);c.lineTo(-w*(.5+i*.18),h);c.lineTo(-w*(.38+i*.18),h);c.closePath();c.fillStyle='#fff7d513';c.fill()}c.restore();
  for(let i=0;i<18;i++){const x=(i*179+t*(3+i%4))%w,y=(i*97-t*6+h*30)%h;c.fillStyle='#f6d69866';c.beginPath();c.arc(x,y,1+i%2,0,7);c.fill()}
 }
 if(m===1){for(let i=0;i<(mobile?15:28);i++){const z=.5+(i%5)/5,x=(i*173+t*19*z+Math.sin(t*.8+i)*30)%(w+70)-35,y=(i*109+t*24*z)%(h+50)-25;c.save();c.translate(x,y);c.rotate(t*.65+i);c.scale(.6+Math.abs(Math.sin(t*.5+i))*.4,1);const r=5+z*5;c.beginPath();c.moveTo(0,-r);c.bezierCurveTo(r*1.5,-r*.5,r*.9,r*.8,0,r);c.bezierCurveTo(-r*.9,r*.4,-r,-r*.7,0,-r);c.fillStyle=['#b46b3580','#cc893c80','#8b743870'][i%3];c.fill();c.beginPath();c.moveTo(0,-r*.6);c.lineTo(0,r*1.35);c.strokeStyle='#66442466';c.lineWidth=.7;c.stroke();c.restore()}}
 if(m===2){
  // Restrict foreground glass droplets to edges, leaving the story readable.
  for(let i=0;i<(mobile?22:48);i++){const x=(i*191+Math.sin(i)*23)%(w+40),y=(i*113+t*(35+i%13))%(h+80)-40;const edge=x>w*.58||x<w*.06;if(!edge)continue;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+20+i%15);c.strokeStyle='#64848f24';c.lineWidth=.8;c.stroke()}
  for(let i=0;i<(mobile?9:20);i++){const x=(i*211+43)%w;if(x>w*.08&&x<w*.62)continue;const y=(i*139+t*(3+i%4))%h,r=4+i%5;c.beginPath();c.ellipse(x,y,r*.6,r*1.6,-.15,0,7);c.fillStyle='#d7f2ff33';c.fill();c.strokeStyle='#506b8266';c.lineWidth=.8;c.stroke();c.beginPath();c.ellipse(x-1,y-r*.3,r*.25,r*.6,-.15,Math.PI,Math.PI*1.8);c.strokeStyle='#ffffffb0';c.stroke()}
 }
 if(m===3){c.save();c.globalCompositeOperation='soft-light';for(let i=0;i<6;i++){const x=w*(.5+i*.1)+Math.sin(t*.4+i)*30;c.beginPath();c.ellipse(x,h*.39+Math.sin(t*.7+i)*h*.08,w*.19,h*.04,Math.sin(t*.2+i)*.3,0,7);c.strokeStyle='#ffffff70';c.lineWidth=2;c.stroke()}c.restore()}
 if(m===4){const mist=c.createLinearGradient(0,h*.34,0,h*.78);mist.addColorStop(0,'#f4f9ff00');mist.addColorStop(.5,'#f4f9ff2a');mist.addColorStop(1,'#f4f9ff00');c.fillStyle=mist;c.fillRect(0,0,w,h);for(let i=0;i<(mobile?30:65);i++){const z=.4+(i%6)/6,x=(i*151+t*10*z+Math.sin(t*.8+i)*18)%(w+30)-15,y=(i*79+t*25*z)%(h+20)-10;c.beginPath();c.arc(x,y,1+z*1.7,0,7);c.fillStyle=i%3?'#ffffffb8':'#a7bac760';c.fill()} }
 c.restore();
 }
};
