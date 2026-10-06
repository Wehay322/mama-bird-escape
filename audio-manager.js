window.createMusicManager=({element,enabled,volume,onChange})=>{
 element.loop=true;element.volume=volume;
 let allowed=false;
 function play(){if(!enabled||!allowed||document.hidden)return;element.play().catch(()=>{})}
 function apply(){element.volume=volume;if(enabled)play();else element.pause();onChange({enabled,volume})}
 const manager={unlock(){allowed=true;play()},setEnabled(value){enabled=Boolean(value);apply()},setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));apply()},get enabled(){return enabled},get volume(){return volume}};
 document.addEventListener('pointerdown',()=>manager.unlock());document.addEventListener('keydown',()=>manager.unlock());
 document.addEventListener('visibilitychange',()=>document.hidden?element.pause():play());
 return manager;
};
