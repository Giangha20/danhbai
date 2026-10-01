const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

const savedCoins=Number(localStorage.getItem("cardGameCoins"));
const savedSettings=(()=>{try{return JSON.parse(localStorage.getItem("cardGameSettings")||"null")}catch(e){return null}})();
const state={
 game:"tienlen", diff:"easy", coins:Number.isFinite(savedCoins)?savedCoins:1000, round:1, settings:Object.assign({music:true,volume:35,fx:"full",theme:"dark",playerName:"Bạn",botNames:[]},savedSettings||{}),
 tl:{players:[],hand:[],selected:[],last:[],lastPlayer:-1,turn:0,passes:0},
 war:{players:[],turn:0,rounds:0,score:0},
 memory:{cards:[],revealed:[],matched:[],moves:0,lock:false},
 three:{players:[],round:0,score:0}
};

const suits=["♠","♥","♦","♣"], ranks=["3","4","5","6","7","8","9","10","J","Q","K","A","2"];
function deck(){
 const d=[]; for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({s:suits[s],r:ranks[r],v:r+3,id:s+"-"+r});
 return d;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function cardText(c){return c.r+c.s}
function cardEl(c,cls=""){
 const b=document.createElement("button"); b.type="button"; b.className="card "+cls+((c.s==="♥"||c.s==="♦")?" red":""); b.textContent=cardText(c); return b;
}
function rank(c){return c.v}
function sortCards(a){return a.sort((x,y)=>x.v-y.v||suits.indexOf(x.s)-suits.indexOf(y.s))}
function show(id,on=true){$(id).classList.toggle("hidden",!on)}
const LOGIN_REWARDS=[100,200,350,500,600,700,1000];
const BOT_NAME_POOL=["Minh","Lan","Huy","An","Linh","Nam","Mai","Khang","Vy","Quân","Trang","Phúc","Duy","Thảo","Tùng"];
function randomBotNames(){return shuffle([...BOT_NAME_POOL]).slice(0,4)}
if(!Array.isArray(state.settings.botNames)||state.settings.botNames.length!==4)state.settings.botNames=randomBotNames();
function todayKey(){return new Date().toISOString().slice(0,10)}
function dateDiff(a,b){const A=new Date(a+"T00:00:00"),B=new Date(b+"T00:00:00");return Math.round((B-A)/86400000)}
function saveLocalState(){localStorage.setItem("cardGameCoins",String(state.coins));localStorage.setItem("cardGameSettings",JSON.stringify(state.settings));}
function claimDailyLogin(){
 const today=todayKey(), last=localStorage.getItem("cardGameLastLogin"), storedDay=Number(localStorage.getItem("cardGameLoginDay")||0);
 let day=storedDay||0, amount=0, claimed=false;
 if(last===today){claimed=true;day=Math.min(Math.max(day,1),7);}
 else {
   const diff=last?dateDiff(last,today):null;
   if(diff===1) day=day>=7?1:day+1; else day=1;
   amount=LOGIN_REWARDS[day-1]; state.coins+=amount;
   localStorage.setItem("cardGameLastLogin",today);localStorage.setItem("cardGameLoginDay",String(day));saveLocalState();
 }
 const txt=$("#loginRewardText"),amt=$("#loginRewardAmount");
 if(txt&&amt){txt.textContent=claimed?`Đã nhận thưởng ngày ${day}/7 hôm nay.`:`Đăng nhập ngày ${day}/7 — đã cộng ${amount} xu.`;amt.textContent=`+${claimed?0:amount} xu`;}
 $("#coins")&&($("#coins").textContent=state.coins);
}
claimDailyLogin();

// Nạp xu ảo mô phỏng: không kết nối thanh toán và không dùng cho cá cược.
document.querySelectorAll("[data-topup]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const amount=Math.max(0,Number(btn.dataset.topup)||0);
    if(!amount)return;
    state.coins+=amount;
    saveLocalState();
    if($("#coins"))$("#coins").textContent=state.coins;
    const status=$("#topupStatus");
    if(status)status.textContent=`Đã cộng +${amount.toLocaleString("vi-VN")} xu ảo.`;
  });
});


$$(".game-choice").forEach(b=>b.onclick=()=>{$$(".game-choice").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.game=b.dataset.game});
$$(".diff-choice").forEach(b=>b.onclick=()=>{$$(".diff-choice").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.diff=b.dataset.diff});
$("#startGame").onclick=()=>startGame();
$("#newGameTop").onclick=()=>{show("#menu",true);show("#gameArea",false);closeModal()};
$("#playAgain").onclick=()=>{closeModal();startGame()};
$("#backMenu").onclick=()=>{closeModal();show("#gameArea",false);show("#menu",true)};


const settingsModal=$("#settingsModal"), music=$("#chillMusic");
let humanTurnTimer=null,humanTurnDeadline=0;
function lockLandscape(){try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock("landscape").catch(()=>{})}catch(e){}}
function ensureAudio(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();return audioCtx}catch(e){return null}}
function tone(freq,duration=.22,type="sine",gain=.05,when=0){const c=ensureAudio();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,c.currentTime+when);g.gain.linearRampToValueAtTime(gain*(state.settings.volume/100),c.currentTime+when+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+when+duration);o.connect(g);g.connect(c.destination);o.start(c.currentTime+when);o.stop(c.currentTime+when+duration+.03)}
function soundLose(){if(state.settings.fx!=="off"){tone(220,.18,"sawtooth",.07);tone(165,.28,"sawtooth",.06,.13)}}
function soundWin(){if(state.settings.fx!=="off"){tone(523,.16,"triangle",.06);tone(659,.16,"triangle",.06,.13);tone(784,.32,"triangle",.07,.26)}}
function soundChop(){if(state.settings.fx!=="off"){tone(740,.12,"square",.06);tone(988,.22,"square",.06,.12)}}
function clearHumanTimer(){if(humanTurnTimer){clearInterval(humanTurnTimer);humanTurnTimer=null}}
function startHumanTimer(){clearHumanTimer();humanTurnDeadline=Date.now()+15000;updateHumanTimer();humanTurnTimer=setInterval(()=>{updateHumanTimer();if(Date.now()>=humanTurnDeadline){clearHumanTimer();autoHumanMove()}},200)}
function updateHumanTimer(){const el=$("#tlTimer");if(el){const sec=Math.max(0,Math.ceil((humanTurnDeadline-Date.now())/1000));el.textContent=`⏱️ ${sec}s`}}
function autoHumanMove(){if(state.tl.turn!==0)return;const chosen=state.tl.selected.map(i=>state.tl.hand[i]);if(validMove(chosen,state.tl.last)){playHumanSelection();return}if(!state.tl.last.length){const one=chooseAI({hand:state.tl.hand});if(one){state.tl.selected=one.map(c=>state.tl.hand.findIndex(x=>x.id===c.id));playHumanSelection();return}}state.tl.selected=[];state.tl.turn=1;renderTL();setStatusTL("Hết 15 giây — bạn bỏ lượt.");setTimeout(aiTL,aiThinkDelay())}
let audioCtx=null, musicTimer=null;
function closeSettings(){settingsModal.classList.add("hidden")}
function openSettings(){
 $("#musicToggle").checked=state.settings.music;
 $("#volumeRange").value=state.settings.volume;$("#volumeValue").textContent=state.settings.volume+"%";
 $("#fxMode").value=state.settings.fx;$("#themeMode").value=state.settings.theme;
 $("#playerName").value=state.settings.playerName||"Bạn";
 const bg=$("#botNames"); if(bg){bg.innerHTML=""; state.settings.botNames.forEach((n,i)=>{const lab=document.createElement("label");lab.innerHTML=`Máy ${i+1}<input data-bot-name="${i}" maxlength="20" value="${String(n).replace(/"/g,"&quot;")}">`;bg.appendChild(lab)})}
 settingsModal.classList.remove("hidden");
}
function applyTheme(){
 document.body.classList.remove("theme-midnight","theme-emerald");
 if(state.settings.theme==="midnight")document.body.classList.add("theme-midnight");
 if(state.settings.theme==="emerald")document.body.classList.add("theme-emerald");
}
function ambientMusic(){
 if(!state.settings.music)return;
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==="suspended")audioCtx.resume();
  if(musicTimer)clearInterval(musicTimer);
  const notes=[196,246.94,293.66,246.94,220,261.63,329.63,261.63];
  let i=0;
  musicTimer=setInterval(()=>{
   if(!state.settings.music||!audioCtx)return;
   const o=audioCtx.createOscillator(),g=audioCtx.createGain();
   o.type="sine";o.frequency.value=notes[i++%notes.length];
   g.gain.setValueAtTime(0,audioCtx.currentTime);
   g.gain.linearRampToValueAtTime((state.settings.volume/100)*0.018,audioCtx.currentTime+.08);
   g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+1.7);
   o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+1.8);
  },700);
 }catch(e){}
}
function playCardSound(){
 if(state.settings.fx==="off")return;
 try{
  const c=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  const o=c.createOscillator(),g=c.createGain();o.type="triangle";o.frequency.value=420;
  g.gain.setValueAtTime(.04,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.13);
  o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.14);
 }catch(e){}
}
function animatePlayedCards(cards){
 if(state.settings.fx==="off")return;
 const table=$("#lastPlay")||$("#warBoard .war-table")||$("#tienlenBoard .table");
 if(!table)return;
 const rect=table.getBoundingClientRect();
 cards.forEach((c,i)=>{
  const el=document.createElement("div");el.className="play-fly "+((c.s==="♥"||c.s==="♦")?"red":"");
  el.textContent=cardText(c);
  el.style.left=(rect.width/2-29+i*5)+"px";el.style.top="65px";
  el.style.setProperty("--fromx",(Math.random()*160-80)+"px");
  el.style.setProperty("--fromy",(180+Math.random()*90)+"px");
  el.style.setProperty("--rot",(Math.random()*30-15)+"deg");
  table.style.position="relative";table.appendChild(el);
  setTimeout(()=>el.remove(),700);
 });
 playCardSound();
}
function dealAnimation(){
 if(state.settings.fx==="off")return;
 const table=$("#tienlenBoard .table"),r=table.getBoundingClientRect();
 for(let i=0;i<8;i++){
  const c=document.createElement("div");c.className="deal-card";
  c.textContent="★";c.style.left=(r.width/2-26)+"px";c.style.top="100px";
  c.style.setProperty("--sx",(Math.random()*420-210)+"px");
  c.style.setProperty("--sy",(-180-Math.random()*100)+"px");
  c.style.setProperty("--rot",(Math.random()*70-35)+"deg");
  table.appendChild(c);setTimeout(()=>c.remove(),700+i*35);
 }
}
$("#settingsBtn").onclick=()=>{openSettings();};
$("#closeSettings").onclick=closeSettings;
$("#musicToggle").onchange=()=>{
 state.settings.music=$("#musicToggle").checked;
 saveLocalState();
 if(state.settings.music){ambientMusic();}else if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
};
$("#closeSettings2").onclick=()=>{
 state.settings.music=$("#musicToggle").checked;state.settings.volume=+$("#volumeRange").value;
 state.settings.fx=$("#fxMode").value;state.settings.theme=$("#themeMode").value;state.settings.playerName=($("#playerName").value||"Bạn").trim().slice(0,20)||"Bạn";state.settings.botNames=[...document.querySelectorAll("[data-bot-name]")].map((el,i)=>(el.value||`Máy ${i+1}`).trim().slice(0,20)||`Máy ${i+1}`);
 saveLocalState();applyTheme();closeSettings();if(state.settings.music)ambientMusic();else if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
};
$("#volumeRange").oninput=e=>$("#volumeValue").textContent=e.target.value+"%";
applyTheme();

function startGame(){
 lockLandscape();
 show("#menu",false);show("#gameArea",true);
 $("#gameName").textContent={tienlen:"Tiến lên miền Nam",war:"Chiến bài",memory:"Nhớ bài",threecard:"3 cây"}[state.game]||"Game";
 $("#difficultyName").textContent={easy:"Dễ",normal:"Bình thường",hard:"Khó"}[state.diff];
 $("#roundNo").textContent=state.round;$("#coins").textContent=state.coins;
 show("#tienlenBoard",state.game==="tienlen");
 show("#warBoard",state.game==="war");
 show("#memoryBoard",state.game==="memory");
 show("#threecardBoard",state.game==="threecard");
 if(state.game==="tienlen")startTL();
 else if(state.game==="war")startWar();
 else if(state.game==="threecard")startThree();
 else startMemory();
}


function aiThinkDelay(){
 const ranges={easy:[1800,2800],normal:[2500,3800],hard:[3200,4800]};
 const [min,max]=ranges[state.diff]||ranges.easy;
 return Math.round(min+Math.random()*(max-min));
}

function startTL(){
 dealAnimation();
 if(state.settings.music)ambientMusic();
 const d=shuffle(deck());state.tl.hand=sortCards(d.splice(0,10));state.tl.players=[
 {name:state.settings.playerName||"Bạn",hand:state.tl.hand},
 {name:state.settings.botNames[0],hand:d.splice(0,10)},
 {name:state.settings.botNames[1],hand:d.splice(0,10)},
 {name:state.settings.botNames[2],hand:d.splice(0,10)},
 {name:state.settings.botNames[3],hand:d.splice(0,10)}
 ];
 state.tl.selected=[];state.tl.last=[];state.tl.lastPlayer=-1;state.tl.passes=0;
 state.tl.turn=state.tl.players.findIndex(p=>p.hand.some(c=>c.v===3&&c.s==="♠"));
 if(state.tl.turn<0)state.tl.turn=0;
 renderTL();setStatusTL();
 if(state.tl.turn!==0)setTimeout(aiTL,aiThinkDelay()); else startHumanTimer();
}
function setStatusTL(msg){
 $("#tlTurn").textContent=msg||("Lượt: "+state.tl.players[state.tl.turn].name);
}
function renderTL(){
 $("#tlCount").textContent=state.tl.hand.length;$("#coins").textContent=state.coins; if(state.tl.turn===0&&!humanTurnTimer)startHumanTimer(); else if(state.tl.turn!==0)clearHumanTimer();
 const hand=$("#tlHand");hand.innerHTML="";
 state.tl.hand.forEach((c,i)=>{const b=cardEl(c);if(state.tl.selected.includes(i))b.classList.add("selected");b.onclick=()=>{const k=state.tl.selected.indexOf(i);k>=0?state.tl.selected.splice(k,1):state.tl.selected.push(i);renderTL()};hand.appendChild(b)});
 const ops=$("#tlOpponents");ops.innerHTML="";
 state.tl.players.slice(1).forEach((p,idx)=>{const x=document.createElement("div");x.className=`opponent seat seat-${idx+1}`;const sample=p.hand[0];x.innerHTML=`<b>${p.name}</b><div class="single-opponent-card mini-card" aria-label="Một lá bài của ${p.name}">${sample?"": ""}</div><small>Còn ${p.hand.length} lá</small>`;ops.appendChild(x)});
 const lp=$("#lastPlay");lp.innerHTML=state.tl.last.length?state.tl.last.map(c=>cardText(c)).join("  "):"Chưa có lượt đánh";
}
function validMove(cards,last){
 if(!cards.length)return false;
 const groups=combo(cards);
 if(!groups)return false;
 if(!last.length)return true;
 const prev=combo(last); if(!prev)return false;
 if(groups.type===prev.type&&groups.size===prev.size)return groups.power>prev.power;
 if(groups.type==="four"&&prev.type==="single"&&last[0].r==="2")return true;
 if(groups.type==="pairrun"&&prev.type==="single"&&last[0].r==="2"&&groups.size>=3)return true;
 return false;
}
function combo(cs){
 if(!cs.length)return null; const a=sortCards([...cs]), n=a.length;
 const cnt={};a.forEach(c=>cnt[c.v]=(cnt[c.v]||0)+1);
 const vals=Object.keys(cnt).map(Number).sort((x,y)=>x-y);
 if(n===1)return {type:"single",size:1,power:a[0].v};
 if(n===2&&Object.values(cnt).includes(2))return {type:"pair",size:2,power:a[1].v};
 if(n===3&&Object.values(cnt).includes(3))return {type:"triple",size:3,power:a[2].v};
 if(n===4&&Object.values(cnt).includes(4))return {type:"four",size:4,power:a[3].v};
 if(n>=3&&vals.length===n&&vals[n-1]-vals[0]===n-1&&!vals.includes(15))return {type:"straight",size:n,power:vals[n-1]};
 if(n>=6&&n%2===0&&vals.length===n/2&&vals.every(v=>cnt[v]===2)&&vals[vals.length-1]-vals[0]===vals.length-1)return {type:"pairrun",size:n,power:vals[vals.length-1]};
 return null;
}
function chooseAI(p){
 const h=sortCards(p.hand),last=state.tl.last;
 let candidates=[];
 for(let i=0;i<h.length;i++){
  const one=[h[i]];if(validMove(one,last))candidates.push(one);
 }
 for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++){const a=[h[i],h[j]];if(validMove(a,last))candidates.push(a)}
 for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++)for(let k=j+1;k<h.length;k++){const a=[h[i],h[j],h[k]];if(validMove(a,last))candidates.push(a)}
 for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++)for(let k=j+1;k<h.length;k++)for(let l=k+1;l<h.length;l++){const a=[h[i],h[j],h[k],h[l]];if(validMove(a,last))candidates.push(a)}
 if(!last.length && state.diff==="easy" && Math.random()<.45)return [h[Math.floor(Math.random()*h.length)]];
 if(!candidates.length)return null;
 candidates.sort((a,b)=>a.length-b.length||combo(a).power-combo(b).power);
 if(state.diff==="easy")return candidates[Math.floor(Math.random()*Math.min(candidates.length,3))];
 if(state.diff==="normal")return candidates[0];
 return candidates[0];
}
function aiTL(){
 if(state.tl.turn===0)return;
 const p=state.tl.players[state.tl.turn],m=chooseAI(p);
 if(m){if(state.tl.last.some(c=>c.r==="2") && (combo(m)?.type==="four" || combo(m)?.type==="pairrun"))soundChop();animatePlayedCards(m);p.hand=p.hand.filter(c=>!m.some(x=>x.id===c.id));state.tl.last=m;state.tl.lastPlayer=state.tl.turn;state.tl.passes=0;$("#lastPlay").innerHTML=m.map(cardText).join("  ")}
 else{state.tl.passes++;if(state.tl.passes>=state.tl.players.length-1){state.tl.last=[];state.tl.passes=0}}
 if(!p.hand.length){endGame(p.name+" thắng Tiến lên!");return}
 state.tl.turn=(state.tl.turn+1)%5;renderTL();setStatusTL(m?`Lượt: ${state.tl.players[state.tl.turn].name}`:`${p.name} bỏ lượt`);
 setTimeout(aiTL,aiThinkDelay());
}
function playHumanSelection(){
 if(state.tl.turn!==0)return;
 const chosen=state.tl.selected.map(i=>state.tl.hand[i]);
 if(!validMove(chosen,state.tl.last)){setStatusTL("Bộ bài không hợp lệ hoặc không chặn được lượt trước.");return}
 clearHumanTimer();
 const hasTwo=state.tl.last.some(c=>c.r==="2") && (combo(chosen)?.type==="four" || combo(chosen)?.type==="pairrun");
 if(hasTwo)soundChop();
 animatePlayedCards(chosen);state.tl.hand=state.tl.hand.filter((c,i)=>!state.tl.selected.includes(i));state.tl.players[0].hand=state.tl.hand;
 state.tl.last=chosen;state.tl.lastPlayer=0;state.tl.selected=[];state.tl.passes=0;
 if(!state.tl.hand.length){endGame("Bạn thắng Tiến lên!");return}
 state.tl.turn=1;renderTL();setStatusTL("Máy đang suy nghĩ...");setTimeout(aiTL,aiThinkDelay());
}
$("#tlPlay").onclick=()=>playHumanSelection();
$("#tlPass").onclick=()=>{if(state.tl.turn===0){clearHumanTimer();state.tl.passes++;state.tl.turn=1;state.tl.selected=[];renderTL();setStatusTL("Bạn bỏ lượt.");setTimeout(aiTL,aiThinkDelay())}};
$("#tlSort").onclick=()=>{state.tl.hand=sortCards(state.tl.hand);state.tl.players[0].hand=state.tl.hand;renderTL()};

function handScore(h){
 const ranks=h.map(c=>c.v);let cnt={};ranks.forEach(v=>cnt[v]=(cnt[v]||0)+1);
 if(Object.values(cnt).includes(3)&&Object.values(cnt).includes(1))return 3;
 if(Object.values(cnt).includes(3))return 2;
 if(Object.values(cnt).includes(2))return 1;
 return Math.max(...ranks.map(v=>v===14?1:v));
}
function liengName(h){
 const cnt={};h.forEach(c=>cnt[c.v]=(cnt[c.v]||0)+1);
 if(new Set(h.map(c=>c.v)).size===1)return "Liêng";
 if(Object.values(cnt).includes(3))return "Sáp";
 if(Object.values(cnt).filter(x=>x===2).length)return "Đôi";
 if(h.every(c=>c.v>=11||c.v===14))return "Ảnh";
 return "Điểm";
}
function startWar(){
 const d=shuffle(deck());
 state.war.players=[d.slice(0,26),d.slice(26)];
 state.war.rounds=0;state.war.score=0;
 $("#warRoundStatus").textContent="Bạn và máy sẵn sàng. Nhấn Chia bài.";
 renderWar();
}
function renderWar(){
 $("#warYouCount").textContent=state.war.players[0]?.length||0;
 $("#warBotCount").textContent=state.war.players[1]?.length||0;
 $("#warRound").textContent=state.war.rounds;
 $("#warScore").textContent=state.war.score;
}
function playWarRound(){
 if(!state.war.players[0].length||!state.war.players[1].length){startWar();return}
 const a=state.war.players[0].shift(),b=state.war.players[1].shift();
 animatePlayedCards([a,b]);
 $("#warYouCard").textContent=cardText(a);$("#warBotCard").textContent=cardText(b);
 state.war.rounds++;
 if(a.v>b.v){state.war.players[0].push(a,b);state.war.score++;$("#warRoundStatus").textContent="Bạn thắng lượt này!"}
 else if(a.v<b.v){state.war.players[1].push(a,b);state.war.score--;$("#warRoundStatus").textContent="Máy thắng lượt này."}
 else {state.war.players[0].push(a);state.war.players[1].push(b);$("#warRoundStatus").textContent="Hòa lượt — mỗi bên giữ lá."}
 renderWar();
 if(!state.war.players[0].length||!state.war.players[1].length){
   const msg=state.war.players[0].length?"Bạn thắng Chiến bài!":"Máy thắng Chiến bài!";
   setTimeout(()=>endGame(msg),500);
 }
}

function threeValue(c){return Math.min(c.v,10)}
function threeTotal(hand){return hand.reduce((n,c)=>n+threeValue(c),0)%10}
function startThree(){
 const d=shuffle(deck()); state.three.players=[{name:state.settings.playerName||"Bạn",hand:d.splice(0,3)}];
 for(let i=0;i<4;i++)state.three.players.push({name:state.settings.botNames[i],hand:d.splice(0,3)});
 state.three.round=0;state.three.score=0;renderThree();$("#threeStatus").textContent="Nhấn Chia 3 cây để bắt đầu.";
}
function renderThree(){
 $("#threeScore").textContent=state.three.score;$("#threeRound").textContent=state.three.round;$("#threeYouName").textContent=state.settings.playerName||"Bạn";
 const cards=$("#threeYouCards");if(cards)cards.innerHTML=state.three.players[0]?.hand.map(c=>{const b=cardEl(c,"lieng-card");b.disabled=true;return b.outerHTML}).join("")||"";
 const ops=$("#threeOpponents");if(ops)ops.innerHTML=state.three.players.slice(1).map((p,idx)=>`<div class="opponent seat seat-${idx+1}"><b>${p.name}</b><div class="single-opponent-card mini-card" aria-label="Một lá bài của ${p.name}"></div><small>Còn ${p.hand.length} lá</small></div>`).join("");
 $("#threeYouTotal").textContent=state.three.players[0]?threeTotal(state.three.players[0].hand):0;
}
function dealThree(){
 const d=shuffle(deck());state.three.players=[{name:state.settings.playerName||"Bạn",hand:d.splice(0,3)}];for(let i=0;i<4;i++)state.three.players.push({name:state.settings.botNames[i],hand:d.splice(0,3)});
 state.three.round++;renderThree();$("#threeStatus").textContent="Máy đang tính điểm...";
 setTimeout(()=>{const vals=state.three.players.map(p=>threeTotal(p.hand));const best=Math.max(...vals);const winners=state.three.players.filter((p,i)=>vals[i]===best).map(p=>p.name);if(winners.includes(state.settings.playerName||"Bạn")){state.three.score++;soundWin();$("#threeStatus").textContent=`Bạn thắng! ${best} điểm.`}else{soundLose();$("#threeStatus").textContent=`${winners.join(", ")} thắng với ${best} điểm.`}renderThree()},aiThinkDelay());
}
$("#threeDeal").onclick=dealThree;$("#threeReset").onclick=startThree;

function startMemory(){
 const base=shuffle(deck()).slice(0,8);
 state.memory.cards=shuffle(base.flatMap((c,i)=>[{...c,key:i+"a"},{...c,key:i+"b"}]));
 state.memory.revealed=[];state.memory.matched=[];state.memory.moves=0;state.memory.lock=false;
 renderMemory();
}
function renderMemory(){
 const grid=$("#memoryGrid");if(!grid)return;grid.innerHTML="";
 state.memory.cards.forEach((c,i)=>{
   const b=document.createElement("button");b.type="button";b.className="memory-card";
   const open=state.memory.revealed.includes(i)||state.memory.matched.includes(i);
   b.classList.toggle("open",open);b.classList.toggle("matched",state.memory.matched.includes(i));
   b.innerHTML=open?`<span>${cardText(c)}</span>`:`<span>?</span>`;
   b.onclick=()=>memoryPick(i);grid.appendChild(b);
 });
 $("#memoryMoves").textContent=state.memory.moves;
 $("#memoryPairs").textContent=Math.floor(state.memory.matched.length/2);
}
function memoryPick(i){
 if(state.memory.lock||state.memory.matched.includes(i)||state.memory.revealed.includes(i))return;
 state.memory.revealed.push(i);renderMemory();
 if(state.memory.revealed.length<2)return;
 state.memory.moves++;state.memory.lock=true;
 const [a,b]=state.memory.revealed;
 setTimeout(()=>{
   if(state.memory.cards[a].v===state.memory.cards[b].v)state.memory.matched.push(a,b);
   state.memory.revealed=[];state.memory.lock=false;renderMemory();
   if(state.memory.matched.length===state.memory.cards.length)setTimeout(()=>endGame(`Bạn hoàn thành Nhớ bài trong ${state.memory.moves} lượt!`),300);
 },aiThinkDelay());
}

$("#warDeal").onclick=()=>playWarRound();
$("#warReset").onclick=()=>startWar();
$("#memoryReset").onclick=()=>startMemory();

function endGame(msg){clearHumanTimer(); if(msg.includes("Bạn thắng")||msg.includes("hoàn thành"))soundWin();else soundLose(); state.coins=Math.max(0,state.coins);$("#coins").textContent=state.coins;$("#resultTitle").textContent=msg.includes("thắng")||msg.includes("hoàn thành")?"🎉 Chiến thắng":"🏁 Kết quả";$("#resultText").textContent=msg;show("#resultModal",true)}
function closeModal(){show("#resultModal",false)}
