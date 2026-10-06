window.WEAPON_CATALOG=[
 {id:'ak',name:'Калаш',price:179,magazine:30,damage:10,interval:.16,reload:2.8,range:800,description:'30 патронов · 10 урона · 6,25 выстрела/сек. Автоперезарядка — 2,8 сек.'},
 {id:'deagle',name:'Дигл',price:250,magazine:7,damage:55,interval:.65,reload:2.4,range:850,description:'7 патронов · 55 урона · 1,54 выстрела/сек. Автоперезарядка — 2,4 сек.'}
];
window.weaponIcon=id=>'<svg viewBox="0 0 80 40" aria-hidden="true">'+(id==='ak'?'<path fill="#aab5ae" d="M25 10h45v7H25zM68 12h10v3H68z"/><path fill="#aa7044" d="m4 8 22 3v7L4 25zm47 4h13v8H51z"/><path fill="#4b5757" d="m33 17 8 3-3 16-8-3zm12 1 8 1-4 15-8-2Z"/>':id==='deagle'?'<path fill="#b8c9c7" d="M15 8h52v12H35l-6 5-14-5z"/><path fill="#475655" d="m17 19 20 2-6 17H13z"/><path stroke="#d9e6dc" fill="none" d="M36 20v8h10v-8"/>':'<path fill="none" stroke="#8ca18e" stroke-width="3" d="M40 10v20M30 20h20"/>')+'</svg>';
window.createArsenal=()=>{
 let active=null,ammo={},reloads={},delays={},traces=[],flash=0;
 function reset(){active=null;ammo={};reloads={};delays={};traces=[];flash=0;for(const w of window.WEAPON_CATALOG){ammo[w.id]=w.magazine;reloads[w.id]=delays[w.id]=0}}reset();
 function select(id){active=active===id?null:id;return active}
 function step(dt){flash=Math.max(0,flash-dt);traces=traces.filter(t=>(t.life-=dt)>0);for(const w of window.WEAPON_CATALOG){delays[w.id]=Math.max(0,delays[w.id]-dt);if(reloads[w.id]>0){reloads[w.id]=Math.max(0,reloads[w.id]-dt);if(reloads[w.id]===0)ammo[w.id]=w.magazine}}}
 function shoot(hero,aim,agents,combat,blocked=()=>false){const w=window.WEAPON_CATALOG.find(w=>w.id===active);if(!w||reloads[w.id]>0||delays[w.id]>0||combat.casting||combat.dead)return null;const dx=aim.x-hero.x,dy=aim.y-hero.y,len=Math.hypot(dx,dy);if(len<1)return null;const nx=dx/len,ny=dy/len;let distance=w.range,target=null;
  for(const a of agents){if(a.hp<=0)continue;const x=a.x-hero.x,y=a.y-hero.y,along=x*nx+y*ny,r=a.kind==='boss'?42:a.kind==='brute'?25:20,side=x*ny-y*nx;if(along<=0||Math.abs(side)>r)continue;const near=Math.max(0,along-Math.sqrt(r*r-side*side));if(near<distance){distance=near;target=a}}
  // Bullets stop at terrain, while the hook retains its phase-through movement.
  for(let d=18;d<distance;d+=8)if(blocked(hero.x+nx*d,hero.y+ny*d)){distance=d;target=null;break}
  if(target)combat.damageAgent(target,w.damage);ammo[w.id]--;delays[w.id]=w.interval;flash=.075;traces.push({x:hero.x,y:hero.y,endX:hero.x+nx*distance,endY:hero.y+ny*distance,life:.09});if(ammo[w.id]===0)reloads[w.id]=w.reload;return {id:w.id,hit:!!target,reloading:ammo[w.id]===0}
 }
 return {reset,select,step,shoot,get active(){return active},get ammo(){return ammo},get reloads(){return reloads},get delays(){return delays},get traces(){return traces},get flash(){return flash}};
};
