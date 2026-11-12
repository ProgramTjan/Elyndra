import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {WONDERS,WonderJournal,readJournal,saveJournal,revealAll,JOURNAL_KEY} from '../dist/wonder-journal.mjs';

const store=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const far={brook:'far',cathedral:'far',gate:'far',dew:'far',deer:'drinking'};

test('a new visitor knows no wonders and hears about the nearest one',()=>{
  const j=new WonderJournal();
  for(const w of WONDERS)assert.equal(j.knows(w.id),false);
  assert.equal(j.nearest([12,0,-10]).id,'brook');assert.equal(j.nearest([60,0,-100]).id,'gate');assert.equal(j.nearest([10,0,140]).id,'deer');
});

test('a wonder is found once, by experiencing it, not by walking past',()=>{
  const j=new WonderJournal();
  assert.deepEqual(j.observe(far),[]);
  assert.deepEqual(j.observe({...far,brook:'invitation',cathedral:'high',gate:'closed',dew:'dry'}),[],'being nearby is not enough');
  assert.deepEqual(j.observe({...far,brook:'awakening'}).map(w=>w.id),['brook']);
  assert.deepEqual(j.observe({...far,brook:'constellation'}),[],'only reported the first time');
  assert.equal(j.knows('brook'),true);assert.notEqual(j.nearest([12,0,-10]).id,'brook');
  assert.deepEqual(j.observe({...far,deer:'invitation',dew:'awakening'}).map(w=>w.id).sort(),['deer','dew']);
});

test('found wonders are kept on the device and survive a broken store',()=>{
  const s=store(),j=new WonderJournal();j.observe({...far,gate:'mirror'});saveJournal(s,j);
  assert.deepEqual(readJournal(s),['gate']);assert.equal(new WonderJournal(readJournal(s)).knows('gate'),true);
  s.setItem(JOURNAL_KEY,'["gate","nonsense",3]');assert.deepEqual(readJournal(s),['gate']);
  s.setItem(JOURNAL_KEY,'{oops');assert.deepEqual(readJournal(s),[]);
  assert.deepEqual(readJournal({getItem(){throw new Error('blocked')}}),[]);
});

test('when everything is found the forest has nothing left to whisper; ?alles opens the menu for testing',()=>{
  const j=new WonderJournal(WONDERS.map(w=>w.id));assert.equal(j.nearest([0,0,0]),null);
  assert.equal(revealAll('?alles'),true);assert.equal(revealAll('?alles=1&x=2'),true);assert.equal(revealAll(''),false);assert.equal(revealAll('?alle'),false);
  const open=new WonderJournal([],{all:true});for(const w of WONDERS)assert.equal(open.knows(w.id),true);assert.equal(open.nearest([0,0,0]),null);
});

test('every wonder has a hidden menu button and a whisper that does not give its name away',()=>{
  const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  for(const w of WONDERS){
    assert.match(html,new RegExp('<button id="'+w.button+'"[^>]* hidden>'),w.button+' starts hidden');
    assert(w.whisper.length>30&&!w.whisper.includes(w.name));
  }
  assert.match(html,/id="whisper"/);
});
