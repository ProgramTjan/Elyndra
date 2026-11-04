// After rain the floating gardens let their water go; hover still between them and the seed keepers cross your path.
export const ISLANDS = Object.freeze([[-96, 43, -180, 13], [-122, 38, -165, 9], [-69, 49, -176, 9], [-109, 58, -204, 10], [-77, 33, -205, 8]].map(i => Object.freeze(i)));
export const GARDENS = Object.freeze({x: -95, z: -186});
// A sheltered hover point between the islands, used by the travel menu.
export const HOVER = Object.freeze([-90, 40, -150]);
const clamp = x => Math.max(0, Math.min(1, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// Wet ground after rain is the condition; mist alone is not enough.
export function dewFromSky(sky = {}) {
  return clamp(((sky.wet ?? 0) - .25) / .35);
}
export function lanternHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  return h >= 20.6 || h < 5.4;
}

// Each keeper rests on one island and carries pollen to another.
const ROUTES = [[1, 2], [3, 4], [2, 0], [4, 1]];
const SIDE = [1.4, -1.8, 2.4, -1];
const LIFT = [1.2, 2.3, .7, 2.9];
const DEPART = 7, SPACING = 2.6, TRAVEL = 10, GREET = 3.6, AHEAD = 7;

function restSpot(island, i) {
  const [x, y, z, r] = ISLANDS[island], a = i * 2.1 + island * 1.3;
  return [x + Math.cos(a) * r * .45, y + .95, z + Math.sin(a) * r * .45];
}

export class GardenDew {
  constructor() {
    this.time = 0; this.still = 0; this.bloom = 0; this.away = 0;
    this.age = -1; this.visits = 0; this.phase = 'far'; this.previous = null;
    this.dew = 0; this.anchor = null; this.origin = null; this.hour = 12; this.flying = false;
  }
  // facing: horizontal look direction [x, z]; the keepers cross the path just ahead of it.
  update(dt, viewer, sky = {}, flying = false, enabled = true, facing = null) {
    dt = Math.min(.05, Math.max(0, dt));
    this.dew = dewFromSky(sky);
    this.hour = sky.hour ?? this.hour;
    this.flying = !!flying;
    if (!enabled) { this.previous = [...viewer]; return this.snapshot(viewer); }
    this.time += dt;
    const dewy = this.dew > .5;
    const distance = Math.hypot(viewer[0] - GARDENS.x, viewer[2] - GARDENS.z);
    const nearby = distance < 52 && viewer[1] > 24;
    const settled = distance < 40 && viewer[1] > 26 && viewer[1] < 80 && this.flying;
    const step = this.previous ? Math.hypot(viewer[0] - this.previous[0], viewer[1] - this.previous[1], viewer[2] - this.previous[2]) : 0;
    const speed = this.previous && dt > 0 ? step / Math.max(dt, 1 / 30) : 0;
    this.previous = [...viewer];
    this.away = nearby ? 0 : this.away + dt;
    if (nearby) {
      if (this.phase === 'far' || this.phase === 'dry') {
        const next = dewy ? 'invitation' : 'dry';
        if (next === 'invitation') this.visits++;
        this.phase = next;
      } else if (this.phase === 'invitation' && this.age < 0 && !dewy) this.phase = 'dry';
    }
    if (this.age < 0) {
      this.still = settled && dewy && speed < 1.5 ? this.still + dt : Math.max(0, this.still - dt * .6);
      if (this.still >= 6) {
        this.age = 0; this.phase = 'awakening';
        const toward = [GARDENS.x - viewer[0], GARDENS.z - viewer[2]];
        const f = facing && Math.hypot(facing[0], facing[1]) > .01 ? facing : Math.hypot(...toward) > .01 ? toward : [0, -1], l = Math.hypot(f[0], f[1]);
        this.anchor = [viewer[0] + f[0] / l * AHEAD, viewer[1], viewer[2] + f[1] / l * AHEAD];
        this.origin = [...viewer];
      }
    } else {
      this.age += dt;
      if (this.age > DEPART) this.phase = 'seeding';
      if (this.age > DEPART + SPACING * 3 + TRAVEL + GREET + 4) this.phase = 'afterglow';
    }
    const target = nearby && this.age >= 0 ? ease(this.age / 10) : nearby && dewy ? ease(this.still / 6) * .25 : 0;
    this.bloom += (target - this.bloom) * (1 - Math.exp(-dt * .8));
    if (this.away > 15) { this.age = -1; this.still = 0; this.phase = 'far'; this.anchor = this.origin = null; }
    return this.snapshot(viewer);
  }
  reset() {
    this.time = 0; this.still = 0; this.bloom = 0; this.away = 0;
    this.age = -1; this.phase = 'far'; this.previous = null; this.anchor = this.origin = null;
  }
  snapshot(viewer) {
    const distance = Math.hypot(viewer[0] - GARDENS.x, viewer[2] - GARDENS.z);
    const near = 1 - ease((distance - 40) / 60);
    return {
      time: this.time, still: this.still, bloom: this.bloom, age: this.age, near, phase: this.phase,
      visits: this.visits, dew: this.dew, anchor: this.anchor, origin: this.origin, eye: [...viewer], distance, height: viewer[1],
      lantern: lanternHour(this.hour), falls: this.dew * near * (.5 + .5 * this.bloom)
    };
  }
}

// Where keeper i is: resting, crossing near the visitor, or (on a return visit) pausing beside them.
export function seedKeeper(i, state, reduced = false) {
  const [from, to] = ROUTES[i % ROUTES.length];
  const a = restSpot(from, i), b = restSpot(to, i + 2);
  const bob = reduced ? 0 : Math.sin(state.time * 1.7 + i * 1.9) * .18;
  if (state.age < 0 || !state.anchor) return {position: [a[0], a[1] + bob, a[2]], rotation: i * 1.7, progress: 0, flying: false, greeting: false};
  const greet = i === 0 && state.visits > 1;
  const local = state.age - DEPART - i * SPACING;
  let t, greeting = false;
  if (!greet) t = ease(local / TRAVEL);
  else if (local < TRAVEL / 2) t = .5 * ease(local / (TRAVEL / 2));
  else if (local < TRAVEL / 2 + GREET) { t = .5; greeting = true; }
  else t = .5 + .5 * ease((local - TRAVEL / 2 - GREET) / (TRAVEL / 2));
  const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1;
  const side = greet ? .8 : SIDE[i % SIDE.length], lift = greet ? .3 : LIFT[i % LIFT.length];
  // A greeting keeper stops halfway between you and the crossing, at eye height.
  const centre = greet && state.origin ? state.anchor.map((v, k) => (v + state.origin[k]) / 2) : state.anchor;
  const mid = [centre[0] - dz / len * side, centre[1] + lift, centre[2] + dx / len * side];
  const c = [0, 1, 2].map(k => 2 * mid[k] - (a[k] + b[k]) / 2);
  const at = s => [0, 1, 2].map(k => (1 - s) * (1 - s) * a[k] + 2 * s * (1 - s) * c[k] + s * s * b[k] + (k === 1 ? Math.sin(s * Math.PI) * 1.5 : 0));
  const p = at(t), q = at(Math.min(1, t + .01)), back = at(Math.max(0, t - .01));
  let rotation = Math.atan2(q[0] - back[0], q[2] - back[2]);
  if (greeting && state.eye) rotation = Math.atan2(state.eye[0] - p[0], state.eye[2] - p[2]);
  if (t <= 0) rotation = i * 1.7;
  p[1] += bob * (t <= 0 || t >= 1 ? 1 : .6);
  return {position: p, rotation, progress: t, flying: t > 0 && t < 1, greeting, path: at};
}

function hash(i) {
  return ((Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) >>> 0) ^ (Math.imul(i, 0xc2b2ae35) >>> 0)) / 4294967296;
}

// Two or three spill points per island; water falls, widens and dissolves into mist.
export const STREAMS = Object.freeze(ISLANDS.flatMap(([x, y, z, r], island) => {
  const count = r > 10 ? 3 : 2;
  return Array.from({length: count}, (_, k) => {
    const a = island * 1.7 + k * (Math.PI * 2 / count) + .4;
    return Object.freeze({x: x + Math.cos(a) * r * .97, y: y - .25, z: z + Math.sin(a) * r * .97, dx: Math.cos(a), dz: Math.sin(a), length: 20 + r * 1.2 + (k % 2) * 4});
  });
}));

export function dropPosition(stream, j, count, time, reduced = false) {
  const s = reduced ? (j + .5) / count : (time / 3.4 + j / count + hash(j + 7) * .3) % 1;
  const fall = Math.pow(s, 1.45);
  const spread = (.15 + s * 1.4) * (hash(j * 3 + 1) - .5);
  const out = .4 + s * 2.2;
  return {
    position: [stream.x + stream.dx * out - stream.dz * spread, stream.y - stream.length * fall, stream.z + stream.dz * out + stream.dx * spread],
    fade: Math.pow(1 - s, 1.1) * Math.min(1, s / .05),
    s
  };
}

export function createDewAtmosphere(gl, compileProgram, compact = false) {
  const vertex = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 point;layout(location=1) in vec4 tint;
  uniform mat4 vp;uniform float pixels;out vec4 glow;out float streak;
  void main(){gl_Position=vp*vec4(point,1.);gl_PointSize=clamp(abs(tint.a)*pixels/max(.2,gl_Position.w),1.,72.);glow=tint;streak=tint.a<0.?1.:0.;}`;
  // Water is drawn as thin falling streaks that both lighten and veil what is behind, so it reads in bright mist too.
  const fragment = `#version 300 es
  precision highp float;in vec4 glow;in float streak;out vec4 color;
  void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.&&streak<.5)discard;
  float shape=streak>.5?exp(-p.x*p.x*26.)*(1.-p.y*p.y):exp(-r*4.)*(1.-smoothstep(.6,1.,r))*.45+exp(-r*40.)*.8;
  float veil=max(glow.r,max(glow.g,glow.b))*shape;
  color=vec4(glow.rgb*shape,clamp(veil*(streak>.5?.75:.35),0.,1.));}`;
  const program = compileProgram(vertex, fragment), vao = gl.createVertexArray(), buffer = gl.createBuffer();
  const vp = gl.getUniformLocation(program, 'vp'), pixels = gl.getUniformLocation(program, 'pixels');
  const drops = compact ? 34 : 60, mists = compact ? 2 : 4, trail = compact ? 6 : 12;
  const capacity = STREAMS.length * (drops + mists) + ROUTES.length * (trail + 1);
  const data = new Float32Array(capacity * 7);
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
  return function render(matrix, state, reduced, height, warmth = 0, night = 0) {
    if (state.near < .02) return;
    let used = 0;
    const put = (p, r, g, b, size) => { data.set([p[0], p[1], p[2], r, g, b, size], used * 7); used++; };
    const t = reduced ? 0 : state.time;
    const light = 1 - night * .55;
    const water = [.6 + warmth * .35, .76 + warmth * .05, .86 - warmth * .25].map((v, k) => v * light + (k === 2 ? night * .12 : 0));
    if (state.falls > .01) {
      for (const stream of STREAMS) {
        for (let j = 0; j < drops; j++) {
          const d = dropPosition(stream, j, drops, t, reduced);
          const k = state.falls * d.fade * (reduced ? .7 : 1);
          put(d.position, water[0] * k, water[1] * k, water[2] * k, -(1 + d.s * .9));
        }
        for (let j = 0; j < mists; j++) {
          const a = j * 2.4 + stream.x, drift = reduced ? 0 : Math.sin(t * .3 + j) * .6;
          const k = state.falls * .12;
          put([stream.x + stream.dx * 3 + Math.cos(a) * 1.4 + drift, stream.y - stream.length * (.92 + j * .03), stream.z + stream.dz * 3 + Math.sin(a) * 1.4], water[0] * k, water[1] * k, water[2] * k, 1.4 + j * .25);
        }
      }
    }
    const pollen = state.lantern ? [.32, .74, 1] : [1, .78, .34];
    for (let i = 0; i < ROUTES.length; i++) {
      const keeper = seedKeeper(i, state, reduced);
      const glow = state.near * (state.lantern ? .9 : .35) * (keeper.flying || keeper.greeting ? 1 : .45);
      put([keeper.position[0], keeper.position[1] + .1, keeper.position[2]], pollen[0] * glow, pollen[1] * glow, pollen[2] * glow, state.lantern ? .75 : .45);
      if (!keeper.flying) continue;
      for (let k = 1; k <= trail; k++) {
        const s = Math.max(0, keeper.progress - k * .012), p = keeper.path(s);
        const fade = (1 - k / (trail + 1)) * state.near * .8;
        put([p[0] + (hash(k + i * 31) - .5) * .5, p[1] - k * .14 - .3, p[2] + (hash(k * 5 + i) - .5) * .5], pollen[0] * fade, pollen[1] * fade, pollen[2] * fade, .1 + (k % 3) * .03);
      }
    }
    if (!used) return;
    gl.useProgram(program); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, used * 7));
    gl.uniformMatrix4fv(vp, false, matrix); gl.uniform1f(pixels, height);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, used);
    gl.depthMask(true); gl.disable(gl.BLEND);
  };
}
