import "./style.css";

const app=document.querySelector("#app");
const colors=["#2dd4bf","#60a5fa","#f472b6","#f59e0b","#a78bfa","#34d399","#fb7185","#22d3ee"];
let nextId=5;
let participants=[
{id:1,name:"Brasil",emoji:"🇧🇷",image:""},
{id:2,name:"Argentina",emoji:"🇦🇷",image:""},
{id:3,name:"Japão",emoji:"🇯🇵",image:""},
{id:4,name:"França",emoji:"🇫🇷",image:""}
];
let settings={speed:3.2,damage:18,hp:100,ballSize:25};
let game=null,raf=0,last=0;

app.innerHTML=`
<header><div><span class="eyebrow">SIMULADOR DE BATALHAS</span><h1>Battle Arena</h1><p>Crie participantes com logos, fotos, bandeiras ou emojis e deixe a arena decidir o campeão.</p></div><div class="status">● PRONTO</div></header>
<main>
<section class="panel">
<div class="panel-head"><div><h2>Participantes</h2><p>Adicione quantos quiser e personalize cada competidor.</p></div><button id="add">+ Adicionar</button></div>
<div id="participants"></div>
<div class="settings">
<label>Velocidade <b id="speedOut"></b><input id="speed" type="range" min="1" max="7" step=".1"></label>
<label>Vida inicial <b id="hpOut"></b><input id="hp" type="range" min="30" max="300" step="10"></label>
<label>Dano <b id="damageOut"></b><input id="damage" type="range" min="5" max="50" step="1"></label>
<label>Tamanho <b id="sizeOut"></b><input id="ballSize" type="range" min="16" max="38" step="1"></label>
</div>
<div class="actions"><button class="primary" id="start">▶ INICIAR BATALHA</button><button id="reset">↻ Reiniciar</button></div>
</section>
<section class="game">
<div class="scorebar"><span id="alive">4 participantes</span><span id="gameState">Aguardando batalha</span></div>
<div class="canvas-wrap"><canvas id="arena"></canvas><div id="winner" class="winner hidden"></div></div>
<p class="hint">As lâminas giratórias causam dano. O último participante vivo vence.</p>
</section>
</main>`;

const canvas=document.querySelector("#arena"),ctx=canvas.getContext("2d"),wrap=canvas.parentElement;
function resize(){const w=Math.min(wrap.clientWidth,720); canvas.width=w*devicePixelRatio;canvas.height=w*devicePixelRatio;canvas.style.width=w+"px";canvas.style.height=w+"px";ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);draw();}
new ResizeObserver(resize).observe(wrap);

function renderParticipants(){
 const box=document.querySelector("#participants");box.innerHTML="";
 participants.forEach((p,i)=>{
  const row=document.createElement("div");row.className="person";
  row.innerHTML=`<div class="avatar">${p.image?`<img src="${p.image}">`:`<span>${p.emoji}</span>`}</div><div class="fields"><input class="name" value="${esc(p.name)}" aria-label="Nome"><div class="mini"><label class="upload">📷 Logo<input type="file" accept="image/*"></label><input class="emoji" value="${p.emoji}" maxlength="8" aria-label="Emoji"></div></div><button class="remove" title="Remover">×</button>`;
  row.querySelector(".name").addEventListener("input",e=>p.name=e.target.value||"Sem nome");
  row.querySelector(".emoji").addEventListener("input",e=>{p.emoji=e.target.value||"⚪";renderParticipants()});
  row.querySelector(".remove").addEventListener("click",()=>{if(participants.length<=2)return;participants=participants.filter(x=>x.id!==p.id);renderParticipants();draw()});
  row.querySelector('input[type=file]').addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{p.image=r.result;renderParticipants();draw()};r.readAsDataURL(f)});
  box.append(row);
 });
 document.querySelector("#alive").textContent=participants.length+" participantes";
}
function esc(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
document.querySelector("#add").onclick=()=>{participants.push({id:nextId++,name:"Participante "+(participants.length+1),emoji:"⚔️",image:""});renderParticipants();draw()};
["speed","hp","damage","ballSize"].forEach(k=>{const el=document.querySelector("#"+k),out=document.querySelector("#"+k+"Out");el.value=settings[k];out.textContent=settings[k];el.oninput=()=>{settings[k]=+el.value;out.textContent=el.value}});
document.querySelector("#start").onclick=startGame;
document.querySelector("#reset").onclick=()=>{cancelAnimationFrame(raf);game=null;last=0;document.querySelector("#winner").classList.add("hidden");document.querySelector("#gameState").textContent="Aguardando batalha";draw()};

function startGame(){
 cancelAnimationFrame(raf);last=0;document.querySelector("#winner").classList.add("hidden");
 const size=parseFloat(canvas.style.width)||500,c=size/2,R=size*.44;
 game=participants.map((p,i)=>{
  const a=(i/participants.length)*Math.PI*2,rad=Math.min(settings.ballSize,Math.max(13,R*.55/Math.sqrt(participants.length)));
  const va=a+Math.PI*.63+(Math.random()-.5);
  return {...p,x:c+Math.cos(a)*R*.58,y:c+Math.sin(a)*R*.58,vx:Math.cos(va)*settings.speed,vy:Math.sin(va)*settings.speed,r:rad,hp:settings.hp,maxHp:settings.hp,angle:Math.random()*6.28,alive:true,hit:0,img:null};
 });
 game.forEach(b=>{if(b.image){b.img=new Image();b.img.src=b.image}});
 document.querySelector("#gameState").textContent="Batalha em andamento";
 raf=requestAnimationFrame(loop);
}
function loop(t){if(!last)last=t;const dt=Math.min(2,(t-last)/16.67);last=t;update(dt);draw();const alive=game.filter(b=>b.alive);document.querySelector("#alive").textContent=alive.length+" vivos";if(alive.length>1)raf=requestAnimationFrame(loop);else if(alive.length===1)finish(alive[0]);}
function update(dt){
 const size=parseFloat(canvas.style.width),c=size/2,R=size*.44;
 for(const b of game){if(!b.alive)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=.055*dt;b.hit=Math.max(0,b.hit-dt);const dx=b.x-c,dy=b.y-c,d=Math.hypot(dx,dy);if(d+b.r>R){const nx=dx/d,ny=dy/d,dot=b.vx*nx+b.vy*ny;b.vx-=2*dot*nx;b.vy-=2*dot*ny;b.x=c+nx*(R-b.r-1);b.y=c+ny*(R-b.r-1)}}
 for(let i=0;i<game.length;i++)for(let j=i+1;j<game.length;j++){const a=game[i],b=game[j];if(!a.alive||!b.alive)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,min=a.r+b.r;if(d<min){const nx=dx/d,ny=dy/d,over=min-d;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){a.vx+=rel*nx;a.vy+=rel*ny;b.vx-=rel*nx;b.vy-=rel*ny}}
   bladeHit(a,b);bladeHit(b,a);
 }
}
function bladeHit(att,target){if(att.hit>0)return;const len=att.r*2.4,tx=att.x+Math.cos(att.angle)*len,ty=att.y+Math.sin(att.angle)*len;const vx=tx-att.x,vy=ty-att.y,wx=target.x-att.x,wy=target.y-att.y,t=Math.max(0,Math.min(1,(wx*vx+wy*vy)/(vx*vx+vy*vy)));const px=att.x+t*vx,py=att.y+t*vy;if(Math.hypot(target.x-px,target.y-py)<target.r){target.hp-=settings.damage;att.hit=8;if(target.hp<=0)target.alive=false}}
function finish(w){document.querySelector("#gameState").textContent="Batalha finalizada";const el=document.querySelector("#winner");el.innerHTML=`<span>🏆 CAMPEÃO</span><strong>${esc(w.name)}</strong><small>${w.emoji}</small>`;el.classList.remove("hidden")}
function draw(){
 const size=parseFloat(canvas.style.width)||Math.min(wrap.clientWidth,720),c=size/2,R=size*.44;ctx.clearRect(0,0,size,size);
 const g=ctx.createRadialGradient(c,c,R*.15,c,c,R);g.addColorStop(0,"#161b2a");g.addColorStop(1,"#080a10");ctx.beginPath();ctx.arc(c,c,R,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle="#323a4d";ctx.lineWidth=4;ctx.stroke();
 ctx.save();ctx.beginPath();ctx.arc(c,c,R-3,0,Math.PI*2);ctx.clip();
 const balls=game||participants.map((p,i)=>{const a=i/participants.length*6.28;return {...p,x:c+Math.cos(a)*R*.55,y:c+Math.sin(a)*R*.55,r:Math.min(settings.ballSize,30),hp:settings.hp,maxHp:settings.hp,angle:a,alive:true}});
 balls.forEach((b,i)=>{if(!b.alive)return;const len=b.r*2.4;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.cos(b.angle)*len,b.y+Math.sin(b.angle)*len);ctx.strokeStyle=colors[i%colors.length];ctx.lineWidth=6;ctx.lineCap="round";ctx.stroke();
 ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.28);ctx.fillStyle="#111827";ctx.fill();ctx.strokeStyle=colors[i%colors.length];ctx.lineWidth=3;ctx.stroke();
 if(b.img&&b.img.complete){ctx.save();ctx.beginPath();ctx.arc(b.x,b.y,b.r-3,0,6.28);ctx.clip();ctx.drawImage(b.img,b.x-b.r,b.y-b.r,b.r*2,b.r*2);ctx.restore()}else{ctx.font=(b.r*1.15)+"px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(b.emoji,b.x,b.y+1)}
 if(game){const w=b.r*2.2;ctx.fillStyle="#242a38";ctx.fillRect(b.x-w/2,b.y-b.r-11,w,4);ctx.fillStyle=colors[i%colors.length];ctx.fillRect(b.x-w/2,b.y-b.r-11,w*Math.max(0,b.hp/b.maxHp),4)}
 });
 ctx.restore();
}
renderParticipants();resize();
