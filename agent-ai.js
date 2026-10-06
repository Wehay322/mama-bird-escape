// Static terrain routes are deliberately modest: one search per frame, infrequent
// replanning and short flanks. Agents retain their original speed and damage.
window.createAgentNavigation=({free})=>{
 const spacing=50,minimum=-1100,size=45,walkable=new Map(),edges=new Map();let budget=1;
 const point=id=>({x:minimum+(id%size)*spacing,y:minimum+Math.floor(id/size)*spacing});
 function clear(a,b){const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/7));for(let i=1;i<=steps;i++){const t=i/steps;if(!free(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,14))return false}return true}
 function edgeClear(a,b){const key=Math.min(a,b)*size*size+Math.max(a,b);if(!edges.has(key))edges.set(key,clear(point(a),point(b)));return edges.get(key)}
 function cell(x,y){const cx=Math.max(0,Math.min(size-1,Math.round((x-minimum)/spacing))),cy=Math.max(0,Math.min(size-1,Math.round((y-minimum)/spacing)));return cy*size+cx}
 function canWalk(id){if(!walkable.has(id)){const p=point(id);walkable.set(id,free(p.x,p.y,14))}return walkable.get(id)}
 function nearest(p){const center=cell(p.x,p.y),cx=center%size,cy=Math.floor(center/size);let best=null,score=Infinity;for(let radius=0;radius<=3;radius++){for(let y=Math.max(0,cy-radius);y<=Math.min(size-1,cy+radius);y++)for(let x=Math.max(0,cx-radius);x<=Math.min(size-1,cx+radius);x++){const id=y*size+x,q=point(id),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<score&&canWalk(id)&&clear(p,q)){best=id;score=d}}if(best!==null)return best}return null}
 function route(start,goal){const from=nearest(start),to=nearest(goal);if(from===null||to===null)return [];const end=point(to),cost=new Map([[from,0]]),previous=new Map(),open=[from],closed=new Set();const estimate=id=>{const p=point(id);return Math.hypot(p.x-end.x,p.y-end.y)/spacing};
  for(let count=0;open.length&&count<1500;count++){let best=0;for(let i=1;i<open.length;i++)if(cost.get(open[i])+estimate(open[i])<cost.get(open[best])+estimate(open[best]))best=i;const id=open.splice(best,1)[0];if(id===to){const result=[];let next=id;while(next!==undefined){result.push(point(next));next=previous.get(next)}result.reverse();if(clear(result[result.length-1],goal))result.push({...goal});return result}closed.add(id);const x=id%size,y=Math.floor(id/size);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=size||ny>=size)continue;const next=ny*size+nx;if(closed.has(next)||!canWalk(next)||!edgeClear(id,next))continue;const score=cost.get(id)+Math.hypot(dx,dy);if(score<(cost.get(next)??Infinity)){cost.set(next,score);previous.set(next,id);if(!open.includes(next))open.push(next)}}
  }return [];
 }
 function direction(a,goal,dt){a.routeTimer=Math.max(0,(a.routeTimer||0)-dt);if(clear(a,goal)){a.route=[];return{x:goal.x-a.x,y:goal.y-a.y}}
  const movedGoal=!a.routeGoal||Math.hypot(goal.x-a.routeGoal.x,goal.y-a.routeGoal.y)>85;
  if(budget>0&&((!a.route?.length&&a.routeTimer===0)||(a.routeTimer===0&&movedGoal))){budget--;a.route=route(a,goal);a.routeGoal={...goal};a.routeTimer=1.25+(a.phase||0)*.055}
  while(a.route?.length&&Math.hypot(a.route[0].x-a.x,a.route[0].y-a.y)<6&&(a.route.length===1||clear(a,a.route[1])))a.route.shift();
  if(a.route?.length){for(let i=Math.min(a.route.length-1,4);i>0;i--)if(clear(a,a.route[i])){a.route.splice(0,i);break}const next=a.route[0];return{x:next.x-a.x,y:next.y-a.y}}
  // Search budget exhausted: probe around the obstruction instead of stalling.
  const heading=Math.atan2(goal.y-a.y,goal.x-a.x);for(const offset of [0,.6,-.6,1.1,-1.1,1.6,-1.6]){const x=Math.cos(heading+offset)*65,y=Math.sin(heading+offset)*65;if(clear(a,{x:a.x+x,y:a.y+y}))return{x,y}}return{x:0,y:0};
 }
 function goal(a,hero,velocity){const dx=hero.x-a.x,dy=hero.y-a.y,d=Math.hypot(dx,dy),role=Math.floor((a.phase||0)*2)%7;if(d<110||![1,2].includes(role))return hero;const v=Math.hypot(velocity.x,velocity.y),nx=v>25?velocity.x/v:dx/Math.max(1,d),ny=v>25?velocity.y/v:dy/Math.max(1,d),side=role===1?1:-1;const target={x:hero.x+velocity.x*.3-ny*70*side,y:hero.y+velocity.y*.3+nx*70*side};return free(target.x,target.y,10)?target:hero}
 return {beginFrame(){budget=1},reset(){walkable.clear();edges.clear();budget=1},direction,goal,route,clear};
};
