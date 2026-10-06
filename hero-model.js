// Sculpted from the supplied front reference. All facial details are 3D geometry.
window.createMellHero=({T,scene,mesh,mat})=>{
 const root=new T.Group();scene.add(root);
 const skin=new T.MeshPhysicalMaterial({color:'#cd9576',roughness:.62,clearcoat:.08,clearcoatRoughness:.8});
 const cheekSkin=new T.MeshStandardMaterial({color:'#d89879',roughness:.75});
 const lip=new T.MeshStandardMaterial({color:'#a65745',roughness:.68});
 const hair=mat('#29231f',.95),teeth=mat('#f4e7d2',.42),eyeWhite=mat('#dfd6c7',.45),iris=mat('#775b40',.4),pupil=mat('#171411',.3);
 function ell(rx,ry,rz,m,x,y,z,parent=root){let o=mesh(new T.SphereGeometry(1,48,32),m,x,y,z,parent);o.scale.set(rx,ry,rz);return o}
 function curve(points,radius,material,parent=root){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),36,radius,10,false),material,0,0,0,parent)}
 // A real thick-walled plastic bowl, rounded at the bottom and open at the top.
 const bowlProfile=[[0,3],[25,3],[29,4],[31,6],[36.5,29],[38,32],[38.8,34],[38.2,35.5],[36.8,35.8],[35.9,33.2],[34.8,29],[28.9,7],[0,7]].map(([r,y])=>new T.Vector2(r,y));
 mesh(new T.LatheGeometry(bowlProfile,96),new T.MeshPhysicalMaterial({color:'#009fea',roughness:.24,clearcoat:.7,clearcoatRoughness:.25}),0,0,0,root);
 const bead=mesh(new T.TorusGeometry(37.4,1.3,16,96),new T.MeshPhysicalMaterial({color:'#29c8ff',roughness:.2,clearcoat:.8}),0,34.5,0,root);bead.rotation.x=Math.PI/2;
 // Bare shoulders sit beneath the rim, with the neck growing into the head.
 ell(29,6,13,skin,0,32,0);ell(10.5,12,9.2,skin,0,41,0);
 const head=new T.Group();head.position.set(0,43,0);root.add(head);
 // Profile rings give the cheeks, jaw, forehead and skull separate proportions.
 const profiles=[[0,7.2,6.4,2.2],[3,11.2,8.5,1.8],[7,13.4,10.1,1.2],[12,16,11.4,.6],[18,17.8,12.2,.1],[24,18.2,12.8,0],[30,17.6,12.8,-.3],[36,16.2,12.1,-.6],[40,13.9,10.8,-.8],[43,10.2,8.4,-1],[45,5.9,5.4,-1.2],[46.4,.05,.05,-1.3]];
 const sample=y=>{let i=profiles.findIndex(p=>p[0]>=y);if(i<=0)return profiles[0].slice(1);const a=profiles[i-1],b=profiles[i],prev=profiles[Math.max(0,i-2)],next=profiles[Math.min(profiles.length-1,i+1)],dy=b[0]-a[0],t=(y-a[0])/dy;return a.slice(1).map((v,j)=>{let k=j+1,m0=(b[k]-prev[k])/(b[0]-prev[0]),m1=(next[k]-a[k])/(next[0]-a[0]);return (2*t*t*t-3*t*t+1)*v+(t*t*t-2*t*t+t)*dy*m0+(-2*t*t*t+3*t*t)*b[k]+(t*t*t-t*t)*dy*m1})};
 const gauss=(x,y,cx,cy,wx,wy)=>Math.exp(-(((x-cx)/wx)**2)-(((y-cy)/wy)**2));
 function skull(minY=0,maxY=46.4,scalp=false){const v=[],ids=[],radial=96,rings=84;for(let j=0;j<=rings;j++){let y=minY+(maxY-minY)*j/rings;for(let i=0;i<=radial;i++){let a=i/radial*Math.PI*2,[rx,rz,cz]=sample(y),x=Math.sin(a)*rx,z=Math.cos(a)*rz+cz,front=Math.max(0,Math.cos(a))**8;
 let relief=1.0*gauss(x,y,0,30,13,7)+1.3*(gauss(x,y,10,18,6,6)+gauss(x,y,-10,18,6,6))-.85*(gauss(x,y,7,26,5,3)+gauss(x,y,-7,26,5,3))+3.5*gauss(x,y,0,21,2.5,5)+1.2*gauss(x,y,0,5,7,3)-4.8*gauss(x,y,0,12.2,7.5,4.8);
 if(scalp){x*=1.014;z*=1.014}v.push(x,y+(scalp?.2:0),z+front*relief);if(j<rings&&i<radial){let k=j*(radial+1)+i;ids.push(k,k+1,k+radial+1,k+1,k+radial+2,k+radial+1)}}}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ids);g.computeVertexNormals();return g}
 mesh(skull(),skin,0,0,0,head);
 // Close-cropped hair follows the skull instead of forming a separate ball.
 mesh(skull(38,46.4,true),hair,0,0,-.1,head);
 for(let side of [-1,1]){ell(1.2,8.7,5.5,hair,side*16.1,31,-3.2,head);ell(2.8,5.3,2.8,skin,side*17.2,24,.3,head);ell(1.35,3.2,.65,cheekSkin,side*18.1,24,2.3,head);
 const cx=side*7.1;ell(4.1,1.65,1.1,eyeWhite,cx,26,12.4,head);ell(1.24,1.22,.36,iris,cx+side*.1,26,13.6,head);ell(.66,.78,.22,pupil,cx+side*.1,26,13.95,head);ell(.28,.3,.15,teeth,cx-.45,26.6,14.13,head);
 curve([[cx-4.4,25.8,12.5],[cx-2.3,27.7,13.1],[cx,28,13.15],[cx+2.2,27.3,13],[cx+4.2,25.7,12.4]],.68,skin,head);
 curve([[cx-4.3,25.8,12.5],[cx-2,24.6,12.9],[cx,24.5,13],[cx+2.3,24.8,12.9],[cx+4.2,25.8,12.4]],.43,cheekSkin,head);
 curve([[cx-4.7,30.5,12.6],[cx-2,31.6,13.0],[cx+.5,31.6,13.2],[cx+4.3,30.7,12.5]],.53,hair,head);
 // Smile pushes the cheek folds upward on both sides.
 curve([[side*3.2,18.3,13],[side*6,15.8,13],[side*8.9,13.6,12.1]],.28,cheekSkin,head);
 }
 // A broad rounded nose integrated with the deformed facial surface.
 ell(2.5,3.5,2.7,skin,0,20.9,15.2,head);ell(2.3,1.75,1.7,skin,-2.5,19.4,14.3,head);ell(2.3,1.75,1.7,skin,2.5,19.4,14.3,head);ell(.75,.35,.65,lip,-2.3,18.75,15.3,head);ell(.75,.35,.65,lip,2.3,18.75,15.3,head);
 // Open laughing mouth, curved lip borders, individual upper teeth and tongue.
 ell(8.1,4.8,.8,mat('#3d201c'),0,12.2,12.25,head);
 curve([[-8.2,13,12.1],[-5.5,16.1,12.6],[-2.3,16.9,13.1],[0,16.4,13.35],[2.3,16.9,13.1],[5.5,16.1,12.6],[8.2,13,12.1]],.66,lip,head);
 curve([[-8.2,13,12.1],[-5.8,9.7,12.6],[-2.5,8.2,13.2],[0,7.95,13.5],[2.5,8.2,13.2],[5.8,9.7,12.6],[8.2,13,12.1]],.78,lip,head);
 for(let i=0;i<8;i++){let x=(i-3.5)*1.55,y=15.0-.024*x*x;const shape=new T.Shape();shape.moveTo(-.68,-.8);shape.quadraticCurveTo(-.68,-1.12,-.37,-1.12);shape.lineTo(.37,-1.12);shape.quadraticCurveTo(.68,-1.12,.68,-.8);shape.lineTo(.68,1.05);shape.lineTo(-.68,1.05);shape.closePath();let tooth=mesh(new T.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.07,bevelThickness:.07}),teeth,x,y,13.0-.012*x*x,head);tooth.rotation.y=-x*.02}
 ell(4,1,.35,mat('#b66c64'),0,9.65,13.1,head);
 root.userData={head};root.traverse(o=>{if(o.isMesh)o.material=o.material.clone()});return root;
};
