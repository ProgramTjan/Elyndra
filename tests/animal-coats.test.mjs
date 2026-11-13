import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createDwellerMeshes} from '../dist/rare-dwellers.mjs';
import {createSquirrelSculptures} from '../dist/squirrel-sculpture.mjs';

const kit=(extra={})=>{let uploads=0;const noop=()=>{};return {helpers:{orb:noop,cone:noop,beam:noop,curveTube:noop,tri:noop,material:noop,upload:()=>({id:++uploads}),...extra},count:()=>uploads};};

test('fox, owl and squirrel grow a coat when the world offers fur tufts',()=>{
  const calls=[];const fur=(...a)=>calls.push(a);
  createDwellerMeshes(kit({ruff:fur}).helpers,()=>0);const dwellers=calls.length;
  assert(dwellers>=20,'fox and owl ask for tufts, got '+dwellers);
  createSquirrelSculptures(kit({ruff:fur}).helpers);assert(calls.length>dwellers+10,'the living squirrel gets a bottlebrush tail');
  for(const c of calls){assert(c.slice(0,8).every(Number.isFinite),'tuft placement is numeric');assert(c[6]>0&&c[7]>0&&c[8].length===3);}
});

test('the creatures still build when no fur helper is passed',()=>{
  const a=kit(),b=kit();createDwellerMeshes(a.helpers,()=>0);createSquirrelSculptures(b.helpers);assert(a.count()>0&&b.count()>0);
});

test('the pelt shading only touches boned creatures and leaves their glowing parts alone',()=>{
  const src=fs.readFileSync(new URL('../dist/shaders.mjs',import.meta.url),'utf8');
  assert.match(src,/F=bone>=0\.\?1\.:0\./);assert.match(src,/float pelt=F\*\(1\.-glow\)/);
  assert.match(src,/else if\(F<\.5&&lite<\.5&&glow<\.5&&C\.r>C\.g\*1\.12/,'wood grain no longer runs over russet fur');
});
