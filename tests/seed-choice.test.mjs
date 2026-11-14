import test from 'node:test';import assert from 'node:assert/strict';
import {SeedChoice,SEED_KEY,SEED_PLACES,PLANT_SECONDS,GROW_SECONDS,LEAVE_DISTANCE,GARDEN_SITE,KEEPER_CLOSING,createSeedMeshes} from '../dist/seed-choice.mjs';
import {REALM,realmGround} from '../dist/realm.mjs?v=story52';

const ground=(x,z)=>z>1500?realmGround(x,z):1+Math.sin(x*.1)*.6+Math.cos(z*.07)*.4;
const store=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),map:m};};
const eye=(x,z)=>[x,ground(x,z)+2.4,z];
const beside=s=>eye(s[0]+1.5,s[2]+1);
const still={moving:false,flying:false};
const wait=(c,seconds,p,opts=still,step=.1)=>{const events=[];for(let t=0;t<seconds-1e-9;t+=step)events.push(...c.update(step,p,opts));return events;};
const opened=(storage=store())=>{const c=new SeedChoice(ground,storage);c.available=true;c.update(.1,eye(94,49));return c;};
const standAt=id=>id==='gardens'?[GARDEN_SITE[0]+1,GARDEN_SITE[1]+2.4,GARDEN_SITE[2]]:null;
const spot=(c,id)=>standAt(id)??beside(c.siteOf(id));
const IDS=['spring','gardens','realm'];

test('the places are frozen, named in Dutch and carry the three blessings from the story',()=>{
  assert(Object.isFrozen(SEED_PLACES));assert.deepEqual(Object.keys(SEED_PLACES),IDS);
  assert.equal(SEED_PLACES.spring.keeper,'Wat bij de bron groeit, is van iedereen die drinkt.');
  assert.equal(SEED_PLACES.gardens.keeper,'Wat in de lucht groeit, reist verder dan wij.');
  assert.equal(SEED_PLACES.realm.keeper,'Wat achter de poort groeit, wacht op wie nog komt.');
  const c=new SeedChoice(ground);
  for(const id of IDS){const p=SEED_PLACES[id];assert.equal(p.id,id);assert(p.name&&p.epilogue);assert.equal(p.travel.length,2);
    const n=p.epilogue.split('.').filter(s=>s.trim()).length;assert(n>=2&&n<=3,'two or three sentences');
    for(const t of [p.keeper,p.epilogue,p.name])assert(!t.includes('!'),'no exclamation marks');
    const s=c.siteOf(id);assert(s.every(Number.isFinite));
    assert(Math.hypot(p.travel[0]-s[0],p.travel[1]-s[2])<p.reach,'the travel standpoint is within reach of the site');}
  assert.equal(SEED_PLACES.gardens.flying,true);assert.equal(SEED_PLACES.spring.flying,false);
  const spring=c.siteOf('spring');assert.deepEqual([spring[0],spring[2]],[-42,-36]);assert.equal(spring[1],ground(-42,-36));
  const realm=c.siteOf('realm');assert.deepEqual([realm[0],realm[2]],[REALM.x-13,REALM.z+9]);assert.equal(realm[1],realmGround(realm[0],realm[2]));
  assert.deepEqual(c.siteOf('gardens'),[...GARDEN_SITE]);
});

test('closed until the dragon chapter is done, then the keeper asks',()=>{
  const c=new SeedChoice(ground,store());
  assert.equal(c.phase,'closed');assert.equal(c.words(),null);assert.equal(c.travelTarget(),null);
  assert.equal(c.choose('spring'),false,'no choice before it is offered');
  wait(c,3,eye(94,49));assert.equal(c.phase,'closed');
  c.available=true;assert.equal(c.phase,'offered');
  assert.equal(c.words()[0],'Waar mag het groeien?');
  const t=c.travelTarget();assert.deepEqual([t[0],t[2]],[94,49]);
  assert.equal(c.action(beside(c.siteOf('spring'))),null,'nothing to plant yet');
  assert.deepEqual(c.interact(beside(c.siteOf('spring'))),[]);
  assert.equal(c.choose('elsewhere'),false);assert.equal(c.phase,'offered');
  c.available=false;assert.equal(c.phase,'closed','before choosing the question can close again');
  c.available=true;c.choose('spring');c.available=false;assert.equal(c.phase,'carrying','a choice is kept');
});

for(const id of IDS)test(`the whole way for ${id}: choose, carry, plant, grow`,()=>{
  const s=store(),c=opened(s),site=c.siteOf(id),words=new Set();
  assert.equal(c.choose(id),true);assert.equal(c.phase,'carrying');assert.equal(c.place,id);
  assert.equal(c.visuals(0,false).carried,true);assert.deepEqual(c.travelTarget(),site);
  assert.deepEqual(JSON.parse(s.map.get(SEED_KEY)),{place:id,phase:'carrying'});
  words.add(c.words().join());
  assert.equal(c.action(eye(30,30)),null,'not far away');
  const at=spot(c,id);assert.equal(c.action(at),'Leg het zaad neer');
  const fx0=c.effects();assert.equal(fx0.growth,0);assert.equal(fx0.river,0);
  c.interact(at);assert.equal(c.phase,'planting');assert.equal(c.visuals(0,false).carried,false);words.add(c.words().join());
  wait(c,PLANT_SECONDS-.5,at);assert.equal(c.phase,'planting');words.add(c.words().join());
  const events=wait(c,.6,at);assert.equal(c.phase,'growing');assert(events.some(e=>e.type==='bell'));
  assert.deepEqual(JSON.parse(s.map.get(SEED_KEY)),{place:id,phase:'growing'});
  const stages=[];let toasts=[];
  for(let t=0;t<GROW_SECONDS+1;t+=.25){
    const ev=c.update(.25,eye(200,200),{moving:true});toasts.push(...ev);
    const v=c.visuals(t,false);stages.push(v.parts.map(p=>p.mesh).find(m=>m!=='glow'));words.add(c.words().join());
    const g=c.effects().growth;assert(g>=0&&g<=1);if(c.phase==='growing'){assert(v.motes.length>0);}
  }
  assert.deepEqual([...new Set(stages)],['sprout','sapling','tree'],'growing shows the three stages in order, wherever you are');
  assert.equal(c.phase,'grown');assert.deepEqual(JSON.parse(s.map.get(SEED_KEY)),{place:id,phase:'grown'});
  const toast=toasts.filter(e=>e.type==='toast');assert.equal(toast.length,1);
  assert.equal(toast[0].text,SEED_PLACES[id].epilogue.split('.')[0]+'.');
  assert.equal(toasts.filter(e=>e.type==='chime').length,1);
  const [title,text]=c.words();assert.equal(title,SEED_PLACES[id].name);assert(text.includes(SEED_PLACES[id].epilogue)&&text.includes(KEEPER_CLOSING));
  assert(words.size>=6,'the note changes as the seed changes');
  assert([...words].some(w=>w.includes(SEED_PLACES[id].keeper)),'the keeper gives his blessing while it grows');
  assert.equal(c.choose('spring'),false,'grown is permanent');assert.equal(c.action(at),null);
  wait(c,30,at);assert.equal(c.phase,'grown');
  const v=c.visuals(3,false);assert.deepEqual(v.parts.map(p=>p.mesh).sort(),['glow','tree']);assert(v.motes.length>0);
});

test('changing one\'s mind while carrying, but not after planting has finished',()=>{
  const s=store(),c=opened(s);c.choose('spring');
  assert.equal(c.choose('realm'),true);assert.equal(c.place,'realm');assert.equal(c.phase,'carrying');
  assert.deepEqual(JSON.parse(s.map.get(SEED_KEY)),{place:'realm',phase:'carrying'});
  assert.equal(c.action(spot(c,'spring')),null,'the old place no longer takes the seed');
  assert.equal(c.action(spot(c,'realm')),'Leg het zaad neer');
  c.interact(spot(c,'realm'));assert.equal(c.choose('gardens'),false,'while it lies in the ground you stay');
});

test('moving pauses the planting count, it never resets it',()=>{
  const c=opened();c.choose('spring');const at=spot(c,'spring');c.interact(at);
  wait(c,3,at);assert(Math.abs(c.still-3)<1e-6);
  wait(c,20,at,{moving:true,flying:false});assert(Math.abs(c.still-3)<1e-6,'walking about pauses');assert.equal(c.phase,'planting');
  wait(c,5,at,{moving:false,flying:true});assert(Math.abs(c.still-3)<1e-6,'hovering above does not count on foot');
  wait(c,1.5,at);assert.equal(c.phase,'planting');wait(c,.6,at);assert.equal(c.phase,'growing');
});

test('walking away returns the seed to your hand with a gentle word',()=>{
  const c=opened();c.choose('realm');const site=c.siteOf('realm'),at=spot(c,'realm');c.interact(at);wait(c,2,at);
  const near=eye(site[0]+LEAVE_DISTANCE-1,site[2]);assert.deepEqual(c.update(.1,near,{moving:true}),[]);assert.equal(c.phase,'planting');
  const far=eye(site[0]+LEAVE_DISTANCE+1,site[2]),ev=c.update(.1,far,{moving:true});
  assert.equal(c.phase,'carrying');assert.equal(ev.length,1);assert.equal(ev[0].type,'toast');assert(!ev[0].text.includes('!'));
  assert.equal(c.visuals(0,false).carried,true);
  c.interact(at);assert.equal(c.phase,'planting');wait(c,PLANT_SECONDS+.1,at);assert.equal(c.phase,'growing');
});

test('the gardens use three dimensions: flying or standing on the island, never from the valley below',()=>{
  const c=opened();c.choose('gardens');const s=c.siteOf('gardens');
  const below=eye(s[0],s[2]);assert.equal(c.action(below),null,'right underneath is too far');
  assert.equal(c.action(below,{flying:true}),null);
  const hover=[s[0]+3,s[1]+5,s[2]-2];assert(Math.hypot(3,5,2)<7);
  assert.equal(c.action(hover,{flying:true}),'Leg het zaad neer');
  const standing=[s[0]+1,s[1]+2.4,s[2]];assert.equal(c.action(standing,{flying:false}),'Leg het zaad neer');
  assert.equal(c.action([s[0]+6,s[1]+4,s[2]],{flying:true}),null,'just beyond seven metres');
  c.interact(hover,{flying:true});wait(c,PLANT_SECONDS+.1,hover,{moving:false,flying:true});assert.equal(c.phase,'growing','one may hover still');
  const d=opened();d.choose('gardens');d.interact(standing);d.update(.1,[s[0],s[1]+14,s[2]],{moving:true,flying:true});assert.equal(d.phase,'carrying','rising far above is walking away');
});

test('the spring and the realm are on foot',()=>{
  for(const id of ['spring','realm']){const c=opened();c.choose(id);const at=spot(c,id);
    assert.equal(c.action(at,{flying:true}),null);assert.equal(c.action([at[0],at[1]+12,at[2]]),null,'not from high above');
    assert.equal(c.action(at),'Leg het zaad neer');
    const s=c.siteOf(id);assert.equal(c.action(eye(s[0]+4.5,s[2])),null,'within four metres');}
});

test('progress survives a reload at every saved stage',()=>{
  for(const id of IDS){
    const s=store(),c=opened(s);c.choose(id);
    assert.equal(new SeedChoice(ground,s).phase,'carrying');
    const at=spot(c,id);c.interact(at);wait(c,2,at);
    const r=new SeedChoice(ground,s);assert.equal(r.phase,'carrying','planting reloads as carrying');assert.equal(r.place,id);
    wait(c,PLANT_SECONDS,at);wait(c,4,at);assert.equal(c.phase,'growing');
    const g=new SeedChoice(ground,s);assert.equal(g.phase,'grown','a reload during growing finds the tree grown');assert.equal(g.effects().growth,1);
    wait(c,GROW_SECONDS,at);const done=new SeedChoice(ground,s);assert.equal(done.phase,'grown');assert.equal(done.place,id);
    done.available=true;assert.equal(done.phase,'grown');assert.deepEqual(done.update(.1,at),[],'no second chime after a reload');
  }
});

test('missing, invalid or broken storage starts closed and never throws',()=>{
  for(const raw of [null,'','nonsense','{"place":"moon","phase":"grown"}','{"place":"spring","phase":"offered"}','{"place":"spring"}','[1,2]','null','42']){
    const s=store();if(raw!==null)s.map.set(SEED_KEY,raw);assert.equal(new SeedChoice(ground,s).phase,'closed',String(raw));}
  assert.equal(new SeedChoice(ground,undefined).phase,'closed');
  const broken={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');},removeItem(){throw new Error('blocked');}};
  for(const storage of [broken,undefined]){
    const c=new SeedChoice(ground,storage);c.available=true;assert.equal(c.choose('spring'),true);
    const at=spot(c,'spring');c.interact(at);wait(c,PLANT_SECONDS+GROW_SECONDS+.5,at);assert.equal(c.phase,'grown');c.reset();assert.equal(c.phase,'offered');}
});

test('effects per place and phase',()=>{
  const none={river:0,seeds:false,gateAwake:false,tenthFruit:false,growth:0};
  assert.deepEqual(new SeedChoice(ground).effects(),none);
  for(const id of IDS){
    const c=opened();assert.deepEqual(c.effects(),none);c.choose(id);assert.deepEqual(c.effects(),none);
    const at=spot(c,id);c.interact(at);wait(c,2,at);assert.deepEqual(c.effects(),none,'nothing changes while planting');
    while(c.phase==='planting')c.update(.05,at,still);assert.equal(c.phase,'growing');wait(c,GROW_SECONDS/2,at);const half=c.effects();
    assert(Math.abs(half.growth-.5)<.02,'growth rises during growing');
    assert.equal(half.river,id==='spring'?half.growth:0);assert.equal(half.seeds,false);assert.equal(half.gateAwake,false);assert.equal(half.tenthFruit,false);
    wait(c,GROW_SECONDS,at);const fx=c.effects();assert.equal(fx.growth,1);
    assert.deepEqual(fx,{river:id==='spring'?1:0,seeds:id==='gardens',gateAwake:id==='realm',tenthFruit:id==='realm',growth:1});
  }
});

test('visuals are finite, use known meshes and stand still when reduced',()=>{
  const keys=new Set(Object.keys(createSeedMeshes(kit())));
  for(const id of IDS){
    const c=opened();const check=()=>{for(const clock of [0,1.7,40]){for(const reduced of [false,true]){const v=c.visuals(clock,reduced);
      for(const p of v.parts){assert(keys.has(p.mesh),p.mesh);assert(p.position.every(Number.isFinite)&&Number.isFinite(p.rotation));}
      assert(v.motes.length<80);for(const m of v.motes)assert(m.length===3&&m.every(Number.isFinite));}
      assert.deepEqual(c.visuals(0,true),c.visuals(25,true),'no animation when reduced');}};
    check();assert.deepEqual(c.visuals(0,false),{parts:[],motes:[],carried:false});
    c.choose(id);check();const at=spot(c,id);c.interact(at);check();
    assert(c.visuals(0,false).parts.some(p=>p.mesh==='seed'),'the seed lies at the site');
    wait(c,PLANT_SECONDS+.1,at);check();wait(c,GROW_SECONDS,at);check();
    assert(c.visuals(0,true).motes.length<c.visuals(0,false).motes.length,'fewer motes when reduced');
    assert.deepEqual(c.visuals(0,false).parts[0].position,c.siteOf(id));
  }
});

test('the note gives more help to whoever lingers while carrying',()=>{
  const c=opened();c.choose('gardens');const first=c.words()[1];
  wait(c,91,eye(90,40),{moving:true},.5);const later=c.words()[1];assert.notEqual(later,first);
  wait(c,91,eye(90,40),{moving:true},.5);assert.notEqual(c.words()[1],later);
  for(const w of [first,later,c.words()[1]])assert(!w.includes('!'));
});

test('reset forgets the choice and clears storage',()=>{
  const s=store(),c=opened(s);c.choose('realm');const at=spot(c,'realm');c.interact(at);wait(c,PLANT_SECONDS+GROW_SECONDS+.5,at);
  assert.equal(c.phase,'grown');c.reset();
  assert.equal(c.phase,'offered','the keeper asks again');assert.equal(c.place,null);assert.equal(s.map.has(SEED_KEY),false);
  assert.deepEqual(c.effects().growth,0);assert.equal(new SeedChoice(ground,s).phase,'closed');
  const noRemove={map:new Map(),getItem(k){return this.map.get(k)??null;},setItem(k,v){this.map.set(k,v);}};
  const d=new SeedChoice(ground,noRemove);d.available=true;d.choose('spring');d.reset();assert.equal(new SeedChoice(ground,noRemove).phase,'closed');
  const closed=new SeedChoice(ground,store());closed.reset();assert.equal(closed.phase,'closed');
  const snap=c.snapshot();assert.equal(snap.phase,'offered');assert.doesNotThrow(()=>JSON.stringify(snap));
});

test('random wandering never plants the seed by accident',()=>{
  let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const c=opened();c.choose('spring');let p=eye(0,0);
  for(let i=0;i<3000;i++){p=eye(p[0]+(rand()-.5)*3,p[2]+(rand()-.5)*3);c.update(.1,p,{moving:true});}
  assert.equal(c.phase,'carrying','planting needs the action button');
});

const kit=()=>{let n=0;const f=()=>{};return {orb:f,cone:f,beam:f,curveTube:f,tri:f,material:f,upload:()=>({id:++n})};};
// Telt driehoeken zoals world.js ze bouwt.
const counting=()=>{let n=0,count=0,last='';const out={tris:{}};
  return Object.assign(out,{orb:(x,y,z,a,b,c,col,s=12,r=7)=>{count+=s*r*2;},cone:(x,y,z,a,b,h,col,s=8)=>{count+=s*4;},beam:()=>{count+=12;},
    curveTube:(pts,radii,col,sides=10)=>{assert.equal(pts.length,radii.length);count+=(pts.length-1)*sides*2;},tri:()=>{count++;},material:m=>{last=m;},
    upload:()=>{out.tris[++n]=count;count=0;return {id:n};},lastMaterial:()=>last});};

test('the mesh creator runs with the stub kit and keeps the tree modest',()=>{
  const m=createSeedMeshes(kit());assert.deepEqual(Object.keys(m).sort(),['glow','sapling','seed','sprout','tree']);
  assert.equal(new Set(Object.values(m).map(v=>v.id)).size,5);
  const k=counting(),meshes=createSeedMeshes(k);assert.equal(k.lastMaterial(),0,'material(0) at the end');
  const tris=Object.fromEntries(Object.entries(meshes).map(([key,v])=>[key,k.tris[v.id]]));
  assert(tris.tree>1200&&tris.tree<2500,`tree has ${tris.tree} triangles`);
  for(const key of ['seed','sprout','sapling','glow'])assert(tris[key]>0&&tris[key]<600,key);
  assert.deepEqual(createSeedMeshes(counting()).tree,{id:4},'deterministic build order');
});

test('the tree is a young silver sibling: a long trunk, branches and some teal light',()=>{
  const tubes=[],tris=[];let points=[];
  const k={...kit(),curveTube:(pts,radii,col)=>{tubes.push({pts,col});points.push(...pts);},tri:(a,b,c,col)=>{tris.push(col);points.push(a,b,c);},
    upload:(()=>{let n=0;return ()=>{const out={id:++n,tubes:tubes.splice(0),tris:tris.splice(0),points};points=[];return out;};})()};
  const {tree,sprout,sapling,seed}=createSeedMeshes(k);
  assert(tree.tubes[0].pts.length>=8,'trunk from at least eight points');assert.deepEqual(tree.tubes[0].col,[.50,.57,.55]);
  const branches=tree.tubes.filter(t=>t.pts[0][1]>1);assert(branches.length>=5&&branches.length<=6);
  const leaves=tree.tris.length/2,lit=tree.tris.filter(c=>c.some(v=>v>1.01)).length/2;
  assert(leaves>300);assert(lit/leaves>.12&&lit/leaves<.3,'about a fifth of the leaves glow');
  const height=pts=>Math.max(...pts.map(p=>p[1]));
  assert(height(tree.points)>6.2&&height(tree.points)<7.8,'about seven metres');
  assert(height(sapling.points)>1.9&&height(sapling.points)<2.6,'sapling about 2.2 metres');
  assert(height(sprout.points)<.5);
  for(const m of [tree,sapling])assert(m.points.every(p=>Math.hypot(p[0],p[2])<4),'built around the local origin');
  assert(seed.points.every(p=>p[1]<.25));
});
