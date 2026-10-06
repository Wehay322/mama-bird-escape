// Weather uses play time; opening a menu freezes both the cycle and its fade.
window.WEATHER_STATES=[
 {name:'Обычная',fog:0,rain:0,wet:0,sun:.25},
 {name:'Туман',fog:1,rain:0,wet:0,sun:.1},
 {name:'Дождь',fog:.25,rain:1,wet:1,sun:0},
 {name:'Солнце',fog:0,rain:0,wet:0,sun:1}
];
window.getWeather=time=>{const cycle=Math.floor(time/60),index=cycle%4,from=window.WEATHER_STATES[cycle===0?0:(index+3)%4],to=window.WEATHER_STATES[index],t=Math.min(1,(time%60)/8),fade=t*t*(3-2*t);return {name:to.name,fog:from.fog+(to.fog-from.fog)*fade,rain:from.rain+(to.rain-from.rain)*fade,wet:from.wet+(to.wet-from.wet)*fade,sun:from.sun+(to.sun-from.sun)*fade}};
// A storm owns one stable layout. Menus and repeated renders never reroll it.
window.PUDDLES=[];let puddleStorm=-1;
window.resetPuddles=()=>{window.PUDDLES.length=0;puddleStorm=-1};
window.updatePuddles=(time,free,random=Math.random)=>{
 if(time<120)return false;const storm=Math.floor((time-120)/240);if(storm===puddleStorm)return false;
 const next=[];for(let attempt=0;attempt<800&&next.length<18;attempt++){
  const p={x:random()*2040-1020,y:random()*2040-1020,rx:45+random()*32,ry:25+random()*18,angle:random()*Math.PI},c=Math.cos(p.angle),s=Math.sin(p.angle);
  if(!free(p.x,p.y,8)||next.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<110))continue;let valid=true;
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a)*p.rx,y=Math.sin(a)*p.ry;if(!free(p.x+x*c-y*s,p.y+x*s+y*c,6)){valid=false;break}}
  if(valid)next.push(p);
 }
 window.PUDDLES.splice(0,window.PUDDLES.length,...next);puddleStorm=storm;return true;
};
window.puddleAt=(x,y)=>window.PUDDLES.some(p=>{const c=Math.cos(p.angle),s=Math.sin(p.angle),dx=x-p.x,dy=y-p.y;return ((dx*c+dy*s)/p.rx)**2+((-dx*s+dy*c)/p.ry)**2<1});
