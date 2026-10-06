window.SKILL_CATALOG=[
 {id:'magnet',name:'Магнит для птенцов',short:'МАГНИТ',price:25,cooldown:25,castTime:0,description:'5 секунд притягивает птенцов в радиусе 210. Откат — 25 секунд.'},
 {id:'requiem',name:'Реквием душ',short:'РЕКВИЕМ',price:210,cooldown:50,castTime:1.67,description:'20 волн душ. До 75% радиуса — 100 урона, дальше — 75. Одно попадание за взрыв и страх.',icon:'souls'},
 {id:'aegis',name:'Aegis Hero 2',short:'AEGIS',price:100,cooldown:30,castTime:.75,description:'Затяжка, небольшое облако дыма и +75 HP. Здоровье не превышает 100.',image:'assets/aegis-hero2.png'},
 {id:'refresher',name:'Рефрешер',short:'РЕФРЕШЕР',price:300,cooldown:100,castTime:0,description:'Обнуляет откаты других навыков и предметов, включая хук. Собственный откат — 100 секунд.'}
];
window.skillIcon=id=>id==='magnet'?'<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#74d8e6" d="M7 8h12v20a5 5 0 0 0 10 0V8h12v20a17 17 0 0 1-34 0Z"/><path fill="#ecf8df" d="M7 8h12v9H7zm22 0h12v9H29Z"/></svg>':id==='aegis'?'<img src="assets/aegis-hero2.png" alt="">':id==='refresher'?'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="#173d35" stroke="#c6b976" stroke-width="3"/><path fill="#74ed9c" d="M10 27C8 7 27 6 29 10c-14 2-8 14-19 17Zm28-6c2 20-17 21-19 17 14-2 8-14 19-17Z"/><path fill="#e1ffaf" d="m22 14 11 4-9 9 3-7-5-1Zm4 20-11-4 9-9-3 7 5 1Z"/></svg>':id==='requiem'?'<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#e94b55" d="M24 2 29 14 39 8 35 20 46 24 34 29 40 40 28 35 24 47 19 35 8 41 14 28 2 24 14 19 8 8 20 14Z"/><path fill="#1d0a17" d="M24 11c-8 0-12 6-12 12 0 9 6 11 12 16 5-5 12-7 12-16 0-7-5-12-12-12Z"/><path fill="#ffd59d" d="m15 22 7 3-3 4-4-2Zm18 0-7 3 3 4 4-2Z"/></svg>':'<span class="empty-skill-icon">＋</span>';

// Twenty visible souls carry one circular blast. Its shared hit set prevents
// overlapping souls from multiplying damage to the same agent in one cast.
window.createCombat=()=>{
 const maxHp=100,damage=15,castTime=1.67,waveSpeed=700,waveRange=550;
 let hp,casting,waves,smoke,cooldowns,hitGrace,damageFlash,healFlash,refreshFlash,kills,magnet;
 function reset(){hp=maxHp;casting=null;waves=[];smoke=null;cooldowns={requiem:0,aegis:0,refresher:0,magnet:0};magnet=0;hitGrace=damageFlash=healFlash=refreshFlash=0;kills=0}
 reset();
 function prepareAgent(a){a.maxHp??=a.kind==='boss'?1000:100;a.hp??=a.maxHp;a.attackCooldown??=0;a.attackWindup??=0;a.attackSwing??=0;a.fear??=0;a.damageFlash??=0;return a}
 function activate(id,p){if(hp<=0)return 'dead';if(casting)return 'casting';if(cooldowns[id]>0)return 'cooldown';if(id==='aegis'&&hp>=maxHp)return 'full';if(!['requiem','aegis','refresher','magnet'].includes(id))return 'unknown';if(id==='magnet'){magnet=5;cooldowns.magnet=25;return 'ok'}if(id==='refresher'){for(const key of Object.keys(cooldowns))if(key!=='refresher')cooldowns[key]=0;cooldowns.refresher=100;refreshFlash=.85;return 'ok'}casting={id,duration:id==='requiem'?castTime:.75,remaining:id==='requiem'?castTime:.75,x:p.x,y:p.y};return 'ok'}
 function damageHero(protectedNow){if(protectedNow||hitGrace>0||hp<=0)return false;hp=Math.max(0,hp-damage);hitGrace=.42;damageFlash=.25;if(hp===0)casting=null;return true}
 function damageAgent(a,amount){prepareAgent(a);if(a.hp<=0)return false;a.hp=Math.max(0,a.hp-amount);a.damageFlash=.23;if(a.hp===0){kills++;a.attackWindup=0;return true}return false}
 function release(p){cooldowns.requiem=50;const pulse={x:p.x,y:p.y,distance:0,previous:0,hits:new Set()};for(let i=0;i<20;i++){const angle=i*Math.PI*2/20;waves.push({x:p.x,y:p.y,dx:Math.sin(angle),dy:Math.cos(angle),distance:0,previous:0,pulse})}}
 function step(dt,p,agents){magnet=Math.max(0,magnet-dt);hitGrace=Math.max(0,hitGrace-dt);damageFlash=Math.max(0,damageFlash-dt);healFlash=Math.max(0,healFlash-dt);refreshFlash=Math.max(0,refreshFlash-dt);for(const id of Object.keys(cooldowns))cooldowns[id]=Math.max(0,cooldowns[id]-dt);
  for(const a of agents){prepareAgent(a);a.attackCooldown=Math.max(0,a.attackCooldown-dt);a.attackSwing=Math.max(0,a.attackSwing-dt);a.fear=Math.max(0,a.fear-dt);a.damageFlash=Math.max(0,a.damageFlash-dt)}
  if(smoke){smoke.age+=dt;if(smoke.age>=2.5)smoke=null}
  if(casting&&hp>0){casting.remaining=Math.max(0,casting.remaining-dt);if(casting.remaining===0){const id=casting.id;casting=null;if(id==='requiem')release(p);else{hp=Math.min(maxHp,hp+75);healFlash=.7;cooldowns.aegis=30;smoke={x:p.x,y:p.y,age:0}}}}
  for(const w of waves){w.previous=w.distance;w.distance=Math.min(waveRange,w.distance+waveSpeed*dt)}
  for(const pulse of new Set(waves.map(w=>w.pulse))){pulse.previous=pulse.distance;pulse.distance=Math.min(waveRange,pulse.distance+waveSpeed*dt);for(const a of agents){if(a.hp<=0||pulse.hits.has(a))continue;const distance=Math.hypot(a.x-pulse.x,a.y-pulse.y);if(distance>=pulse.previous-14&&distance<=pulse.distance&&distance<=waveRange){pulse.hits.add(a);damageAgent(a,distance<=waveRange*.75?100:75);if(a.hp>0){a.fear=Math.min(2.15,a.fear+.6);a.attackWindup=0}}}}
  waves=waves.filter(w=>w.distance<waveRange);
 }
 function attack(a,dt,p,protectedNow){prepareAgent(a);if(a.hp<=0||a.fear>0){a.attackWindup=0;return false}const distance=Math.hypot(a.x-p.x,a.y-p.y);if(a.attackWindup>0){a.attackWindup=Math.max(0,a.attackWindup-dt);if(a.attackWindup===0){a.attackCooldown=a.kind==='boss'?1.8:a.kind==='brute'?1.6:1.15;a.attackSwing=.23;return distance<=(a.kind==='boss'?65:44)?damageHero(protectedNow):false}return false}if(distance<(a.kind==='boss'?60:38)&&a.attackCooldown===0&&!protectedNow){a.attackWindup=a.kind==='boss'?.9:a.kind==='brute'?.55:.25;return false}return false}
 return {reset,activate,step,attack,prepareAgent,damageAgent,damageHero,get hp(){return hp},get dead(){return hp<=0},get casting(){return casting},get waves(){return waves},get smoke(){return smoke},get cooldowns(){return cooldowns},get damageFlash(){return damageFlash},get healFlash(){return healFlash},get refreshFlash(){return refreshFlash},get kills(){return kills},get magnet(){return magnet}};
};
