// Pointer capture keeps one finger steering while another uses an ability.
window.sampleStick=(dx,dy,radius,deadZone=.12)=>{
 const distance=Math.hypot(dx,dy),clamped=Math.min(distance,radius);
 const strength=Math.max(0,(clamped/radius-deadZone)/(1-deadZone));
 const nx=distance?dx/distance:0,ny=distance?dy/distance:0;
 return {x:nx*strength,y:ny*strength,thumbX:nx*clamped,thumbY:ny*clamped};
};
window.createVirtualStick=({element,thumb,onMove,canMove})=>{
 let pointer=null,bounds=null;
 function reset(){const captured=pointer;pointer=null;bounds=null;onMove({x:0,y:0});thumb.style.transform='translate(-50%, -50%)';element.dataset.active='false';if(captured!==null&&element.hasPointerCapture(captured))element.releasePointerCapture(captured)}
 function steer(e){if(e.pointerId!==pointer)return;e.preventDefault();const radius=Math.min(bounds.width,bounds.height)/2-thumb.offsetWidth/2-5;const vector=window.sampleStick(e.clientX-bounds.left-bounds.width/2,e.clientY-bounds.top-bounds.height/2,radius);onMove({x:vector.x,y:vector.y});thumb.style.transform=`translate(calc(-50% + ${vector.thumbX}px), calc(-50% + ${vector.thumbY}px))`}
 element.addEventListener('pointerdown',e=>{if(pointer!==null||!canMove()||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();pointer=e.pointerId;bounds=element.getBoundingClientRect();element.setPointerCapture(pointer);element.dataset.active='true';steer(e)},{passive:false});
 element.addEventListener('pointermove',steer,{passive:false});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,e=>{if(e.pointerId===pointer)reset()});
 window.addEventListener('resize',reset);window.addEventListener('blur',reset);
 return {reset};
};
