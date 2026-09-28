import {COLORS} from "./config.js";

export class BattleArena{
 constructor(canvas,wrap,{onState,onAlive,onWinner}={}){
  this.canvas=canvas;this.wrap=wrap;this.ctx=canvas.getContext("2d");this.game=null;this.raf=0;this.last=0;this.startedAt=0;this.participants=[];this.settings={};this.previewImages=new Map();this.onState=onState;this.onAlive=onAlive;this.onWinner=onWinner;
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(wrap);
 }
 setPreview(participants,settings){this.participants=participants;this.settings=settings;this.draw();}
 resize(){const w=Math.min(this.wrap.clientWidth-16,720);if(w<50)return;const dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=w*dpr;this.canvas.height=w*dpr;this.canvas.style.width=w+"px";this.canvas.style.height=w+"px";this.ctx.setTransform(dpr,0,0,dpr,0,0);this.draw();}
 start(participants,settings){this.stop(false);this.participants=participants;this.settings={...settings};this.last=0;const size=parseFloat(this.canvas.style.width)||500,c=size/2,R=size*.475;
  this.game=participants.map((p,i)=>{const a=i/participants.length*Math.PI*2,rad=Math.min(settings.ballSize,Math.max(13,R*.48/Math.sqrt(participants.length))),va=a+Math.PI*.72+(Math.random()-.5)*.7;const b={...p,x:c+Math.cos(a)*R*.45,y:c+Math.sin(a)*R*.45,vx:Math.cos(va)*settings.speed,vy:Math.sin(va)*settings.speed,r:rad,alive:true,lines:[],wallCooldown:0,img:null,color:COLORS[i%COLORS.length]};if(b.image){b.img=new Image();b.img.src=b.image}for(let n=0;n<(settings.startLines||3);n++)this.addLine(b,n);return b;});
  this.startedAt=performance.now();this.onState?.("Batalha em andamento");this.onAlive?.(this.game.length,true);this.draw();this.raf=requestAnimationFrame(t=>this.loop(t));
 }
 stop(clear=true){cancelAnimationFrame(this.raf);this.last=0;if(clear)this.game=null;}
 reset(){this.stop();this.onState?.("Aguardando batalha");this.onAlive?.(this.participants.length,false);this.draw();}
 addLine(b,seed=null){const max=this.settings.maxLines||8;if(b.lines.length>=max)return;const size=parseFloat(this.canvas.style.width)||500,c=size/2,R=size*.475;let angle=seed===null?Math.atan2(b.y-c,b.x-c)+(Math.random()-.5)*1.8:(seed/(this.settings.startLines||3))*Math.PI*2;let px=c+Math.cos(angle)*R,py=c+Math.sin(angle)*R;b.lines.push({x:px,y:py,flash:12});}
 loop(t){if(!this.game)return;if(!this.last)this.last=t;const dt=Math.min(2,(t-this.last)/16.67);this.last=t;this.update(dt);this.draw();const alive=this.game.filter(b=>b.alive);this.onAlive?.(alive.length,true);if(alive.length>1)this.raf=requestAnimationFrame(n=>this.loop(n));else if(alive.length===1){this.onState?.("Batalha finalizada");this.onWinner?.(alive[0]);}}
 update(dt){const size=parseFloat(this.canvas.style.width),c=size/2,R=size*.475;
  for(const b of this.game){if(!b.alive)continue;b.wallCooldown=Math.max(0,b.wallCooldown-dt);b.x+=b.vx*dt;b.y+=b.vy*dt;for(const l of b.lines)l.flash=Math.max(0,l.flash-dt);const dx=b.x-c,dy=b.y-c,d=Math.hypot(dx,dy)||1;if(d+b.r>=R){const nx=dx/d,ny=dy/d,dot=b.vx*nx+b.vy*ny;if(dot>0){b.vx-=2*dot*nx;b.vy-=2*dot*ny;b.x=c+nx*(R-b.r-2);b.y=c+ny*(R-b.r-2);if(b.wallCooldown<=0){this.addLine(b);b.wallCooldown=10;}}}}
  for(let i=0;i<this.game.length;i++)for(let j=i+1;j<this.game.length;j++)this.resolveBallCollision(this.game[i],this.game[j]);
  // Small start grace period prevents participants spawning directly on a rival line.
  if(performance.now()-this.startedAt>700){
   for(const owner of this.game){if(!owner.alive)continue;for(const attacker of this.game){if(!attacker.alive||attacker===owner)continue;let cut=false;for(let i=owner.lines.length-1;i>=0;i--){const l=owner.lines[i];if(this.segmentHitsCircle(owner.x,owner.y,l.x,l.y,attacker.x,attacker.y,attacker.r*.72)){owner.lines.splice(i,1);cut=true;if(owner.lines.length===0)owner.alive=false;break;}}if(!owner.alive)break;if(cut)continue;}}
  }
 }
 resolveBallCollision(a,b){
  // Ball-to-ball contact is purely physical: no damage, no line loss.
  if(!a.alive||!b.alive)return;
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.001,min=a.r+b.r;
  if(d>=min)return;
  const nx=dx/d,ny=dy/d,over=min-d;
  // Separate immediately so mobile frame drops cannot leave balls stuck together.
  a.x-=nx*(over/2+.5);a.y-=ny*(over/2+.5);
  b.x+=nx*(over/2+.5);b.y+=ny*(over/2+.5);
  // Equal-mass elastic collision: exchange only the velocity component along impact normal.
  const avn=a.vx*nx+a.vy*ny,bvn=b.vx*nx+b.vy*ny;
  const closing=avn-bvn;
  if(closing>0){
   a.vx+=(bvn-avn)*nx;a.vy+=(bvn-avn)*ny;
   b.vx+=(avn-bvn)*nx;b.vy+=(avn-bvn)*ny;
  }
 }
 segmentHitsCircle(x1,y1,x2,y2,cx,cy,r){const vx=x2-x1,vy=y2-y1,wx=cx-x1,wy=cy-y1,len=vx*vx+vy*vy;if(!len)return false;const t=Math.max(.12,Math.min(1,(wx*vx+wy*vy)/len)),px=x1+t*vx,py=y1+t*vy;return Math.hypot(cx-px,cy-py)<=r;}
 draw(){const size=parseFloat(this.canvas.style.width)||Math.min(this.wrap.clientWidth,720);if(!size)return;const ctx=this.ctx,c=size/2,R=size*.475;ctx.clearRect(0,0,size,size);const g=ctx.createRadialGradient(c,c,R*.1,c,c,R);g.addColorStop(0,"#171c2b");g.addColorStop(1,"#080b12");ctx.beginPath();ctx.arc(c,c,R,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle="#39445c";ctx.lineWidth=3;ctx.stroke();ctx.save();ctx.beginPath();ctx.arc(c,c,R-2,0,Math.PI*2);ctx.clip();
  const list=this.game||this.participants.map((p,i)=>{const a=i/Math.max(1,this.participants.length)*Math.PI*2,r=Math.min(this.settings.ballSize||25,30),x=c+Math.cos(a)*R*.55,y=c+Math.sin(a)*R*.55;let img=null;if(p.image){img=this.previewImages.get(p.id);if(!img||img.src!==p.image){img=new Image();img.onload=()=>this.draw();img.src=p.image;this.previewImages.set(p.id,img);}}return {...p,x,y,r,alive:true,color:COLORS[i%COLORS.length],lines:[{x:c+Math.cos(a)*R,y:c+Math.sin(a)*R}],img};});
  for(const b of list){if(!b.alive)continue;for(const l of b.lines){ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(l.x,l.y);ctx.strokeStyle=b.color;ctx.globalAlpha=l.flash?1:.78;ctx.lineWidth=l.flash?1.6:.8;ctx.lineCap="round";ctx.stroke();}ctx.globalAlpha=1;}
  list.forEach(b=>{if(!b.alive)return;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle="#0b0f17";ctx.fill();ctx.strokeStyle=b.color;ctx.lineWidth=3;ctx.stroke();if(b.img&&b.img.complete){ctx.save();ctx.beginPath();ctx.arc(b.x,b.y,b.r-3,0,Math.PI*2);ctx.clip();ctx.drawImage(b.img,b.x-b.r,b.y-b.r,b.r*2,b.r*2);ctx.restore();}else{ctx.font=b.r*1.12+"px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(b.emoji,b.x,b.y+1);}if(this.game){ctx.font="bold 10px sans-serif";ctx.fillStyle="#fff";ctx.textAlign="center";ctx.fillText(b.lines.length+" linhas",b.x,b.y-b.r-9);}});
  ctx.restore();
 }
}
