import assert from 'node:assert/strict';
import {BrookMotion,dragonPose,packBones} from '../dist/wildlife-motion.mjs';
const point=(m,p)=>[0,1,2].map(i=>m[i]*p[0]+m[i+4]*p[1]+m[i+8]*p[2]+m[i+12]);
const close=(a,b)=>assert(Math.hypot(...a.map((v,i)=>v-b[i]))<1e-8);
function rigid(bones){const packed=packBones(bones);assert.equal(packed.length,288);assert(packed.every(Number.isFinite));for(let m of bones)for(let c of[0,4,8])assert(Math.abs(Math.hypot(m[c],m[c+1],m[c+2])-1)<1e-8);}
const ground=(x,z)=>x*.025+z*.012;const a=new BrookMotion(58,-90,-.5,0,ground),b=new BrookMotion(71,-90,.5,3.7,ground);let distinct=false,minFlap=1,maxFlap=0;
for(let i=0;i<1200;i++){const t=i*.025,p=a.update(.025,t,[58,3,-86]),q=b.update(.025,t,[58,3,-86]);rigid(p.bones);rigid(q.bones);assert(Math.abs(p.look)<=.76);close(point(p.bones[6],[0,0,0]),[58,ground(58,-90),-90]);for(let j=2;j<5;j++)close(point(p.bones[j],[0,0,j===2?.52:.46]),point(p.bones[j+1],[0,0,0]));if(Math.abs(p.bones[2][0]-q.bones[2][0])>.01)distinct=true;
 const d=dragonPose(t);rigid(d.bones);minFlap=Math.min(minFlap,d.flapping);maxFlap=Math.max(maxFlap,d.flapping);assert(d.position[1]>=78&&d.position[1]<=82);for(let [j,side]of[[3,-1],[5,1]])close(point(d.bones[j],[side*2.4,.05,.35]),point(d.bones[j+1],[0,0,0]));close(point(d.bones[7],[0,-.06,1.25]),point(d.bones[8],[0,0,0]));const next=dragonPose(t+.001),dx=next.position[0]-d.position[0],dz=next.position[2]-d.position[2];assert(dx*(-Math.sin(d.heading))+dz*(-Math.cos(d.heading))>0,'Dragon faces direction of flight');}
assert(distinct);assert.equal(minFlap,0);assert.equal(maxFlap,1);assert(a.interest>.5);assert.deepEqual(dragonPose(0,true),dragonPose(100,true));const still=new BrookMotion(58,-90,-.5,0,ground);assert.deepEqual(still.update(.03,0,[0,0,0],true),still.update(.03,100,[58,2,-88],true));
console.log('Wildlife: finite rigid poses, attached tail/wing joints, planted brook feet, independent rhythms, flight heading, flap/glide transitions and reduced motion.');
