import assert from 'node:assert/strict';
import {GATE, GateWonder, dusk, reflectionPosition} from '../dist/gate-wonder.mjs';

assert.equal(dusk(12), false);
assert.equal(dusk(17.4), false);
assert.equal(dusk(19.5), true);
assert.equal(dusk(20.5), true);
assert.equal(dusk(22), false);

const at = [GATE.x, 3.2, GATE.z];

const sleeping = new GateWonder();
for (let i = 0; i < 220; i++) sleeping.update(.05, at, 19.5, false);
assert.equal(sleeping.phase, 'closed', 'Dusk alone cannot open the mirror');
assert.equal(sleeping.age, -1);

const noon = new GateWonder();
for (let i = 0; i < 220; i++) noon.update(.05, at, 12, true);
assert.equal(noon.phase, 'day', 'A waking ring at noon is not yet a mirror');
assert.equal(noon.age, -1);

const duskVisit = new GateWonder();
for (let i = 0; i < 80; i++) duskVisit.update(.05, at, 19.5, true);
assert.equal(duskVisit.phase, 'invitation');
assert.equal(duskVisit.age, -1, 'A glimpse cannot hold the other forest');
for (let i = 0; i < 240; i++) duskVisit.update(.05, at, 19.5, true);
assert.equal(duskVisit.phase, 'mirror');
assert(duskVisit.bloom > .45);

const paused = duskVisit.still;
const age = duskVisit.age;
for (let i = 0; i < 80; i++) duskVisit.update(.05, at, 19.5, true, false);
assert.equal(duskVisit.age, age, 'Dialogs must not advance the mirror');
assert.equal(duskVisit.still, paused);

const walker = new GateWonder();
for (let i = 0; i < 220; i++) walker.update(.05, [GATE.x + Math.sin(i * .1) * 6, 3, GATE.z], 19.5, true);
assert.equal(walker.age, -1, 'Walking around is not stillness');

const flyer = new GateWonder();
for (let i = 0; i < 220; i++) flyer.update(.05, [GATE.x, 24, GATE.z], 19.5, true);
assert.equal(flyer.age, -1, 'High flight may stay free without triggering');

const wait = new GateWonder();
for (let i = 0; i < 80; i++) wait.update(.05, at, 12, true);
assert.equal(wait.phase, 'day');
for (let i = 0; i < 20; i++) wait.update(.05, at, 19.5, true);
assert.equal(wait.phase, 'invitation', 'Waiting through noon into dusk opens the invitation');
for (let i = 0; i < 340; i++) wait.update(.05, at, 19.5, true);
assert.ok(['mirror', 'afterglow'].includes(wait.phase));

const begun = new GateWonder();
for (let i = 0; i < 180; i++) begun.update(.05, at, 19.5, true);
assert(begun.age >= 0);
for (let i = 0; i < 80; i++) begun.update(.05, at, 12, false);
assert.notEqual(begun.phase, 'far');
assert(begun.age >= 0, 'Once begun, the mirror finishes even if the ring sleeps');

for (let i = 0; i < 280; i++) wait.update(.05, [80, 8, 80], 19.5, true);
assert.equal(wait.phase, 'far');
for (let i = 0; i < 180; i++) wait.update(.05, at, 19.5, true);
assert.equal(wait.visits, 2, 'Returning can see the other forest again');
assert(wait.age >= 0);

const heard = new GateWonder();
for (let i = 0; i < 40; i++) heard.update(.05, at, 19.5, true);
assert.equal(heard.visits, 1);
heard.reset();
assert.equal(heard.phase, 'far');
assert.equal(heard.age, -1);
assert.equal(heard.visits, 1);
for (let i = 0; i < 20; i++) heard.update(.05, at, 19.5, true);
assert.equal(heard.phase, 'invitation');
assert.equal(heard.visits, 2);

for (let i = 0; i < 40; i++) {
  const p = reflectionPosition(i, 3, .8, 10);
  assert(p.every(Number.isFinite));
}
assert.deepEqual(reflectionPosition(4, 9, 1, 10, true), reflectionPosition(4, 0, 1, 10, true));

console.log('Gate: dusk, waking ring, stillness, waiting, flight, pauses, repeat visits and reflections passed.');
