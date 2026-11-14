import {IDENTITY,multiply} from './deer-motion.mjs?v=story52';
import {joint} from './wildlife-motion.mjs?v=story52';

// Three inhabitants of the visions who sometimes step into the valley itself:
// the root fox at dawn, the silver wing at night by the waking gate, and the
// leafling after rain. Each comes once per window, only while you stay gentle.
export const DWELLERS = Object.freeze({
  fox: Object.freeze({scene: 0, point: 1, name: 'De wortelvos', met: 'Je zag hem bij dageraad, voor de wortelkathedraal. Waar hij groef, welde water op.'}),
  owl: Object.freeze({scene: 1, point: 2, name: 'De zilvervleugel', met: 'Je zag haar in de nacht op de lichtpoort, voordat ze door het licht vloog.'}),
  leafling: Object.freeze({scene: 3, point: 1, name: 'Het bladortje', met: 'Je zag het na de regen langs de arm van de moswachter naar beneden klimmen.'})
});
export const STORAGE_KEY = 'elyndra-met-dwellers';
export const SPRING_KEY = 'elyndra-fox-spring-v1';
export function readSpring(storage) { try { return storage?.getItem(SPRING_KEY) === 'found'; } catch { return false; } }
export function saveSpring(storage) { try { storage?.setItem(SPRING_KEY, 'found'); } catch {} }
export const FOX_WATCH = Object.freeze([-45, -26]);
// Just in front of the fox's digging paws; shared by the water and its glints.
export function springPosition(ground) { return [-46.39, ground(-46.39, -40.10) + .08, -40.10]; }
export const FOX = Object.freeze({from: [-64, -36], dig: [-47, -40], exit: [-27, -50]});
export const KEEPER = Object.freeze({x: 86, z: 36});
export const GATE_RING = Object.freeze({x: 66, z: -110, rise: 12, radius: 12});
// She rests on a lantern post along the approach, low enough to meet her eyes.
export const OWL_PERCH = Object.freeze({x: 59, z: -95, top: 2.58});

const clamp = x => Math.max(0, Math.min(1, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const wrap = h => ((h % 24) + 24) % 24;
export const dawn = hour => { const h = wrap(hour); return h >= 5 && h < 7.5; };
export const night = hour => { const h = wrap(hour); return h >= 20.6 || h < 5; };
export const afterRain = (sky = {}) => (sky.wet ?? 0) > .45 && (sky.rain ?? 0) < .35;

export function readMet(storage) {
  try {
    const list = JSON.parse(storage?.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(list) ? list.filter(id => id in DWELLERS) : []);
  } catch { return new Set(); }
}
export function saveMet(storage, met) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify([...met])); } catch {}
}

// Walk a polyline by distance, so routes keep an even pace.
export function along(points, distance) {
  let left = Math.max(0, distance);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(...b.map((v, k) => v - a[k]));
    if (left <= length || i === points.length - 1) {
      const t = length ? Math.min(1, left / length) : 1;
      return {position: lerp(a, b, t), direction: length ? b.map((v, k) => (v - a[k]) / length) : [0, 0, -1], segment: i - 1};
    }
    left -= length;
  }
  return {position: [...points[0]], direction: [0, 0, -1], segment: 0};
}
export const routeLength = points => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(...p.map((v, k) => v - points[i][k])), 0);
// Creatures are modelled small and scaled up at the root, so they read at walking distance.
export const SIZE = Object.freeze({fox: 1.2, owl: 2.1, leafling: 1.9});
const grow = (m, s) => multiply(m, [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1]);
const headingOf = (dx, dz, fallback = 0) => Math.hypot(dx, dz) > 1e-4 ? Math.atan2(-dx, -dz) : fallback;
const turn = (from, to) => { let d = to - from; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

// The leafling's way down: moss nest, shoulder, upper arm, elbow, hand, then the hanging vine.
export function leaflingRoute(ground) {
  const {x, z} = KEEPER, gy = ground(x, z), vineX = x - 8, vineZ = z + 4.6, foot = ground(vineX, vineZ);
  const puddle = [x - 9, 0, z + 15];
  puddle[1] = ground(puddle[0], puddle[2]);
  return {
    gy, vine: [vineX, vineZ], puddle,
    points: [
      [x - 4.6, gy + 18.5, z + .4], [x - 5, gy + 18.1, z + .3], [x - 6.5, gy + 15.4, z + 1.1],
      [x - 8, gy + 11.6, z + 2.1], [x - 8, gy + 9.3, z + 3.4], [vineX, gy + 8.2, vineZ + .35],
      [vineX, foot + .45, vineZ + .35], [x - 8.6, ground(x - 8.6, z + 8) + .45, z + 8], [puddle[0] + .3, puddle[1] + .45, puddle[2] - 1.1]
    ]
  };
}

class Dweller {
  constructor(id, met) {
    this.id = id; this.met = met; this.used = false;
    this.phase = 'waiting'; this.time = 0; this.leaveAt = Infinity; this.leaveFrom = null;
    this.seen = 0; this.calm = 0; this.metNow = false; this.noticed = false; this.noticedNow = false; this.spooked = false;
  }
  start() { this.used = true; this.phase = 'present'; this.time = 0; this.leaveAt = Infinity; this.leaveFrom = null; this.seen = 0; this.noticed = false; this.spooked = false; }
  stop() { this.phase = 'waiting'; this.time = 0; this.leaveAt = Infinity; this.leaveFrom = null; }
}

export class RareDwellers {
  constructor(ground, met = new Set(), springFound = false) {
    this.springFound = springFound; this.springNow = false;
    this.ground = ground;
    this.metSet = new Set(met);
    this.fox = new Dweller('fox', this.metSet.has('fox'));
    this.owl = new Dweller('owl', this.metSet.has('owl'));
    this.leafling = new Dweller('leafling', this.metSet.has('leafling'));
    this.previous = null; this.speed = 0; this.clock = 0; this.lift = 0;
    this.gateY = ground(GATE_RING.x, GATE_RING.z);
    this.perchY = ground(OWL_PERCH.x, OWL_PERCH.z);
    this.leafRoute = leaflingRoute(ground);
    this.foxRoute = [[FOX.from[0], 0, FOX.from[1]], [FOX.dig[0] - 2.4, 0, FOX.dig[1] + .4], [FOX.dig[0], 0, FOX.dig[1]]]
      .map(p => [p[0], ground(p[0], p[2]), p[2]]);
  }
  get all() { return [this.fox, this.owl, this.leafling]; }
  // An explicit journey from the vision starts a fresh dawn encounter.
  visitFox(viewer) {
    this.fox.stop(); this.fox.used = false;
    this.previous = [...viewer]; this.speed = 0;
  }
  update(dt, viewer, ctx = {}, enabled = true) {
    this.springNow = false;
    dt = Math.min(.05, Math.max(0, dt));
    for (const d of this.all) d.metNow = d.noticedNow = false;
    if (!enabled) { this.previous = [...viewer]; return this.snapshot(viewer, ctx); }
    this.clock += dt;
    const step = this.previous ? Math.hypot(viewer[0] - this.previous[0], viewer[2] - this.previous[2]) : 0;
    const speed = this.previous && dt > 0 ? step / Math.max(dt, 1 / 30) : 0;
    this.speed += (speed - this.speed) * (1 - Math.exp(-dt * 6));
    this.previous = [...viewer];
    this.lift = ctx.keeperLift ?? 0;
    const hour = ctx.hour ?? 12, flying = !!ctx.flying;
    const running = this.speed > 9.5;
    const facing = ctx.facing ?? null;

    // Root fox: dawn, on foot, near the cathedral path.
    if(!ctx.foxReserved)this.advance(this.fox, dt, {
      window: dawn(hour),
      ready: !flying && Math.hypot(viewer[0] - FOX.dig[0], viewer[2] - FOX.dig[1]) < 46,
      duration: 22, stay: 16,
      shy: (pose) => running || Math.hypot(viewer[0] - pose.position[0], viewer[2] - pose.position[2]) < 6
    }, viewer, facing);
    if (!ctx.foxReserved && !this.springFound && this.fox.phase === 'present' && this.fox.time >= 12.8 && !this.fox.spooked) {
      this.springFound = this.springNow = true;
    }
    // Silver wing: night, the ring awake, the visitor near the gate.
    this.advance(this.owl, dt, {
      window: night(hour) && !!ctx.portal,
      ready: Math.hypot(viewer[0] - GATE_RING.x, viewer[2] - GATE_RING.z) < 48,
      duration: 27, stay: 21,
      shy: (pose) => Math.hypot(...pose.position.map((v, k) => v - viewer[k])) < 4.5
    }, viewer, facing);
    // Leafling: after rain, a visitor standing calmly before the keeper.
    const nearKeeper = !flying && Math.hypot(viewer[0] - KEEPER.x, viewer[2] - (KEEPER.z + 8)) < 26;
    this.leafling.calm = nearKeeper && this.speed < 1.2 ? this.leafling.calm + dt : Math.max(0, this.leafling.calm - dt);
    this.advance(this.leafling, dt, {
      window: afterRain(ctx),
      ready: nearKeeper && this.leafling.calm > 3,
      duration: 28, stay: 18,
      shy: (pose) => running || Math.hypot(viewer[0] - pose.position[0], viewer[2] - pose.position[2]) < 3
    }, viewer, facing);
    return this.snapshot(viewer, ctx);
  }
  advance(d, dt, rule, viewer, facing) {
    if (d.phase === 'waiting') {
      if (!rule.window) d.used = false;
      else if (!d.used && rule.ready) d.start();
      return;
    }
    d.time += dt;
    const pose = this.pose(d.id);
    if (d.leaveAt === Infinity && (d.time >= rule.stay || (rule.shy(pose) && d.time > 1))) {
      d.spooked = d.time < rule.stay;
      d.leaveAt = d.time; d.leaveFrom = [...pose.position];
    }
    const end = d.leaveAt === Infinity ? rule.duration : d.leaveAt + this.leaveTime(d);
    // Only a creature actually in view, close enough to recognise, counts as met.
    const to = pose.position.map((v, k) => v - viewer[k]), distance = Math.hypot(...to), flat = Math.hypot(to[0], to[2]) || 1;
    const inView = !facing || distance < 8 || (facing[0] * to[0] + facing[1] * to[2]) / flat > .55;
    if (pose.fade > .5 && distance < 50 && inView) d.seen += dt;
    if (!d.noticed && d.seen >= 2.5) {
      d.noticed = d.noticedNow = true;
      if (!d.met) { d.met = d.metNow = true; this.metSet.add(d.id); }
    }
    if (d.time >= end) d.stop();
  }
  leaveTime(d) {
    const from = d.leaveFrom ?? [0, 0, 0];
    if (d.id === 'fox') return Math.max(2.5, Math.hypot(FOX.exit[0] - from[0], FOX.exit[1] - from[2]) / (d.spooked ? 6 : 3)) + 1.2;
    if (d.id === 'owl') return d.spooked ? 4 : 6;
    return Math.max(3, this.leafProgress(d) / (d.spooked ? 2.6 : 1.4)) + 1.2;
  }
  leafProgress(d) {
    // Distance already travelled down the route at the moment it turns back.
    const route = this.leafRoute.points, total = routeLength(route);
    return Math.min(1, ease((Math.min(d.leaveAt, 9.5) - 1.5) / 8)) * total;
  }
  // Poses in world space; each returns bones for the shared animal skeleton.
  pose(id, reduced = false) {
    const d = this[id];
    if (id === 'fox') return foxPose(d, this.foxRoute, this.ground, this.previous, this.clock, reduced);
    if (id === 'owl') return owlPose(d, this.gateY, this.previous, this.clock, reduced, this.perchY);
    return leaflingPose(d, this.leafRoute, this.ground, this.previous, this.clock, this.lift, reduced, this.leafProgress(d));
  }
  snapshot(viewer, ctx = {}) {
    const out = {};
    for (const d of this.all) {
      out[d.id] = {phase: d.phase, time: d.time, met: d.met, metNow: d.metNow, noticedNow: d.noticedNow, seen: d.seen, used: d.used, leaving: d.leaveAt !== Infinity, spooked: d.spooked};
    }
    out.springFound = this.springFound; out.springNow = this.springNow;
    out.met = [...this.metSet];
    out.justMet = this.all.find(d => d.metNow)?.id ?? null;
    const noticed = this.all.find(d => d.noticedNow);
    out.noticed = noticed ? {id: noticed.id, again: !noticed.metNow} : null;
    return out;
  }
}

// ---------- poses ----------

function look(viewer, position, heading, limit = 1.1) {
  if (!viewer) return 0;
  const want = headingOf(viewer[0] - position[0], viewer[2] - position[2], heading);
  return Math.max(-limit, Math.min(limit, turn(heading, want)));
}

export function foxPose(d, route, ground, viewer, clock, reduced = false) {
  const t = d.time, total = routeLength(route);
  let position, heading, gait = 0, listen = 0, dig = 0, sit = 0, gaze = 0, fade = 1, spring = 0;
  if (d.leaveAt === Infinity || t < d.leaveAt) {
    const walk = ease(Math.min(1, t / 6));
    const at = along(route, walk * total);
    position = at.position; heading = headingOf(at.direction[0], at.direction[2]);
    gait = t < 6 ? 1 - ease((t - 5) / 1) : 0;
    listen = ease((t - 6) / .8) * (1 - ease((t - 9.6) / .6));
    dig = ease((t - 10) / .4) * (1 - ease((t - 12.8) / .4));
    sit = ease((t - 13.2) / .8);
    gaze = sit;
    fade = ease(t / 1.4);
  } else {
    const from = d.leaveFrom, exit = [FOX.exit[0], 0, FOX.exit[1]];
    const span = Math.max(2.5, Math.hypot(exit[0] - from[0], exit[2] - from[2]) / (d.spooked ? 6 : 3));
    const s = ease((t - d.leaveAt) / span);
    position = lerp(from, exit, s);
    heading = headingOf(exit[0] - from[0], exit[2] - from[2]);
    gait = d.spooked ? 1.6 : 1;
    fade = 1 - ease((t - d.leaveAt - span + .4) / 1.2);
  }
  if (d.time >= 11 && d.leaveAt >= 11) spring = ease((d.time - 11) / 2) * (d.phase === 'waiting' ? 0 : 1);
  position = [position[0], ground(position[0], position[2]), position[2]];
  return poseRootFox({position,heading,gait,listen,dig,sit,gaze,fade,spring},ground,viewer,clock,reduced);
}

export function poseRootFox(state,ground,viewer,clock,reduced=false){
  const {position,heading,gait=0,listen=0,dig=0,sit=0,gaze=0,fade=1,spring=0}=state;
  const time = reduced ? 0 : clock;
  const stride = reduced ? 0 : Math.sin(time * 9 * Math.max(1, gait)) * .55 * Math.min(1, gait);
  const bob = reduced ? 0 : Math.abs(Math.sin(time * 9)) * .035 * Math.min(1, gait);
  const root = grow(joint(IDENTITY, [position[0], position[1] + (.47 + bob - sit * .12) * SIZE.fox, position[2]], heading), SIZE.fox);
  const body = joint(root, [0, 0, 0], sit * .32 - listen * .12 - dig * .18, 'x');
  const turnHead = (gaze ? look(viewer, position, heading, 1) * gaze : 0) + (reduced ? 0 : Math.sin(time * .9) * .08 * (1 - gaze));
  let head = joint(body, [0, .18, -.5], turnHead);
  head = joint(head, [0, 0, 0], -listen * .75 - dig * .55 + (reduced ? 0 : Math.sin(time * 6) * .05 * dig), 'x');
  head = joint(head, [0, 0, 0], listen * .45, 'z');
  let tail = joint(body, [0, .05, .46], reduced ? 0 : Math.sin(time * 2.2) * .18, 'y');
  tail = joint(tail, [0, 0, 0], .25 + sit * .5, 'x');
  const tip = joint(tail, [0, -.12, .5], reduced ? 0 : Math.sin(time * 2.2 - .8) * .22, 'y');
  const legs = [];
  for (const [side, front] of [[-1, true], [1, true], [-1, false], [1, false]]) {
    const pair = (side < 0) === front ? 1 : -1;
    let swing = stride * pair;
    if (front && dig) swing = reduced ? -.6 : -.6 + Math.sin(time * 14 + side) * .5 * dig;
    if (!front && sit) swing = swing * (1 - sit) + sit * 1.15;
    if (front && sit) swing = swing * (1 - sit) - sit * .25;
    legs.push(joint(body, [side * .12, -.08, front ? -.32 : .32], swing, 'x'));
  }
  const springAt = springPosition(ground);
  return {bones: [body, head, tail, tip, ...legs], position, heading, fade, spring, dig, springAt};
}

export function owlPose(d, gateY, viewer, clock, reduced = false, perchY = gateY) {
  const t = d.time, ringTop = [OWL_PERCH.x, perchY + OWL_PERCH.top + .29 * SIZE.owl, OWL_PERCH.z];
  // She comes in high from behind the visitor, crosses before the ring, and settles on the lamp.
  const arrive = [GATE_RING.x + 30, gateY + 36, GATE_RING.z + 60], bend = [GATE_RING.x + 8, gateY + 18, GATE_RING.z + 6];
  const through = [GATE_RING.x, gateY + GATE_RING.rise, GATE_RING.z - 2], beyond = [GATE_RING.x, gateY + GATE_RING.rise - 1, GATE_RING.z - 18];
  const quad = (a, c, b, s) => [0, 1, 2].map(k => (1 - s) * (1 - s) * a[k] + 2 * s * (1 - s) * c[k] + s * s * b[k]);
  let position, ahead, perched = 0, fade = 1, flap = 0;
  const leaving = d.leaveAt !== Infinity && t >= d.leaveAt;
  if (!leaving) {
    const s = ease(Math.min(1, t / 7));
    position = quad(arrive, bend, ringTop, s); ahead = quad(arrive, bend, ringTop, Math.min(1, s + .02));
    perched = ease((t - 6.6) / .7);
    flap = t < 7 ? (t > 5.4 ? 1 : (Math.sin(t * .9) > .6 ? 1 : .15)) : 0;
    fade = ease(t / 1.4);
  } else {
    const span = d.spooked ? 4 : 6, s = ease((t - d.leaveAt) / span);
    const start = d.leaveFrom;
    const lift = [start[0] + 3, start[1] + 9, start[2] - 6];
    position = s < .5 ? quad(start, lift, through, s * 2) : lerp(through, beyond, (s - .5) * 2);
    ahead = s < .5 ? quad(start, lift, through, Math.min(1, s * 2 + .03)) : beyond;
    perched = 1 - ease((t - d.leaveAt) / .5);
    flap = s < .3 ? 1 : .2;
    // She fades as she passes through the light.
    fade = 1 - ease((position[2] - (GATE_RING.z - 1)) / -6);
  }
  const dir = ahead.map((v, k) => v - position[k]);
  let heading = perched > .5 ? headingOf(0, 1) : headingOf(dir[0], dir[2], 0);
  if (perched > .5 && viewer) heading += turn(heading, headingOf(viewer[0] - position[0], viewer[2] - position[2], heading)) * .6;
  const time = reduced ? 0 : clock;
  const beat = reduced ? .1 : Math.sin(time * 7) * .75 * flap + .12 * (1 - flap);
  const root = grow(joint(IDENTITY, position, heading), SIZE.owl);
  const body = joint(root, [0, 0, 0], -1.2 * (1 - perched), 'x');
  const swivel = perched ? look(viewer, position, heading, 1.6) * perched : 0;
  const bow = d.time > 12 && d.time < 13.4 && !leaving ? Math.sin((d.time - 12) / 1.4 * Math.PI) * .35 : 0;
  let head = joint(body, [0, .27, 0], swivel + (reduced ? 0 : Math.sin(time * .7) * .1 * perched));
  head = joint(head, [0, 0, 0], 1.2 * (1 - perched) - bow, 'x');
  // Perched, she keeps the made wing half open, and spreads both as she bows.
  const opened = Math.min(1, bow / .35), fold = perched * (.22 - .18 * opened);
  const wings = [];
  for (const side of [-1, 1]) {
    const droop = perched * (.85 - .5 * opened);
    let wing = joint(body, [side * .17, .08, 0], side * (beat * (1 - perched) - droop), 'z');
    wing = joint(wing, [0, 0, 0], -side * fold * 1.35, 'y');
    wings.push(wing);
  }
  const tail = joint(body, [0, -.2, .14], .2 * (1 - perched) + (reduced ? 0 : Math.sin(time * 1.3) * .05), 'x');
  return {bones: [body, head, wings[0], wings[1], tail], position, heading, fade, perched};
}

export function leaflingPose(d, route, ground, viewer, clock, lift = 0, reduced = false, turned = 0) {
  const t = d.time, points = route.points, total = routeLength(points);
  let distance, back = false, sip = 0, shake = 0, ears = 0, gaze = 0, fade = 1;
  if (d.leaveAt === Infinity || t < d.leaveAt) {
    const rise = ease(t / 1.5);
    distance = t < 1.5 ? 0 : ease((t - 1.5) / 8) * total;
    sip = ease((t - 9.6) / .6) * (1 - ease((t - 12.5) / .5));
    shake = t > 13 && t < 14.4 ? 1 : 0;
    ears = ease((t - 10.5) / 1.2);
    gaze = ease((t - 14.4) / .8);
    fade = rise;
  } else {
    back = true;
    const span = Math.max(3, turned / (d.spooked ? 2.6 : 1.4));
    distance = turned * (1 - ease((t - d.leaveAt) / span));
    ears = d.spooked ? 0 : 1 - ease((t - d.leaveAt) / 2);
    fade = 1 - ease((t - d.leaveAt - span + .2) / 1);
  }
  const at = along(points, distance);
  const p = at.position;
  const breathing = lift * ease((p[1] - route.gy - 8) / 4);
  const position = [p[0], p[1] + breathing, p[2]];
  let dir = back ? at.direction.map(v => -v) : at.direction;
  if (distance <= 0) dir = [0, 0, 1];
  const vertical = Math.abs(dir[1]) > .85;
  // On the vine its back and ears face the clearing.
  const heading = vertical ? Math.PI : headingOf(dir[0], dir[2], 0);
  const pitch = Math.asin(Math.max(-1, Math.min(1, dir[1])));
  const time = reduced ? 0 : clock;
  const moving = (!sip && !gaze && distance > 0 && distance < total) || back;
  const root = grow(joint(IDENTITY, position, heading), SIZE.leafling);
  const body = joint(joint(root, [0, 0, 0], pitch, 'x'), [0, 0, 0], reduced ? 0 : Math.sin(time * 22) * .35 * shake, 'z');
  const gazeTurn = gaze ? look(viewer, position, heading, 1.2) * gaze : 0;
  let head = joint(body, [0, .08, -.3], gazeTurn);
  head = joint(head, [0, 0, 0], -sip * .7 + gaze * .25, 'x');
  const earBones = [];
  for (const side of [-1, 1]) {
    const flutter = reduced ? 0 : Math.sin(time * 3.1 + side) * .08 * ears;
    let ear = joint(head, [side * .09, .1, .02], side * (-.9 * (1 - ears) + flutter), 'z');
    ear = joint(ear, [0, 0, 0], .9 * (1 - ears), 'x');
    earBones.push(ear);
  }
  const legs = [];
  for (let k = 0; k < 6; k++) {
    const side = k % 2 ? 1 : -1, row = Math.floor(k / 2), tripod = (k === 0 || k === 3 || k === 4) ? 1 : -1;
    const swing = moving && !reduced ? Math.sin(time * 16) * .5 * tripod : 0;
    legs.push(joint(body, [side * .1, -.05, -.14 + row * .14], swing, 'x'));
  }
  return {bones: [body, head, ...earBones, ...legs], position, heading, fade, sip, shake, ears};
}

// ---------- meshes ----------

export function createDwellerMeshes({orb, cone, beam, curveTube, tri, ruff = () => {}, upload, material}, ground) {
  const two = (a, b, c, col) => { tri(a, b, c, col); tri(a, c, b, col); };
  const bone = i => material((i + 5) * 10);

  // Root fox: russet coat, pale chest and tail tip, dark socks, amber eyes.
  const russet = [.62, .27, .09], cream = [.84, .78, .64], sock = [.13, .07, .04];
  const dusk = [.40, .16, .06];
  bone(0); orb(0, 0, 0, .21, .21, .47, russet, 22, 12); orb(0, -.06, -.33, .15, .16, .15, cream, 14, 8); orb(0, .02, .3, .19, .19, .2, russet, 14, 8);
  // Witte bef, donkere rugstreep en een ruige vacht op flanken en dijen.
  ruff(0, -.06, -.33, .15, .16, .15, 70, .09, cream, {arc: [.9, 2.8], turn: [3.4, 6.0], sweep: [0, -.7, .15]});
  ruff(0, 0, 0, .205, .205, .46, 60, .07, dusk, {arc: [0, .5], sweep: [0, .1, .9], width: .4});
  ruff(0, 0, 0, .21, .21, .47, 170, .075, russet, {arc: [.55, 2.4], sweep: [0, -.25, .9], width: .4, tip: [.74, .40, .16]});
  ruff(0, .02, .3, .19, .19, .2, 60, .08, russet, {arc: [.5, 2.5], turn: [-.2, 3.3], sweep: [0, -.3, .7], width: .4});
  bone(1);
  orb(0, .05, -.06, .16, .14, .16, russet, 18, 10); orb(0, .0, -.25, .075, .065, .15, russet, 14, 8); orb(0, -.035, -.22, .07, .04, .13, cream, 12, 7);
  // Wangkragen, een kuif tussen de oren en snorharen.
  for (const side of [-1, 1]) {
    ruff(side * .12, -.02, -.07, .07, .08, .06, 34, .10, cream, {arc: [.7, 2.5], turn: side > 0 ? [-1.1, 1.1] : [2.0, 4.2], sweep: [side * .7, -.35, .35]});
    for (let j = 0; j < 4; j++) beam([side * .045, -.025, -.33], [side * (.20 + j * .012), -.06 + j * .028, -.30 + j * .012], .0035, [.92, .9, .84]);
    orb(side * .075, .095, -.178, .03, .028, .012, [.05, .03, .02], 8, 5);
  }
  ruff(0, .05, -.06, .16, .14, .16, 60, .06, russet, {arc: [0, 1.5], turn: [-.3, 3.4], sweep: [0, .25, .8], width: .4, tip: [.74, .40, .16]});
  orb(0, .01, -.4, .03, .028, .028, sock, 8, 5); orb(-.12, -.02, -.07, .07, .08, .06, cream, 8, 5); orb(.12, -.02, -.07, .07, .08, .06, cream, 8, 5);
  for (const side of [-1, 1]) {
    two([side * .05, .15, -.06], [side * .15, .12, .02], [side * .13, .36, -.02], russet);
    two([side * .075, .16, -.07], [side * .135, .14, -.03], [side * .125, .31, -.05], sock);
    ruff(side * .105, .2, -.05, .03, .07, .02, 10, .06, cream, {arc: [.3, 2.2], turn: [3.6, 5.8], sweep: [0, .6, -.4], width: .3});
    orb(side * .075, .09, -.19, .024, .022, .015, [1.25, .78, .22], 8, 5);
  }
  // Een volle pluimstaart met een roomwitte punt.
  bone(2); curveTube([[0, 0, 0], [0, -.06, .25], [0, -.12, .5]], [.06, .15, .13], russet, 14);
  for (let j = 0; j < 5; j++) { const t = j / 4; ruff(0, -.02 - t * .1, .08 + t * .4, .07 + t * .09, .07 + t * .09, .09, 46, .15, russet, {sweep: [0, -.05, .7], tip: dusk, width: .38}); }
  bone(3); curveTube([[0, 0, 0], [0, -.02, .18], [0, .02, .32]], [.13, .1, .015], cream, 14);
  for (let j = 0; j < 3; j++) { const t = j / 2; ruff(0, -.01, .04 + t * .2, .13 - t * .07, .13 - t * .07, .08, 40, .14, cream, {sweep: [0, 0, .8], width: .38}); }
  for (let i = 4; i < 8; i++) { bone(i); beam([0, 0, 0], [0, -.36, 0], .045, sock); orb(0, -.38, -.03, .05, .03, .07, sock, 10, 6); ruff(0, -.08, 0, .06, .1, .06, 16, .07, russet, {arc: [.8, 2.3], sweep: [0, -.8, .2], width: .4}); }
  const fox = upload();

  // Silver wing: a soft barn-owl body, one feathered wing and one wing the keeper made.
  // The made wing catches moonlight: its plates are faintly luminous, so she reads at night.
  const plume = [.68, .6, .48], face = [.93, .89, .8], silver = [.62, .68, .74], moonplate = [.74, .82, 1.02], filament = [.7, 1.05, 1.2];
  bone(0); orb(0, 0, 0, .2, .28, .18, plume, 18, 11); orb(0, -.03, -.1, .15, .21, .1, [.88, .83, .72], 14, 8);
  ruff(0, -.03, -.1, .15, .21, .1, 80, .07, [.9, .86, .76], {arc: [.5, 2.7], turn: [3.5, 5.9], sweep: [0, -.9, .1], width: .7, tip: [.7, .6, .45]});
  ruff(0, 0, 0, .2, .28, .18, 80, .07, plume, {arc: [.3, 2.6], turn: [-.3, 3.4], sweep: [0, -.9, .2], width: .7, tip: [.5, .42, .3]});
  for (const side of [-1, 1]) orb(side * .07, -.29, -.04, .04, .03, .06, [.3, .25, .18], 8, 5);
  bone(1); orb(0, .1, 0, .19, .16, .17, plume, 18, 11); orb(0, .1, -.11, .155, .13, .06, face, 16, 9);
  ruff(0, .1, -.11, .16, .135, .05, 60, .035, [.62, .5, .36], {arc: [1.25, 1.9], turn: [0, 6.283], sweep: [0, 0, -.2], width: .8});
  ruff(0, .1, 0, .19, .16, .17, 60, .05, plume, {arc: [0, 1.6], turn: [-.3, 3.4], sweep: [0, .1, .8], width: .6, tip: [.5, .42, .3]});
  orb(0, .06, -.175, .022, .04, .03, [.35, .3, .2], 8, 5);
  for (const side of [-1, 1]) {
    orb(side * .065, .12, -.16, .045, .045, .025, [1.4, 1, .38], 10, 6);
    two([side * .06, .22, -.03], [side * .15, .2, .02], [side * .14, .33, .03], plume);
  }
  bone(2);
  for (let j = 0; j < 7; j++) {
    const x = -.06 - j * .1, len = .32 + Math.sin(j / 6 * Math.PI) * .12 - j * .02;
    two([x, 0, -.08], [x - .12, .005, -.06], [x - .1, -.01, len], j % 2 ? plume : [.6, .5, .37]);
  }
  two([0, 0, -.09], [-.78, .01, -.03], [-.06, .01, .16], [.55, .46, .33]);
  bone(3);
  beam([0, 0, 0], [.78, .02, -.02], .022, silver); beam([.06, 0, 0], [.42, 0, .2], .014, silver);
  for (let j = 0; j < 6; j++) {
    const x = .1 + j * .11, len = .3 + Math.sin(j / 5 * Math.PI) * .12 - j * .02;
    two([x, 0, -.06], [x + .1, .004, -.05], [x + .08, -.01, len], j % 2 ? moonplate : silver);
    beam([x, .012, -.05], [x + .07, .012, len - .04], .012, filament);
  }
  for (let j = 0; j < 4; j++) orb(.08 + j * .2, .01, -.03, .03, .03, .03, [.38, .44, .46], 8, 5);
  bone(4);
  for (let j = -2; j <= 2; j++) two([0, 0, 0], [j * .05 - .03, -.02, .24], [j * .05 + .03, -.02, .24], plume);
  const owl = upload();

  // Leafling: six small legs, two leaf ears, large wet eyes.
  const fawn = [.52, .43, .29], belly = [.7, .62, .45], leaf = [.24, .48, .13], vein = [.4, .62, .2];
  bone(0); orb(0, 0, 0, .14, .12, .26, fawn, 14, 8); orb(0, -.05, 0, .1, .07, .2, belly, 12, 6);
  curveTube([[0, .02, .24], [0, .1, .34], [0, .2, .3]], [.035, .03, .01], fawn, 6);
  bone(1); orb(0, .02, -.06, .12, .11, .11, fawn, 14, 8); orb(0, -.02, -.15, .06, .05, .05, belly, 10, 6);
  for (const side of [-1, 1]) {
    orb(side * .06, .05, -.14, .036, .04, .025, [.04, .05, .04], 10, 6);
    orb(side * .068, .065, -.16, .01, .01, .007, [1.3, 1.25, 1.05], 6, 4);
  }
  for (const i of [2, 3]) {
    bone(i); const side = i === 2 ? -1 : 1;
    const base = [0, 0, 0], tip = [side * .34, .2, .04];
    two(base, [side * .16, .16, -.07], tip, leaf); two(base, tip, [side * .2, .03, .09], [.2, .42, .11]);
    beam(base, [side * .3, .18, .035], .006, vein);
  }
  for (let i = 4; i < 10; i++) { bone(i); beam([0, 0, 0], [0, -.12, -.03], .016, [.25, .19, .1]); orb(0, -.125, -.04, .02, .012, .025, [.2, .15, .08], 6, 4); }
  const leafling = upload();

  // The vine the leafling uses, hanging from the keeper's left hand; and a moss nest on his shoulder.
  material(5);
  const route = leaflingRoute(ground), [vx, vz] = route.vine, top = route.points[5][1], foot = ground(vx, vz);
  const strand = [[vx, top + .3, vz], [vx + .15, top - 2, vz + .1], [vx - .1, (top + foot) / 2, vz + .05], [vx + .05, foot + .4, vz - .05], [vx + .25, foot, vz + .2]];
  curveTube(strand, strand.map((_, k) => .12 - k * .015), [.2, .23, .1], 6);
  material(2);
  for (let k = 0; k < 7; k++) {
    const y = top - .6 - k * (top - foot - .8) / 7, a = k * 2.4;
    two([vx, y, vz], [vx + Math.cos(a) * .32, y + .08, vz + Math.sin(a) * .32], [vx + Math.cos(a + .5) * .28, y - .1, vz + Math.sin(a + .5) * .28], [.14, .32, .09]);
  }
  material(0);
  const vine = upload();
  // A small water basin remains after the encounter, even on a later visit.
  const [sx, sy, sz] = springPosition(ground);
  material(3);
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9, x = sx + Math.cos(a) * .8, z = sz + Math.sin(a) * .6;
    orb(x, ground(x, z) + .06, z, .25, .12, .22, [.2, .27, .16], 8, 5);
  }
  material(4); orb(sx, sy, sz, .72, .035, .51, [.04, .24, .25], 20, 6);
  material(0);
  const spring = upload();
  return {fox, owl, leafling, vine, spring};
}

// Small light: the spring the fox uncovers, rain shaken from the leafling, silver glints.
export function sparkPositions(poses, time, reduced = false) {
  const sparks = [];
  const t = reduced ? 0 : time;
  if (poses.fox && (poses.fox.spring > .01)) {
    const [x, base, z] = poses.fox.springAt;
    for (let i = 0; i < 14; i++) {
      const s = reduced ? i / 14 : (t * .45 + i / 14) % 1, a = i * 2.39;
      sparks.push({p: [x + Math.cos(a) * (.1 + s * .3), base + s * .9, z + Math.sin(a) * (.1 + s * .3)], c: [.45, .85, 1], k: poses.fox.spring * (1 - s) * .9, size: .09});
    }
  }
  if (poses.owl && poses.owl.fade > .05) {
    // A cold glint travels along the silver wing.
    const o = poses.owl, wing = o.bones[3];
    for (let i = 0; i < 3; i++) {
      const x = .2 + i * .25, w = [0, 1, 2].map(k => wing[k] * x + wing[8 + k] * .1 + wing[12 + k]);
      const pulse = reduced ? .6 : .45 + .35 * Math.sin(t * 2.2 - i * 1.3);
      sparks.push({p: w, c: [.6, .85, 1], k: o.fade * pulse * .6, size: .22});
    }
  }
  if (poses.leafling && poses.leafling.sip > .3) {
    const p = poses.leafling.position;
    for (let i = 0; i < 10; i++) {
      const s = reduced ? i / 10 : (t * .6 + i / 10) % 1, a = i * 2.39;
      sparks.push({p: [p[0] + Math.cos(a) * (.4 + s * 1.1), p[1] - .4, p[2] - .6 + Math.sin(a) * (.4 + s * 1.1)], c: [.55, .8, .95], k: poses.leafling.sip * (1 - s) * .45, size: .08});
    }
  }
  if (poses.leafling && poses.leafling.shake > 0) {
    const p = poses.leafling.position;
    for (let i = 0; i < 12; i++) {
      const a = i * 2.39 + t * 9;
      sparks.push({p: [p[0] + Math.cos(a) * .35, p[1] + .12 + Math.sin(i) * .08, p[2] + Math.sin(a) * .35], c: [.7, .85, 1], k: .7, size: .06});
    }
  }
  return sparks;
}

export function createSparkRenderer(gl, compileProgram) {
  const vertex = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 point;layout(location=1) in vec4 tint;
  uniform mat4 vp;uniform float pixels;out vec4 glow;
  void main(){gl_Position=vp*vec4(point,1.);gl_PointSize=clamp(tint.a*pixels/max(.2,gl_Position.w),1.,48.);glow=tint;}`;
  const fragment = `#version 300 es
  precision highp float;in vec4 glow;out vec4 color;
  void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;
  color=vec4(glow.rgb*(exp(-r*4.)*.5+exp(-r*30.)*.8),1.);}`;
  const program = compileProgram(vertex, fragment), vao = gl.createVertexArray(), buffer = gl.createBuffer();
  const vp = gl.getUniformLocation(program, 'vp'), pixels = gl.getUniformLocation(program, 'pixels');
  const data = new Float32Array(64 * 7);
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
  return function render(matrix, sparks, height) {
    const used = Math.min(64, sparks.length);
    if (!used) return;
    for (let i = 0; i < used; i++) { const s = sparks[i]; data.set([...s.p, s.c[0] * s.k, s.c[1] * s.k, s.c[2] * s.k, s.size], i * 7); }
    gl.useProgram(program); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, used * 7));
    gl.uniformMatrix4fv(vp, false, matrix); gl.uniform1f(pixels, height);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, used);
    gl.depthMask(true); gl.disable(gl.BLEND);
  };
}
