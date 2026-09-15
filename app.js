const $ = (s) => document.querySelector(s);
const screens = { auth: $('#auth-screen'), menu: $('#menu-screen'), game: $('#game-screen') };
const SKINS = [['reef','Reef 🐠','hsl(188 90% 58%)'],['sunset','Sunset 🐡','hsl(22 90% 62%)'],['royal','Royal 🐟','hsl(260 80% 70%)'],['lime','Lime 🐠','hsl(92 75% 58%)'],['deep','Deep Sea 🦈','hsl(215 75% 62%)']];
const EVOS = [['FRY',1],['MINNOW',2.5],['CLIPPER',5],['HUNTER',9],['TITAN',15]];
const SAVE_KEY = 'fishArenaSave';
const defaultSave = {bestSize:1,bestEaten:0,skin:'reef',account:null};
let save = loadSave();
function loadSave(){ try { return {...defaultSave,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}; } catch { return {...defaultSave}; } }
function persist(){ try { localStorage.setItem(SAVE_KEY,JSON.stringify(save)); } catch {} }
function show(screen){ Object.values(screens).forEach(x=>x.classList.add('hidden')); screen.classList.remove('hidden'); }
function evoFor(size){ let e=EVOS[0]; for(const x of EVOS) if(size>=x[1]) e=x; return e; }
function renderMenu(){
  $('#best-size').textContent=Number(save.bestSize||1).toFixed(1);
  $('#best-eaten').textContent=save.bestEaten||0;
  $('#welcome').textContent=save.account ? `Signed in as ${save.account}` : 'Playing locally as guest';
  $('#skin-list').innerHTML=SKINS.map(([id,name])=>`<button type="button" class="skin ${save.skin===id?'selected':''}" data-skin="${id}">${name}</button>`).join('');
  document.querySelectorAll('[data-skin]').forEach(b=>b.addEventListener('click',()=>{save.skin=b.dataset.skin;persist();renderMenu();}));
}
function enterGuest(){ save.account='Guest'; persist(); renderMenu(); show(screens.menu); $('#room-status').textContent='Guest mode ready — progress saves on this device.'; }
function localAccount(){
  const email=$('#email').value.trim();
  const password=$('#password').value;
  if(!email || password.length<6){ $('#auth-status').textContent='Enter an email and a password with 6+ characters.'; return; }
  save.account=email; persist(); renderMenu(); show(screens.menu); $('#auth-status').textContent='';
}
$('#auth-form').addEventListener('submit',(e)=>{e.preventDefault();localAccount();});
$('#signup-btn').addEventListener('click',(e)=>{e.preventDefault();localAccount();});
$('#guest-btn').addEventListener('click',(e)=>{e.preventDefault();enterGuest();});
$('#signout-btn').addEventListener('click',(e)=>{e.preventDefault();save.account=null;persist();show(screens.auth);});
$('#play-btn').addEventListener('click',(e)=>{e.preventDefault();startGame();});
$('#leave-btn').addEventListener('click',(e)=>{e.preventDefault();stopGame();renderMenu();show(screens.menu);});
$('#host-btn').addEventListener('click',(e)=>{e.preventDefault();const code=Math.random().toString(36).slice(2,8).toUpperCase();$('#room-status').textContent=`Room ${code} created`;startGame(code);});
$('#join-btn').addEventListener('click',(e)=>{e.preventDefault();const code=window.prompt('Enter room code:');if(code&&code.trim())startGame(code.trim().toUpperCase());});

const canvas=$('#game'),ctx=canvas.getContext('2d');
let raf=null,input={x:0,y:0},player=null,fish=[],particles=[],running=false,room='',boosting=false,lastEvo='FRY',boostEnergy=100;
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);} addEventListener('resize',resize); resize();
function spawnFish(){const r=12+Math.random()*25;fish.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r,size:.6+Math.random()*2.7,vx:(Math.random()-.5)*.7,vy:(Math.random()-.5)*.7,h:Math.floor(Math.random()*360)});}
function startGame(code=''){
  room=code; show(screens.game); running=true; boosting=false; boostEnergy=100;
  player={x:innerWidth/2,y:innerHeight/2,r:22+(save.bestSize||1)*3,size:save.bestSize||1,score:0,vx:0,vy:0};
  fish=[]; particles=[]; for(let i=0;i<50;i++)spawnFish(); input={x:player.x,y:player.y}; lastEvo=evoFor(player.size)[0];
  $('#evo-label b').textContent=lastEvo; $('#room-code').classList.toggle('hidden',!room); $('#room-code').textContent=room?`ROOM ${room}`:''; $('#game-tip').textContent='Joystick to swim • BOOST to dash';
  cancelAnimationFrame(raf); loop();
}
function stopGame(){running=false;boosting=false;cancelAnimationFrame(raf);if(player){save.bestSize=Math.max(save.bestSize||1,player.size);save.bestEaten=Math.max(save.bestEaten||0,player.score);}persist();}
canvas.addEventListener('pointermove',(e)=>{if(e.pointerType==='mouse')input={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerdown',(e)=>{if(e.pointerType==='mouse')input={x:e.clientX,y:e.clientY};});

const joy=$('#joystick'),stick=$('#stick');
function joyMove(e){e.preventDefault();if(!player)return;const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy),max=38;if(d>max){dx=dx/d*max;dy=dy/d*max;}stick.style.transform=`translate(${dx}px,${dy}px)`;input={x:player.x+dx*12,y:player.y+dy*12};}
function joyEnd(){stick.style.transform='translate(0,0)';if(player)input={x:player.x,y:player.y};}
joy.addEventListener('pointerdown',(e)=>{e.preventDefault();joy.setPointerCapture(e.pointerId);joyMove(e);});
joy.addEventListener('pointermove',(e)=>{if(e.buttons)joyMove(e);});
['pointerup','pointercancel','lostpointercapture'].forEach(x=>joy.addEventListener(x,joyEnd));
const boost=$('#boost-btn');
function boostOn(e){e.preventDefault();boosting=true;boost.classList.add('active');}
function boostOff(){boosting=false;boost.classList.remove('active');}
boost.addEventListener('pointerdown',boostOn); ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(x=>boost.addEventListener(x,boostOff));

function drawFish(f,me=false){
  ctx.save();ctx.translate(f.x,f.y);if(!me)ctx.rotate(Math.atan2(f.vy||.001,f.vx||1));ctx.scale(f.r/22,f.r/22);
  const evo=evoFor(f.size)[0];ctx.fillStyle=me?(SKINS.find(s=>s[0]===save.skin)||SKINS[0])[2]:`hsl(${f.h} 75% 60%)`;
  ctx.beginPath();ctx.ellipse(0,0,26,15,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(-38,-14);ctx.lineTo(-38,14);ctx.closePath();ctx.fill();
  if(me&&evo!=='FRY'){ctx.fillStyle='#ffffff55';ctx.beginPath();ctx.arc(-3,0,18,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(14,-5,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#071827';ctx.beginPath();ctx.arc(15,-5,2,0,Math.PI*2);ctx.fill();ctx.restore();
}
function loop(){
  if(!running)return;const w=innerWidth,h=innerHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle='#063b52';ctx.fillRect(0,0,w,h);
  const dx=input.x-player.x,dy=input.y-player.y,dist=Math.hypot(dx,dy);
  if(boosting&&boostEnergy>0)boostEnergy=Math.max(0,boostEnergy-.9);else boostEnergy=Math.min(100,boostEnergy+.35);
  const speed=boosting&&boostEnergy>0?1.35:.52;if(dist>8){player.vx+=(dx/dist*speed-player.vx)*.11;player.vy+=(dy/dist*speed-player.vy)*.11;}
  player.x=Math.max(player.r,Math.min(w-player.r,player.x+player.vx));player.y=Math.max(player.r,Math.min(h-player.r,player.y+player.vy));
  for(const f of fish){
    f.x+=f.vx;f.y+=f.vy;if(f.x<-50)f.x=w+50;if(f.x>w+50)f.x=-50;if(f.y<-50)f.y=h+50;if(f.y>h+50)f.y=-50;
    const d=Math.hypot(f.x-player.x,f.y-player.y);if(d<player.r+f.r*.7){
      if(f.size<player.size){player.score++;player.size+=.055;player.r=22+player.size*3;particles.push({x:f.x,y:f.y,t:1});const now=evoFor(player.size)[0];if(now!==lastEvo){lastEvo=now;$('#evo-label b').textContent=now;$('#evo-name').textContent=now;$('#evolution').classList.remove('hidden');setTimeout(()=>$('#evolution').classList.add('hidden'),1300);}}
      else if(player.size>1.2){player.size*=.96;player.r=22+player.size*3;}
    }
    drawFish(f);
  }
  drawFish(player,true);particles=particles.filter(p=>p.t>0);for(const p of particles){p.t-=.035;ctx.fillStyle=`rgba(120,230,255,${p.t})`;ctx.beginPath();ctx.arc(p.x,p.y,30*(1-p.t),0,Math.PI*2);ctx.fill();}
  $('#size-label').textContent=player.size.toFixed(1);$('#score-label').textContent=player.score;raf=requestAnimationFrame(loop);
}
renderMenu();show(screens.auth);
export class PeerRoom{constructor(){this.pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});this.channel=this.pc.createDataChannel('fish-arena');}send(state){if(this.channel.readyState==='open')this.channel.send(JSON.stringify(state));}}
