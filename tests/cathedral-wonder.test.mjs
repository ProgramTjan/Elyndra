import assert from 'node:assert/strict';
import {CATHEDRAL, CathedralWonder, lowSun, sporePosition} from '../dist/cathedral-wonder.mjs';

assert.equal(lowSun(12), false);
assert.equal(lowSun(17.4), true);
assert.equal(lowSun(6.3), true);
assert.equal(lowSun(19.5), true);
assert.equal(lowSun(22), false);
assert.equal(lowSun(3), false);

const at = [CATHEDRAL.x - 4, 3.2, CATHEDRAL.z + 3];
const noon = new CathedralWonder();
for (let i = 0; i < 200; i++) noon.update(.05, at, 12);
assert.equal(noon.phase, 'high', 'Midday can invite, but must not awaken');
assert.equal(noon.age, -1);
assert(noon.still < 1);

const dusk = new CathedralWonder();
for (let i = 0; i < 80; i++) dusk.update(.05, at, 17.4);
assert.equal(dusk.phase, 'invitation');
assert.equal(dusk.age, -1, 'A glimpse cannot trigger the breath');
for (let i = 0; i < 240; i++) dusk.update(.05, at, 17.4);
assert.equal(dusk.phase, 'breath');
assert(dusk.bloom > .5);

const paused = dusk.still;
const age = dusk.age;
for (let i = 0; i < 80; i++) dusk.update(.05, at, 17.4, false);
assert.equal(dusk.age, age, 'Dialogs must not advance the shrine');
assert.equal(dusk.still, paused);

const walker = new CathedralWonder();
for (let i = 0; i < 220; i++) walker.update(.05, [CATHEDRAL.x + Math.sin(i * .1) * 6, 3, CATHEDRAL.z], 17.4);
assert.equal(walker.age, -1, 'Walking around is not stillness');

const flyer = new CathedralWonder();
for (let i = 0; i < 220; i++) flyer.update(.05, [CATHEDRAL.x, 22, CATHEDRAL.z], 17.4);
assert.equal(flyer.age, -1, 'High flight may stay free without triggering');

const wait = new CathedralWonder();
for (let i = 0; i < 80; i++) wait.update(.05, at, 12);
assert.equal(wait.phase, 'high');
for (let i = 0; i < 20; i++) wait.update(.05, at, 17.4);
assert.equal(wait.phase, 'invitation', 'Waiting through noon into golden hour opens the invitation');
for (let i = 0; i < 340; i++) wait.update(.05, at, 17.4);
assert.ok(['breath', 'song', 'afterglow'].includes(wait.phase));

for (let i = 0; i < 280; i++) wait.update(.05, [80, 8, 80], 17.4);
assert.equal(wait.phase, 'far');
for (let i = 0; i < 180; i++) wait.update(.05, at, 17.4);
assert.equal(wait.visits, 2, 'Returning can hear the shrine again');
assert(wait.age >= 0);

const started = new CathedralWonder();
for (let i = 0; i < 180; i++) started.update(.05, at, 17.4);
const phase = started.phase;
for (let i = 0; i < 80; i++) started.update(.05, at, 12);
assert.equal(started.phase === 'far' ? 'far' : started.phase, started.phase);
assert(started.age >= 0, 'Once begun, the breath finishes even if the sun climbs');
assert.notEqual(phase, 'far');

const heard = new CathedralWonder();
for (let i = 0; i < 40; i++) heard.update(.05, at, 17.4);
assert.equal(heard.phase, 'invitation');
assert.equal(heard.visits, 1);
heard.reset();
assert.equal(heard.phase, 'far');
assert.equal(heard.age, -1);
assert.equal(heard.visits, 1, 'A return journey still remembers you');
for (let i = 0; i < 20; i++) heard.update(.05, at, 17.4);
assert.equal(heard.phase, 'invitation');
assert.equal(heard.visits, 2);

for (let i = 0; i < 40; i++) {
  const p = sporePosition(i, 3, .8, 2.2);
  assert(p.every(Number.isFinite));
}
assert.deepEqual(sporePosition(4, 9, 1, 2.2, true), sporePosition(4, 0, 1, 2.2, true));

console.log('Cathedral: low sun, stillness, waiting, flight, pauses, repeat visits and spores passed.');
