const $=id=>document.getElementById(id),canvas=$('game');
const defaults={coins:0,best:0,hook:false,speedCharges:0,invisCharges:0,shieldCharges:0,ownedSkins:['classic'],skin:'classic',musicEnabled:true,musicVolume:.18,masterVolume:1,ownedSkills:[],skillSlots:[null,null,null,null]};
let saved={...defaults};try{saved={...defaults,...JSON.parse(localStorage.getItem('mellrun-v1')||'{}')}}catch{}
for(const key of ['coins','best','speedCharges','invisCharges','shieldCharges'])saved[key]=Math.max(0,Math.floor(Number(saved[key])||0));
saved.ownedSkins=Array.isArray(saved.ownedSkins)?saved.ownedSkins.filter(id=>window.SKIN_CATALOG.some(s=>s.id===id)):['classic'];
if(!saved.ownedSkins.includes('classic'))saved.ownedSkins.unshift('classic');
if(!saved.ownedSkins.includes(saved.skin))saved.skin='classic';
saved.musicVolume=Number.isFinite(saved.musicVolume)?Math.max(0,Math.min(1,saved.musicVolume)):.18;
saved.masterVolume=Number.isFinite(saved.masterVolume)?Math.max(0,Math.min(1,saved.masterVolume)):1;
saved.ownedSkills=Array.isArray(saved.ownedSkills)?[...new Set(saved.ownedSkills.filter(id=>window.SKILL_CATALOG.some(s=>s.id===id)))]:[];
saved.skillSlots=Array.from({length:4},(_,i)=>saved.ownedSkills.includes(saved.skillSlots?.[i])?saved.skillSlots[i]:null);
saved.skillSlots=saved.skillSlots.map((id,i,a)=>id&&a.indexOf(id)===i?id:null);
const combat=window.createCombat(),slotKeys=['Z','X','C','V'];
let state='menu',panel='menu',panelStack=[],elapsed=0,stage=1,lap=1,levelTime=0,runCoins=0,grace=3,spawnTimer=0,coinTimer=0,speed=0,invis=0,shield=0,cooldown=0,grapple=null,agents=[],coins=[],keys={},p={x:-480,y:460},velocity={x:0,y:0},last=0,previewSkin=saved.skin,hookPointer=null,hoveredHookTarget=null;
function persist(){try{localStorage.setItem('mellrun-v1',JSON.stringify(saved))}catch{}}
// This fixed gift is claimed once in the browser where the link is opened.
function claimBrowserGift(){
 const giftId='opera-gx-10000-6c318df4';
 if(window.location?.hash!=='#gift='+giftId)return;
 const claimed=Array.isArray(saved.claimedGifts)?saved.claimedGifts:[];
 let message;
 if(claimed.includes(giftId))message='Подарок уже получен в этом браузере.';
 else{
  const before=saved.coins,previous=saved.claimedGifts;saved.coins+=10000;saved.claimedGifts=[...claimed,giftId];
  try{localStorage.setItem('mellrun-v1',JSON.stringify(saved));message='Начислено 10 000 птенцов!'}
  catch{saved.coins=before;saved.claimedGifts=previous;toast('Не удалось сохранить подарок. Разреши сохранение данных сайта и открой ссылку ещё раз.');return}
 }
 openPanel('shop');$('shopMsg').textContent=message+' Баланс: '+saved.coins+' птенцов.';toast(message);
 window.history?.replaceState(null,'',window.location.pathname+window.location.search);
}
const soundEffects=window.createSoundEffects({volume:saved.masterVolume,pickupElement:$('pickupSound')});
const music=window.createMusicManager({element:$('bgMusic'),enabled:saved.musicEnabled,volume:saved.musicVolume,masterVolume:saved.masterVolume,onChange:({enabled,volume})=>{saved.musicEnabled=enabled;saved.musicVolume=volume;persist();updateMusicUi()}});
function updateMusicUi(){$('musicEnabled').checked=music.enabled;$('musicVolume').value=Math.round(music.volume*100);$('volumeValue').textContent=Math.round(music.volume*100)+'%'}
$('musicEnabled').onchange=e=>music.setEnabled(e.target.checked);$('musicVolume').oninput=e=>music.setVolume(Number(e.target.value)/100);updateMusicUi();
function updateMasterUi(){$('masterVolume').value=Math.round(saved.masterVolume*100);$('masterVolumeValue').textContent=Math.round(saved.masterVolume*100)+'%'}
$('masterVolume').oninput=e=>{saved.masterVolume=Math.max(0,Math.min(1,Number(e.target.value)/100));music.setMasterVolume(saved.masterVolume);soundEffects.setVolume(saved.masterVolume);persist();updateMasterUi()};updateMasterUi();
function toast(text){$('toast').textContent=text;$('toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').style.display='none',2400)}
let seed=431;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const trees=[];for(let i=0;i<155;i++){let x=random()*2300-1150,y=random()*2300-1150;if(Math.abs(x+y)<95||Math.abs(x-y)<100||Math.abs(x)>1040||Math.abs(y)>1040||Math.hypot(x+480,y-460)<130)continue;trees.push({x,y,r:19+random()*13,type:y<x?0:1})}
const towers=[{x:-750,y:730},{x:750,y:-730},{x:-850,y:-120},{x:850,y:120},{x:-250,y:250},{x:250,y:-250},{x:-900,y:600},{x:900,y:-600}],anchors=[...trees,...towers];
let stickInput={x:0,y:0};const stickControl=window.createVirtualStick({element:$('joystick'),thumb:$('stickThumb'),canMove:()=>state==='running',onMove:v=>stickInput=v});
function movementInput(){const x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);return x||y?{x,y}:stickInput}
function resetInput(){keys={};stickControl.reset();velocity={x:0,y:0};clearHookHover()}
const touchLayout=window.matchMedia('(max-width:760px), (pointer:coarse), (max-height:500px) and (max-width:1000px)');let lastUiState;
function updateCombatUi(){
 $('heroHp').textContent=combat.hp+' / 100';$('heroHpFill').style.width=combat.hp+'%';$('heroHpMeter').setAttribute('aria-valuenow',combat.hp);$('heroHealth').dataset.low=String(combat.hp<=30);$('heroHealth').dataset.hurt=String(combat.damageFlash>0);$('heroHealth').dataset.heal=String(combat.healFlash>0);$('combatVignette').style.opacity=Math.min(.55,combat.damageFlash*2);
 for(let i=0;i<4;i++){const id=saved.skillSlots[i],item=window.SKILL_CATALOG.find(s=>s.id===id),b=$('skillSlot'+i),cd=combat.cooldowns[id]||0,casting=combat.casting?.id===id;b.dataset.ready=String(!!id&&!cd&&!combat.casting);b.dataset.cooldown=String(cd>0);b.dataset.casting=String(casting);if(b.dataset.skill!==(id||'empty')){b.dataset.skill=id||'empty';$('skillIcon'+i).innerHTML=window.skillIcon(id);$('skillName'+i).textContent=item?.short||'ПУСТО'}$('skillTimer'+i).textContent=casting?'Подготовка':cd>0?Math.ceil(cd)+' сек.':id?'Готов':'Выбрать';b.setAttribute('aria-label',slotKeys[i]+': '+(item?item.name+(cd>0?', откат '+Math.ceil(cd)+' секунд':', готов'):'пустой слот, открыть магазин'));b.disabled=!!id&&(cd>0||!!combat.casting)}
}
function ui(){updateCombatUi();
 if(lastUiState!==state){document.body.dataset.gameState=state;lastUiState=state;requestAnimationFrame(()=>window.resize3D?.())}
 $('hookTimer').textContent=cooldown>0?cooldown.toFixed(1)+' сек.':saved.hook?'ГОТОВ':'25 птенцов';$('touchHook').disabled=cooldown>0;
 for(const [type,time,duration] of [['shield',shield,5],['invis',invis,15],['speed',speed,60]]){$(type+'Ability').dataset.active=String(time>0);$(type+'Stock').textContent='×'+saved[type+'Charges'];$(type+'Timer').textContent=time>0?Math.ceil(time)+'с · АКТИВНО':duration+' сек.'}
 $('coins').textContent=saved.coins;$('best').textContent=String(saved.best).padStart(5,'0');$('score').textContent=String(Math.floor(elapsed*10)).padStart(5,'0');$('level').innerHTML=String(stage).padStart(2,'0')+' <small>/ 15</small>';$('lap').textContent=lap;$('bar').style.width=Math.min(100,levelTime/30*100)+'%';
 $('effects').textContent=[shield>0?'ЩИТ '+Math.ceil(shield)+'с':'',speed>0?'ТУРБО '+Math.ceil(speed)+'с':'',invis>0?'НЕВИДИМОСТЬ '+Math.ceil(invis)+'с':'',saved.hook?(cooldown>0?'ХУК '+cooldown.toFixed(1)+'с':touchLayout.matches?'ХУК ГОТОВ':'ХУК ГОТОВ · ПРОБЕЛ'):''].filter(Boolean).join(' • ');
}
const panels={menu:'overlay',shop:'shop',settings:'settings',skins:'skins',defeat:'defeat',complete:'complete'};
function syncPanels(){for(const [name,id] of Object.entries(panels))$(id).classList.toggle('hidden',panel!==name);$('modalTitle').innerHTML=state==='paused'?'ПЕРЕВЕДИ<br><span>ДЫХАНИЕ.</span>':'ПОБЕГ<br><span>МАМЫ ПТИЦЫ</span>';$('modalText').textContent=state==='paused'?'Погоня на паузе. Вернись, когда будешь готов.':'Птенцы в кармане. Интерпол на хвосте.';$('play').innerHTML=(state==='paused'?'ПРОДОЛЖИТЬ':'ИГРАТЬ')+' <span>↗</span>';$('menuRestart').classList.toggle('hidden',state!=='paused');ui()}
function openPanel(name){if(panel===name)return;soundEffects.menu();panelStack.push({state,panel});if(state==='running')state='paused';resetInput();panel=name;if(name==='shop'){$('shopMsg').textContent='Баланс: '+saved.coins+' птенцов';renderLoadout()}if(name==='skins'){previewSkin=saved.skin;renderSkinCards()}syncPanels()}
function closePanel(){soundEffects.menu();const back=panelStack.pop();if(back){state=back.state;panel=back.panel}else{panel='menu';state='menu'}resetInput();syncPanels()}
function pause(){soundEffects.menu();if(state==='running'){state='paused';panel='menu';panelStack=[];resetInput()}else if(state==='paused'&&panel==='menu'){state='running';panel=null;resetInput()}syncPanels()}
function start(){soundEffects.menu();stepDistance=0;resetInput();combat.reset();navigation.reset();elapsed=0;stage=1;lap=1;levelTime=0;runCoins=0;grace=3;spawnTimer=coinTimer=0;agents=[];coins=[];p={x:-480,y:460};grapple=null;cooldown=speed=invis=shield=0;for(let i=0;i<22;i++)spawnCoin();state='running';panel=null;panelStack=[];music.unlock();syncPanels()}
function mainMenu(){soundEffects.menu();saved.best=Math.max(saved.best,Math.floor(elapsed*10));persist();state='menu';panel='menu';panelStack=[];resetInput();syncPanels()}
$('play').onclick=()=>state==='paused'?pause():start();$('pause').onclick=pause;$('restart').onclick=start;$('menuRestart').onclick=start;$('replay').onclick=start;
$('defeatMenu').onclick=mainMenu;$('completeMenu').onclick=mainMenu;
for(const id of ['mobileShop','shopOpen','footerShop'])$(id).onclick=()=>openPanel('shop');$('closeShop').onclick=closePanel;
$('skinsOpen').onclick=$('settingsSkins').onclick=()=>openPanel('skins');$('closeSkins').onclick=closePanel;
$('sound').onclick=$('settingsOpen').onclick=()=>openPanel('settings');$('closeSettings').onclick=closePanel;
$('continueCycle').onclick=()=>{stage=1;lap++;levelTime=0;agents=[];spawnTimer=0;grace=3;state='running';panel=null;panelStack=[];resetInput();syncPanels();toast('Новый круг · '+lap)};
const prices={speed:12,invis:18,hook:25,shield:6},HOOK_RANGE=880,HOOK_COOLDOWN=1;
document.querySelectorAll('[data-buy]').forEach(button=>button.onclick=()=>{const type=button.dataset.buy,cost=prices[type];if(type==='hook'&&saved.hook){$('shopMsg').textContent='Хук уже куплен. Пробел или кнопка хука справа.';return}if(saved.coins<cost){$('shopMsg').textContent='Не хватает '+(cost-saved.coins)+' птенцов';return}saved.coins-=cost;soundEffects.purchase();if(type==='hook')saved.hook=true;else saved[type+'Charges']++;persist();ui();$('shopMsg').textContent='Куплено! Баланс: '+saved.coins+' птенцов. Усиления активируются во время игры.'});
function renderLoadout(){
 for(const item of window.SKILL_CATALOG){const owned=saved.ownedSkills.includes(item.id);$('owned_'+item.id).textContent=owned?'Куплен · выбери слот ниже':'Купить навсегда';document.querySelectorAll('[data-buy-skill]').forEach(b=>{if(b.dataset.buySkill===item.id)b.dataset.owned=String(owned)})}
 for(let i=0;i<4;i++){const select=$('equipSlot'+i);select.textContent='';for(const item of [{id:'',name:'Пусто'},...window.SKILL_CATALOG.filter(s=>saved.ownedSkills.includes(s.id))]){const o=document.createElement('option');o.value=item.id;o.textContent=item.name;select.appendChild(o)}select.value=saved.skillSlots[i]||''}
}
document.querySelectorAll('[data-buy-skill]').forEach(b=>b.onclick=()=>{const item=window.SKILL_CATALOG.find(s=>s.id===b.dataset.buySkill);if(saved.ownedSkills.includes(item.id)){$('shopMsg').textContent='Уже куплен. Выбери слот Z, X, C или V ниже.';return}if(saved.coins<item.price){$('shopMsg').textContent='Не хватает '+(item.price-saved.coins)+' птенцов';return}saved.coins-=item.price;soundEffects.purchase();saved.ownedSkills.push(item.id);const empty=saved.skillSlots.indexOf(null);if(empty>=0)saved.skillSlots[empty]=item.id;persist();renderLoadout();ui();$('shopMsg').textContent=item.name+' куплен навсегда'+(empty>=0?' · слот '+slotKeys[empty]:'')+'. Баланс: '+saved.coins+' птенцов.'});
for(let i=0;i<4;i++){$('equipSlot'+i).onchange=e=>{const id=e.target.value;if(id&&!saved.ownedSkills.includes(id))return;const previous=saved.skillSlots.indexOf(id);if(id&&previous>=0)saved.skillSlots[previous]=saved.skillSlots[i];saved.skillSlots[i]=id||null;soundEffects.menu();persist();renderLoadout();ui();$('shopMsg').textContent='Слоты сохранены. Z / X / C / V — использовать в игре.'};$('skillSlot'+i).onclick=()=>activateSkill(i)}
function activateSkill(index){if(state!=='running')return;const id=saved.skillSlots[index];if(!id){openPanel('shop');return}const result=combat.activate(id,p);if(result!=='ok'){if(result==='full')toast('У тебя уже 100 HP');else if(result==='casting')toast('Дождись завершения навыка');else if(result==='cooldown')toast('Откат: '+Math.ceil(combat.cooldowns[id])+' сек.');return}if(id==='requiem'){grapple=null;velocity={x:0,y:0};clearHookHover()}if(id==='refresher'){cooldown=0;refreshHookHover();toast('Откаты навыков, предметов и хука сброшены')}ui()}
let stepDistance=0;
let previewRenderer;
function renderSkinCards(){const list=$('skinList');list.textContent='';for(const skin of window.SKIN_CATALOG){const b=document.createElement('button');b.className='skin-card';b.dataset.selected=String(skin.id===previewSkin);b.setAttribute('aria-pressed',String(skin.id===previewSkin));b.innerHTML='<img src="'+skin.image+'" alt=""><span><strong>'+skin.name+'</strong><small>'+(saved.ownedSkins.includes(skin.id)?'Куплен':skin.price+' птенцов')+'</small></span>'+(saved.skin===skin.id?'<em>НАДЕТ</em>':'');b.onclick=()=>{soundEffects.menu();previewSkin=skin.id;renderSkinCards()};list.appendChild(b)}
 const skin=window.SKIN_CATALOG.find(s=>s.id===previewSkin),owned=saved.ownedSkins.includes(previewSkin);$('skinName').textContent=skin.name;$('skinDescription').textContent=skin.description;$('skinMsg').textContent='Баланс: '+saved.coins+' птенцов. У всех скинов одинаковый хитбокс.';$('skinAction').textContent=saved.skin===previewSkin?'ВЫБРАН':owned?'ВЫБРАТЬ':'КУПИТЬ · '+skin.price+' ПТЕНЦОВ';$('skinAction').disabled=saved.skin===previewSkin;
}
$('skinAction').onclick=()=>{const skin=window.SKIN_CATALOG.find(s=>s.id===previewSkin);if(!saved.ownedSkins.includes(previewSkin)){if(saved.coins<skin.price){$('skinMsg').textContent='Не хватает '+(skin.price-saved.coins)+' птенцов';return}saved.coins-=skin.price;soundEffects.purchase();saved.ownedSkins.push(previewSkin)}soundEffects.menu();saved.skin=previewSkin;persist();renderSkinCards();ui()};
function activate(type){if(state!=='running')return;const key=type+'Charges';if(!saved[key]){toast('Нет усиления в запасе — купи в магазине');return}if(type==='invis'&&invis>0||type==='speed'&&speed>0||type==='shield'&&shield>0){toast('Усиление уже действует');return}saved[key]--;if(type==='invis')invis=15;else if(type==='shield')shield=5;else speed=60;persist();ui();toast(type==='invis'?'Невидимость: 15 секунд':type==='shield'?'Щит: 5 секунд':'Ускорение: 60 секунд')}
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;let k=e.key.toLowerCase();const map={'ц':'w','ф':'a','ы':'s','в':'d','к':'r','й':'q','я':'z','ч':'x','с':'c','м':'v'};k=map[k]||k;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'&&!e.repeat){if(panel&&panel!=='menu'&&panelStack.length)closePanel();else pause()}if(k===' '&&!e.repeat)hook();if(k==='q'&&!e.repeat)activate('shield');if(k==='r'&&!e.repeat)activate('invis');if(k==='shift'&&!e.repeat)activate('speed');if(['z','x','c','v'].includes(k)&&!e.repeat){e.preventDefault();activateSkill(['z','x','c','v'].indexOf(k))}keys[k]=true});
window.addEventListener('keyup',e=>{let k=e.key.toLowerCase();keys[k]=false;const map={'ц':'w','ф':'a','ы':'s','в':'d'};if(map[k])keys[map[k]]=false});window.addEventListener('blur',()=>{resetInput();if(state==='running')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause()});
$('touchHook').onclick=()=>hook();for(const type of ['shield','invis','speed'])$(type+'Ability').onclick=()=>activate(type);
// Every skin uses this same radius. Model scales never feed into gameplay collision.
function free(x,y,r=13){return Math.abs(x)<1120&&Math.abs(y)<1120&&!trees.some(t=>Math.hypot(x-t.x,y-t.y)<t.r*.65+r)&&!towers.some(t=>Math.hypot(x-t.x,y-t.y)<r+23)}
function move(a,dx,dy,r=13){if(free(a.x+dx,a.y,r))a.x+=dx;if(free(a.x,a.y+dy,r))a.y+=dy}
const AGENT_RADIUS=20,navigation=window.createAgentNavigation({free});
function moveAgent(a,dx,dy){
 const open=(x,y)=>free(x,y,10)&&agents.every(b=>b===a||Math.hypot(x-b.x,y-b.y)>=AGENT_RADIUS*2);
 if(open(a.x+dx,a.y+dy)){a.x+=dx;a.y+=dy;return}
 if(open(a.x+dx,a.y))a.x+=dx;if(open(a.x,a.y+dy))a.y+=dy;
}
function separateAgents(){
 // A few solver passes keep crowds apart without pushing them into terrain.
 for(let pass=0;pass<6;pass++){let overlapping=false;for(let i=0;i<agents.length;i++)for(let j=i+1;j<agents.length;j++){
  const a=agents[i],b=agents[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),minimum=AGENT_RADIUS*2;if(d>=minimum-.01)continue;overlapping=true;
  const angle=(i*7+j*3)*2.39996,nx=d>.001?dx/d:Math.cos(angle),ny=d>.001?dy/d:Math.sin(angle),push=(minimum-d+.02)/2;
  const ax=a.x,ay=a.y,bx=b.x,by=b.y;move(a,-nx*push,-ny*push,10);move(b,nx*push,ny*push,10);
  const movedA=(ax-a.x)*nx+(ay-a.y)*ny,movedB=(b.x-bx)*nx+(b.y-by)*ny;if(movedA<push*.9)move(b,nx*Math.max(0,push-movedA),ny*Math.max(0,push-movedA),10);if(movedB<push*.9)move(a,-nx*Math.max(0,push-movedB),-ny*Math.max(0,push-movedB),10);
 }if(!overlapping)break}
}
function hookLanding(target){const angle=Math.atan2(p.y-target.y,p.x-target.x);for(const radius of [65,85,105])for(let i=0;i<16;i++){const offset=i===0?0:Math.ceil(i/2)*Math.PI/8*(i%2?1:-1),x=target.x+Math.cos(angle+offset)*radius,y=target.y+Math.sin(angle+offset)*radius;if(free(x,y))return{x,y}}return null}
function spawnCoin(){for(let n=0;n<100;n++){let x=random()*2100-1050,y=random()*2100-1050;if(free(x,y,20)){coins.push({x,y});return}}}
function spawnAgent(){for(let n=0;n<100;n++){let angle=random()*Math.PI*2,x=p.x+Math.cos(angle)*480,y=p.y+Math.sin(angle)*480;if(free(x,y)&&agents.every(a=>Math.hypot(a.x-x,a.y-y)>=AGENT_RADIUS*2)){agents.push(combat.prepareAgent({x,y,phase:random()*6}));return}}}
function canHookTarget(target){if(!target||state!=='running'||!saved.hook||cooldown>0||combat.casting?.id==='requiem')return false;const distance=Math.hypot(target.x-p.x,target.y-p.y);return distance>=75&&distance<=HOOK_RANGE}
function clearHookHover(){hookPointer=null;hoveredHookTarget=null;canvas.style.cursor=''}
function refreshHookHover(){const target=hookPointer&&state==='running'&&saved.hook&&cooldown<=0?window.pickHookAnchor?.(hookPointer.x,hookPointer.y):null;hoveredHookTarget=canHookTarget(target)?target:null;canvas.style.cursor=hoveredHookTarget?'crosshair':''}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;hookPointer={x:e.clientX,y:e.clientY};refreshHookHover()});
canvas.addEventListener('pointerleave',clearHookHover);canvas.addEventListener('pointercancel',clearHookHover);
function hook(target){if(state!=='running'||combat.casting?.id==='requiem')return;if(!saved.hook){toast('Купи хук в магазине · 25 птенцов');return}if(cooldown>0)return;refreshHookHover();const input=movementInput();const aim=HOOK_RANGE/2;const near=target||hoveredHookTarget||anchors.filter(canHookTarget).sort((a,b)=>Math.hypot(a.x-p.x-input.x*aim,a.y-p.y-input.y*aim)-Math.hypot(b.x-p.x-input.x*aim,b.y-p.y-input.y*aim))[0];if(!canHookTarget(near)){toast('Нет цели в радиусе хука');return}const landing=hookLanding(near);if(!landing){toast('Нет свободного места для приземления');return}const d=Math.hypot(near.x-p.x,near.y-p.y);grapple={...landing,target:near,launch:{...p},phase:'out',travel:0,duration:d/1050,tip:{...p},blocked:0};cooldown=HOOK_COOLDOWN;refreshHookHover();ui()}
canvas.onclick=e=>{if(state!=='running'||!saved.hook)return;const target=window.pickHookAnchor?.(e.clientX,e.clientY);if(canHookTarget(target))hook(target)};
function updateGrapple(dt){if(!grapple)return false;const g=grapple;g.travel+=dt;if(g.phase==='out'){const t=Math.min(1,g.travel/g.duration);g.tip.x=g.launch.x+(g.target.x-g.launch.x)*t;g.tip.y=g.launch.y+(g.target.y-g.launch.y)*t;if(t>=1){g.phase='pull';g.travel=0}return false}
 if(g.phase==='pull'){const d=Math.hypot(g.x-p.x,g.y-p.y);if(d<12){p.x=g.x;p.y=g.y;g.phase='retract';g.travel=0;g.retractFrom={...g.tip};velocity={x:0,y:0};return true}const step=Math.min(d,750*dt);p.x=Math.max(-1119.9,Math.min(1119.9,p.x+(g.x-p.x)/d*step));p.y=Math.max(-1119.9,Math.min(1119.9,p.y+(g.y-p.y)/d*step));velocity={x:0,y:0};return true}
 const t=Math.min(1,g.travel/.22);g.tip.x=g.retractFrom.x+(p.x-g.retractFrom.x)*t;g.tip.y=g.retractFrom.y+(p.y-g.retractFrom.y)*t;if(t>=1)grapple=null;return false;
}
function finishRun(){state='caught';panel='defeat';panelStack=[];resetInput();saved.best=Math.max(saved.best,Math.floor(elapsed*10));persist();$('resultScore').textContent=Math.floor(elapsed*10);$('resultBest').textContent=saved.best;$('resultChicks').textContent=runCoins;syncPanels()}
function update(dt){if(state!=='running')return;elapsed+=dt;levelTime+=dt;grace-=dt;shield=Math.max(0,shield-dt);speed=Math.max(0,speed-dt);invis=Math.max(0,invis-dt);cooldown=Math.max(0,cooldown-dt);
 if(levelTime>=30){if(stage===15){levelTime=30;state='complete';panel='complete';panelStack=[];resetInput();saved.best=Math.max(saved.best,Math.floor(elapsed*10));persist();syncPanels();return}levelTime-=30;stage++;grace=2;toast('Уровень '+stage+' · круг '+lap)}
 combat.step(dt,p,agents);agents=agents.filter(a=>a.hp>0);const charging=combat.casting?.id==='requiem';const pulling=updateGrapple(dt);if(!pulling&&!charging){const input=movementInput(),len=Math.hypot(input.x,input.y),v=155*(speed>0?1.55:1),dx=len?input.x/Math.max(1,len)*v:0,dy=len?input.y/Math.max(1,len)*v:0;
  const weather=window.getWeather(elapsed),slippery=weather.wet>.2&&window.puddleAt(p.x,p.y);const friction=slippery?1-Math.exp(-dt*6):1;velocity.x+=(dx-velocity.x)*friction;velocity.y+=(dy-velocity.y)*friction;const ox=p.x,oy=p.y;move(p,velocity.x*dt,velocity.y*dt);const walked=Math.hypot(p.x-ox,p.y-oy);if(walked>0){stepDistance+=walked;if(stepDistance>=43){stepDistance%=43;soundEffects.step()}}else stepDistance=0;
 }
 spawnTimer+=dt;if(spawnTimer>Math.max(1.3,5-stage*.22)){spawnTimer=0;if(agents.length<3+stage+Math.min(lap-1,4))spawnAgent()}
 coinTimer+=dt;if(coinTimer>1.5&&coins.length<42){coinTimer=0;spawnCoin();let a=random()*6.28,x=p.x+Math.cos(a)*150,y=p.y+Math.sin(a)*150;if(free(x,y,20))coins.push({x,y})}
 for(let i=coins.length-1;i>=0;i--)if(Math.hypot(p.x-coins[i].x,p.y-coins[i].y)<35){coins.splice(i,1);saved.coins++;runCoins++;soundEffects.pickup();persist()}
 navigation.beginFrame();for(const a of agents){let vx=p.x-a.x,vy=p.y-a.y,d=Math.max(.001,Math.hypot(vx,vy)),v=90+stage*3+Math.min(lap-1,4)*4;if(a.fear>0){vx=-vx;vy=-vy;v*=.85}else if(invis>0){vx=Math.cos(elapsed*.45+a.phase);vy=Math.sin(elapsed*.45+a.phase);d=1}else if(d<30||a.attackWindup>0)v=0;else{const direction=navigation.direction(a,navigation.goal(a,p,velocity),dt);vx=direction.x;vy=direction.y;d=Math.max(.001,Math.hypot(vx,vy))}const ox=a.x,oy=a.y;moveAgent(a,vx/d*v*dt,vy/d*v*dt);if(v>0&&Math.hypot(a.x-ox,a.y-oy)<v*dt*.2)moveAgent(a,-vy/d*v*dt,vx/d*v*dt);}separateAgents();for(const a of agents){combat.attack(a,dt,p,invis>0||shield>0||grace>0||grapple?.phase==='pull');if(combat.dead){finishRun();break}} ui();
}
function adaptTouch(){resetInput();$('hint').textContent=touchLayout.matches?'Стик — движение. Навыки — четыре окна снизу. Хук и усиления справа.':'Z / X / C / V — навыки · WASD / стрелки — движение · Пробел — хук · Q — щит · R — невидимость · Shift — скорость · Esc — пауза';window.resize3D?.()}
touchLayout.addEventListener('change',adaptTouch);window.addEventListener('resize',()=>window.resize3D?.());adaptTouch();syncPanels();claimBrowserGift();
const healthMarkers=[];
function healthMarker(i,kind){if(!healthMarkers[i]){const b=document.createElement('div');b.className='world-health '+kind+'-bar';const text=document.createElement('strong'),track=document.createElement('div'),fill=document.createElement('i');track.className='hp-track';track.appendChild(fill);b.appendChild(text);b.appendChild(track);$('worldHealth').appendChild(b);healthMarkers[i]={b,text,fill}}return healthMarkers[i]}
function updateHealthMarkers(){const list=[{...p,hp:combat.hp,height:saved.skin==='massa'?155:saved.skin==='artur'?147:112},...agents.map(a=>({...a,height:126}))];for(let i=0;i<list.length;i++){const a=list[i],m=healthMarker(i,i===0?'hero':'agent'),pos=window.project3D(a.x,a.y,a.height),x=pos.x*canvas.clientWidth/canvas.width,y=pos.y*canvas.clientHeight/canvas.height;m.b.style.display=pos.visible!==false&&x>-60&&x<canvas.clientWidth+60&&y>0&&y<canvas.clientHeight?'block':'none';m.b.style.left=x+'px';m.b.style.top=y+'px';m.text.textContent=a.hp+' / 100';m.fill.style.width=a.hp+'%';m.b.setAttribute('aria-label',(i===0?'Герой':'Интерпол')+': '+a.hp+' HP')}for(let i=list.length;i<healthMarkers.length;i++)healthMarkers[i].b.style.display='none'}
function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);refreshHookHover();window.render3D({p,trees,towers,agents,coins,state,elapsed,invis,speed,shield,grace,grapple,stage,lap,skin:saved.skin,weather:window.getWeather(elapsed),hookTarget:hoveredHookTarget,combat},dt);if(state==='running')updateHealthMarkers();if(panel==='skins'){previewRenderer??=window.createSkinPreview($('skinPreview'));previewRenderer.render(previewSkin,t/1000)}requestAnimationFrame(frame)}requestAnimationFrame(frame);
