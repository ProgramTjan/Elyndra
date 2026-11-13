import test from 'node:test';import assert from 'node:assert/strict';
import {inWell,WELL_SECONDS,REALM,VALLEY_GATE,REALM_KEY,FRUITS,LISTEN_SECONDS,inRealm,realmGround,contain,passage,arrival,homecoming,fruitStates,answer,Listening,readVisited,saveVisited} from '../dist/realm.mjs';
import {createRealm} from '../dist/realm-scenery.mjs';

const at=(lx,lz,y=3)=>[REALM.x+lx,y,REALM.z+lz];

test('the land behind the gate is a bowl with a mound, a pool below the waterline and a rim in the mist',()=>{
  assert(realmGround(REALM.x,REALM.z)>realmGround(REALM.x,REALM.z+40)+2,'the tree stands on a mound');
  assert(realmGround(REALM.x+REALM.pool[0],REALM.z+REALM.pool[1])<-3,'the pool lies below the water level');
  assert(realmGround(REALM.x+REALM.radius+12,REALM.z)>realmGround(REALM.x+60,REALM.z)+8,'the rim rises');
  for(let a=0;a<6.3;a+=.2)for(let r=0;r<200;r+=7)assert(Number.isFinite(realmGround(REALM.x+Math.cos(a)*r,REALM.z+Math.sin(a)*r)));
  const start=arrival();assert(inRealm(start.pos));assert(start.pos[1]>realmGround(start.pos[0],start.pos[2]));
});

test('you enter only through an awake gate, walking north through the opening',()=>{
  const south=[66,6,-108],north=[66,6,-110.5];
  assert.equal(passage(south,north,{awake:true}),'enter');
  assert.equal(passage(south,north,{awake:false}),null,'a sleeping gate is only an arch');
  assert.equal(passage(north,south,{awake:true}),null,'coming back from behind does nothing');
  assert.equal(passage([40,6,-108],[40,6,-110.5],{awake:true}),null,'walking past the pylons does nothing');
  assert.equal(passage([66,6,30],[66,6,-140],{awake:true}),null,'travelling by menu across the line is not a passage');
  assert.equal(passage(null,north,{awake:true}),null);
  assert.equal(passage([66,20,-109],[66,20,-110.2],{awake:true}),'enter','flying through the ring counts');
});

test('the arch at the southern edge brings you home, and only from the inside',()=>{
  assert.equal(passage(at(0,67),at(0,68.4)),'leave');
  assert.equal(passage(at(0,69),at(0,67.5)),null,'walking in from behind the arch does nothing');
  assert.equal(passage(at(12,67),at(12,68.4)),null,'beside the arch does nothing');
  const home=homecoming(()=>2);assert(home.pos[2]>VALLEY_GATE.z,'you step out on the valley side of the gate');assert.equal(home.pos[1],4.4);
  assert.equal(passage(home.pos,[home.pos[0],home.pos[1],home.pos[2]+2],{awake:true}),null,'stepping out does not send you straight back');
  const start=arrival();assert.equal(passage(start.pos,[start.pos[0],start.pos[1],start.pos[2]-2]),null,'arriving does not send you straight home');
});

test('the mist keeps you on the island and under a low ceiling',()=>{
  const out=contain(at(300,0,500));assert(Math.abs(Math.hypot(out[0]-REALM.x,out[2]-REALM.z)-REALM.radius)<1e-6);assert(out[1]<=realmGround(out[0],out[2])+REALM.ceiling);
  assert.deepEqual(contain(at(10,10,4)),at(10,10,4),'inside nothing changes');
});

test('nine fruits hang in reach under the crown, clear of the trunk and of each other',()=>{
  assert.equal(FRUITS.length,9);assert.equal(FRUITS.filter(f=>f.kind==='wonder').length,5);assert.equal(FRUITS.filter(f=>f.kind==='heart').length,4);
  for(const f of FRUITS){const r=Math.hypot(f.x-REALM.x,f.z-REALM.z);assert(r>6&&r<REALM.crown);assert(f.height>2.6&&f.height<6);}
  for(const a of FRUITS)for(const b of FRUITS)if(a!==b)assert(Math.hypot(a.x-b.x,a.z-b.z)>3);
});

test('the tree remembers exactly what was found in the valley',()=>{
  const none=fruitStates();assert.equal(none.filter(f=>f.lit).length,0);assert.match(answer(none),/allemaal nog dicht/);
  const some=fruitStates(['brook','deer','realm','nonsense'],[true,false,true,false]);
  assert.deepEqual(some.filter(f=>f.lit).map(f=>f.id).sort(),['brook','deer','heart0','heart2']);
  assert.match(answer(some),/^4 van de negen/);assert.match(answer(some),/wacht nog op de adem van de kathedraal/,'it names the first closed bud in the ring');
  const all=fruitStates(['brook','cathedral','gate','dew','deer'],[true,true,true,true]);assert.match(answer(all),/Alle negen/);
});

test('the tree answers once to someone who stands still under its crown',()=>{
  const l=new Listening(),under=at(8,6);
  for(let i=0;i<40;i++)assert.equal(l.update(.1,under,{moving:true}),false,'walking gets no answer');
  let answers=0;for(let i=0;i<(LISTEN_SECONDS+3)*10;i++)if(l.update(.1,under))answers++;
  assert.equal(answers,1);assert(l.glow>0,'the fruits glow after the answer');
  for(let i=0;i<200;i++)assert.equal(l.update(.1,under),false,'no repeating while you stay');
  assert.equal(l.glow,0);
  l.update(.1,at(60,0));let again=0;for(let i=0;i<80;i++)if(l.update(.1,under))again++;assert.equal(again,1,'coming back asks again');
  const flying=new Listening();for(let i=0;i<100;i++)assert.equal(flying.update(.1,under,{grounded:false}),false);
  const valley=new Listening();for(let i=0;i<100;i++)assert.equal(valley.update(.1,[0,3,0]),false);
});

test('the first visit is remembered, also without working storage',()=>{
  const m=new Map(),s={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
  assert.equal(readVisited(s),false);saveVisited(s);assert.equal(m.get(REALM_KEY),'visited');assert.equal(readVisited(s),true);
  const broken={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};assert.equal(readVisited(broken),false);saveVisited(broken);
});

test('the scenery builds its meshes, keeps the path and pool free of trunks and offers a lighter build for phones',()=>{
  const build=mobile=>{let tris=0,uploads=0;const n=()=>{};const kit={orb:n,cone:n,beam:n,curveTube:n,material:n,tri:()=>{tris++;},upload:()=>({id:++uploads})};return {r:createRealm(kit,{mobile}),tris};};
  const desk=build(false),phone=build(true);
  for(const key of ['ground','pool','tree','crown','grove','arch','bud','wonder','heart'])assert(desk.r[key],key);
  assert(phone.tris<desk.tris*.75,'phones get a lighter world');
  for(const c of desk.r.colliders){const lx=c.x-REALM.x,lz=c.z-REALM.z;
    assert(!(Math.abs(lx)<4&&lz>14&&lz<64),'no trunk on the path');
    assert(Math.hypot(lx-REALM.pool[0],lz-REALM.pool[1])>REALM.poolRadius,'no trunk in the pool');}
  assert(desk.r.colliders.length>40);
});

test('the light well sits in the middle of the pool and nowhere else',()=>{
  assert.equal(inWell(at(REALM.pool[0],REALM.pool[1])),true);assert.equal(inWell(at(REALM.pool[0]+6,REALM.pool[1])),false);
  assert.equal(inWell([REALM.pool[0],3,REALM.pool[1]]),false,'not in the valley');assert(WELL_SECONDS>=2);
});
