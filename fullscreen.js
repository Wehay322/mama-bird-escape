// Keep a visible exit button even when an overlay covers the arena.
window.createFullscreenControl=({arena,buttons,onResize,onReset,onMessage})=>{
 let expanded=false,busy=false,previousFocus=null;
 const nativeElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
 function sync(){const native=nativeElement();if(native)expanded=native===arena;else if(!arena.classList.contains('screen-fallback'))expanded=false;
  arena.classList.toggle('screen-expanded',expanded);document.body.classList.toggle('game-expanded',expanded);
  for(const b of buttons){b.setAttribute('aria-pressed',String(expanded));b.setAttribute('aria-label',expanded?'Выйти из полного экрана':'Открыть игру на весь экран');b.title=expanded?'Выйти из полного экрана':'На весь экран'}onReset?.();requestAnimationFrame(()=>onResize?.());
 }
 function fallback(){expanded=true;arena.classList.add('screen-fallback');sync()}
 async function toggle(){if(busy)return;busy=true;try{
  if(expanded){if(nativeElement()){const exit=document.exitFullscreen||document.webkitExitFullscreen;await exit.call(document)}else{arena.classList.remove('screen-fallback');expanded=false}sync();previousFocus?.focus?.()}
  else{previousFocus=document.activeElement;arena.classList.add('screen-fallback');expanded=true;sync();const request=arena.requestFullscreen||arena.webkitRequestFullscreen;if(request){try{await request.call(arena,{navigationUI:'hide'});arena.classList.remove('screen-fallback');sync()}catch{onMessage?.('Игра развёрнута на всё окно браузера')}}}
 }catch{onMessage?.('Не удалось переключить экран. Попробуй кнопку ещё раз.')}finally{busy=false}}
 for(const b of buttons)b.onclick=toggle;for(const e of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(e,sync);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&arena.classList.contains('screen-fallback')){e.preventDefault();e.stopImmediatePropagation();toggle()}},true);
 sync();return {toggle,get expanded(){return expanded}};
};
if(typeof navigator!=='undefined'&&(/OPR\//i.test(navigator.userAgent)||/Opera/i.test(navigator.userAgent)||/opera-safe-15|safe2d/i.test(location.search))){const s=document.createElement('script');s.src='safe2d.js?v=opera-safe-15';document.head.appendChild(s)}
