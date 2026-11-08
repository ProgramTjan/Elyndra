import test from 'node:test';
import assert from 'node:assert/strict';
import {FoxInvitation,FOX_INVITATION_KEY} from '../dist/fox-invitation.mjs';
import {RareDwellers} from '../dist/rare-dwellers.mjs';
import {conversationNode,nearbySpeakers} from '../dist/conversation-model.mjs';
const ground=(x,z)=>.5*Math.sin(x*.02)+.2*Math.cos(z*.02);
const foot=p=>[p[0],ground(p[0],p[2])+2.4,p[2]];
const store=()=>{const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};};
const frames=(s,n,p)=>{for(let i=0;i<n;i++)s.update(.05,p);};

test('Invitation is gated, optional, and uses proximity including altitude',()=>{
 const s=new FoxInvitation(ground);const p=foot(s.dig);
 assert(!s.start(p));s.available=true;
 assert(!s.start([p[0],40,p[2]]));assert(!s.start([0,2,0]));assert(s.start(p));assert(!s.start(p));
 assert(!conversationNode('fox','start',{}).choices.some(c=>c[1]==='invitation'));
 assert(conversationNode('fox','start',{foxAvailable:true}).choices.some(c=>c[1]==='invitation'));
 assert.deepEqual(conversationNode('fox','invitation').choices.map(c=>c[1]),['foxStart','end']);
 const pose=s.pose(p);assert(nearbySpeakers(p,[0,0,0],0,null,pose).includes('fox'));
 assert(!nearbySpeakers([p[0],50,p[2]],[0,0,0],0,null,pose).includes('fox'));
 pose.fade=0;assert(!nearbySpeakers(p,[0,0,0],0,null,pose).includes('fox'));
});

test('Film, skip, pause, and reduced motion preserve the same playable discovery',()=>{
 const a=new FoxInvitation(ground),b=new FoxInvitation(ground);a.available=b.available=true;
 a.start(foot(a.dig));b.start(foot(b.dig),true);
 const camera=b.camera(true);const old=b.snapshot();b.update(50,foot(b.dig),false);assert.deepEqual(b.snapshot(),old);
 for(let i=0;i<181;i++){
  a.update(.05,foot(a.dig));
  const pose=a.pose(foot(a.dig));for(const bone of pose.bones)assert(Array.from(bone).every(Number.isFinite));
  assert.deepEqual(b.camera(true),camera);
 }
 b.skip();assert.equal(a.phase,'fragment');assert.deepEqual(a.offeringPosition(),b.offeringPosition());
 assert(!a.skip());assert(!a.interact([0,2,0]));assert(!a.interact([a.fragment[0],40,a.fragment[2]]));
});

test('The player takes, washes, carries and explicitly gives the fragment',()=>{
 const saved=store(),s=new FoxInvitation(ground,saved);s.available=true;s.start(foot(s.dig));s.skip();
 assert(s.interact(foot(s.fragment)));assert.equal(s.phase,'wash');assert.equal(saved.getItem(FOX_INVITATION_KEY),'wash');
 assert(!s.interact([0,2,0]));assert(s.interact(foot(s.spring)));assert.equal(s.phase,'washing');
 frames(s,80,[0,2,0]);assert.equal(s.washProgress,0,'Walking away cannot clean remotely');
 frames(s,61,foot(s.spring));assert.equal(s.phase,'carry');assert(s.clean);assert.equal(saved.getItem(FOX_INVITATION_KEY),'carry');
 assert(!s.deliver(foot(s.meeting)));frames(s,1,foot(s.meeting));assert.equal(s.phase,'arrival');
 frames(s,121,foot(s.meeting));assert.equal(s.phase,'offering');assert(!s.deliver([0,2,0]));
 assert(s.deliver(foot(s.meeting)));assert.equal(s.phase,'done');assert.equal(saved.getItem(FOX_INVITATION_KEY),'done');
 assert(!s.deliver(foot(s.meeting)));assert(!s.start(foot(s.dig)));
 assert.deepEqual(s.pose(foot(s.meeting)).position,s.meeting);
 const ctx={foxCanDeliver:true};assert(conversationNode('keeper','start',ctx).choices.some(c=>c[1]==='foxClue'));
 assert.match(conversationNode('keeper','foxClue',ctx).text,/zaadje/);
});

test('Reload resumes each durable task, and blocked storage still permits play',()=>{
 const saved=store(),s=new FoxInvitation(ground,saved);s.available=true;s.start(foot(s.dig));
 let resumed=new FoxInvitation(ground,saved);assert.equal(resumed.phase,'fragment');
 resumed.interact(foot(resumed.fragment));resumed=new FoxInvitation(ground,saved);assert.equal(resumed.phase,'wash');
 resumed.interact(foot(resumed.spring));resumed.update(.5,foot(resumed.spring));resumed=new FoxInvitation(ground,saved);assert.equal(resumed.phase,'wash');
 for(const phase of ['carry','done']){saved.setItem(FOX_INVITATION_KEY,phase);assert.equal(new FoxInvitation(ground,saved).phase,phase);}
 for(const value of ['film','washing','true','{}']){saved.setItem(FOX_INVITATION_KEY,value);assert.equal(new FoxInvitation(ground,saved).phase,'idle');}
 const blocked={getItem(){throw Error()},setItem(){throw Error()}};
 const session=new FoxInvitation(ground,blocked);session.available=true;assert(session.start(foot(session.dig)));session.skip();assert(session.interact(foot(session.fragment)));
});

test('Reserving the fox pauses its old routine without pausing other inhabitants',()=>{
 const d=new RareDwellers(ground);const viewer=[-45,ground(-45,-26)+2.4,-26];
 for(let i=0;i<100;i++)d.update(.05,viewer,{hour:6});
 const t=d.fox.time,clock=d.clock;
 for(let i=0;i<300;i++)d.update(.05,viewer,{hour:6,foxReserved:true});
 assert.equal(d.fox.time,t);assert(d.clock>clock);assert(!d.springFound,'The reserved fox cannot open the old spring in the background');
 for(let i=0;i<300;i++)d.update(.05,viewer,{hour:6});assert(d.springFound,'The original dawn encounter still works when released');
});
