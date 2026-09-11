import assert from 'node:assert/strict';
import * as m from '../dist/puzzle-model.mjs';
assert(m.rootStatus(m.ROOT_SOLUTION).solved);
assert(!m.rootStatus(m.freshState().pipes).solved);
const broken=[...m.ROOT_SOLUTION];broken[5]=m.rotate(broken[5]);assert(!m.rootStatus(broken).solved);
function permutations(a){if(!a.length)return [[]];return a.flatMap((x,i)=>permutations(a.filter((_,j)=>j!==i)).map(p=>[x,...p]))}
assert.deepEqual(permutations([0,1,2,3,4,5]).filter(m.runesSolved),[[0,1,2,3,4,5]]);
const solutions=[];for(let i=0;i<64;i++){const a=Array.from({length:6},(_,j)=>!!(i&(1<<j)));if(m.balanceSolved(a))solutions.push(a)}
assert.deepEqual(solutions,[[true,false,true,true,false,false]]);
const s=m.freshState();s.solved[1]=true;s.pipes=m.ROOT_SOLUTION;s.runes=[0,1,2,3,4,5];s.round=2;
assert.deepEqual(m.restoreState(JSON.stringify(s)),s);
assert.deepEqual(m.restoreState('broken'),m.freshState());
assert.deepEqual(m.restoreState('{"version":1,"pipes":[999]}').pipes,m.freshState().pipes);
console.log('Puzzle rules, unique solutions and saved-progress recovery passed.');
