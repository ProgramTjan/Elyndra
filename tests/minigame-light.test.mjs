import test from 'node:test';import assert from 'node:assert/strict';
import {LightGame,createLightMeshes,trace,solves,reflect,facing,ORIGIN,PLAY_RADIUS,NEAR_RADIUS,STAIR_X,STAIR_CLEAR,SOURCE,MIRRORS,LANDMARKS,TARGET,TARGET_RADIUS,REACH,RING_HEIGHT,BEAM_HEIGHT,MAX_MOTES,MAX_RANGE} from '../dist/minigame-light.mjs';

// Dezelfde golvende grond als in de vallei, zonder rivier en meer.
const ground=(x,z)=>1.3+3*Math.sin(x*.023)*Math.cos(z*.019)+1.5*Math.sin(z*.045+x*.01);
const kit=()=>{let n=0;const f=()=>{};return {orb:f,cone:f,beam:f,curveTube:f,tri:f,material:f,upload:()=>({id:++n})};};
const near=(a,b,e=1e-9)=>a.every((v,i)=>Math.abs(v-b[i])<e);
const at=(x,z,y)=>[x,y??ground(x,z)+2.4,z];
// Een plek om bij een spiegel te staan: 2 m ten zuidwesten, buiten de straal maar binnen bereik.
const standAt=i=>at(MIRRORS[i].x-1.4,MIRRORS[i].z+1.4);
const combos=function*(){for(let a=0;a<8;a++)for(let b=0;b<8;b++)for(let c=0;c<8;c++)yield [a,b,c];};
const layout=turns=>MIRRORS.map((m,i)=>({x:m.x,z:m.z,facing:turns[i]}));
const S=Math.SQRT1_2;

test('facing follows the yaw convention and reflection is a true mirror reflection',()=>{
  assert(near(facing(0),[0,-1]));assert(near(facing(2),[1,0]));assert(near(facing(4),[0,1]));assert(near(facing(6),[-1,0]));
  assert(near(facing(3),[S,S]));assert(near(facing(9),facing(1)));assert(near(facing(-1),facing(7)));
  // Met de hand: oost op een westwaartse spiegel kaatst recht terug.
  assert(near(reflect([1,0],[-1,0]),[-1,0]));
  // Zuidoost op een spiegel die naar het noorden kijkt wordt noordoost.
  assert(near(reflect([S,S],[0,-1]),[S,-S]));
  // Noord op een spiegel die naar het zuidoosten kijkt wordt oost.
  assert(near(reflect([0,-1],[S,S]),[1,0]));
  // Een spiegeling behoudt de lengte, en twee keer spiegelen geeft het origineel.
  for(let k=0;k<8;k++)for(let j=0;j<8;j++){const d=facing(k),r=reflect(d,facing(j));assert(Math.abs(Math.hypot(...r)-1)<1e-12);assert(near(reflect(r,facing(j)),d));}
});

test('the ray trace: reflection, the stone back, misses, grazing, range, bounces and the target',()=>{
  const src={x:0,z:0,facing:2},far={target:[500,500]};
  // Spiegel naar het noordwesten: oost wordt noord, de rest van de 60 m loopt de straal uit.
  let r=trace(src,[{x:10,z:0,facing:7}],far);
  assert.equal(r.end,'nothing');assert.deepEqual(r.hits,[0]);assert(near(r.points[1],[10,0]));assert(near(r.points[2],[10,-50]));
  // Dezelfde plek, 180 graden gedraaid: de straal stuit op de achterkant.
  r=trace(src,[{x:10,z:0,facing:3}],far);assert.equal(r.end,'mirror back');assert.deepEqual(r.hits,[]);assert.equal(r.blocked,0);assert(near(r.points[1],[10,0]));
  // Een spiegel van 2,4 m breed: 1,1 m naast het midden raak, 1,3 m ernaast mis.
  r=trace(src,[{x:10,z:1.1,facing:6}],far);assert.equal(r.end,'nothing');assert.deepEqual(r.hits,[0]);assert(near(r.points[2],[-40,0]));
  r=trace(src,[{x:10,z:1.3,facing:6}],far);assert.equal(r.end,'nothing');assert.deepEqual(r.hits,[]);assert(near(r.points[1],[MAX_RANGE,0]));
  // Langs het vlak scheren (evenwijdig) gaat erlangs.
  r=trace(src,[{x:10,z:0,facing:0}],far);assert.equal(r.end,'nothing');assert.deepEqual(r.hits,[]);
  // Twee spiegels die elkaar aankijken: binnen 60 m drie keer heen en weer, en met meer bereik de grens van 8 weerkaatsingen.
  const pair=[{x:10,z:0,facing:6},{x:-10,z:0,facing:2}];
  r=trace(src,pair,far);assert.equal(r.end,'nothing');assert.deepEqual(r.hits,[0,1,0]);
  const length=r.points.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-r.points[i][0],p[1]-r.points[i][1]),0);assert(Math.abs(length-MAX_RANGE)<1e-9);
  r=trace(src,pair,{...far,range:1000});assert.equal(r.end,'bounces');assert.equal(r.hits.length,8);
  // Het doel: de straal eindigt op de rand van de cirkel, ook als er een spiegel achter staat.
  r=trace(src,[{x:30,z:0,facing:6}],{target:[20,0],radius:2.5});assert.equal(r.end,'target');assert(near(r.points[1],[17.5,0]));
  r=trace(src,[],{target:[20,3],radius:2.5});assert.equal(r.end,'nothing','a target 3 m beside the beam is missed');
});

test('the play area lies west of the stair, every leg of the solution is an exact diagonal',()=>{
  const things=[[SOURCE.x,SOURCE.z],...MIRRORS.map(m=>[m.x,m.z]),...LANDMARKS.column,LANDMARKS.stump,LANDMARKS.carved,...LANDMARKS.boulders,...LANDMARKS.rubble];
  for(const [x,z] of things){assert(Math.hypot(x-ORIGIN[0],z-ORIGIN[1])<=PLAY_RADIUS,`${x},${z} lies in the play area`);assert(STAIR_X-x>=STAIR_CLEAR,`${x},${z} keeps the stair free`);}
  for(const a of MIRRORS)for(const b of MIRRORS)if(a!==b)assert(Math.hypot(a.x-b.x,a.z-b.z)>2*REACH,'one mirror at a time is within reach');
  const r=trace(SOURCE,layout(MIRRORS.map(m=>m.solution)));
  assert(near(r.points[0],[SOURCE.x,SOURCE.z]));MIRRORS.forEach((m,i)=>assert(near(r.points[i+1],[m.x,m.z]),'the beam meets each mirror in its centre'));
  for(let i=1;i<r.points.length;i++){const dx=r.points[i][0]-r.points[i-1][0],dz=r.points[i][1]-r.points[i-1][1];assert(Math.abs(Math.abs(dx)-Math.abs(dz))<1e-9,'diagonal leg');}
  // De laatste spiegel ligt op de diagonaal door het midden van het doel.
  const last=MIRRORS[2];assert.equal(TARGET[0]-last.x,last.z-TARGET[1]);
  // De herkenningspunten staan niet in het opgeloste lichtspoor.
  const seg=(p,a,b)=>{const t=Math.max(0,Math.min(1,((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/((b[0]-a[0])**2+(b[1]-a[1])**2)));return Math.hypot(p[0]-a[0]-t*(b[0]-a[0]),p[1]-a[1]-t*(b[1]-a[1]));};
  for(const p of things.slice(4))for(let i=1;i<r.points.length;i++)assert(seg(p,r.points[i-1],r.points[i])>1.5,`${p} stays out of the beam`);
});

test('brute force: of all 8^3 orientations exactly one solves it, and its 180-degree twins do not',()=>{
  const solutions=[],reachTarget=[];
  for(const turns of combos()){const r=trace(SOURCE,layout(turns));if(solves(r))solutions.push(turns);if(r.end==='target')reachTarget.push(turns);}
  assert.deepEqual(solutions,[MIRRORS.map(m=>m.solution)]);
  assert.deepEqual(reachTarget,solutions,'no other combination even reaches the target');
  // Een spiegel 180 graden gedraaid ligt op dezelfde lijn, maar keert het licht haar stenen rug toe.
  MIRRORS.forEach((_,i)=>{const turns=MIRRORS.map(m=>m.solution);turns[i]=(turns[i]+4)%8;const r=trace(SOURCE,layout(turns));assert.equal(r.end,'mirror back');assert.equal(r.blocked,i);});
});

test('the start is unsolved and several turns away from the solution',()=>{
  const g=new LightGame(ground),start=MIRRORS.map(m=>m.start);
  assert.deepEqual(g.snapshot().turns,start);assert.equal(g.solved,false);assert.equal(g.begun,false);
  assert(!solves(trace(SOURCE,layout(start))));
  const presses=MIRRORS.reduce((s,m)=>s+(m.solution-m.start+8)%8,0);assert(presses>=4,`${presses} presses`);
  MIRRORS.forEach(m=>assert.notEqual(m.start,m.solution));
});

test('a full playthrough: stand at each mirror and turn it until the light reaches the gate',()=>{
  const g=new LightGame(ground),events=[];
  assert(g.near(at(...ORIGIN)));assert(!g.near(at(ORIGIN[0]+NEAR_RADIUS+1,ORIGIN[1])));
  assert.equal(g.prompt(at(...ORIGIN),{flying:false}),null,'nothing to turn in the middle of the field');
  MIRRORS.forEach((m,i)=>{
   const p=standAt(i);
   assert.equal(g.prompt(p,{flying:true}),null,'not from the air');assert.deepEqual(g.interact(p,{flying:true,yaw:0}),[]);
   const label=g.prompt(p,{flying:false});assert.equal(label,'Draai de spiegel');assert(label.length<=28);
   while(g.snapshot().turns[i]!==m.solution){
    const e=g.interact(p,{flying:false,yaw:0});events.push(...e);
    assert.equal(e[0].type,'bell');assert.equal(e[0].note,m.note);
    g.update(1/60,p,{moving:false,flying:false,yaw:0});
   }
  });
  assert.equal(g.solved,true);assert.equal(g.begun,true);
  assert.equal(events.filter(e=>e.type==='bell').length,MIRRORS.reduce((s,m)=>s+(m.solution-m.start+8)%8,0));
  assert.equal(new Set(MIRRORS.map(m=>m.note)).size,3,'each mirror has its own note');
  assert.equal(events.filter(e=>e.type==='solved').length,1);
  const toast=events.filter(e=>e.type==='toast');assert.equal(toast.length,1);assert.match(toast[0].text,/^[A-Z][^!]*\.$/);
  assert.equal(events.filter(e=>e.type==='chime').length,2,'the light reaches the second and the third mirror');
  assert.deepEqual(g.snapshot().hits,[0,1,2]);assert.equal(g.snapshot().end,'target');
  // Daarna liggen de spiegels vast.
  for(let i=0;i<3;i++){assert.equal(g.prompt(standAt(i),{flying:false}),null);assert.deepEqual(g.interact(standAt(i),{flying:false,yaw:0}),[]);}
  assert.deepEqual(g.snapshot().turns,MIRRORS.map(m=>m.solution));
  assert.deepEqual(g.update(1,standAt(0),{}),[]);
});

test('turning a mirror that brings the light one mirror further chimes; losing it again is quiet',()=>{
  const g=new LightGame(ground);
  // Spiegel 1 naar de oplossing: twee slagen. Eerst kaatst hij het licht terug (nog steeds één spiegel).
  let e=g.interact(standAt(0),{});assert.deepEqual(e.map(x=>x.type),['bell']);
  e=g.interact(standAt(0),{});assert.deepEqual(e.map(x=>x.type),['bell'],'spiegel 2 staat nog op de kant: het licht scheert erlangs');
  e=g.interact(standAt(1),{});assert.deepEqual(e.map(x=>x.type),['bell','chime']);assert.equal(g.snapshot().lit,2);
  // Spiegel 1 verder draaien neemt het licht weer weg: geen klank, geen straf.
  e=g.interact(standAt(0),{});assert.deepEqual(e.map(x=>x.type),['bell']);assert(g.snapshot().lit<2);assert.equal(g.snapshot().best,2);
});

test('it cannot be solved by accident: walking around and pressing away from the mirrors does nothing',()=>{
  let seed=99;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const g=new LightGame(ground),before=JSON.stringify(g.snapshot().turns);
  for(let i=0;i<5000;i++){
   const p=at(ORIGIN[0]+(rand()-.5)*40,ORIGIN[1]+(rand()-.5)*40),flying=rand()<.3;
   assert.deepEqual(g.update(.1,p,{moving:true,flying,yaw:rand()*6}),[]);
   if(g.prompt(p,{flying})===null)assert.deepEqual(g.interact(p,{flying,yaw:0}),[]);
  }
  assert.equal(JSON.stringify(g.snapshot().turns),before);assert.equal(g.solved,false);assert.equal(g.begun,false);
});

test('reset brings back the starting state, also after solving',()=>{
  const g=new LightGame(ground),fresh=JSON.stringify(g.snapshot());
  g.interact(standAt(2),{});g.update(30,at(...ORIGIN),{});g.solved=true;
  g.reset();assert.equal(JSON.stringify(g.snapshot()),fresh);
  // Na reset kan het opnieuw, en klinkt 'solved' opnieuw één keer.
  let solved=0;MIRRORS.forEach((m,i)=>{while(g.snapshot().turns[i]!==m.solution)solved+=g.interact(standAt(i),{}).filter(e=>e.type==='solved').length;});
  assert.equal(solved,1);
});

test('restored progress: setting solved turns the mirrors home without events',()=>{
  const g=new LightGame(ground);g.solved=true;
  assert.deepEqual(g.snapshot().turns,MIRRORS.map(m=>m.solution));assert.equal(g.snapshot().end,'target');
  assert.deepEqual(g.interact(standAt(0),{}),[]);assert.match(g.words()[1],/naar de poort/);
});

test('words describe the goal and progress, and name a mirror by its landmark when you linger',()=>{
  const g=new LightGame(ground),here=at(...ORIGIN),idle=s=>{for(let t=0;t<s;t+=.5)g.update(.5,here,{moving:false});};
  const [title,start]=g.words();assert.equal(title,'Het lichtspoor');assert.match(start,/drie staande spiegels/);assert.match(start,/één spiegel/);
  for(const [,text] of [g.words()])assert(!text.includes('!'));
  g.interact(standAt(0),{});const one=g.words()[1];assert.notEqual(one,start);assert.match(one,/één van de drie/);
  idle(89);assert.doesNotMatch(g.words()[1],/omgevallen zuil/,'no hint before 90 s');
  idle(2);assert.match(g.words()[1],/De spiegel bij de omgevallen zuil wacht op je\./);
  idle(90);assert.match(g.words()[1],/Draai de spiegel bij de omgevallen zuil nog één keer\./);
  // Wie wegloopt, laat de klok stilstaan.
  const away=g.snapshot().idle;g.update(.5,at(ORIGIN[0]+60,ORIGIN[1]),{});assert.equal(g.snapshot().idle,away);
  // Spiegel 1 goed: de hint gaat over naar de volgende spiegel (het licht scheert nog langs spiegel 2).
  g.interact(standAt(0),{});assert.match(g.words()[1],/Draai de spiegel bij de gebeitelde steen nog drie keer\./);
  // Nieuwe voortgang (twee spiegels) zet de hulp weer op nul.
  g.interact(standAt(1),{});const two=g.words()[1];assert.match(two,/twee van de drie/);assert.doesNotMatch(two,/spiegel bij/);assert.equal(g.snapshot().idle,0);
  g.interact(standAt(1),{});g.interact(standAt(1),{});
  g.interact(standAt(2),{});const before=g.words()[1];assert.match(before,/twee van de drie/);
  g.interact(standAt(2),{});assert.equal(g.solved,true);const done=g.words()[1];assert.notEqual(done,before);assert.match(done,/naar de poort/);
  // Alle drie geraakt maar nog niet naar de poort heeft zijn eigen zin.
  const other=new LightGame(ground),three=[...combos()].find(t=>{const r=trace(SOURCE,layout(t));return new Set(r.hits).size===3&&!solves(r);});
  if(three){other.begun=true;other.turns=[...three];other.result=other.light();assert.match(other.words()[1],/alle drie de spiegels, maar/);}
  for(const name of MIRRORS.map(m=>m.name))assert.match(name,/^de spiegel bij de /);
});

test('visuals: finite numbers, known meshes, the right rotation, and a bounded drifting beam of motes',()=>{
  const meshes=createLightMeshes(kit(),ground);
  for(const key of ['scenery','mirror','mirrorLit'])assert(meshes[key]?.id,`${key} exists`);
  const g=new LightGame(ground);
  for(const turns of combos()){
   g.turns=[...turns];g.result=g.light();
   for(const reduced of [false,true]){
    const v=g.visuals(12.3,reduced);
    assert.equal(v.parts.length,3);
    for(const p of v.parts){assert(p.mesh in meshes);assert(p.position.every(Number.isFinite));assert(Number.isFinite(p.rotation));}
    assert(v.motes.length<=(reduced?35:MAX_MOTES)&&v.motes.length>0);
    for(const m of v.motes){assert.equal(m.length,3);assert(m.every(Number.isFinite));}
   }
  }
  g.reset();
  // De rotatie draait de lokale voorkant (-z) precies zoals de shader: x'=cos·x+sin·z, z'=-sin·x+cos·z.
  g.visuals(0,false).parts.forEach((p,i)=>{const r=p.rotation,front=[Math.sin(r)*-1,Math.cos(r)*-1];assert(near(front,facing(MIRRORS[i].start)));});
  assert.deepEqual(g.visuals(0,false).parts.map(p=>p.mesh),['mirrorLit','mirror','mirror']);
  // Elk lichtje ligt op straalhoogte boven de grond.
  for(const m of g.visuals(3,false).motes)assert(Math.abs(m[1]-ground(m[0],m[2])-BEAM_HEIGHT)<1e-9);
  // Beweging alleen zonder 'reduced'.
  assert.deepEqual(g.visuals(0,true).motes,g.visuals(40,true).motes);
  assert.notDeepEqual(g.visuals(0,false).motes,g.visuals(1,false).motes);
  assert(g.visuals(0,true).motes.length<g.visuals(0,false).motes.length);
  // Opgelost: alle spiegels lichten op en het laatste stuk stijgt naar het midden van de ring.
  g.solved=true;const v=g.visuals(0,false),ring=[TARGET[0],ground(TARGET[0],TARGET[1])+RING_HEIGHT,TARGET[1]];
  assert.deepEqual(v.parts.map(p=>p.mesh),['mirrorLit','mirrorLit','mirrorLit']);
  assert(v.motes.length<=MAX_MOTES);const top=v.motes.at(-1);assert(Math.hypot(top[0]-ring[0],top[1]-ring[1],top[2]-ring[2])<1.2);
  assert(v.motes.some(m=>m[1]>ground(m[0],m[2])+BEAM_HEIGHT+5),'the last leg rises');
  const last=MIRRORS[2];for(const m of v.motes)if(m[0]>MIRRORS[1].x+.5)assert(m[1]>ground(last.x,last.z)+BEAM_HEIGHT,'no flat leg next to the rising one');
});

test('the mesh creator runs with a stub kit, ends on material 0 and stays within the triangle budget',()=>{
  let tris=0,lastMaterial=null,n=0;
  const counting={orb:(x,y,z,a,b,c,col,s=12,r=7)=>{tris+=s*r*2;},cone:(x,y,z,a,b,h,col,s=8)=>{tris+=s*4;},beam:()=>{tris+=16;},
   curveTube:(pts,radii,col,s=10)=>{tris+=(pts.length-1)*s*2;},tri:(a,b,c,col)=>{tris++;assert(col.every(Number.isFinite));},material:m=>{lastMaterial=m;},upload:()=>({id:++n,tris})};
  const meshes=createLightMeshes(counting,ground);
  assert.equal(lastMaterial,0);assert.deepEqual(Object.keys(meshes).sort(),['mirror','mirrorLit','scenery']);
  assert(meshes.scenery.tris<6000,`${meshes.scenery.tris} triangles`);
  assert.deepEqual(Object.keys(createLightMeshes(kit(),ground)).sort(),['mirror','mirrorLit','scenery']);
});

test('deterministic: the same presses give the same state',()=>{
  const run=()=>{const g=new LightGame(ground);for(const i of [2,0,1,1,0,2,2,1])g.interact(standAt(i),{});g.update(5,at(...ORIGIN),{});return JSON.stringify([g.snapshot(),g.words(),g.visuals(7,false)]);};
  assert.equal(run(),run());
});
