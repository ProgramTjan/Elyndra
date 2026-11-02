import assert from 'node:assert/strict';
import {DWELLERS, FOX, GATE_RING, KEEPER, OWL_PERCH, RareDwellers, afterRain, along, dawn, leaflingRoute, night, readMet, routeLength, saveMet, sparkPositions} from '../dist/rare-dwellers.mjs';

const ground = (x, z) => Math.sin(x * .05) * 1.5 + Math.cos(z * .04);
const run = (world, seconds, viewer, ctx, enabled = true) => {
  let s;
  for (let i = 0; i < seconds * 20; i++) s = world.update(.05, typeof viewer === 'function' ? viewer(i) : viewer, ctx, enabled);
  return s;
};

assert.equal(dawn(6), true); assert.equal(dawn(9), false);
assert.equal(night(23), true); assert.equal(night(3), true); assert.equal(night(19), false);
assert.equal(afterRain({wet: .8, rain: .1}), true);
assert.equal(afterRain({wet: .5, rain: .86}), false, 'While it pours, the leafling stays in its nest');
assert.equal(afterRain({wet: 0, rain: 0}), false);

const path = [[0, 0, 0], [3, 0, 4], [3, 0, 10]];
assert.equal(routeLength(path), 11);
assert.deepEqual(along(path, 5).position, [3, 0, 4]);
assert.deepEqual(along(path, 99).position, [3, 0, 10]);

// Root fox: dawn, on foot, near the cathedral path.
const foxSpot = [FOX.dig[0] + 2, 3, FOX.dig[1] + 14];
const foxView = {hour: 6, facing: [0, -1]};
const noon = new RareDwellers(ground);
run(noon, 30, foxSpot, {...foxView, hour: 12});
assert.equal(noon.fox.phase, 'waiting', 'The fox does not come at noon');

const dawnVisit = new RareDwellers(ground);
let s = run(dawnVisit, 2, foxSpot, foxView);
assert.equal(s.fox.phase, 'present');
const pose = dawnVisit.pose('fox');
assert.equal(pose.bones.length, 8);
assert(pose.bones.flat().every(Number.isFinite));
assert(Math.abs(pose.position[1] - ground(pose.position[0], pose.position[2])) < 1e-9, 'The fox walks on the ground');
let met = null;
for (let i = 0; i < 400; i++) { s = dawnVisit.update(.05, foxSpot, foxView); if (s.justMet) met = s.justMet; }
assert.equal(met, 'fox', 'Watching the fox lets you meet him');
assert(dawnVisit.pose('fox').spring > .5, 'Where he digs, water wells up');
run(dawnVisit, 20, foxSpot, foxView);
assert.equal(dawnVisit.fox.phase, 'waiting', 'He leaves again');
run(dawnVisit, 30, foxSpot, foxView);
assert.equal(dawnVisit.fox.phase, 'waiting', 'Once per dawn');
run(dawnVisit, 5, foxSpot, {...foxView, hour: 12});
run(dawnVisit, 1, foxSpot, foxView);
assert.equal(dawnVisit.fox.phase, 'present', 'A new dawn may bring him back');

const turned = new RareDwellers(ground);
run(turned, 12, foxSpot, {...foxView, facing: [0, 1]});
assert.equal(turned.fox.met, false, 'Looking away is not meeting');

const flyer = new RareDwellers(ground);
run(flyer, 10, foxSpot, {...foxView, flying: true});
assert.equal(flyer.fox.phase, 'waiting', 'He does not show himself to flyers');

const runner = new RareDwellers(ground);
run(runner, 3, foxSpot, foxView);
s = run(runner, 1, i => [foxSpot[0], 3, foxSpot[2] - i * .6], foxView);
assert(s.fox.leaving && s.fox.spooked, 'Running sends him away');
run(runner, 12, foxSpot, foxView);
assert.equal(runner.fox.phase, 'waiting');

// Silver wing: night, the ring awake, the visitor near the gate.
const gateSpot = [GATE_RING.x, ground(GATE_RING.x, GATE_RING.z + 16) + 2.4, GATE_RING.z + 16];
const owlView = {hour: 22, portal: true, facing: [-.99, -.14]};
const sleeping = new RareDwellers(ground);
run(sleeping, 20, gateSpot, {...owlView, portal: false});
assert.equal(sleeping.owl.phase, 'waiting', 'A sleeping ring keeps her away');
const owlNight = new RareDwellers(ground);
run(owlNight, 10, gateSpot, owlView);
const perched = owlNight.pose('owl');
assert.equal(perched.bones.length, 5);
assert(perched.perched > .9, 'She lands on a lantern post');
assert(Math.hypot(perched.position[0] - OWL_PERCH.x, perched.position[2] - OWL_PERCH.z) < .01);
assert(Math.abs(perched.position[1] - ground(OWL_PERCH.x, OWL_PERCH.z) - OWL_PERCH.top - .61) < .05, 'at the height of the lamp');
s = run(owlNight, 4, gateSpot, owlView);
assert(owlNight.owl.met);
let throughRing = false, faded = false;
for (let i = 0; i < 400; i++) {
  owlNight.update(.05, gateSpot, owlView);
  if (owlNight.owl.phase !== 'present') break;
  const p = owlNight.pose('owl');
  if (Math.abs(p.position[0] - GATE_RING.x) < 2 && Math.abs(p.position[2] - GATE_RING.z) < 2.5 && Math.abs(p.position[1] - ground(GATE_RING.x, GATE_RING.z) - GATE_RING.rise) < 2.5) throughRing = true;
  if (p.fade < .05) faded = true;
}
assert(throughRing, 'She leaves through the light');
assert(faded, 'and is gone on the other side');

// Leafling: after rain, calm before the keeper.
const keeperSpot = [KEEPER.x - 6, 3, KEEPER.z + 16];
const wet = {hour: 14, wet: .8, rain: .05, phase: 'afterglow', facing: [0, -1], keeperLift: .03};
const dry = new RareDwellers(ground);
run(dry, 20, keeperSpot, {...wet, wet: 0});
assert.equal(dry.leafling.phase, 'waiting');
const restless = new RareDwellers(ground);
run(restless, 20, i => [keeperSpot[0] + Math.sin(i * .3) * 3, 3, keeperSpot[2]], wet);
assert.equal(restless.leafling.phase, 'waiting', 'It waits until you are calm');
const calm = new RareDwellers(ground);
run(calm, 3.2, keeperSpot, wet);
assert.equal(calm.leafling.phase, 'present');
const route = leaflingRoute(ground);
assert(Math.hypot(...calm.pose('leafling').position.map((v, k) => v - route.points[0][k])) < .2, 'It starts in its nest on the shoulder');
run(calm, 10, keeperSpot, wet);
const drinking = calm.pose('leafling');
assert.equal(drinking.bones.length, 10);
assert(drinking.position[1] - ground(drinking.position[0], drinking.position[2]) < .6, 'It comes down to the puddle');
assert(calm.leafling.met);
let home = false;
for (let i = 0; i < 600 && calm.leafling.phase === 'present'; i++) {
  calm.update(.05, keeperSpot, wet);
  const p = calm.pose('leafling').position;
  if (Math.hypot(...p.map((v, k) => v - route.points[0][k])) < .5) home = true;
}
assert(home, 'It climbs back to its nest');
assert.equal(calm.leafling.phase, 'waiting');

const startled = new RareDwellers(ground);
run(startled, 9, keeperSpot, wet);
const low = startled.pose('leafling').position;
s = run(startled, .5, [low[0] + 1, 3, low[2] + 1], wet);
assert(s.leafling.spooked, 'Coming too close sends it home');

// Pauses, memory and the visions.
const paused = new RareDwellers(ground);
run(paused, 3, foxSpot, foxView);
const t = paused.fox.time;
run(paused, 5, foxSpot, foxView, false);
assert.equal(paused.fox.time, t, 'Dialogs must not advance them');

const store = new Map();
const storage = {getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v)};
saveMet(storage, new Set(['fox', 'owl']));
assert.deepEqual([...readMet(storage)], ['fox', 'owl']);
store.set('elyndra-met-dwellers', '{broken');
assert.equal(readMet(storage).size, 0);
assert.equal(readMet(null).size, 0);
const remembered = new RareDwellers(ground, new Set(['fox']));
let again = null;
for (let i = 0; i < 300; i++) { const r = remembered.update(.05, foxSpot, foxView); if (r.noticed) again = r.noticed; assert.equal(r.justMet, null); }
assert.deepEqual(again, {id: 'fox', again: true}, 'A known fox is recognised, not met anew');
for (const d of Object.values(DWELLERS)) assert(d.name && d.met && Number.isInteger(d.scene) && Number.isInteger(d.point));

const reducedA = new RareDwellers(ground), reducedB = new RareDwellers(ground);
run(reducedA, 8, foxSpot, foxView); run(reducedB, 8, foxSpot, foxView);
reducedB.clock += 5;
assert.deepEqual(reducedA.pose('fox', true).bones, reducedB.pose('fox', true).bones, 'Reduced motion holds still poses');
run(reducedA, 5, foxSpot, foxView);
for (const sp of sparkPositions({fox: reducedA.pose('fox')}, 3)) assert(sp.p.every(Number.isFinite));

console.log('Dwellers: dawn fox, night owl through the ring, leafling after rain, shyness, once per window, memory and pauses passed.');
