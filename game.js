const $=id=>document.getElementById(id),canvas=$('game');
const defaults={coins:0,best:0,hook:false,speedCharges:0,invisCharges:0,shieldCharges:0,ownedSkins:['classic'],skin:'classic',musicEnabled:true,musicVolume:.18};
let saved={...defaults};try{saved={...defaults,...JSON.parse(localStorage.getItem('mellrun-v1')||'{}')}}catch{}
for(const key of ['coins','best','speedCharges','invisCharges','shieldCharges'])saved[key]=Math.max(0,Math.floor(Number(saved[key])||0));
saved.ownedSkins=Array.isArray(saved.ownedSkins)?saved.ownedSkins.filter(id=>window.SKIN_CATALOG.some(s=>s.id===id)):['classic'];
if(!saved.ownedSkins.includes('classic'))saved.ownedSkins.unshift('classic');
if(!saved.ownedSkins.includes(saved.skin))saved.skin='classic';
saved.musicVolume=Number.isFinite(saved.musicVolume)?Math.max(0,Math.min(1,saved.musicVolume)):.18;
let state='menu',panel='menu',panelStack=[],elapsed=0,stage=1,lap=1,levelTime=0,runCoins=0,grace=3,spawnTimer=0,coinTimer=0,speed=0,invis=0,shield=0,cooldown=0,grapple=null,agents=[],coins=[],keys={},p={x:-480,y:460},velocity={x:0,y:0},last=0,previewSkin=saved.skin;
function persist(){try{localStorage.setItem('mellrun-v1',JSON.stringify(saved))}catch{}}
const music=window.createMusicManager({element:$('bgMusic'),enabled:saved.musicEnabled,volume:saved.musicVolume,onChange:({enabled,volume})=>{saved.musicEnabled=enabled;saved.musicVolume=volume;persist();updateMusicUi()}});
function updateMusicUi(){$('musicEnabled').checked=music.enabled;$('musicVolume').value=Math.round(music.volume*100);$('volumeValue').textContent=Math.round(music.volume*100)+'%'}
$('musicEnabled').onchange=e=>music.setEnabled(e.target.checked);$('musicVolume').oninput=e=>music.setVolume(Number(e.target.value)/100);updateMusicUi();
function toast(text){$('toast').textContent=text;$('toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').style.display='none',2400)}
let seed=431;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const trees=[];for(let i=0;i<155;i++){let x=random()*2300-1150,y=random()*2300-1150;if(Math.abs(x+y)<95||Math.abs(x-y)<100||Math.abs(x)>1040||Math.abs(y)>1040||Math.hypot(x+480,y-460)<130)continue;trees.push({x,y,r:19+random()*13,type:y<x?0:1})}
const towers=[{x:-750,y:730},{x:750,y:-730},{x:-850,y:-120},{x:850,y:120},{x:-250,y:250},{x:250,y:-250},{x:-900,y:600},{x:900,y:-600}],anchors=[...trees,...towers];
let stickInput={x:0,y:0};const stickControl=window.createVirtualStick({element:$('joystick'),thumb:$('stickThumb'),canMove:()=>state==='running',onMove:v=>stickInput=v});
function movementInput(){const x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);return x||y?{x,y}:stickInput}
function resetInput(){keys={};stickControl.reset();velocity={x:0,y:0}}
const touchLayout=window.matchMedia('(max-width:760px), (pointer:coarse), (max-height:500px) and (max-width:1000px)');let lastUiState;
function ui(){
 if(lastUiState!==state){document.body.dataset.gameState=state;lastUiState=state;requestAnimationFrame(()=>window.resize3D?.())}
 $('hookTimer').textContent=cooldown>0?cooldown.toFixed(1)+' сек.':saved.hook?'ГОТОВ':'25 птенцов';$('touchHook').disabled=cooldown>0;
 for(const [type,time,duration] of [['shield',shield,5],['invis',invis,15],['speed',speed,60]]){$(type+'Ability').dataset.active=String(time>0);$(type+'Stock').textContent='×'+saved[type+'Charges'];$(type+'Timer').textContent=time>0?Math.ceil(time)+'с · АКТИВНО':duration+' сек.'}
 $('coins').textContent=saved.coins;$('best').textContent=String(saved.best).padStart(5,'0');$('score').textContent=String(Math.floor(elapsed*10)).padStart(5,'0');$('level').innerHTML=String(stage).padStart(2,'0')+' <small>/ 15</small>';$('lap').textContent=lap;$('bar').style.width=Math.min(100,levelTime/30*100)+'%';
 $('effects').textContent=[shield>0?'ЩИТ '+Math.ceil(shield)+'с':'',speed>0?'ТУРБО '+Math.ceil(speed)+'с':'',invis>0?'НЕВИДИМОСТЬ '+Math.ceil(invis)+'с':'',saved.hook?(cooldown>0?'ХУК '+cooldown.toFixed(1)+'с':touchLayout.matches?'ХУК ГОТОВ':'ХУК ГОТОВ · ПРОБЕЛ'):''].filter(Boolean).join(' • ');
}
const panels={menu:'overlay',shop:'shop',settings:'settings',skins:'skins',defeat:'defeat',complete:'complete'};
function syncPanels(){for(const [name,id] of Object.entries(panels))$(id).classList.toggle('hidden',panel!==name);$('modalTitle').innerHTML=state==='paused'?'ПЕРЕВЕДИ<br><span>ДЫХАНИЕ.</span>':'ПОБЕГ<br><span>МАМЫ ПТИЦЫ</span>';$('modalText').textContent=state==='paused'?'Погоня на паузе. Вернись, когда будешь готов.':'Птенцы в кармане. Интерпол на хвосте.';$('play').innerHTML=(state==='paused'?'ПРОДОЛЖИТЬ':'ИГРАТЬ')+' <span>↗</span>';$('menuRestart').classList.toggle('hidden',state!=='paused');ui()}
function openPanel(name){if(panel===name)return;panelStack.push({state,panel});if(state==='running')state='paused';resetInput();panel=name;if(name==='shop')$('shopMsg').textContent='Баланс: '+saved.coins+' птенцов';if(name==='skins'){previewSkin=saved.skin;renderSkinCards()}syncPanels()}
function closePanel(){const back=panelStack.pop();if(back){state=back.state;panel=back.panel}else{panel='menu';state='menu'}resetInput();syncPanels()}
function pause(){if(state==='running'){state='paused';panel='menu';panelStack=[];resetInput()}else if(state==='paused'&&panel==='menu'){state='running';panel=null;resetInput()}syncPanels()}
function start(){resetInput();elapsed=0;stage=1;lap=1;levelTime=0;runCoins=0;grace=3;spawnTimer=coinTimer=0;agents=[];coins=[];p={x:-480,y:460};grapple=null;cooldown=speed=invis=shield=0;for(let i=0;i<22;i++)spawnCoin();state='running';panel=null;panelStack=[];music.unlock();syncPanels()}
function mainMenu(){saved.best=Math.max(saved.best,Math.floor(elapsed*10));persist();state='menu';panel='menu';panelStack=[];resetInput();syncPanels()}
$('play').onclick=()=>state==='paused'?pause():start();$('pause').onclick=pause;$('restart').onclick=start;$('menuRestart').onclick=start;$('replay').onclick=start;
$('defeatMenu').onclick=mainMenu;$('completeMenu').onclick=mainMenu;
for(const id of ['mobileShop','shopOpen','footerShop'])$(id).onclick=()=>openPanel('shop');$('closeShop').onclick=closePanel;
$('skinsOpen').onclick=$('settingsSkins').onclick=()=>openPanel('skins');$('closeSkins').onclick=closePanel;
$('sound').onclick=$('settingsOpen').onclick=()=>openPanel('settings');$('closeSettings').onclick=closePanel;
$('continueCycle').onclick=()=>{stage=1;lap++;levelTime=0;agents=[];spawnTimer=0;grace=3;state='running';panel=null;panelStack=[];resetInput();syncPanels();toast('Новый круг · '+lap)};
const prices={speed:12,invis:18,hook:25,shield:6},HOOK_RANGE=880,HOOK_COOLDOWN=1;
document.querySelectorAll('[data-buy]').forEach(button=>button.onclick=()=>{const type=button.dataset.buy,cost=prices[type];if(type==='hook'&&saved.hook){$('shopMsg').textContent='Хук уже куплен. Пробел или кнопка хука справа.';return}if(saved.coins<cost){$('shopMsg').textContent='Не хватает '+(cost-saved.coins)+' птенцов';return}saved.coins-=cost;if(type==='hook')saved.hook=true;else saved[type+'Charges']++;persist();ui();$('shopMsg').textContent='Куплено! Баланс: '+saved.coins+' птенцов. Усиления активируются во время игры.'});
let previewRenderer;
function renderSkinCards(){const list=$('skinList');list.textContent='';for(const skin of window.SKIN_CATALOG){const b=document.createElement('button');b.className='skin-card';b.dataset.selected=String(skin.id===previewSkin);b.setAttribute('aria-pressed',String(skin.id===previewSkin));b.innerHTML='<img src="'+skin.image+'" alt=""><span><strong>'+skin.name+'</strong><small>'+(saved.ownedSkins.includes(skin.id)?'Куплен':skin.price+' птенцов')+'</small></span>'+(saved.skin===skin.id?'<em>НАДЕТ</em>':'');b.onclick=()=>{previewSkin=skin.id;renderSkinCards()};list.appendChild(b)}
 const skin=window.SKIN_CATALOG.find(s=>s.id===previewSkin),owned=saved.ownedSkins.includes(previewSkin);$('skinName').textContent=skin.name;$('skinDescription').textContent=skin.description;$('skinMsg').textContent='Баланс: '+saved.coins+' птенцов. У всех скинов одинаковый хитбокс.';$('skinAction').textContent=saved.skin===previewSkin?'ВЫБРАН':owned?'ВЫБРАТЬ':'КУПИТЬ · '+skin.price+' ПТЕНЦОВ';$('skinAction').disabled=saved.skin===previewSkin;
}
$('skinAction').onclick=()=>{const skin=window.SKIN_CATALOG.find(s=>s.id===previewSkin);if(!saved.ownedSkins.includes(previewSkin)){if(saved.coins<skin.price){$('skinMsg').textContent='Не хватает '+(skin.price-saved.coins)+' птенцов';return}saved.coins-=skin.price;saved.ownedSkins.push(previewSkin)}saved.skin=previewSkin;persist();renderSkinCards();ui()};
function activate(type){if(state!=='running')return;const key=type+'Charges';if(!saved[key]){toast('Нет усиления в запасе — купи в магазине');return}if(type==='invis'&&invis>0||type==='speed'&&speed>0||type==='shield'&&shield>0){toast('Усиление уже действует');return}saved[key]--;if(type==='invis')invis=15;else if(type==='shield')shield=5;else speed=60;persist();ui();toast(type==='invis'?'Невидимость: 15 секунд':type==='shield'?'Щит: 5 секунд':'Ускорение: 60 секунд')}
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(e.target?.tagName))return;let k=e.key.toLowerCase();const map={'ц':'w','ф':'a','ы':'s','в':'d','к':'r','й':'q'};k=map[k]||k;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'&&!e.repeat){if(panel&&panel!=='menu'&&panelStack.length)closePanel();else pause()}if(k===' '&&!e.repeat)hook();if(k==='q'&&!e.repeat)activate('shield');if(k==='r'&&!e.repeat)activate('invis');if(k==='shift'&&!e.repeat)activate('speed');keys[k]=true});
window.addEventListener('keyup',e=>{let k=e.key.toLowerCase();keys[k]=false;const map={'ц':'w','ф':'a','ы':'s','в':'d'};if(map[k])keys[map[k]]=false});window.addEventListener('blur',()=>{resetInput();if(state==='running')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause()});
$('touchHook').onclick=()=>hook();for(const type of ['shield','invis','speed'])$(type+'Ability').onclick=()=>activate(type);
// Every skin uses this same radius. Model scales never feed into gameplay collision.
function free(x,y,r=13){return Math.abs(x)<1120&&Math.abs(y)<1120&&!trees.some(t=>Math.hypot(x-t.x,y-t.y)<t.r*.65+r)&&!towers.some(t=>Math.hypot(x-t.x,y-t.y)<r+23)}
function move(a,dx,dy,r=13){if(free(a.x+dx,a.y,r))a.x+=dx;if(free(a.x,a.y+dy,r))a.y+=dy}
function spawnCoin(){for(let n=0;n<100;n++){let x=random()*2100-1050,y=random()*2100-1050;if(free(x,y,20)){coins.push({x,y});return}}}
function spawnAgent(){for(let n=0;n<100;n++){let angle=random()*Math.PI*2,x=p.x+Math.cos(angle)*480,y=p.y+Math.sin(angle)*480;if(free(x,y)){agents.push({x,y,phase:random()*6});return}}}
function hook(target){if(state!=='running')return;if(!saved.hook){toast('Купи хук в магазине · 25 птенцов');return}if(cooldown>0)return;const input=movementInput();const aim=HOOK_RANGE/2;const near=target||anchors.filter(t=>Math.hypot(t.x-p.x,t.y-p.y)>75&&Math.hypot(t.x-p.x,t.y-p.y)<=HOOK_RANGE).sort((a,b)=>Math.hypot(a.x-p.x-input.x*aim,a.y-p.y-input.y*aim)-Math.hypot(b.x-p.x-input.x*aim,b.y-p.y-input.y*aim))[0];const d=near?Math.hypot(near.x-p.x,near.y-p.y):0;if(!near||d>HOOK_RANGE||d<75){toast('Нет цели в радиусе хука');return}grapple={x:near.x+(p.x-near.x)/d*65,y:near.y+(p.y-near.y)/d*65,target:near,launch:{...p},phase:'out',travel:0,duration:d/1050,tip:{...p},blocked:0};cooldown=HOOK_COOLDOWN;ui()}
canvas.onclick=e=>{if(state!=='running'||!saved.hook)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height;const point=anchors.map(t=>({t,s:window.project3D(t.x,t.y,35)})).sort((a,b)=>Math.hypot(a.s.x-x,a.s.y-y)-Math.hypot(b.s.x-x,b.s.y-y))[0];if(point&&Math.hypot(point.s.x-x,point.s.y-y)<55)hook(point.t)};
function updateGrapple(dt){if(!grapple)return false;const g=grapple;g.travel+=dt;if(g.phase==='out'){const t=Math.min(1,g.travel/g.duration);g.tip.x=g.launch.x+(g.target.x-g.launch.x)*t;g.tip.y=g.launch.y+(g.target.y-g.launch.y)*t;if(t>=1){g.phase='pull';g.travel=0}return false}
 if(g.phase==='pull'){let d=Math.hypot(g.x-p.x,g.y-p.y);if(d<12||g.blocked>.35){g.phase='retract';g.travel=0;g.retractFrom={...g.tip};return false}let step=Math.min(d,750*dt),ox=p.x,oy=p.y;move(p,(g.x-p.x)/d*step,(g.y-p.y)/d*step);if(Math.hypot(p.x-ox,p.y-oy)<step*.15)g.blocked+=dt;else g.blocked=0;velocity={x:0,y:0};return true}
 const t=Math.min(1,g.travel/.22);g.tip.x=g.retractFrom.x+(p.x-g.retractFrom.x)*t;g.tip.y=g.retractFrom.y+(p.y-g.retractFrom.y)*t;if(t>=1)grapple=null;return false;
}
function finishRun(){state='caught';panel='defeat';panelStack=[];resetInput();saved.best=Math.max(saved.best,Math.floor(elapsed*10));persist();$('resultScore').textContent=Math.floor(elapsed*10);$('resultBest').textContent=saved.best;$('resultChicks').textContent=runCoins;syncPanels()}
function update(dt){if(state!=='running')return;elapsed+=dt;levelTime+=dt;grace-=dt;shield=Math.max(0,shield-dt);speed=Math.max(0,speed-dt);invis=Math.max(0,invis-dt);cooldown=Math.max(0,cooldown-dt);
 if(levelTime>=30){if(stage===15){levelTime=30;state='complete';panel='complete';panelStack=[];resetInput();saved.best=Math.max(saved.best,Math.floor(elapsed*10));persist();syncPanels();return}levelTime-=30;stage++;grace=2;toast('Уровень '+stage+' · круг '+lap)}
 const pulling=updateGrapple(dt);if(!pulling){const input=movementInput(),len=Math.hypot(input.x,input.y),v=155*(speed>0?1.55:1),dx=len?input.x/Math.max(1,len)*v:0,dy=len?input.y/Math.max(1,len)*v:0;
  const weather=window.getWeather(elapsed),slippery=weather.wet>.2&&window.puddleAt(p.x,p.y);const friction=slippery?1-Math.exp(-dt*6):1;velocity.x+=(dx-velocity.x)*friction;velocity.y+=(dy-velocity.y)*friction;move(p,velocity.x*dt,velocity.y*dt);
 }
 spawnTimer+=dt;if(spawnTimer>Math.max(1.3,5-stage*.22)){spawnTimer=0;if(agents.length<3+stage+Math.min(lap-1,4))spawnAgent()}
 coinTimer+=dt;if(coinTimer>1.5&&coins.length<42){coinTimer=0;spawnCoin();let a=random()*6.28,x=p.x+Math.cos(a)*150,y=p.y+Math.sin(a)*150;if(free(x,y,20))coins.push({x,y})}
 for(let i=coins.length-1;i>=0;i--)if(Math.hypot(p.x-coins[i].x,p.y-coins[i].y)<35){coins.splice(i,1);saved.coins++;runCoins++;persist()}
 for(const a of agents){let vx=p.x-a.x,vy=p.y-a.y,d=Math.max(.001,Math.hypot(vx,vy));if(invis>0){vx=Math.cos(elapsed*.45+a.phase);vy=Math.sin(elapsed*.45+a.phase);d=1}const v=90+stage*3+Math.min(lap-1,4)*4,ox=a.x,oy=a.y;move(a,vx/d*v*dt,vy/d*v*dt,10);if(Math.hypot(a.x-ox,a.y-oy)<v*dt*.2)move(a,-vy/d*v*dt,vx/d*v*dt,10);if(invis<=0&&shield<=0&&grace<=0&&grapple?.phase!=='pull'&&Math.hypot(p.x-a.x,p.y-a.y)<27){finishRun();break}}
 ui();
}
function adaptTouch(){resetInput();$('hint').textContent=touchLayout.matches?'Стик слева — движение. Хук и усиления справа. Магазин — корзина сверху.':'WASD / стрелки — движение · Пробел — хук · Q — щит · R — невидимость · Shift — скорость · Esc — пауза';window.resize3D?.()}
touchLayout.addEventListener('change',adaptTouch);window.addEventListener('resize',()=>window.resize3D?.());adaptTouch();syncPanels();
function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);window.render3D({p,trees,towers,agents,coins,state,elapsed,invis,speed,shield,grace,grapple,stage,lap,skin:saved.skin,weather:window.getWeather(elapsed)},dt);if(panel==='skins'){previewRenderer??=window.createSkinPreview($('skinPreview'));previewRenderer.render(previewSkin,t/1000)}requestAnimationFrame(frame)}requestAnimationFrame(frame);
