import test from 'node:test';import assert from 'node:assert/strict';
import {Footsteps,Stillness,BirdChorus,chorusProfile,surfaceAt,riverPresence,phrase,phraseSeconds,SPECIES,STRIDE,createVoices} from '../dist/soundscape.mjs';

const seeded=(s=7)=>()=>(s=(s*16807)%2147483647)/2147483647;

test('the ground decides the footstep: bridge, shallow water, wet moss or grass',()=>{
  assert.equal(surfaceAt({height:2,water:-2.3}),'grass');
  assert.equal(surfaceAt({height:2,water:-2.3,wet:.6}),'wet');
  assert.equal(surfaceAt({height:-3,water:-2.3}),'water');
  assert.equal(surfaceAt({height:-3,water:-2.3,onBridge:true}),'wood');
});

test('walking gives alternating steps at a calm cadence; running lengthens the stride',()=>{
  const walk=new Footsteps(),sides=[];
  for(let i=0;i<600;i++){const s=walk.update(6.5/60);if(s)sides.push(s);} // ten seconds of walking
  assert(sides.length>=20&&sides.length<=24,'about 2.2 steps a second, got '+sides.length);
  assert(sides.every((s,i)=>i===0||s===-sides[i-1]),'left and right alternate');
  const run=new Footsteps();let steps=0;for(let i=0;i<600;i++)if(run.update(14.3/60,{running:true}))steps++;
  assert(steps>sides.length&&steps<40);assert(STRIDE.run>STRIDE.walk);
});

test('flying, standing still and travelling by menu make no footsteps',()=>{
  const f=new Footsteps();
  for(let i=0;i<300;i++)assert.equal(f.update(.3,{grounded:false}),0);
  for(let i=0;i<300;i++)assert.equal(f.update(0),0);
  assert.equal(f.update(180),0,'a teleport is not a stride');
});

test('stillness grows while you stand and collapses when you run',()=>{
  const s=new Stillness();for(let i=0;i<20;i++)s.update(1);assert.equal(s.value,1);
  s.update(2,{moving:true});assert(s.value>.8,'a few steps barely disturb the forest');
  s.update(2,{moving:true,running:true});assert.equal(s.value,0);
});

test('each part of the day has its own singers',()=>{
  const dawn=chorusProfile(6),noon=chorusProfile(13),dusk=chorusProfile(19),night=chorusProfile(23.5);
  assert(dawn.gap[1]<noon.gap[0],'the dawn chorus is the busiest');
  assert('blackbird' in dusk.species&&!('owl' in dusk.species));
  assert.deepEqual(Object.keys(night.species),['owl']);assert.equal(night.crickets,1);assert.equal(noon.crickets,0);
  assert.deepEqual(Object.keys(chorusProfile(2).species),['owl'],'the small hours are night too');
  const rain=chorusProfile(6,{rain:.86});assert(rain.gap[0]>dawn.gap[0]*3,'rain hushes the birds');
  assert(chorusProfile(23,{rain:.86}).crickets<.2);
  for(let h=0;h<24;h+=.25)for(const n of Object.keys(chorusProfile(h).species))assert(SPECIES.includes(n));
});

test('standing still brings more song than running through',()=>{
  const count=still=>{const c=new BirdChorus(seeded()),p=chorusProfile(9);let n=0;for(let i=0;i<60*120;i++)if(c.update(1/60,p,still))n++;return n;};
  assert(count(1)>count(0)*2);
  const c=new BirdChorus(seeded(3)),p=chorusProfile(6);
  for(let i=0;i<4000;i++){const call=c.update(.1,p,.5);if(call){assert(p.species[call.species]>0);assert(Math.abs(call.pan)<=.8);assert(call.distance>=0&&call.distance<=1);}}
});

test('the river is heard before it is seen, on the correct side, and fades when flying high',()=>{
  const far=riverPresence({across:60}),mid=riverPresence({across:24}),bank=riverPresence({across:1});
  assert.equal(far.level,0);assert(mid.level>0&&mid.level<bank.level);assert(bank.level>.9);
  assert(riverPresence({across:20,yaw:0}).pan>0);assert(riverPresence({across:-20,yaw:0}).pan<0);
  assert(riverPresence({across:20,yaw:Math.PI}).pan<0,'turning around swaps the side');
  assert(riverPresence({across:1,height:60}).level<bank.level*.2);
});

test('every song is a finite, audible, short phrase',()=>{
  for(const name of SPECIES)for(let seed=1;seed<40;seed++){
    const notes=phrase(name,seeded(seed));assert(notes.length>0,name);
    for(const n of notes){assert(Number.isFinite(n.at+n.dur+n.from+n.to+n.amp));assert(n.dur>0&&n.from>200&&n.from<6500&&n.to>200&&n.amp>0&&n.amp<=1,name);}
    assert(phraseSeconds(notes)<7,name);
  }
  assert(phrase('owl')[0].from<500,'the owl is low');assert(phrase('wren').length>15,'the wren trills');
  assert.deepEqual(phrase('nothing'),[]);
});

test('the voices build on a bare audio context without panners or delay',()=>{
  const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
  const node=()=>({connect(){},start(){},stop(){},frequency:param(),Q:param(),gain:param()});
  const ctx={currentTime:1,sampleRate:100,createGain:node,createOscillator:node,createBiquadFilter:node,createBufferSource:node,createBuffer:(c,n)=>({getChannelData:()=>new Float32Array(n)})};
  const v=createVoices(ctx,node());
  for(const s of ['grass','wet','wood','water'])v.step(s,1,true);
  for(const s of SPECIES)assert(v.bird(s,{pan:.3,distance:.5})>0);
  v.setRiver({level:.5,pan:.2,bright:.7});v.setCrickets(1);
});
