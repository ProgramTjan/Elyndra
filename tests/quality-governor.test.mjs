import test from 'node:test';import assert from 'node:assert/strict';
import {QualityGovernor,tierSettings,readRemembered,saveRemembered,AUTO_KEY} from '../dist/quality-governor.mjs';

const run=(g,fps,seconds)=>{let changes=0;for(let i=0;i<fps*seconds;i++)if(g.sample(1/fps))changes++;return changes;};
const store=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};

test('desktop starts beautiful, a phone starts smooth at full resolution',()=>{
  assert.equal(new QualityGovernor().tier,'high');
  const phone=new QualityGovernor({mobile:true});
  assert.equal(phone.tier,'fast');assert.equal(phone.scale,1);
  assert.deepEqual(tierSettings('fast',1,3),{pixel:1,shadow:512,soft:0});
  assert.deepEqual(tierSettings('high',1,3),{pixel:2,shadow:2048,soft:1});
});

test('a fast desktop keeps the beautiful tier',()=>{
  const g=new QualityGovernor();assert.equal(run(g,60,30),0);assert.equal(g.tier,'high');
});

test('a struggling device steps down once per measurement and never climbs back',()=>{
  const g=new QualityGovernor();
  assert.equal(run(g,20,6),1);assert.equal(g.tier,'fast');assert.equal(g.scale,1);
  run(g,20,6);assert.equal(g.scale,.8);
  run(g,20,6);assert.equal(g.scale,.65);
  assert.equal(run(g,20,20),0,'the lowest step is the floor');
  assert.equal(run(g,60,60),0,'no flip-flopping after a step down');assert.equal(g.tier,'fast');
});

test('a capable phone is promoted after sustained smooth frames',()=>{
  const g=new QualityGovernor({mobile:true});
  assert.equal(run(g,60,5),0,'not on the first good window');
  run(g,60,10);assert.equal(g.tier,'high');
});

test('pauses, tab switches and very slow software rendering are handled',()=>{
  const g=new QualityGovernor();
  for(let i=0;i<20;i++){assert.equal(g.sample(5),false);g.sample(1/60);}assert.equal(g.tier,'high','single long frames are pauses');
  const stuck=new QualityGovernor();stuck.sample(2);stuck.sample(2);assert.equal(stuck.sample(2),true);assert.equal(stuck.tier,'fast','three long frames in a row is a stalled device');
  assert.equal(g.sample(0),false);assert.equal(g.sample(NaN),false);
  for(let i=0;i<12;i++)g.sample(.75);assert.equal(g.tier,'fast','1.3 fps still counts as slow');
});

test('a step down is remembered for a week on this device',()=>{
  const s=store(),g=new QualityGovernor();run(g,20,12);saveRemembered(s,g,1000);
  const again=new QualityGovernor({remembered:readRemembered(s,2000)});
  assert.equal(again.tier,'fast');assert.equal(again.scale,.8);assert.equal(again.locked,true);
  assert.equal(readRemembered(s,1000+8*24*3600*1000),null);
  s.setItem(AUTO_KEY,'{broken');assert.equal(readRemembered(s),null);
  assert.equal(readRemembered({getItem(){throw new Error('blocked')}}),null);
});
