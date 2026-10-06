window.SKIN_CATALOG = [
  {id:'classic',name:'Мама птицы',price:0,image:'assets/hero.png',description:'Тот самый синий тазик.'},
  {id:'miti',name:'Мити',price:67,image:'assets/miti.png',description:'Красный тазик. Настроение — огонь.'},
  {id:'massa',name:'Масса',price:200,image:'assets/massa.png',description:'Больше герой — тот же хитбокс.'},
  {id:'artur',name:'Артур',price:350,image:'assets/artur.png',description:'Костюм, рюкзак и пропеллер.'}
];

// Joints are placed at hips, shoulders, knees and elbows, not in limb centers.
window.createRunnerBody=({T,scene,mesh,mat,kind='agent'})=>{
 const root=new T.Group();scene.add(root);const body=new T.Group();body.position.y=40;root.add(body);
 const big=kind==='massa',agent=kind==='agent',skin=mat('#d6a084',.65),cloth=mat(big?'#16171b':agent?'#253347':'#202b3e'),shoe=mat('#151a22',.55);
 function ell(rx,ry,rz,m,x,y,z,parent=body){const o=mesh(new T.SphereGeometry(1,24,18),m,x,y,z,parent);o.scale.set(rx,ry,rz);return o}
 function box(w,h,d,m,x,y,z,parent=body){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,parent)}
 const width=big?27:16;
 ell(width,big?24:20,big?20:11,cloth,0,21,0);
 if(big){ell(28,12,21,skin,0,5,1);ell(29,19,21,cloth,0,26,0);ell(1.2,1,.5,mat('#956852'),0,2,22);
  const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.clearRect(0,0,512,256);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 52px sans-serif';ctx.fillText('МОЁ ТЕЛО',256,112);ctx.fillText('МОЁ ДЕЛО',256,173);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const shirt=mesh(new T.PlaneGeometry(40,20),new T.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false}),0,29,21.7,body);shirt.rotation.x=-.08;
 }else{const white=mat('#edf0e7');box(11,30,2,white,0,24,11);const tie=box(4,25,2,mat('#263b60'),0,22,13);tie.rotation.z=.03;for(const side of [-1,1]){let lapel=box(7,23,2,cloth,side*7,30,12);lapel.rotation.z=side*.2;}box(10,3,2,mat('#bbccde'),-9,29,12.3)}
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const hip=new T.Group();hip.position.set(side*(big?13:8),0,0);body.add(hip);ell(big?10:5,10,6,cloth,0,-9,0,hip);
  const knee=new T.Group();knee.position.y=-18;hip.add(knee);ell(big?9:4.5,10,5.5,cloth,0,-9,0,knee);box(big?18:11,6,18,shoe,0,-35+18,4,knee);legs.push({hip,knee});
  const shoulder=new T.Group();shoulder.position.set(side*(width+3),35,0);body.add(shoulder);ell(big?9:5,9,6,cloth,0,-8,0,shoulder);
  const elbow=new T.Group();elbow.position.y=-16;shoulder.add(elbow);ell(big?7:4,9,4.5,big?skin:cloth,0,-8,0,elbow);ell(4,5,4,skin,0,-18,0,elbow);arms.push({shoulder,elbow});
 }
 ell(big?11:6,8,7,skin,0,43,0);
 root.userData={body,legs,arms,kind,phase:0};return root;
};

window.createRunnerAgent=options=>{
 const {T,mesh,mat}=options,root=window.createRunnerBody({...options,kind:'agent'}),body=root.userData.body;
 const head=mesh(new T.SphereGeometry(10,24,18),mat('#d6a084'),0,57,0,body);head.scale.y=1.15;
 mesh(new T.BoxGeometry(21,4,3),mat('#101923',.3),0,60,9,body);
 mesh(new T.CylinderGeometry(11,11,5,24),mat('#24354b'),0,70,0,body);mesh(new T.BoxGeometry(24,2,18),mat('#24354b'),0,68,4,body);
 const badge=mesh(new T.BoxGeometry(3,5,1),mat('#e7c568',.3),8,31,13,body);badge.rotation.z=.2;
 return root;
};

window.createGameSkin=({T,scene,mesh,mat,id='classic'})=>{
 if(id==='classic'||id==='miti'){const root=window.createMellHero({T,scene,mesh,mat,variant:id,bowlColor:id==='miti'?'#e21b24':'#009fea',rimColor:id==='miti'?'#ff3838':'#29c8ff'});root.userData.kind='basin';return root}
 const root=window.createRunnerBody({T,scene,mesh,mat,kind:id});
 const temporary=window.createMellHero({T,scene,mesh,mat,variant:id}),head=temporary.userData.head;temporary.remove(head);scene.remove(temporary);temporary.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});
 head.position.set(0,43,0);head.scale.multiplyScalar(id==='massa'?.76:.68);root.userData.body.add(head);root.userData.head=head;
 if(id==='artur'){
  const body=root.userData.body,blue=mat('#285583',.65);
  const bag=mesh(new T.BoxGeometry(25,35,12),blue,0,25,-16,body);bag.geometry.computeVertexNormals();
  for(const side of [-1,1]){const strap=mesh(new T.BoxGeometry(4,35,3),blue,side*12,29,11.8,body);strap.rotation.z=side*.08;}
  const cap=new T.Group();cap.position.set(0,44,-.8);head.add(cap);
  ['#e2273b','#1e5ac2','#f2d52b','#2d964a'].forEach((color,i)=>mesh(new T.SphereGeometry(14.3,16,10,i*Math.PI/2,Math.PI/2,0,Math.PI/2),mat(color,.5),0,-1,0,cap));
  const rim=mesh(new T.TorusGeometry(14.3,2.2,12,48),mat('#161a1e'),0,-1,0,cap);rim.rotation.x=Math.PI/2;
  mesh(new T.CylinderGeometry(.7,.7,12,8),mat('#4b5638'),0,18,0,cap);
  const propeller=new T.Group();propeller.position.y=24;cap.add(propeller);mesh(new T.BoxGeometry(37,1.7,5),mat('#f6d522',.3),0,0,0,propeller);mesh(new T.SphereGeometry(2,12,8),mat('#f6d522'),0,0,0,propeller);root.userData.propeller=propeller;
 }
 root.scale.setScalar(id==='massa'?1.06:.86);root.traverse(o=>{if(o.isMesh)o.material=o.material.clone()});return root;
};

window.animateCharacter=(root,time,moving,dt=0)=>{
 const u=root.userData,phase=time*(u.kind==='boss'?6:u.agentKind==='brute'?8:u.kind==='agent'?11:10),stride=moving?1:0;
 if(u.body){u.body.position.y=40+(moving?Math.abs(Math.sin(phase))*2.2:Math.sin(time*2)*.35);u.body.rotation.x=moving?.10:0;u.body.rotation.z=moving?Math.sin(phase)*.045:0;
  u.legs.forEach(({hip,knee},i)=>{let swing=phase+i*Math.PI;hip.rotation.x=Math.sin(swing)*.72*stride;knee.rotation.x=Math.max(0,-Math.sin(swing))*.95*stride+.08;});
  u.arms.forEach(({shoulder,elbow},i)=>{let swing=phase+i*Math.PI;shoulder.rotation.x=-Math.sin(swing)*.62*stride;shoulder.rotation.z=(i?-.10:.10);elbow.rotation.x=-.35-Math.max(0,Math.sin(swing))*.38*stride;});
 }else{root.position.y=moving?Math.abs(Math.sin(phase))*1.8:Math.sin(time*2)*.45;root.rotation.z=moving?Math.sin(phase)*.035:0;root.rotation.x=moving?.04:0;}
 if(u.head){u.head.rotation.y=Math.sin(time*1.4)*.025;u.head.rotation.x=moving?Math.sin(phase*2)*.018:Math.sin(time*2)*.01;}
 if(u.propeller)u.propeller.rotation.y=time*(moving?15:5);
 root.traverse(o=>{if(o.userData.blink){const blink=time%4.7;o.scale.y=o.userData.openY*(blink>4.5?Math.max(.07,Math.abs(blink-4.6)*10):1);}});
};

window.createSkinPreview=canvas=>{
 const T=THREE,renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,1,1000);camera.position.set(155,106,215);camera.lookAt(0,51,0);scene.add(new T.HemisphereLight('#e8f5ff','#34472b',3));const light=new T.DirectionalLight('#fff4d8',3);light.position.set(-100,170,130);scene.add(light);
 const mat=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});const mesh=(geo,m,x=0,y=0,z=0,parent=scene)=>{let o=new T.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o};
 const floor=mesh(new T.CylinderGeometry(61,66,5,64),mat('#385248'),0,-2,0);let hero,id;
 return {render(next,time){if(next!==id){if(hero){scene.remove(hero);hero.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.map?.dispose();o.material.dispose()}})}hero=window.createGameSkin({T,scene,mesh,mat,id:next});id=next;}
  let w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();hero.rotation.y=Math.sin(time*.3)*.28;window.animateCharacter(hero,time,false);renderer.render(scene,camera);}
 };
};
