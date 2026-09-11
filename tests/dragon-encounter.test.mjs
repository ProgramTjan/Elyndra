import assert from 'node:assert/strict';
import {DragonEncounter,DRAGON_REST} from '../dist/dragon-encounter.mjs';
import {dragonPose,packBones} from '../dist/wildlife-motion.mjs';
import {ForestCompanion} from '../dist/forest-companion.mjs';
const ground=(x,z)=>1.3+3*Math.sin(x*.023)*Math.cos(z*.019)+1.5*Math.sin(z*.045+x*.01)-Math.max(0,1-Math.abs(x-(15+Math.sin(z*.012)*16))/18)*7;
const garden={discovered:true,gardenAge:20};
const r=DRAGON_REST,viewer=[r.x-Math.sin(r.heading)*6,0,r.z-Math.cos(r.heading)*6];viewer[1]=ground(viewer[0],viewer[2])+2.4;
const d=new DragonEncounter(ground);let time=0,last=null,seen=new Set(),met=0;
for(let i=0;i<900;i++){
 time+=.05;const normal=dragonPose(time),s=d.update(.05,normal,viewer,garden);seen.add(s.phase);met+=Number(s.greeted);
 if(s.position){
  assert(s.position.every(Number.isFinite));
  if(last)assert(Math.hypot(...s.position.map((v,i)=>v-last[i]))<1.7,'Landing must remain continuous');
  const pose=dragonPose(time,false,{...s,ground});assert.equal(pose.bones.length,11);assert(packBones(pose.bones).every(Number.isFinite));last=s.position;
 }
}
assert(seen.has('approaching'));assert(seen.has('resting'));assert(seen.has('greeting'));assert.equal(met,1);
assert(d.bow>.9);assert(d.known);assert.equal(d.settle,1);
const stable=d.snapshot();for(let i=0;i<100;i++)d.update(.05,dragonPose(time),viewer,garden,false);assert.deepEqual(d.snapshot(),stable,'Modal pauses preserve the encounter');
const pose=dragonPose(time,true,{...d.snapshot(),ground});
assert.equal(pose.flapping,0,'A grounded dragon does not flap');
const transform=(m,p)=>[0,1,2].map(i=>m[i]*p[0]+m[i+4]*p[1]+m[i+8]*p[2]+m[i+12]);
for(let bone of[9,10]){
 const foot=transform(pose.bones[bone],[0,-1.37,-.53]);
 assert(Math.abs(foot[1]-ground(foot[0],foot[2]))<.07,'Talons meet the sloping clearing');
}
assert.deepEqual(dragonPose(0,true,{...d.snapshot(),ground}),dragonPose(200,true,{...d.snapshot(),ground}),'Reduced-motion resting pose is stable');
for(let i=0;i<140;i++)d.update(.05,dragonPose(time),[r.x,ground(r.x,r.z)+2.4,r.z],garden);
assert(d.bow<.01,'Crowding makes the dragon lift its head again');
seen=new Set();last=d.position;
for(let i=0;i<1100;i++){
 time+=.05;const s=d.update(.05,dragonPose(time),[100,10,100],garden);seen.add(s.phase);
 if(s.position&&last)assert(Math.hypot(...s.position.map((v,i)=>v-last[i]))<1.7,'Departure has no teleport');
 last=s.position;
}
assert(seen.has('departing'));assert.equal(d.phase,'orbit');assert(d.known);
const saved=new DragonEncounter(ground,true);assert(saved.known);assert(saved.trust>0);
const stranger=new DragonEncounter(ground);for(let i=0;i<100;i++)stranger.update(.05,dragonPose(0),viewer,{discovered:false,gardenAge:0});assert.equal(stranger.phase,'orbit');

const companion=new ForestCompanion(ground,true),friend=[9,1,-3],wonder={time:0,age:0,bloom:0};seen=new Set();
for(let i=0;i<600;i++){const s=companion.update(.05,friend,wonder);seen.add(s.phase);assert(s.position.every(Number.isFinite));}
assert(seen.has('greeting'));assert(seen.has('accompanying'));assert(seen.has('returning'));assert.equal(companion.phase,'resting','Greeting ends without looping');
console.log('Dragon: full landing, folded wings, planted feet, gentle greeting, crowding, pauses, departure, reduced motion and remembered companion welcome passed.');
