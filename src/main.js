import "./style.css";
import {BattleArena} from "./arena.js";
import {DEFAULT_PARTICIPANTS,DEFAULT_SETTINGS} from "./config.js";
import {escapeHtml,readImageFile} from "./utils.js";
import {renderShell} from "./ui.js";

const app=document.querySelector("#app");
let participants=structuredClone(DEFAULT_PARTICIPANTS);
let settings={...DEFAULT_SETTINGS};
let nextId=participants.length+1;

renderShell(app);

const winner=document.querySelector("#winner");
const arena=new BattleArena(document.querySelector("#arena"),document.querySelector(".canvas-wrap"),{
 onState:text=>document.querySelector("#gameState").textContent=text,
 onAlive:(count,running)=>document.querySelector("#alive").textContent=count+(running?" vivos":" participantes"),
 onWinner:p=>{winner.innerHTML=`<span>🏆 CAMPEÃO</span><strong>${escapeHtml(p.name)}</strong><small>${p.emoji}</small>`;winner.classList.remove("hidden");}
});

function refreshPreview(){arena.setPreview(participants,settings);}

function renderParticipants(){
 const box=document.querySelector("#participants");box.innerHTML="";
 participants.forEach(p=>{
  const row=document.createElement("div");row.className="person";
  row.innerHTML=`<div class="avatar">${p.image?`<img src="${p.image}" alt="">`:`<span>${p.emoji}</span>`}</div><div class="fields"><input class="name" value="${escapeHtml(p.name)}" aria-label="Nome do participante"><div class="mini"><label class="upload">📷 Logo<input type="file" accept="image/*"></label><input class="emoji" value="${p.emoji}" maxlength="8" aria-label="Emoji"></div></div><button class="remove" title="Remover" aria-label="Remover participante">×</button>`;
  row.querySelector(".name").addEventListener("input",e=>{p.name=e.target.value||"Sem nome";});
  row.querySelector(".emoji").addEventListener("change",e=>{p.emoji=e.target.value||"⚪";renderParticipants();refreshPreview();});
  row.querySelector(".remove").addEventListener("click",()=>{if(participants.length<=2)return;participants=participants.filter(x=>x.id!==p.id);renderParticipants();refreshPreview();});
  row.querySelector('input[type="file"]').addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{p.image=await readImageFile(file);renderParticipants();refreshPreview();}catch{alert("Não foi possível carregar essa imagem.");}});
  box.append(row);
 });
 document.querySelector("#alive").textContent=participants.length+" participantes";
}

document.querySelector("#add").addEventListener("click",()=>{participants.push({id:nextId++,name:"Participante "+(participants.length+1),emoji:"⚔️",image:""});renderParticipants();refreshPreview();});

["speed","startLines","maxLines","ballSize"].forEach(key=>{
 const input=document.querySelector("#"+key),output=document.querySelector("#"+key+"Out");
 input.value=settings[key];output.textContent=settings[key];
 input.addEventListener("input",()=>{settings[key]=Number(input.value);output.textContent=input.value;refreshPreview();});
});

const startButton=document.querySelector("#start");
function startBattle(event){event?.preventDefault();winner.classList.add("hidden");startButton.textContent="⚔️ BATALHA EM ANDAMENTO";arena.start(participants.map(p=>({...p})),{...settings});document.querySelector(".game").scrollIntoView({behavior:"smooth",block:"start"});}
startButton.addEventListener("click",startBattle);
document.querySelector("#reset").addEventListener("click",()=>{winner.classList.add("hidden");startButton.textContent="▶ INICIAR BATALHA";arena.reset();});

renderParticipants();
refreshPreview();
