import assert from 'node:assert/strict';
import {GARDENS, HOVER, ISLANDS, STREAMS, GardenDew, dewFromSky, dropPosition, lanternHour, seedKeeper} from '../dist/garden-dew.mjs';
import {Atmosphere} from '../dist/atmosphere.mjs';

assert.equal(dewFromSky({wet: 0}), 0, 'A clear sky leaves the gardens dry');
assert.equal(dewFromSky({wet: .08}), 0, 'Mist alone is not dew');
assert(dewFromSky({wet: .82}) > .9, 'After rain the gardens are full');
assert.equal(lanternHour(22), true);
assert.equal(lanternHour(12), false);

for (const [x, y, z, r] of ISLANDS) assert(Math.hypot(HOVER[0] - x, HOVER[2] - z) > r + 1, 'The hover point stays between islands, not inside one');

const wetSky = {hour: 12, wet: .8, phase: 'afterglow'};
const drySky = {hour: 12, wet: 0, phase: 'clear'};
const at = [...HOVER];

const dry = new GardenDew();
for (let i = 0; i < 260; i++) dry.update(.05, at, drySky, true);
assert.equal(dry.phase, 'dry', 'Without rain the gardens only wait');
assert.equal(dry.age, -1);

const walker = new GardenDew();
for (let i = 0; i < 260; i++) walker.update(.05, [GARDENS.x, 3, GARDENS.z], wetSky, false);
assert.equal(walker.phase, 'far', 'Below the islands nothing is asked of you');
assert(walker.snapshot([GARDENS.x, 3, GARDENS.z]).falls > .1, 'From the ground the waterfalls are still visible after rain');

const restless = new GardenDew();
for (let i = 0; i < 260; i++) restless.update(.05, [HOVER[0] + Math.sin(i * .2) * 8, HOVER[1], HOVER[2]], wetSky, true);
assert.equal(restless.phase, 'invitation');
assert.equal(restless.age, -1, 'Flying around is not hovering still');

const visit = new GardenDew();
for (let i = 0; i < 60; i++) visit.update(.05, at, wetSky, true);
assert.equal(visit.phase, 'invitation');
assert.equal(visit.age, -1, 'A glimpse cannot wake the dew');
const before = visit.snapshot(at).falls;
for (let i = 0; i < 100; i++) visit.update(.05, at, wetSky, true, true, [0, -1]);
assert(visit.age >= 0);
assert.deepEqual(visit.origin, at);
assert.deepEqual(visit.anchor, [at[0], at[1], at[2] - 7], 'The keepers cross the path ahead of your gaze');
for (let i = 0; i < 260; i++) visit.update(.05, at, wetSky, true);
assert.equal(visit.phase, 'seeding');
assert(visit.snapshot(at).falls > before * 1.8, 'Stillness lets the islands release more water');

const paused = visit.age;
for (let i = 0; i < 60; i++) visit.update(.05, at, wetSky, true, false);
assert.equal(visit.age, paused, 'Dialogs must not advance the dew');

let ahead = Infinity, visitor = Infinity;
for (let age = 0; age < 40; age += .1) {
  for (let i = 0; i < 4; i++) {
    const keeper = seedKeeper(i, {...visit.snapshot(at), age}, false);
    assert(keeper.position.every(Number.isFinite));
    if (!keeper.flying) continue;
    ahead = Math.min(ahead, Math.hypot(...keeper.position.map((v, k) => v - visit.anchor[k])));
    visitor = Math.min(visitor, Math.hypot(...keeper.position.map((v, k) => v - at[k])));
  }
}
assert(ahead < 3, 'The keepers cross the path just ahead of you');
assert(visitor > 2.5, 'They never fly through the visitor');
for (let i = 0; i < 4; i++) assert.equal(seedKeeper(i, {...visit.snapshot(at), age: 40}).progress, 1, 'Every keeper reaches its island');
assert.equal(seedKeeper(0, {...visit.snapshot(at), age: 14.5}).greeting, false, 'A first visit has no greeting');

for (let i = 0; i < 400; i++) visit.update(.05, at, wetSky, true);
assert.equal(visit.phase, 'afterglow');
for (let i = 0; i < 340; i++) visit.update(.05, [60, 4, 60], wetSky, false);
assert.equal(visit.phase, 'far');
for (let i = 0; i < 160; i++) visit.update(.05, at, wetSky, true);
assert.equal(visit.visits, 2, 'Returning can wake the dew again');
assert(visit.age >= 0);
const greeter = [];
for (let age = 0; age < 30; age += .1) {
  const keeper = seedKeeper(0, {...visit.snapshot(at), age});
  if (keeper.greeting) greeter.push(Math.hypot(...keeper.position.map((v, k) => v - at[k])));
}
assert(greeter.length > 20, 'On a return one keeper stops and waits');
assert(Math.max(...greeter) < 5 && Math.min(...greeter) > 2, 'It waits close, but not in your face');

const drying = new GardenDew();
for (let i = 0; i < 40; i++) drying.update(.05, at, wetSky, true);
assert.equal(drying.phase, 'invitation');
for (let i = 0; i < 20; i++) drying.update(.05, at, drySky, true);
assert.equal(drying.phase, 'dry', 'If the dew is gone before waking, the invitation fades');

assert(STREAMS.length >= 10);
for (const stream of STREAMS) for (let j = 0; j < 20; j++) {
  const d = dropPosition(stream, j, 20, 4.2);
  assert(d.position.every(Number.isFinite));
  assert(d.position[1] <= stream.y + .001);
}
assert.deepEqual(dropPosition(STREAMS[0], 3, 20, 9, true), dropPosition(STREAMS[0], 3, 20, 0, true), 'Reduced motion holds the drops still');

const sky = new Atmosphere({weather: 'clear'});
assert.equal(sky.afterRain(), true);
assert(dewFromSky(sky.snapshot()) > .5, 'Travelling to the dew brings a visit that just had rain');
assert.equal(sky.snapshot().phase, 'afterglow');
const chosen = new Atmosphere({preference: 'clear'});
assert.equal(chosen.afterRain(), false, 'A chosen sky stays as the visitor set it');
assert.equal(chosen.snapshot().weather, 'clear');

console.log('Dew: rain condition, hovering stillness, waterfalls, crossing keepers, return greeting, pauses and chosen weather passed.');
