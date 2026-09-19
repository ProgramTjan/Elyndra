import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DragonInvitation,CLEARING,DRAGON_PATH,inDragonGlade} from '../dist/dragon-invitation.mjs';
import {DragonEncounter,DRAGON_REST} from '../dist/dragon-encounter.mjs';
import {dragonPose,packBones} from '../dist/wildlife-motion.mjs';
const ground=(x,z)=>1.3+3*Math.sin(x*.023)*Math.cos(z*.019)+1.5*Math.sin(z*.045+x*.01)-Math.max(0,1-Math.abs(x-(15+Math.sin(z*.012)*16))/18)*7;
const visitor=(x,z)=>[x,ground(x,z)+2.4,z];
const garden={discovered:true,gardenAge:20};
function ready(){
 const encounter=new DragonEncounter(ground,true),r=DRAGON_REST;
 const viewer=visitor(r.x-Math.sin(r.heading)*6,r.z-Math.cos(r.heading)*6);
 for(let i=0;i<850;i++)encounter.update(.05,dragonPose(i*.05),viewer,garden);
 const journey=new DragonInvitation(ground);
 assert(journey.invite(encounter.snapshot(),viewer));return {journey,viewer};
}
function step(journey,viewer,n=1,reduced=false){
 let state,last=journey.pose?.position;
 for(let i=0;i<n;i++){
  state=journey.update(.05,viewer,dragonPose(journey.time),true,reduced);
  if(state.pose){
   assert(state.pose.position.every(Number.isFinite));
   if(last)assert(Math.hypot(...state.pose.position.map((v,k)=>v-last[k]))<2,'Flight remains continuous');
   assert(packBones(dragonPose(journey.time,reduced,{...state.pose,ground}).bones).every(Number.isFinite));
   last=state.pose.position;
  }
 }
 return state;
}
function follow(journey,reduced=false){
 let states=new Set();
 for(let i=0;i<2200&&journey.phase!=='weaving';i++){
  const [x,,z]=journey.pose.position;
  const state=step(journey,visitor(x+2,z+3),1,reduced);states.add(state.phase);
 }
 assert.equal(journey.phase,'weaving');return states;
}
test('Invitation requires an established, close and calm greeting; duplicate input is harmless',()=>{
 const journey=new DragonInvitation(ground),stranger=new DragonEncounter(ground);
 assert.equal(journey.invite(stranger.snapshot(),visitor(-10,-40)),false);
 const {journey:j,viewer}=ready();assert.equal(j.invite(j.pose,viewer),false);
 const before=j.snapshot();for(let i=0;i<100;i++)j.update(.05,[100,50,100],dragonPose(0),false);
 assert.deepEqual(j.snapshot(),before,'A modal pauses the entire shared encounter');
});
test('Dragon waits for a visitor, resumes with hysteresis, then draws only where they walk',()=>{
 const {journey,viewer}=ready();step(journey,viewer,170);
 let state;
 for(let i=0;i<700&&journey.phase!=='waiting';i++)state=step(journey,viewer);
 assert.equal(journey.phase,'waiting');
 const p=[...journey.pose.position];step(journey,visitor(p[0]+11,p[2]),60);assert.equal(journey.phase,'waiting');
 step(journey,visitor(p[0]+6,p[2]),1);assert.equal(journey.phase,'leading');
 follow(journey);
 assert.equal(journey.flowers.length,0);
 step(journey,visitor(CLEARING.x,CLEARING.z),60);assert.equal(journey.flowers.length,1);
 for(const [x,z] of [[-19,-16],[-19,-12],[-23,-12],[-26,-14]])step(journey,visitor(x,z),60);
 assert.equal(journey.flowers.length,5);
 assert(journey.snapshot().flowers.every(f=>f.bloom>0));
 const flowers=journey.flowers.length;step(journey,visitor(-19,-16),30);assert.equal(journey.flowers.length,flowers,'Revisiting does not pile up flowers');
 step(journey,visitor(0,0),40);assert.equal(journey.flowers.length,flowers,'No flowers outside the glade');
 const before=journey.snapshot();journey.update(10,visitor(0,0),dragonPose(0),false);assert.deepEqual(journey.snapshot(),before);
 assert(journey.finish());assert.equal(journey.finish(),false);
 let light=false,released=false;
 for(let i=0;i<560;i++){state=step(journey,visitor(-23,-16));light ||= !!state.spark;released ||= state.released;}
 assert(light);assert(released);assert.equal(journey.phase,'idle');assert.equal(journey.flowers.length,0);
});
test('Leaving or flying away cancels safely and another invitation is possible',()=>{
 const {journey}=ready();step(journey,visitor(100,100),270);assert.equal(journey.phase,'departing');
 assert.equal(journey.completed,false);step(journey,visitor(100,100),500);assert.equal(journey.phase,'idle');
 const r=DRAGON_REST,e={phase:'greeting',position:[r.x,ground(r.x,r.z)+1.55,r.z],heading:r.heading,known:true,trust:1,bow:1,settle:1,look:0};
 assert(journey.invite(e,visitor(-8,-38)));
 for(let i=0;i<260;i++)step(journey,[-8,50,-38]);
 assert.equal(journey.phase,'departing');
});
test('Reduced motion retains agency and completion; route is dry and cleared',()=>{
 const {journey}=ready();follow(journey,true);step(journey,visitor(-23,-16),180,true);
 assert(journey.finish());step(journey,visitor(-23,-16),560,true);assert.equal(journey.phase,'idle');
 for(const [x,z] of DRAGON_PATH){assert(inDragonGlade(x,z));assert(ground(x,z)>-2.3);}
 assert(inDragonGlade(CLEARING.x,CLEARING.z));assert(!inDragonGlade(86,36));
});
