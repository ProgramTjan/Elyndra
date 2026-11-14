import assert from 'node:assert/strict';
import * as m from '../dist/puzzle-model.mjs';
// Vier ritmes, vier plekken, vier spellen in de wereld.
for(const list of [m.TITLES,m.PLACES,m.GAMES])assert.equal(list.length,4);
assert.deepEqual(m.TITLES,['Het water','Het licht','De adem','De stem']);
// Een verse stand heeft precies de vorm die andere code en oude versies verwachten.
assert.deepEqual(m.freshState(),{version:1,solved:[false,false,false,false],hints:[0,0,0,0]});
assert.notEqual(m.freshState().solved,m.freshState().solved,'every fresh state is its own copy');
// Een oude save met puzzelvelden laadt: alleen `solved` telt, de rest valt weg.
const old={version:1,solved:[true,false,true,false],hints:[3,1,0,2],pipes:[1,2,3],runes:[0,1,2,3,4,5],stones:[true,false,true,true,false,false],round:2,sequence:[1,3,0,2,1,0,3]};
assert.deepEqual(m.restoreState(JSON.stringify(old)),{version:1,solved:[true,false,true,false],hints:[0,0,0,0]});
const s=m.freshState();s.solved[3]=true;assert.deepEqual(m.restoreState(JSON.stringify(s)),s);
// Kapotte of vreemde saves vallen terug op het begin.
for(const raw of ['broken',null,'','null','[]','{"version":2,"solved":[true,true,true,true]}','{"version":1,"solved":"yes"}'])assert.deepEqual(m.restoreState(raw),m.freshState(),String(raw));
assert.deepEqual(m.restoreState('{"version":1,"solved":[1,"true",true]}').solved,[false,false,true,false],'only real booleans count');
console.log('Rhythm model: fresh shape, old saves with puzzle fields, corrupt saves.');
