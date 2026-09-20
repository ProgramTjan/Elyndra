import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MIRROR,DeerMirror,lakeGround,surfacePoint} from '../dist/deer-mirror.mjs';
import {DeerMotion} from '../dist/deer-motion.mjs';
const ground=(x,z)=>lakeGround(x,z,.5);
const at=(x,z)=>[x,ground(x,z)+2.4,z];
function tick(m,v,n){let s;for(let i=0;i<n;i++){s=m.update(.05,v);assert([s.bloom,s.open,s.fade,s.alignment,...Object.values(s.actor).filter(x=>typeof x==='number')].every(Number.isFinite));}return s;}
test('Invitation, agency, alignment, forest and return form a repeatable encounter',()=>{
 const m=new DeerMirror(ground),v=at(9,145);assert(!m.accept(v));tick(m,v,130);assert.equal(m.phase,'invitation');assert.equal(m.bloom,1);
 const before=m.snapshot(v);m.update(5,v,false);assert.deepEqual(m.snapshot(v),before);
 assert(m.accept(v));assert(!m.accept(v));tick(m,v,170);assert.equal(m.phase,'searching');assert.equal(m.fade,0);
 tick(m,v,200);assert.equal(m.phase,'searching','Standing in the initial spot cannot solve the puzzle');
 tick(m,[9,40,139],40);assert.equal(m.phase,'searching','Flying over it does not solve it');
 tick(m,at(9,139),70);assert.equal(m.phase,'opening');tick(m,at(9,139),200);assert.equal(m.phase,'beyond');assert(m.completed);
 tick(m,at(9,139),470);assert.equal(m.phase,'farewell');assert.equal(m.fade,1);assert(m.snapshot(v).petal>0);
 tick(m,at(9,139),380);assert.equal(m.phase,'rest');tick(m,at(-30,0),260);assert.equal(m.phase,'drinking');
 tick(m,v,130);assert(m.accept(v),'The encounter can be repeated');
});
test('Leaving the hidden deer brings it back; no stuck invisible actor',()=>{
 const m=new DeerMirror(ground),v=at(9,145);tick(m,v,140);m.accept(v);tick(m,v,170);
 tick(m,at(-50,-50),700);assert.equal(m.fade,1);assert(['farewell','rest','drinking'].includes(m.phase));
});
test('The moon is at the actual reflected antler projection from a walkable bank',()=>{
 const eye=at(MIRROR.shoreX,MIRROR.alignZ),a=new DeerMotion(()=>ground(11,135));let pose;
 for(let i=0;i<100;i++)pose=a.update(.05,0,eye,true,{x:17,z:135,heading:-Math.PI/2,stillHead:true});
 const h=pose.bones[2],p=[0,1,2].map(i=>h[i+12]+h[i+4]*.95);p[1]=2*MIRROR.water-p[1];
 const moon=surfacePoint(eye,p);assert(moon.every(Number.isFinite));assert(Math.abs(moon[1]-MIRROR.water)<1e-9);
 assert(Math.hypot((moon[0]-23)/14,(moon[2]-135)/19)<.82,'Moon is inside the visible pool');
 assert(ground(9,139)>MIRROR.water,'Solution is on dry ground');
 assert.equal(lakeGround(-48,-65,2),2,'The cathedral terrain is unchanged');
});
