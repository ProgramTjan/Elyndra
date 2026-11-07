import test from 'node:test';
import assert from 'node:assert/strict';
import {SquirrelGathering,GATHERING_KEY,SCENE_SECONDS} from '../dist/squirrel-gathering.mjs';
import {SquirrelSecret,squirrelPose} from '../dist/squirrel-secret.mjs';
import {conversationNode} from '../dist/conversation-model.mjs';
const ground=(x,z)=>Math.sin(x*.02)+Math.cos(z*.02);
const foot=p=>[p[0],ground(p[0],p[2])+2.4,p[2]];
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};};

test('Dialogue unlocks after four beats, offers opt-out and remembers the first guest',()=>{
 for(const all of [false,true])for(const gatheringAvailable of [false,true]) {
  const ctx={all,gatheringAvailable};
  const start=conversationNode('squirrel','start',ctx);
  assert.equal(start.choices.some(([,n])=>n==='gathering'),all&&gatheringAvailable);
 }
 const invite=conversationNode('squirrel','gathering',{all:true,gatheringAvailable:true});
 assert.deepEqual(invite.choices.map(c=>c[1]),['gatheringStart','end']);
 assert.match(conversationNode('squirrel','start',{all:true,gatheringPhase:'needNut'}).text,/pakken/);
 assert.match(conversationNode('keeper','start',{all:true,gatheringPhase:'done'}).text,/eerste gast/);
});

test('Full film and skipping yield the same playable nut, without automatic collection',()=>{
 const a=new SquirrelGathering(ground),b=new SquirrelGathering(ground);
 assert(a.start());assert(b.start());assert(!a.start());
 const fixed=a.camera(true),original=new SquirrelSecret(ground).snapshot();
 let sawReach=false,positions=new Set();
 for(let i=0;i<SCENE_SECONDS*20+1;i++){
  a.update(.05,foot(a.stash));
  const actor=a.actor(original);sawReach ||= actor.reach>0;
  for(const bone of squirrelPose(actor))assert(Array.from(bone).every(Number.isFinite));
  for(const nut of a.nuts())assert(nut.every(Number.isFinite));
  positions.add(a.position.join(','));
  assert.deepEqual(a.camera(true),fixed,'Reduced motion never tracks or pans');
 }
 assert(sawReach);assert(positions.size>50);
 assert(b.skip());assert(!b.skip());
 assert.equal(a.phase,'needNut');assert.deepEqual(a.nuts(),b.nuts());
 assert.deepEqual(a.position,b.position);
 assert(!a.collect(foot([0,0,0])));assert(!a.collect([106,100,64]));
 assert.equal(a.phase,'needNut');
});

test('Picking up, waiting for the player, arriving, and returning the single squirrel',()=>{
 const saved=storage(),s=new SquirrelGathering(ground,saved);s.start();s.skip();
 assert(s.collect(foot(s.nut)));assert(!s.collect(foot(s.nut)));
 const held=[...s.position];
 for(let i=0;i<50;i++)s.update(.05,[0,2,0]);
 assert.deepEqual(s.position,held);
 for(let i=0;i<200&&s.phase==='escort';i++)s.update(.05,foot(s.position));
 assert.equal(s.phase,'arrival');
 for(let i=0;i<101;i++)s.update(.05,foot(s.position));
 assert.equal(s.phase,'done');assert.equal(saved.getItem(GATHERING_KEY),'done');
 assert.equal(s.nuts().length,3);
 const old=new SquirrelSecret(ground,true);
 old.position=[...s.position];old.startReturn();
 for(let i=0;i<200;i++)old.update(.05,foot(s.meeting));
 assert.equal(old.phase,'home');assert(old.revealed);
 assert(!s.start());assert.equal(new SquirrelGathering(ground,saved).phase,'done');
});

test('Pause and reload retain the task, including during the film and after pickup',()=>{
 const saved=storage(),s=new SquirrelGathering(ground,saved);s.start();s.update(2,foot(s.stash));
 const before=JSON.stringify(s);s.update(50,foot(s.stash),false);assert.equal(JSON.stringify(s),before);
 let restored=new SquirrelGathering(ground,saved);assert.equal(restored.phase,'needNut');
 assert(restored.collect(foot(restored.nut)));
 restored=new SquirrelGathering(ground,saved);assert.equal(restored.phase,'escort');
 assert(!restored.canCollect(foot(restored.nut)));
 for(const bad of ['true','cinematic','<script>','']){saved.setItem(GATHERING_KEY,bad);assert.equal(new SquirrelGathering(ground,saved).phase,'idle');}
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 const session=new SquirrelGathering(ground,blocked);assert(session.start());assert(session.skip());assert(session.collect(foot(session.nut)));
});


test('Reduced motion cuts straight to the stash and keeps the gathering in a fixed close view',()=>{
 const s=new SquirrelGathering(ground);s.start(true);
 const camera=s.camera(true);
 for(let i=0;i<160;i++){
  s.update(.05,foot(s.stash));
  assert.deepEqual(s.position,s.stash);
  assert.deepEqual(s.camera(true),camera);
  assert(s.nuts().every(p=>p.every(Number.isFinite)));
 }
 assert(s.sceneTime>7.999);
 for(let i=0;i<41;i++)s.update(.05,foot(s.stash));
 assert.equal(s.phase,'needNut');
});
