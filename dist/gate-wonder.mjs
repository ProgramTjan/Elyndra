// Stillness before the waking ring; dusk lets the water hold another forest.
export const GATE = Object.freeze({x: 66, z: -94});
export const RING = Object.freeze({x: 66, z: -110});
const clamp = x => Math.max(0, Math.min(1, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };

export function dusk(hour) {
  const h = ((hour % 24) + 24) % 24;
  return h >= 18.2 && h < 20.6;
}

export class GateWonder {
  constructor() {
    this.time = 0; this.still = 0; this.bloom = 0; this.away = 0;
    this.age = -1; this.visits = 0; this.phase = 'far'; this.previous = null;
    this.dusk = false; this.open = false;
  }
  update(dt, viewer, hour = 12, portal = false, enabled = true) {
    dt = Math.min(.05, Math.max(0, dt));
    this.dusk = dusk(hour);
    this.open = !!portal;
    if (!enabled) { this.previous = [...viewer]; return this.snapshot(viewer); }
    this.time += dt;
    const distance = Math.hypot(viewer[0] - GATE.x, viewer[2] - GATE.z);
    const nearby = distance < 28 && viewer[1] < 18;
    const settled = distance < 16 && viewer[1] < 9;
    const step = this.previous ? Math.hypot(viewer[0] - this.previous[0], viewer[2] - this.previous[2]) : 0;
    const speed = this.previous && dt > 0 ? step / Math.max(dt, 1 / 30) : 0;
    this.previous = [...viewer];
    this.away = nearby ? 0 : this.away + dt;
    if (nearby) {
      if (this.phase === 'far' || this.phase === 'closed' || this.phase === 'day') {
        const next = !this.open ? 'closed' : this.dusk ? 'invitation' : 'day';
        if (next === 'invitation' && this.phase !== 'invitation') this.visits++;
        this.phase = next;
      } else if (this.phase === 'invitation' && this.age < 0) {
        if (!this.open) this.phase = 'closed';
        else if (!this.dusk) this.phase = 'day';
      }
    }
    if (this.age < 0) {
      this.still = settled && this.open && this.dusk && speed < .75 ? this.still + dt : Math.max(0, this.still - dt * .6);
      if (this.still >= 6) { this.age = 0; this.phase = 'awakening'; }
    } else {
      this.age += dt;
      if (this.age > 8) this.phase = 'mirror';
      if (this.age > 22) this.phase = 'afterglow';
    }
    const target = nearby && this.age >= 0 ? ease(this.age / 11) : nearby && this.open && this.dusk ? ease(this.still / 6) * .2 : 0;
    this.bloom += (target - this.bloom) * (1 - Math.exp(-dt * .9));
    if (this.away > 12) { this.age = -1; this.still = 0; this.phase = 'far'; }
    return this.snapshot(viewer);
  }
  reset() {
    this.time = 0; this.still = 0; this.bloom = 0; this.away = 0;
    this.age = -1; this.phase = 'far'; this.previous = null;
    this.dusk = false; this.open = false;
  }
  snapshot(viewer) {
    const distance = Math.hypot(viewer[0] - GATE.x, viewer[2] - GATE.z);
    const near = 1 - ease((distance - 14) / 22);
    return {time: this.time, still: this.still, bloom: this.bloom, age: this.age, near, phase: this.phase, visits: this.visits, dusk: this.dusk, open: this.open, distance, height: viewer[1]};
  }
}

export function reflectionPosition(i, time, bloom, portalY = 10, reduced = false) {
  const a = i * 2.39996323, r = 1.1 + (i % 10) * .72;
  const t = reduced ? 0 : time;
  const depth = (i % 3 === 0) ? -1 : 1;
  return [
    RING.x + Math.cos(a) * r * (.35 + bloom * .85),
    portalY + depth * (r * .12 + (reduced ? (i % 5) * .08 : Math.sin(t * .45 + i) * .55)) * (.3 + bloom),
    RING.z + .35 + Math.sin(a) * .18
  ];
}

export function createGateAtmosphere(gl, compileProgram, compact = false) {
  const vertex = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 point;layout(location=1) in vec4 tint;
  uniform mat4 vp;uniform float pixels;out vec4 glow;
  void main(){gl_Position=vp*vec4(point,1.);gl_PointSize=clamp(tint.a*pixels/max(.2,gl_Position.w),1.,68.);glow=tint;}`;
  const fragment = `#version 300 es
  precision highp float;in vec4 glow;out vec4 color;
  void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;
  float halo=exp(-r*5.)*(1.-smoothstep(.65,1.,r));float core=exp(-r*68.);
  color=vec4(glow.rgb*(halo*.38+core*.95),1.);}`;
  const program = compileProgram(vertex, fragment), vao = gl.createVertexArray(), buffer = gl.createBuffer();
  const vp = gl.getUniformLocation(program, 'vp'), pixels = gl.getUniformLocation(program, 'pixels');
  const count = compact ? 64 : 110, data = new Float32Array((count + 50) * 7);
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
  return function render(matrix, state, portalY, reduced, height) {
    if (state.near < .02 && state.bloom < .02) return;
    let used = 0;
    const t = reduced ? 0 : state.time, strength = state.near * (.2 + .8 * state.bloom);
    for (let i = 0; i < count; i++) {
      const p = reflectionPosition(i, t, state.bloom, portalY, reduced);
      const pulse = reduced ? 1 : .74 + .26 * Math.sin(t * .7 + i);
      const other = i % 4 === 0;
      data.set([...p, (other ? .95 : .18) * strength * pulse, (other ? .72 : .62) * strength * pulse, (other ? .28 : .58) * strength * pulse, .2 + (i % 5) * .03], used * 7);
      used++;
    }
    gl.useProgram(program); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, used * 7));
    gl.uniformMatrix4fv(vp, false, matrix); gl.uniform1f(pixels, height);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, used);
    gl.depthMask(true); gl.disable(gl.BLEND);
  };
}
