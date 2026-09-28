import {COLORS} from "./config.js";

export class BattleArena{
 constructor(canvas,wrap,{onState,onAlive,onWinner}={}){
  this.canvas=canvas;this.wrap=wrap;this.ctx=canvas.getContext("2d");this.game=null;this.raf=0;this.last=0;this.participants=[];this.settings={};this.onState=onState;this.onAlive=onAlive;this.onWinner=onWinner;
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(wrap);
 }
 setPreview(participants,settings){this.participants=participants;this.settings=settings;this.draw();}
 resize(){const w=Math.min(this.wrap.clientWidth,720);const dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=w*dpr;this.canvas.height=w*dpr;this.canvas.style.width=w+"px";this.canvas.style.height=w+"px";this.ctx.setTransform(dpr,0,0,dpr,0,0);this.draw();}
 start(participants,settings){this.stop(false);this.participants=participants;this.settings={...settings};this.last=0;const size=parseFloat(this.canvas.style.width)||500,c=size/2,R=size*.44;
  this.game=participants.map((p,i)=>{const a=i/participants.length*Math.PI*2,rad=Math.min(settings.ballSize,Math.max(13,R*.55/Math.sqrt(participants.length))),va=a+Math.PI*.63+(Math.random()-.5);const b={...p,x:c+Math.cos(a)*R*.58,y:c+Math.sin(a)*R*.58,vx:Math.cos(va)*settings.speed,vy:Math.sin(va)*settings.speed,r:rad,hp:settings.hp,maxHp:settings.hp,angle:Math.random()*Math.PI*2,alive:true,hit:0,img:null};if(b.image){b.img=new Image();b.img.src=b.image}return b;});
  this.onState?.("Batalha em andamento");this.onAlive?.(this.game.length,true);this.raf=requestAnimationFrame(t=>this.loop(t));
 }
 stop(clear=true){cancelAnimationFrame(this.raf);this.last=0;if(clear)this.game=null;}
 reset(){this.stop();this.onState?.("Aguardando batalha");this.onAlive?.(this.participants.length,false);this.draw();}
 loop(t){if(!this.game)return;if(!this.last)this.last=t;const dt=Math.min(2,(t-this.last)/16.67);this.last=t;this.update(dt);this.draw();const alive=this.game.filter(b=>b.alive);this.onAlive?.(alive.length,true);if(alive.length>1)this.raf=requestAnimationFrame(n=>this.loop(n));else if(alive.length===1){this.onState?.("Batalha finalizada");this.onWinner?.(alive[0]);}}
 update(dt){const size=parseFloat(this.canvas.style.width),c=size/2,R=size*.44;
  for(const b of this.game){if(!b.alive)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=.055*dt;b.hit=Math.max(0,b.hit-dt);const dx=b.x-c,dy=b.y-c,d=Math.hypot(dx,dy)||1;if(d+b.r>R){const nx=dx/d,ny=dy/d,dot=b.vx*nx+b.vy*ny;b.vx-=2*dot*nx;b.vy-=2*dot*ny;b.x=c+nx*(R-b.r-1);b.y=c+ny*(R-b.r-1);}}
  for(let i=0;i<this.game.length;i++)for(let j=i+1;j<this.game.length;j++){const a=this.game[i],b=this.game[j];if(!a.alive||!b.alive)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,min=a.r+b.r;if(d<min){const nx=dx/d,ny=dy/d,over=min-d;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){a.vx+=rel*nx;a.vy+=rel*ny;b.vx-=rel*nx;b.vy-=rel*ny;}}this.bladeHit(a,b);this.bladeHit(b,a);}
 }
 bladeHit(att,target){if(att.hit>0)return;const len=att.r*2.4,tx=att.x+Math.cos(att.angle)*len,ty=att.y+Math.sin(att.angle)*len,vx=tx-att.x,vy=ty-att.y,wx=target.x-att.x,wy=target.y-att.y,t=Math.max(0,Math.min(1,(wx*vx+wy*vy)/(vx*vx+vy*vy))),px=att.x+t*vx,py=att.y+t*vy;if(Math.hypot(target.x-px,target.y-py)<target.r){target.hp-=this.settings.damage;att.hit=8;if(target.hp<=0)target.alive=false;}}
 draw(){const size=parseFloat(this.canvas.style.width)||Math.min(this.wrap.clientWidth,720);if(!size)return;const ctx=this.ctx,c=size/2,R=size*.44;ctx.clearRect(0,0,size,size);const g=ctx.createRadialGradient(c,c,R*.15,c,c,R);g.addColorStop(0,"#161b2a");g.addColorStop(1,"#080a10");ctx.beginPath();ctx.arc(c,c,R,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle="#323a4d";ctx.lineWidth=4;ctx.stroke();ctx.save();ctx.beginPath();ctx.arc(c,c,R-3,0,Math.PI*2);ctx.clip();
  const list=this.game||this.participants.map((p,i)=>{const a=i/Math.max(1,this.participants.length)*Math.PI*2;return {...p,x:c+Math.cos(a)*R*.55,y:c+Math.sin(a)*R*.55,r:Math.min(this.settings.ballSize||25,30),hp:this.settings.hp||100,maxHp:this.settings.hp||100,angle:a,alive:true};});
  list.forEach((b,i)=>{if(!b.alive)return;const color=COLORS[i%COLORS.length],len=b.r*2.4;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.cos(b.angle)*len,b.y+Math.sin(b.angle)*len);ctx.strokeStyle=color;ctx.lineWidth=6;ctx.lineCap="round";ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle="#111827";ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();if(b.img&&b.img.complete){ctx.save();ctx.beginPath();ctx.arc(b.x,b.y,b.r-3,0,Math.PI*2);ctx.clip();ctx.drawImage(b.img,b.x-b.r,b.y-b.r,b.r*2,b.r*2);ctx.restore();}else{ctx.font=b.r*1.15+"px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(b.emoji,b.x,b.y+1);}if(this.game){const w=b.r*2.2;ctx.fillStyle="#242a38";ctx.fillRect(b.x-w/2,b.y-b.r-11,w,4);ctx.fillStyle=color;ctx.fillRect(b.x-w/2,b.y-b.r-11,w*Math.max(0,b.hp/b.maxHp),4);}});
  ctx.restore();
 }
}
