// Weather uses play time; opening a menu freezes both the cycle and its fade.
window.WEATHER_STATES=[
 {name:'Обычная',fog:0,rain:0,wet:0,sun:.25},
 {name:'Туман',fog:1,rain:0,wet:0,sun:.1},
 {name:'Дождь',fog:.25,rain:1,wet:1,sun:0},
 {name:'Солнце',fog:0,rain:0,wet:0,sun:1}
];
window.getWeather=time=>{const cycle=Math.floor(time/60),index=cycle%4,from=window.WEATHER_STATES[cycle===0?0:(index+3)%4],to=window.WEATHER_STATES[index],t=Math.min(1,(time%60)/8),fade=t*t*(3-2*t);return {name:to.name,fog:from.fog+(to.fog-from.fog)*fade,rain:from.rain+(to.rain-from.rain)*fade,wet:from.wet+(to.wet-from.wet)*fade,sun:from.sun+(to.sun-from.sun)*fade}};
window.PUDDLES=[[-510,480,52,28],[-640,650,63,32],[-220,220,57,28],[330,-310,65,34],[700,-720,70,30],[-1010,260,60,32],[-1020,-480,72,30],[700,1020,65,29],[1010,270,69,33],[-850,740,59,36],[230,1015,62,33],[-1020,-830,52,30],[780,-1020,62,34],[-450,-1030,52,32]].map(([x,y,rx,ry])=>({x,y,rx,ry}));
window.puddleAt=(x,y)=>window.PUDDLES.some(p=>((x-p.x)/p.rx)**2+((y-p.y)/p.ry)**2<1);
