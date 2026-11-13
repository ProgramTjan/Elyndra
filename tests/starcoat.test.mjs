import test from 'node:test';import assert from 'node:assert/strict';
import {Starcoats,herdPlaces,createStarcoatMesh,TRUST_SECONDS,STARCOAT_KEY} from '../dist/starcoat.mjs';
import {REALM,realmGround} from '../dist/realm.mjs';
import {RealmChimes,BELL_NOTES,createVoices} from '../dist/soundscape.mjs';

const pool=[REALM.x+REALM.pool[0],0,REALM.z+REALM.pool[1]];
const beside=(herd,i=0,d=9)=>{const a=herd.animals[i].position;const k=d/Math.hypot(a[0]-pool[0],a[2]-pool[2]);return [a[0]+(a[0]-pool[0])*k,a[1]+2.4,a[2]+(a[2]-pool[2])*k];};
const run=(herd,seconds,viewer,opts)=>{let seen=null;for(let t=0;t<seconds-1e-9;t+=.1)seen=herd.update(.1,viewer,opts)??seen;return seen;};
const seeded=(s=5)=>()=>(s=(s*16807)%2147483647)/2147483647;

test('three starcoats stand at the waterline, facing the pool',()=>{
  const places=herdPlaces();assert.equal(places.length,3);
  for(const p of places){
    const d=Math.hypot(p.position[0]-pool[0],p.position[2]-pool[2]);assert(d>6&&d<REALM.poolRadius,'at the rim');
    assert(p.position[1]>-2.3,'on dry ground at the edge of the water, y='+p.position[1].toFixed(2));
    const forward=[-Math.sin(p.heading),-Math.cos(p.heading)],to=[pool[0]-p.position[0],pool[2]-p.position[2]];
    assert(forward[0]*to[0]+forward[1]*to[1]>0,'facing the water');
  }
});

test('left alone they drink; a runner makes every head come up at once',()=>{
  const herd=new Starcoats();run(herd,20,[REALM.x,3,REALM.z+60]);
  assert(herd.animals.every(a=>a.alert<.05));assert(herd.animals.some(a=>a.drink>.8));
  run(herd,1.2,beside(herd,0,14),{moving:true,running:true});
  assert(herd.animals.every(a=>a.alert>.8),'all startled');assert(herd.animals.every(a=>a.drink<.2),'nobody keeps drinking');
});

test('walking up makes them wary, standing still earns their trust and one of them greets you',()=>{
  const herd=new Starcoats(),spot=beside(herd,1,7);
  run(herd,3,spot,{moving:true});assert(herd.animals[1].alert>.5);assert.equal(herd.greeted,false);
  assert.equal(run(herd,TRUST_SECONDS-1,spot),null,'not yet');
  assert.equal(run(herd,1.5,spot),'greeting');assert.equal(herd.chosen,1,'the nearest one looks at you');
  assert.equal(run(herd,5,spot),null,'only once');
  assert(herd.trust>.9);assert(herd.animals[1].gaze>.8);assert(herd.animals.every(a=>a.alert<.3),'they settle');
  run(herd,12,spot);assert(herd.animals[1].gaze<.3,'after a while she drinks again');
  run(herd,2,[REALM.x,3,REALM.z+60]);assert.equal(run(herd,TRUST_SECONDS+1,spot),'greeting','a new visit can be greeted again');
});

test('flying over them or standing in the valley earns nothing',()=>{
  const herd=new Starcoats();assert.equal(run(herd,20,beside(herd,0,6),{grounded:false}),null);
  assert.equal(run(herd,20,[0,3,0]),null);assert.equal(herd.still,0);
});

test('the first greeting is remembered, also without working storage',()=>{
  const m=new Map(),s={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)},herd=new Starcoats(realmGround,s);
  run(herd,TRUST_SECONDS+1,beside(herd,0,7));assert.equal(m.get(STARCOAT_KEY),'met');assert.equal(new Starcoats(realmGround,s).met,true);
  const broken={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}},b=new Starcoats(realmGround,broken);
  assert.equal(run(b,TRUST_SECONDS+1,beside(b,0,7)),'greeting');
});

test('each pose is a finite skeleton whose head goes down to drink and up to look',()=>{
  const herd=new Starcoats(),far=[REALM.x,3,REALM.z+60];run(herd,20,far);
  const headY=p=>p.bones[2][13];
  for(const reduced of [false,true])for(const p of herd.poses(far,12.3,reduced)){assert.equal(p.bones.length,4);for(const b of p.bones){assert.equal(b.length,16);assert(b.every(Number.isFinite));}}
  const drinking=herd.poses(far,0,true).map(headY);
  run(herd,1.5,beside(herd,0,14),{moving:true,running:true});
  const startled=herd.poses(far,0,true).map(headY);
  assert(startled.every((y,i)=>y>drinking[i]+.2||herd.animals[i].drink>.5===false),'heads rise');
  assert(Math.max(...startled.map((y,i)=>y-drinking[i]))>.5);
  assert.deepEqual(herd.poses(far,1,true),herd.poses(far,99,true),'reduced motion holds still');
});

test('the mesh uses four bones and builds without a fur helper',()=>{
  const bones=new Set();let uploads=0;const n=()=>{};
  const kit={orb:n,cone:n,beam:n,curveTube:n,tri:n,material:v=>bones.add(v),upload:()=>({id:++uploads})};
  assert(createStarcoatMesh(kit));assert.deepEqual([...bones].filter(v=>v>=50).sort((a,b)=>a-b),[50,60,70,80]);
  let tufts=0;createStarcoatMesh({...kit,ruff:()=>tufts++});assert(tufts>8);
});

test('behind the gate there are bells and drips instead of birds, and stillness brings more bells',()=>{
  const count=still=>{const c=new RealmChimes(seeded());let n=0;for(let i=0;i<60*120;i++)n+=c.update(1/60,{stillness:still}).filter(e=>e.type==='bell').length;return n;};
  assert(count(1)>count(0)*2);
  const c=new RealmChimes(seeded(9));let bells=0,drips=0;
  for(let i=0;i<3000;i++)for(const e of c.update(.1,{stillness:.5,poolDistance:10})){if(e.type==='bell'){bells++;assert(BELL_NOTES.includes(e.note));assert(Math.abs(e.pan)<=.8);}else{drips++;assert(e.distance>=0&&e.distance<=1);}}
  assert(bells>10&&drips>bells,'near the pool it drips often');
  const farAway=new RealmChimes(seeded(3));let none=0;for(let i=0;i<2000;i++)none+=farAway.update(.1,{poolDistance:80}).filter(e=>e.type==='drip').length;assert.equal(none,0);
});

test('the new voices work on a bare audio context',()=>{
  const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
  const node=()=>({connect(){},start(){},stop(){},frequency:param(),Q:param(),gain:param()});
  const ctx={currentTime:1,sampleRate:100,createGain:node,createOscillator:node,createBiquadFilter:node,createBufferSource:node,createBuffer:(c,n)=>({getChannelData:()=>new Float32Array(n)})};
  const v=createVoices(ctx,node());v.setRealm(1);v.bell(523.25,{pan:.3,distance:.4});v.drip({distance:.2,pan:-.4});v.call({pan:.2});v.setRealm(0);
});
