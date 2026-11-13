import test from 'node:test';import assert from 'node:assert/strict';
import {DragonGuest,DRAGON_GUEST_KEY,DRAGON_FILM_SECONDS,KINDLE_SECONDS,heldPosition} from '../dist/dragon-guest.mjs';
import {conversationNode,nearbySpeakers,SPEAKERS} from '../dist/conversation-model.mjs';

const ground=()=>0;
const store=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),map:m};};
const resting={phase:'resting',position:[-14,1.55,-40]};
const beside=[-8,2.4,-36],lanternSide=[-10.2,2.4,-32.6],atKeeper=[92,2.4,47];
const wait=(g,seconds,p,step=.1)=>{for(let t=0;t<seconds-1e-9;t+=step)g.update(step,p);};
const opened=(storage)=>{const g=new DragonGuest(ground,storage);g.available=true;return g;};

test('the dragon can only be invited once the earlier guests have come and he has landed to rest',()=>{
  const g=new DragonGuest(ground,store());
  assert.equal(g.canInvite(beside,resting),false,'not before the fox has arrived');
  g.available=true;
  assert.equal(g.canInvite(beside,{phase:'orbit'}),false,'not while he is still flying');
  assert.equal(g.canInvite(beside,{phase:'approaching'}),false);
  assert.equal(g.canInvite([60,2.4,60],resting),false,'not from far away');
  assert.equal(g.canInvite([-8,30,-36],resting),false,'not from the air');
  assert.equal(g.canInvite(beside,resting),true);
  assert.equal(g.reserved,false,'until invited the old dragon encounter keeps him');
});

test('the film ends by itself or by skipping, both leaving the lantern to pick up',()=>{
  for(const skip of [true,false]){
    const s=store(),g=opened(s);assert.equal(g.start(beside,resting),true);
    assert.equal(g.cinematic,true);assert.equal(s.map.get(DRAGON_GUEST_KEY),'ember','progress is saved when the film begins');
    assert(g.camera().position.every(Number.isFinite));assert.deepEqual(g.camera(true),g.camera(true),'reduced motion has one fixed shot');
    if(skip)assert.equal(g.skip(),true);else wait(g,DRAGON_FILM_SECONDS+.2,beside);
    assert.equal(g.phase,'ember');assert.equal(g.action(lanternSide),'Neem de gloedlantaarn');assert.equal(g.action([30,2.4,30]),null);
  }
});

test('the glow settles only for someone who stands still',()=>{
  const g=opened(store());g.start(beside,resting);g.skip();assert.equal(g.interact(lanternSide),true);assert.equal(g.phase,'kindle');
  let p=[...lanternSide];for(let i=0;i<80;i++){p=[p[0]+.3,p[1],p[2]];g.update(.1,p);} // eight seconds of walking
  assert.equal(g.phase,'kindle','walking never settles it');assert(g.kindle<.2);
  wait(g,KINDLE_SECONDS-1,p);assert.equal(g.phase,'kindle');
  wait(g,1.4,p);assert.equal(g.phase,'carry');assert.equal(g.carried,true);assert.equal(g.offeringPosition(),null,'the visitor now carries it');
});

test('he flies his own way, circles above the keeper and lands when you arrive',()=>{
  const g=opened(store());g.start(beside,resting);g.skip();g.interact(lanternSide);wait(g,KINDLE_SECONDS+.5,lanternSide);
  const early=g.pose(lanternSide);assert(early.settle>0,'he gathers himself before taking off');
  wait(g,10,lanternSide);const climbing=g.pose(lanternSide);assert(climbing.position[1]>10&&climbing.settle===0);
  wait(g,20,lanternSide);const circling=g.pose(lanternSide);
  assert(Math.abs(Math.hypot(circling.position[0]-g.meeting[0],circling.position[2]-g.meeting[2])-34)<.5,'circling above the gathering');
  let last=g.pose(lanternSide).position;for(let i=0;i<300;i++){g.update(.1,lanternSide);const now=g.pose(lanternSide).position;assert(Math.hypot(...now.map((v,k)=>v-last[k]))<4,'no jumps in his flight');last=now;}
  g.update(.1,atKeeper);assert.equal(g.phase,'arrival');
  for(let i=0;i<85;i++){g.update(.1,atKeeper);const now=g.pose(atKeeper).position;assert(Math.hypot(...now.map((v,k)=>v-last[k]))<4,'no jump while landing');last=now;}
  assert.equal(g.phase,'offering');const landed=g.pose(atKeeper);assert.equal(landed.settle,1);assert.deepEqual(landed.position,g.landing);
  assert(Math.hypot(g.landing[0]-86,g.landing[2]-36)>14,'he lands clear of the keeper');
});

test('the keeper receives the warmth and the dragon stays as third guest',()=>{
  const s=store(),g=opened(s);g.start(beside,resting);g.skip();g.interact(lanternSide);wait(g,KINDLE_SECONDS+.5,lanternSide);g.update(.1,atKeeper);wait(g,9,atKeeper);
  assert(Math.hypot(g.lantern[0]-g.rest[0],g.lantern[2]-g.rest[2])>5,'the lantern lies clear of his head');assert(g.near(g.standpoint(),g.lantern,3.6),'the travel button puts the lantern within reach');
  assert.equal(g.canDeliver([-10,2.4,-38]),false);assert.equal(g.deliver(atKeeper),true);
  assert.equal(g.phase,'done');assert.equal(g.active,false);assert.equal(g.reserved,true);assert.equal(s.map.get(DRAGON_GUEST_KEY),'done');
  assert(g.offeringPosition(),'the lantern rests by the snacks');assert.equal(g.glow(),1);
});

test('progress survives a reload at every stage, and works without storage',()=>{
  for(const saved of ['ember','kindle','carry','done']){const s=store();s.setItem(DRAGON_GUEST_KEY,saved);const g=new DragonGuest(ground,s);assert.equal(g.phase,saved);assert(g.pose(beside).position.every(Number.isFinite));assert(saved==='done'||g.words());}
  const s=store();s.setItem(DRAGON_GUEST_KEY,'nonsense');assert.equal(new DragonGuest(ground,s).phase,'idle');
  const broken={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};
  const g=new DragonGuest(ground,broken);g.available=true;assert.equal(g.start(beside,resting),true);g.skip();assert.equal(g.interact(lanternSide),true);
  const none=new DragonGuest(ground,undefined);none.available=true;assert.equal(none.start(beside,resting),true);
});

test('paused and unavailable chapters do not advance',()=>{
  const g=opened(store());g.start(beside,resting);g.update(5,beside,false);assert.equal(g.elapsed,0,'menus and hidden tabs pause the film');
  const closed=new DragonGuest(ground,store());closed.update(1,beside);assert.equal(closed.time,0);
});

test('the carried lantern hangs low and to the right of where you look',()=>{
  const eye=[0,2.4,0],north=heldPosition(eye,0,0);
  assert(north[2]<-1&&north[0]>.3&&north[1]<eye[1],'ahead, right and below when facing north');
  const east=heldPosition(eye,Math.PI/2,0);assert(east[0]>1&&east[2]>.3);
});

test('the dragon answers in gestures and the keeper names what the three guests brought',()=>{
  assert(SPEAKERS.dragon);
  const open=conversationNode('dragon','start',{dragonGuestAvailable:true});assert.deepEqual(open.choices[0],['Kom je ook naar de samenkomst?','guestInvitation']);
  assert(!open.text.includes('“'),'he does not speak in words');
  const invite=conversationNode('dragon','guestInvitation',{dragonGuestAvailable:true});assert.equal(invite.choices[0][1],'dragonGuestStart');assert.equal(invite.choices[1][1],'end');
  assert.deepEqual(conversationNode('dragon','start',{}).choices,[['Tot zo, oude draak.','end']]);
  for(const phase of ['ember','kindle','offering','done'])assert.notEqual(conversationNode('dragon','start',{dragonGuestPhase:phase}).text,open.text);
  const keeper=conversationNode('keeper','start',{dragonCanDeliver:true});assert.deepEqual(keeper.choices[1],['Ik breng warmte van de draak.','dragonWarmth']);
  assert.match(conversationNode('keeper','dragonWarmth',{dragonCanDeliver:true}).text,/Water, een teken en warmte/);
  assert.match(conversationNode('keeper','start',{foxPhase:'done',dragonGuestPhase:'idle'}).text,/oude vriend rust/);
  assert.match(conversationNode('keeper','start',{foxPhase:'done',dragonGuestPhase:'done'}).text,/Drie gasten/);
  assert.equal(nearbySpeakers([-9,2.4,-37],[50,0,150],0,null,null,[-14,1.55,-40])[0],'dragon');
  assert(!nearbySpeakers([-9,2.4,-37],[50,0,150],0,null,null,null).includes('dragon'));
});
