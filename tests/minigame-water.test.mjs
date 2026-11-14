import test from 'node:test';import assert from 'node:assert/strict';
import {WaterGame,createWaterMeshes,ORIGIN,REACH,NEAR_RADIUS,HINTS,SPRING,SPRING_STONE,JUNCTION,BASINS,HOLLOWS,BASIN_RADIUS,HOLLOW_RADIUS,SLUICES,LANDMARKS,EDGES,START,SOLUTION,flow,isSolved,turn,actionsBetween,correctCount,waterLayout,along,mossyStones,clearance} from '../dist/minigame-water.mjs';

// De echte valleigrond (zonder meer), en een vlakke grond voor eenvoudige gevallen.
const valley=(x,z)=>1.3+3*Math.sin(x*.023)*Math.cos(z*.019)+1.5*Math.sin(z*.045+x*.01);
const kit=()=>{let n=0;const f=()=>{};return {orb:f,cone:f,beam:f,curveTube:f,tri:f,material:f,upload:()=>({id:++n})};};
const eye=(g,[x,,z])=>[x,g.ground(x,z)+2.4,z];
const at=(g,k)=>eye(g,g.stations[k]);
const all=()=>{const out=[[]];for(const s of SLUICES){const next=[];for(const o of out)for(let v=0;v<s.settings.length;v++)next.push([...o,v]);out.splice(0,out.length,...next);}return out;};
const rng=seed=>()=>(seed=(seed*16807)%2147483647)/2147483647;

test('the network is a small directed graph whose solution is unique',()=>{
  const configs=all();assert.equal(configs.length,3*2*3*2*2*2);
  const solved=configs.filter(isSolved);
  assert.equal(solved.length,1,'exactly one configuration feeds all three basins with nothing wasted');
  assert.deepEqual(solved[0],[...SOLUTION]);
  assert.equal(SLUICES.filter(s=>s.kind!=='diverter').length>=2,true,'at least two splitters or gates');
  assert(SLUICES.length>=5&&SLUICES.length<=6);
  const nodes=new Set(['bron','knoop',...SLUICES.map(s=>s.id),...BASINS.map(b=>b.id),...HOLLOWS.map(h=>h.id)]);
  for(const [a,b] of EDGES){assert(nodes.has(a)&&nodes.has(b),`${a}->${b}`);}
  for(const s of SLUICES)for(const o of s.settings)for(const t of o.to)assert(EDGES.some(([a,b])=>a===s.id&&b===t),`${s.id} can send to ${t}`);
  // Elke sluis krijgt water in de oplossing: anders zou zijn stand er niet toe doen.
  const f=flow(SOLUTION);for(const s of SLUICES)assert(f.reached.includes(s.id),s.id);
});

test('the flow function is pure and follows the settings',()=>{
  const a=[...START],before=JSON.stringify(a);
  assert.deepEqual(flow(a),flow(a));assert.equal(JSON.stringify(a),before,'flow does not change its input');
  const start=flow(START);assert.deepEqual(start.basins,[false,true,false]);assert.equal(start.waste,false);
  const closedEverything=flow([0,1,0,0,0,0]);assert.deepEqual(closedEverything.basins,[false,true,false],'west to the middle reaches only the north basin');
  const waste=flow([1,0,1,1,1,0]);assert.deepEqual(waste.basins,[true,true,false]);assert.equal(waste.waste,true,'the stump sends water into the dry hollow');
  const done=flow(SOLUTION);assert.equal(done.fed,3);assert.equal(done.waste,false);
  assert.deepEqual(turn([2,1,0,0,1,0],0),[0,1,0,0,1,0],'a three-way sluice wraps round');
  assert.equal(correctCount(SOLUTION),SLUICES.length);
});

test('the start is unsolved, not one turn away, and solvable within eight',()=>{
  assert.equal(isSolved(START),false);
  for(let k=0;k<SLUICES.length;k++)assert.equal(isSolved(turn(START,k)),false,`one turn of ${SLUICES[k].id} does not solve it`);
  // Breedte-eerst door alle standen: de kortste weg is precies wat de draaiafstand zegt.
  const key=s=>s.join(''),dist=new Map([[key(START),0]]),queue=[[...START]];
  while(queue.length){const s=queue.shift();for(let k=0;k<SLUICES.length;k++){const n=turn(s,k);if(!dist.has(key(n))){dist.set(key(n),dist.get(key(s))+1);queue.push(n);}}}
  const d=dist.get(key(SOLUTION));assert.equal(d,actionsBetween(START,SOLUTION));assert(d>=2&&d<=8,`shortest solution takes ${d} turns`);
  assert.equal(dist.size,all().length,'every configuration is reachable');
});

test('every station, basin and hollow lies within 12 m of the origin, clear of each other',()=>{
  const r=([dx,dz])=>Math.hypot(dx,dz);
  for(const s of SLUICES)assert(r(s.at)+.6<=12,s.id);
  for(const b of BASINS)assert(r(b.at)+BASIN_RADIUS<=12,b.id);
  for(const h of HOLLOWS)assert(r(h.at)+HOLLOW_RADIUS<=12,h.id);
  assert(r(SPRING_STONE)+.9<=12);assert(r(SPRING)<=12);assert(r(JUNCTION)<=12);
  for(const a of SLUICES)for(const b of SLUICES)if(a!==b)assert(Math.hypot(a.at[0]-b.at[0],a.at[1]-b.at[1])>3.5,`${a.id} and ${b.id} are apart`);
  const L=waterLayout(valley);
  for(const v of Object.values(LANDMARKS))for(const p of Array.isArray(v[0])?v:[v]){assert(clearance(L,p)>1.2,`landmark ${p} stays off the gutters`);assert(r(p)<=11.2);}
  const stones=mossyStones(valley);assert(stones.length>=4);
  for(const [dx,dz,s] of stones){assert(r([dx,dz])+s<=12);assert(clearance(L,[dx,dz])>s+.8);}
  for(const e of L.edges){assert(e.length>1,`${e.from}->${e.to} is a real gutter`);for(const p of e.samples)assert.equal(p[1],valley(p[0],p[2]),'gutters lie on the ground');}
  assert.deepEqual(ORIGIN,[-32,-52]);
});

test('a scripted visit walks between the sluices and brings the water back',()=>{
  const g=new WaterGame(valley);assert.equal(g.solved,false);assert.equal(g.begun,false);
  const far=eye(g,[ORIGIN[0],0,ORIGIN[1]+30]);assert.equal(g.near(far),false);assert.equal(g.prompt(far,{}),null);assert.deepEqual(g.interact(far,{yaw:0}),[]);
  assert.equal(g.near(eye(g,[ORIGIN[0]+NEAR_RADIUS-1,0,ORIGIN[1]])),true);
  const script=['steen','steen','wortel','boog','varens','stronk'],log=[];
  for(const id of script){
    const k=SLUICES.findIndex(s=>s.id===id),stand=at(g,k);stand[0]+=1.5;stand[2]-=1.2;   // niet precies op de paal, wel binnen bereik
    for(let i=0;i<10;i++)g.update(.1,stand,{moving:i<5});
    const label=g.prompt(stand,{flying:false});assert(label&&label.length<=28,label);
    assert.equal(g.prompt(stand,{flying:true}),null,'not while flying');assert.deepEqual(g.interact(stand,{flying:true,yaw:0}),[]);
    const ev=g.interact(stand,{flying:false,yaw:.3});log.push(ev);
    assert.equal(ev[0].type,'bell');assert.equal(ev[0].note,SLUICES[k].note);assert(Number.isFinite(ev[0].pan)&&Math.abs(ev[0].pan)<=1);
  }
  assert.equal(g.begun,true);
  const types=log.map(e=>e.map(x=>x.type));
  assert.deepEqual(types,[['bell'],['bell'],['bell','chime'],['bell'],['bell'],['bell','chime','toast','solved']]);
  const toast=log[5].find(e=>e.type==='toast');assert.match(toast.text,/water/);assert(!toast.text.includes('!'));
  assert.equal(g.solved,true);assert.deepEqual(g.snapshot().settings,[...SOLUTION]);
  // Daarna blijft het stromen en draait niets meer.
  for(let k=0;k<SLUICES.length;k++){assert.equal(g.prompt(at(g,k),{}),null);assert.deepEqual(g.interact(at(g,k),{yaw:0}),[]);}
  assert.deepEqual(g.snapshot().settings,[...SOLUTION]);assert.equal(flow(g.settings).fed,3);
  assert.deepEqual(g.update(5,at(g,0),{}),[]);assert.match(g.words()[0],/stroomt weer/);
});

test('notes differ per sluice and stay soft and low',()=>{
  const notes=SLUICES.map(s=>s.note);assert.equal(new Set(notes).size,notes.length);
  for(const n of notes)assert(n>=100&&n<=300);
  for(const s of SLUICES){assert.match(s.name,/^de /);assert(s.name.length<40);}
});

test('walking about never changes anything, and random turning only solves at the one solution',()=>{
  const g=new WaterGame(valley),rand=rng(91);
  for(let i=0;i<3000;i++){const p=eye(g,[ORIGIN[0]+(rand()-.5)*30,0,ORIGIN[1]+(rand()-.5)*30]);g.update(.05,p,{moving:true});g.prompt(p,{});}
  assert.deepEqual(g.snapshot().settings,[...START]);assert.equal(g.solved,false);assert.equal(g.begun,false);
  let solvedEvents=0;
  for(let i=0;i<200;i++){
    const k=Math.floor(rand()*SLUICES.length),ev=g.interact(at(g,k),{yaw:rand()*6});
    solvedEvents+=ev.filter(e=>e.type==='solved').length;
    assert.equal(g.solved,g.snapshot().settings.join()===SOLUTION.join(),'solved exactly when every sluice stands right');
    if(g.solved)break;
  }
  assert(solvedEvents<=1);
  // Een plek tussen de sluisjes in (buiten bereik van alle) doet niets.
  const gap=eye(g,[ORIGIN[0]+SPRING[0]-5.5,0,ORIGIN[1]+SPRING[1]]);
  assert(g.stations.every(s=>Math.hypot(s[0]-gap[0],s[2]-gap[2])>REACH));assert.equal(g.prompt(gap,{}),null);
  const high=at(new WaterGame(valley),0);high[1]+=10;assert.equal(new WaterGame(valley).prompt(high,{}),null,'hovering high above is not on foot');
});

test('reset() returns to the unsolved start, also after the lead restores progress',()=>{
  const g=new WaterGame(valley);for(const k of[0,0,1])g.interact(at(g,k),{});g.update(100,at(g,1),{});
  g.reset();assert.deepEqual(g.snapshot().settings,[...START]);assert.equal(g.solved,false);assert.equal(g.begun,false);assert.equal(g.snapshot().idle,0);
  g.solved=true;assert.deepEqual(g.snapshot().settings,[...SOLUTION]);assert.equal(g.prompt(at(g,2),{}),null);
  assert.equal(g.visuals(0,false).parts.filter(p=>p.mesh==='basinLit').length,3,'restored progress shows the water running');
  assert.equal(g.visuals(0,false).parts.some(p=>p.mesh==='gateLit'),false);
  g.reset();assert.equal(g.solved,false);assert.deepEqual(g.snapshot().settings,[...START]);
  // Na reset klinkt het klokje opnieuw bij de eerste keer vullen.
  for(const k of[0,0])g.interact(at(g,k),{});assert.deepEqual(g.interact(at(g,1),{}).map(e=>e.type),['bell','chime']);
});

test('words() name the goal, follow progress and give escalating guidance',()=>{
  const g=new WaterGame(valley),here=eye(g,[ORIGIN[0]+1,0,ORIGIN[1]+1]);
  const first=g.words();assert.equal(first[0],'De waterloop');assert.match(first[1],/drie wortelkommen/);
  for(const [,text] of [first])assert(!text.includes('!'));
  g.interact(at(g,0),{});assert.match(g.words()[1],/^Eén van de drie kommen krijgt water\./);
  g.interact(at(g,0),{});g.interact(at(g,1),{});assert.match(g.words()[1],/^Twee van de drie kommen krijgen water\./);
  g.interact(at(g,2),{});g.interact(at(g,3),{});assert.match(g.words()[1],/Twee van de drie.*droge kuil/);
  assert.notEqual(g.words()[1],first[1]);
  // Getimede wenken: alleen in het speelveld, en een nieuwe stap vooruit zet de klok terug.
  const h=new WaterGame(valley),far=eye(h,[ORIGIN[0]+50,0,ORIGIN[1]]);
  for(let i=0;i<400;i++)h.update(1,far,{});assert.equal(h.snapshot().idle,0,'time away from the roots does not count');
  for(let i=0;i<89;i++)h.update(1,here,{});assert(!/Kijk eens/.test(h.words()[1]));
  h.update(1,here,{});assert.match(h.words()[1],/Kijk eens bij de sluis bij de bronsteen\./);
  for(let i=0;i<90;i++)h.update(1,here,{});assert.match(h.words()[1],/De sluis bij de bronsteen wil het water naar twee kanten laten gaan\./);
  assert(!/Kijk eens/.test(h.words()[1]),'the second hint replaces the first');
  h.interact(at(h,0),{});assert.match(h.words()[1],/bronsteen wil/,'a turn that is no progress keeps the hint');
  h.interact(at(h,0),{});assert(!/bronsteen|Kijk eens/.test(h.words()[1]),'progress clears the hint');
  for(let i=0;i<95;i++)h.update(1,here,{});assert.match(h.words()[1],/Kijk eens bij de sluis bij de gespleten wortel\./,'the next hint names the next sluice');
  for(let i=0;i<90;i++)h.update(1,here,{});assert.match(h.words()[1],/gespleten wortel wil het water naar de westkom sturen/);
  for(const k of[1,2,3])h.interact(at(h,k),{});
  for(let i=0;i<200;i++)h.update(1,here,{});assert.match(h.words()[1],/holle stronk wil het water naar de oostkom sturen/);
  h.interact(at(h,4),{});assert.deepEqual(h.words(),['Het water stroomt weer','De drie kommen lopen vol. Onder de wortels hoor je de rivier weer.']);
  assert.deepEqual(HINTS,[90,180]);
});

test('visuals() use only existing meshes, finite numbers and follow the water',()=>{
  const meshes=createWaterMeshes(kit(),valley);
  assert(meshes.scenery&&meshes.gate&&meshes.gateLit&&meshes.basinLit);
  for(let i=0;i<EDGES.length;i++)assert(meshes['flow'+i],'flow'+i);
  const g=new WaterGame(valley),check=v=>{
    for(const p of v.parts){assert(p.mesh in meshes,p.mesh);assert.equal(p.position.length,3);for(const n of[...p.position,p.rotation])assert(Number.isFinite(n));}
    assert(v.motes.length<=60);for(const m of v.motes){assert.equal(m.length,3);for(const n of m)assert(Number.isFinite(n));}
  };
  const v=g.visuals(3.2,false);check(v);
  const wet=flow(START).wet.map((w,i)=>w?'flow'+i:null).filter(Boolean);
  assert.deepEqual(v.parts.filter(p=>p.mesh.startsWith('flow')).map(p=>p.mesh),wet);
  for(const p of v.parts.filter(p=>p.mesh.startsWith('flow'))){assert.deepEqual(p.position,[0,0,0]);assert.equal(p.rotation,0);}
  assert.equal(v.parts.filter(p=>p.mesh==='gate').length,SLUICES.length);
  assert.equal(v.parts.filter(p=>p.mesh==='basinLit').length,1);assert.equal(v.parts.some(p=>p.mesh==='gateLit'),false);
  g.update(.1,at(g,1),{});const lit=g.visuals(0,false).parts.filter(p=>p.mesh==='gateLit');
  assert.equal(lit.length,1);assert.equal(lit[0].position[0],g.stations[1][0],'the marker shows at the sluice you stand at');
  // De plank wijst naar de uitgang die water krijgt (de wereld draait lokaal -z naar (-sin r,-cos r)).
  g.interact(at(g,1),{});const r=g.gateRotation(1),s=g.stations[1],kom=g.layout.nodes.westkom,d=Math.hypot(kom[0]-s[0],kom[2]-s[2]);
  assert(Math.abs(-Math.sin(r)-(kom[0]-s[0])/d)<1e-9&&Math.abs(-Math.cos(r)-(kom[2]-s[2])/d)<1e-9);
  assert.notEqual(g.gateRotation(3),(g.interact(at(g,3),{}),g.gateRotation(3)),'opening the gate turns it');
  for(let t=0;t<20;t+=.37){check(g.visuals(t,false));check(g.visuals(t,true));}
  g.solved=true;check(g.visuals(1,false));assert(g.visuals(1,false).motes.length>g.visuals(1,true).motes.length,'fewer motes when reduced');
  assert.deepEqual(g.visuals(1,true).motes,g.visuals(9,true).motes,'reduced motion keeps the motes still');
  assert.notDeepEqual(g.visuals(1,false).motes,g.visuals(1.2,false).motes);
  // De lichtjes drijven stroomafwaarts: u groeit met de tijd (op de omslag na).
  const a=g.drift(2,false),b=g.drift(2.05,false);assert.equal(a.length,b.length);
  for(let i=0;i<a.length;i++){assert.equal(a[i].edge,b[i].edge);if(a[i].u<.9)assert(b[i].u>a[i].u);}
  const e=g.layout.edges[0],start=along(e,0),end=along(e,1);assert.deepEqual(start,e.samples[0]);assert.deepEqual(end,e.samples.at(-1));
  assert.equal(e.from,'bron');
});

test('the mesh creator builds the water strips in world coordinates and stays modest',()=>{
  // Een kit die driehoeken per upload telt en de hoekpunten bewaart.
  let groups=[],cur={tris:[],count:0},mat=0,materials=new Set();
  const add=n=>{cur.count+=n;};
  const k={orb:(x,y,z,rx,ry,rz,c,s=12,r=7)=>{add(s*r*2);if(c.some(v=>v>1.01))cur.glow=true;},cone:(x,y,z,a,b,h,c,s=8)=>add(s*4),beam:()=>add(12),curveTube:(p,r,c,s=10)=>{add((p.length-1)*s*2);for(const q of p)for(const v of q)assert(Number.isFinite(v));},
    tri:(a,b,c,col)=>{add(1);cur.tris.push([a,b,c,col]);for(const v of[...a,...b,...c])assert(Number.isFinite(v));},material:n=>{mat=n;materials.add(n);},upload:()=>{groups.push(cur);cur={tris:[],count:0};return {id:groups.length};}};
  const meshes=createWaterMeshes(k,valley);
  assert.equal(mat,0,'material(0) at the end');assert(materials.has(5)&&materials.has(3));
  assert(groups[0].count<6000,`scenery has about ${groups[0].count} triangles`);
  const L=waterLayout(valley);
  L.edges.forEach((e,i)=>{
    const grp=groups[meshes['flow'+i].id-1];assert(grp.tris.length>0);
    for(const [a,b,c,col] of grp.tris){assert(col.some(v=>v>1.01),'the water glows');
      for(const p of[a,b,c]){assert(clearance(L,[p[0]-ORIGIN[0],p[2]-ORIGIN[1]])<.3,'the strip lies along a gutter');
        const y=p[1]-valley(p[0],p[2]);assert(y>0&&y<.2,'just above the gutter floor');}}
  });
  const disc=groups[meshes.basinLit.id-1];for(const [a,b,c] of disc.tris)for(const p of[a,b,c])assert(Math.hypot(p[0],p[2])<=BASIN_RADIUS&&Math.abs(p[1])<.05,'basin disc around the local origin');
  const gate=groups[meshes.gate.id-1];for(const [a,b,c] of gate.tris)for(const p of[a,b,c])assert(Math.hypot(p[0],p[2])<1,'gate around the local origin');
  assert(groups[meshes.gateLit.id-1].glow);
  // De gewone stub-kit uit het contract werkt ook, en een andere oorsprong verschuift alles.
  assert(createWaterMeshes(kit(),()=>0,{origin:[10,10]}).scenery);
  const moved=new WaterGame(()=>0,{origin:[10,10]});assert.equal(moved.near([10,2.4,10]),true);assert.equal(moved.near([-32,2.4,-52]),false);
});

test('two identical visits give identical results',()=>{
  const run=()=>{const g=new WaterGame(valley),rand=rng(5),out=[];
    for(let i=0;i<40;i++){const k=Math.floor(rand()*SLUICES.length);g.update(.5,at(g,k),{});out.push(g.interact(at(g,k),{yaw:i*.1}));}
    return JSON.stringify([out,g.snapshot(),g.words(),g.visuals(4,false)]);};
  assert.equal(run(),run());
  const s=new WaterGame(valley).snapshot();assert.deepEqual(JSON.parse(JSON.stringify(s)),s,'snapshot is plain JSON');
});
