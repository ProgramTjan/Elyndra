import fs from 'node:fs';
import assert from 'node:assert/strict';import {DeerMotion,solveLeg} from '../dist/deer-motion.mjs';
const ground=(x,z)=>Math.sin(x*.12)*.12+z*.025;const deer=new DeerMotion(ground);let old,steps=0,moved=false,maxError=0;
for(let frame=0;frame<2400;frame++){let p=deer.update(.025,frame*.025,[0,2,0]);assert.equal(p.bones.length,18);for(let m of p.bones){assert(m.every(Number.isFinite));for(let i of[0,4,8])assert(Math.abs(Math.hypot(m[i],m[i+1],m[i+2])-1)<1e-6,'Rigid bone keeps scale');}if(old){for(let i=0;i<4;i++)if(i!==old.active&&i!==p.active)assert.deepEqual(p.feet[i],old.feet[i],'Supporting hoof stays planted');if(p.active!==old.active&&p.active>=0)steps++;if(Math.hypot(p.position[0]-old.position[0],p.position[2]-old.position[2])>0)moved=true;}maxError=Math.max(maxError,p.maxFootError);old=p;}
assert(moved&&steps>8);assert(maxError<.04,`Foot reach error ${maxError}`);
const reduced=new DeerMotion(ground),a=reduced.update(.025,0,[0,0,0],true);for(let i=1;i<800;i++)assert.deepEqual(reduced.update(.025,i*.025,[0,0,0],true).position,a.position);
const shy=new DeerMotion(ground);for(let i=0;i<800;i++){let p=shy.update(.025,i*.025,[-37,2,-45]);assert(!p.moving,'Pauses walking when approached');}
const leg=solveLeg([0,1.5,0],[0,.1,.1],[0,0,-1]);assert(Math.abs(Math.hypot(leg.knee[0],leg.knee[1]-1.5,leg.knee[2])-.86)<1e-8);
console.log(`Deer: 18 rigid bones, ${steps} steps, planted support feet, bounded reach (${maxError.toFixed(4)}), proximity stop and reduced motion.`);

// Use the actual valley terrain to check reach over the full small walking circuit.
const source=fs.readFileSync(new URL('../dist/world.js',import.meta.url),'utf8');const terrainCode=source.slice(source.indexOf('function river(z)'),source.indexOf('// A continuous valley'));
const actualGround=new Function(terrainCode+';return ground;')();const walker=new DeerMotion(actualGround);let reach=0;
for(let i=0;i<6000;i++){let p=walker.update(.025,i*.025,[0,0,0]);reach=Math.max(reach,p.maxFootError);}assert(reach<.04,`Actual terrain reach error ${reach}`);console.log('Actual valley: hoof targets remain within leg reach.');
