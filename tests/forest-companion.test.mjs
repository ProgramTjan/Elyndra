import assert from 'node:assert/strict';
import {ForestCompanion,GARDEN,gardenFlower,companionTrail} from '../dist/forest-companion.mjs';
const river=z=>15+Math.sin(z*.012)*16;
const ground=(x,z)=>1.3+3*Math.sin(x*.023)*Math.cos(z*.019)+1.5*Math.sin(z*.045+x*.01)-Math.max(0,1-Math.abs(x-river(z))/18)*7;
const wonder={time:0,bloom:1,age:40};
const guide=new ForestCompanion(ground);
let visitor=[9,1,-3];
for(let i=0;i<80;i++)guide.update(.05,visitor,wonder);
assert.equal(guide.phase,'leading','Approaching accepts the invitation');
const start=guide.progress;
for(let i=0;i<100;i++)guide.update(.05,[70,2,70],wonder);
assert.equal(guide.phase,'waiting');assert.equal(guide.progress,start,'An absent visitor is never left behind');
const saved=guide.snapshot(visitor);
for(let i=0;i<80;i++)guide.update(.05,visitor,wonder,false);
assert.deepEqual(guide.snapshot(visitor),saved,'A modal pauses the entire escort');
let maxStep=0,last=[...guide.position];
for(let i=0;i<1500;i++){
 visitor=[guide.position[0],guide.position[1]+2.4,guide.position[2]+3];
 guide.update(.05,visitor,wonder);
 maxStep=Math.max(maxStep,Math.hypot(guide.position[0]-last[0],guide.position[2]-last[2]));
 assert(guide.position.every(Number.isFinite));last=[...guide.position];
}
assert.equal(guide.phase,'arrived');assert(guide.discovered);assert(guide.bloom>.99);
assert(maxStep<.091,'Movement stays continuous and bounded');
assert(Math.hypot(guide.position[0]-GARDEN.x,guide.position[2]-GARDEN.z)<4);
for(let i=0;i<2200;i++)guide.update(.05,[100,5,100],wonder);
assert.equal(guide.phase,'resting','The abandoned guide swims home');
assert(guide.discovered,'Leaving does not erase the garden');

const independent=new ForestCompanion(ground);
for(let i=0;i<120;i++)independent.update(.05,[GARDEN.x,70,GARDEN.z],wonder);
assert(!independent.discovered,'Flying high over the garden cannot discover it');
for(let i=0;i<100;i++)independent.update(.05,[GARDEN.x,ground(GARDEN.x,GARDEN.z)+2.4,GARDEN.z],wonder,true,true);
assert(independent.discovered,'Independent discovery also works with reduced motion');
const restored=new ForestCompanion(ground,true);assert(restored.discovered);assert.equal(restored.bloom,1);
for(let i=0;i<34;i++){const f=gardenFlower(i,ground);assert(Object.values(f).every(Number.isFinite));assert(f.y>=-2.1);}
for(let i=0;i<100;i++)assert(companionTrail(i/100,ground).flat().every(Number.isFinite));
console.log('Companion: invitation, waiting, modal pause, complete journey, continuous return, independent discovery and remembered garden passed.');
