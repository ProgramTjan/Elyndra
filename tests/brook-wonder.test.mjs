import assert from 'node:assert/strict';
import {BROOK,BrookWonder,starPosition,visitingFlight} from '../dist/brook-wonder.mjs';
import {dragonPose} from '../dist/wildlife-motion.mjs';

const w=new BrookWonder(),at=[BROOK.x-10,2,BROOK.z+8];
for(let i=0;i<110;i++)w.update(.05,at);
assert.equal(w.age,-1,'A glimpse cannot trigger the full encounter');
const paused=w.still;
for(let i=0;i<400;i++)w.update(.05,at,false);
assert.equal(w.still,paused,'Dialogs and the intro must not advance stillness');
for(let i=0;i<410;i++)w.update(.05,at);
assert.equal(w.phase,'constellation');assert(w.bloom>.95);
for(let i=0;i<180;i++)assert.deepEqual(starPosition(i,0,1,true),starPosition(i,100,1,true),'Reduced-motion stars remain stable');
for(let i=0;i<250;i++)w.update(.05,[130,40,120]);
assert.equal(w.phase,'far');assert.equal(w.age,-1);assert(w.bloom<.001);
for(let i=0;i<130;i++)w.update(.05,at);
assert.equal(w.visits,2);assert(w.age>=0,'Returning can awaken the hollow again');
const moving=new BrookWonder();
for(let i=0;i<400;i++)moving.update(.05,[BROOK.x+Math.sin(i*.08)*7,2,BROOK.z+8]);
assert.equal(moving.age,-1,'Walking around must not be treated as stillness');
const normal=dragonPose(10);
assert.deepEqual(visitingFlight(4,normal.position),normal.position);
assert.deepEqual(visitingFlight(58,normal.position),normal.position);
assert.equal(visitingFlight(25,normal.position,true),null);
let previous=null;
for(let age=4;age<58;age+=.05){
 const p=visitingFlight(age,normal.position),pose=dragonPose(age,false,{position:p,heading:.3});
 assert(p.every(Number.isFinite));assert(p[1]>19,'Dragon stays above the root canopy');
 assert(pose.bones.flat().every(Number.isFinite));
 if(previous)assert(Math.hypot(...p.map((v,i)=>v-previous[i]))<2,'No teleport during detour');
 previous=p;
}
console.log('Brook: stillness, pauses, movement, repeat visits, reduced motion and continuous dragon detour passed.');
