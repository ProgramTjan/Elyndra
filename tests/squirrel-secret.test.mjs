import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SquirrelSecret,MONUMENT,STUMPS,SQUIRREL_ROUTE,SECRET_KEY,readSecret,saveSecret,inSquirrelPath,squirrelPose} from '../dist/squirrel-secret.mjs';
import {packBones} from '../dist/wildlife-motion.mjs';
import {conversationNode,nearbySpeakers} from '../dist/conversation-model.mjs';
const ground=(x,z)=>1.3+3*Math.sin(x*.023)*Math.cos(z*.019)+1.5*Math.sin(z*.045+x*.01)-Math.max(0,1-Math.abs(x-(15+Math.sin(z*.012)*16))/18)*7+Math.min(1,Math.max(0,(Math.abs(x)-135)/55,(-z-215)/55,(z-165)/55))**2*25;
const viewer=(x,z)=>[x,ground(x,z)+2.4,z];
function step(s,v,n=1,reduced=false){let state,prev=[...s.position];for(let i=0;i<n;i++){
 state=s.update(.05,v,true,reduced);assert(state.position.every(Number.isFinite));
 assert(Math.hypot(...state.position.map((x,k)=>x-prev[k]))<1,'The squirrel never teleports');prev=state.position;
 assert(packBones(squirrelPose(state,reduced)).every(Number.isFinite));
}return state;}
function reach(s,reduced=false){const seen=new Set();for(let i=0;i<3800&&s.phase!=='ready'&&s.phase!=='posing';i++){
 const [x,,z]=s.position;step(s,viewer(x+1.7,z-2),1,reduced);seen.add(s.phase);
}return seen;}
test('Explicit invitation, climb, stumps, waiting and coming back to the visitor',()=>{
 const s=new SquirrelSecret(ground);assert(!s.invite(viewer(0,0)));assert(!s.invite([96,80,43]));assert(s.invite(viewer(96,49)));assert(!s.invite(viewer(96,49)));
 step(s,viewer(96,49),200);assert.equal(s.phase,'leading');
 const before=s.snapshot(viewer(96,49));s.update(100,viewer(0,0),false);assert.deepEqual(s.snapshot(viewer(96,49)),before);
 const phases=new Set();for(let i=0;i<500;i++){phases.add(step(s,viewer(96,49)).phase);if(phases.has('return-to-you'))break;}
 assert(phases.has('waiting'));assert(phases.has('return-to-you'));
 const seen=reach(s);assert(seen.has('perching'));assert.equal(s.phase,'ready');assert(!s.revealed);
 assert(!s.touch(viewer(90,50)));assert(!s.touch([130,80,143]));assert(s.touch(viewer(130,139)));
 let discoveries=0;for(let i=0;i<210;i++)discoveries+=Number(step(s,viewer(130,139)).justRevealed);
 assert.equal(discoveries,1);assert(s.revealed);assert.equal(s.reveal,1);
 const poses=new Set();let wobble=false;for(let i=0;i<400;i++){const st=step(s,viewer(130,139));poses.add(st.phase);wobble ||= Math.abs(st.wobble)>.1;}
 assert(poses.has('posing'));assert(poses.has('proud'));assert(wobble);
 assert(Math.abs(s.position[1]-ground(130,148)-MONUMENT.crown)<.05);
 for(let i=0;i<2500&&s.phase!=='home';i++)step(s,viewer(86,55));assert.equal(s.phase,'home');assert(s.revealed);
});
test('Walking away safely returns him home; repeat visit preserves the monument',()=>{
 const s=new SquirrelSecret(ground);s.invite(viewer(96,49));step(s,viewer(0,0),1600);assert.equal(s.phase,'home');
 assert(s.invite(viewer(96,49)));reach(s);s.touch(viewer(130,139));step(s,viewer(130,139),210);
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 assert(saveSecret(storage));assert.equal(store.get(SECRET_KEY),'found');assert(readSecret(storage));
 const reloaded=new SquirrelSecret(ground,readSecret(storage));assert.equal(reloaded.reveal,1);assert.equal(reloaded.phase,'home');
 step(reloaded,viewer(130,135));assert.equal(reloaded.phase,'visiting');
 for(let i=0;i<2000&&reloaded.phase!=='proud';i++)step(reloaded,viewer(130,135));assert.equal(reloaded.phase,'proud');
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};assert(!readSecret(broken));assert(!saveSecret(broken));
 assert(conversationNode('keeper','start',{monument:true}).text.includes('bescheidenheid'));
 assert(conversationNode('squirrel','start',{monument:true}).text.includes('kunstkenner'));
 assert(!nearbySpeakers(viewer(96,43),[0,0,0],ground(86,36),reloaded.position).includes('squirrel'),'No duplicate conversation at the empty hand');
});
test('Reduced motion can finish the whole encounter and the route is dry',()=>{
 const s=new SquirrelSecret(ground);s.invite(viewer(96,49));reach(s,true);assert(s.touch(viewer(130,139)));
 for(let i=0;i<650;i++){const st=step(s,viewer(130,139),1,true);assert.equal(st.wobble,0);}
 assert(s.revealed);assert.equal(s.phase,'proud');
 for(const [x,z]of SQUIRREL_ROUTE){assert(ground(x,z)>-2.3);assert(inSquirrelPath(x,z));}
 for(const [x,z]of STUMPS)assert(inSquirrelPath(x,z));assert(!inSquirrelPath(-48,-65));
});
