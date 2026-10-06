window.createMusicManager=({element,enabled,volume,masterVolume=1,onChange})=>{
 element.loop=true;element.volume=volume*masterVolume;
 let allowed=false;
 function play(){if(!enabled||!allowed||document.hidden)return;element.play().catch(()=>{})}
 function apply(){element.volume=volume*masterVolume;if(enabled)play();else element.pause();onChange({enabled,volume})}
 const manager={unlock(){allowed=true;play()},setEnabled(value){enabled=Boolean(value);apply()},setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));apply()},setMasterVolume(value){masterVolume=Math.max(0,Math.min(1,Number(value)||0));element.volume=volume*masterVolume},get enabled(){return enabled},get volume(){return volume}};
 document.addEventListener('pointerdown',()=>manager.unlock());document.addEventListener('keydown',()=>manager.unlock());
 document.addEventListener('visibilitychange',()=>document.hidden?element.pause():play());
 return manager;
};
