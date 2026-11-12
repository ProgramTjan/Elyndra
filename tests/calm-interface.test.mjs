import test from 'node:test';import assert from 'node:assert/strict';
import {CalmInterface,CALM_DELAY,isTap,inReach,readCalmEnabled,saveCalmEnabled} from '../dist/calm-interface.mjs';

test('the interface fades only after standing still',()=>{
  const c=new CalmInterface();
  assert.equal(c.update(CALM_DELAY-1),false);
  assert.equal(c.update(1.1),true);
});

test('walking, a menu or an explicit wake brings it back and restarts the wait',()=>{
  const c=new CalmInterface();c.update(CALM_DELAY+1);
  assert.equal(c.update(.016,{moving:true}),false);
  assert.equal(c.update(CALM_DELAY-1),false);
  c.update(2);assert.equal(c.calm,true);
  assert.equal(c.update(.016,{blocked:true}),false);
  c.update(CALM_DELAY+1);c.wake();assert.equal(c.calm,false);
});

test('it can be switched off and the choice is kept',()=>{
  const c=new CalmInterface({enabled:false});assert.equal(c.update(60),false);
  c.setEnabled(true);assert.equal(c.update(CALM_DELAY),true);
  const m=new Map(),s={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
  assert.equal(readCalmEnabled(s),true);saveCalmEnabled(s,false);assert.equal(readCalmEnabled(s),false);
  assert.equal(readCalmEnabled({getItem(){throw new Error('blocked')}}),true);
});

test('a tap wakes the interface, a drag to look around does not',()=>{
  assert.equal(isTap({x:10,y:10},{x:13,y:12}),true);
  assert.equal(isTap({x:10,y:10},{x:60,y:10}),false);
  assert.equal(isTap(null,{x:0,y:0}),false);
});

test('the mouse wakes it only near the edges where the buttons live',()=>{
  assert.equal(inReach(40,720),true);assert.equal(inReach(360,720),false);assert.equal(inReach(650,720),true);
});
