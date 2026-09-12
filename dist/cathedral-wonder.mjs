// Stillness under the root arches; the seed only answers when the sun is low.
export const CATHEDRAL = Object.freeze({x: -42, z: -50});
export const SHRINE = Object.freeze({x: -39, z: -40});
const clamp = x => Math.max(0, Math.min(1, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };

export function lowSun(hour) {
  const h = ((hour % 24) + 24) % 24;
  return (h >= 5 && h < 7.8) || (h >= 16 && h < 20.8);
}

export class CathedralWonder {
  constructor() {
    this.time = 0; this.still = 0; this.bloom = 0; this.away = 0;
    this.age = -1; this.visits = 0; this.phase = 'far'; this.previous = null; this.low = false;
  }
  update(dt, viewer, hour = 12, enabled = true) {
    dt = Math.min(.05, Math.max(0, dt));
    this.low = lowSun(hour);
    if (!enabled) { this.previous = [...viewer]; return this.snapshot(viewer); }
    this.time += dt;
    const distance = Math.hypot(viewer[0] - CATHEDRAL.x, viewer[2] - CATHEDRAL.z);
    const nearby = distance < 26 && viewer[1] < 16;
    const settled = distance < 14 && viewer[1] < 8;
    const step = this.previous ? Math.hypot(viewer[0] - this.previous[0], viewer[2] - this.previous[2]) : 0;
    const speed = this.previous && dt > 0 ? step / Math.max(dt, 1 / 30) : 0;
    this.previous = [...viewer];
    this.away = nearby ? 0 : this.away + dt;
    if (nearby) {
      if (this.phase === 'far') {
        this.phase = this.low ? 'invitation' : 'high';
        if (this.phase === 'invitation') this.visits++;
      } else if (this.phase === 'high' && this.low) { this.phase = 'invitation'; this.visits++; }
      else if (this.phase === 'invitation' && !this.low && this.age < 0) this.phase = 'high';
    }
    if (this.age < 0) {
      this.still = settled && this.low && speed < .75 ? this.still + dt : Math.max(0, this.still - dt * .6);
      if (this.still >= 6) { this.age = 0; this.phase = 'awakening'; }
    } else {
      this.age += dt;
      if (this.age > 9) this.phase = 'breath';
      if (this.age > 17) this.phase = 'song';
      if (this.age > 28) this.phase = 'afterglow';
    }
    const target = nearby && this.age >= 0 ? ease(this.age / 12) : nearby && this.low ? ease(this.still / 6) * .18 : 0;
    this.bloom += (target - this.bloom) * (1 - Math.exp(-dt * .9));
    if (this.away > 12) { this.age = -1; this.still = 0; this.phase = 'far'; }
    return this.snapshot(viewer);
  }
  reset() {
    this.time = 0; this.still = 0; this.bloom = 0; this.away = 0;
    this.age = -1; this.phase = 'far'; this.previous = null; this.low = false;
  }
  snapshot(viewer) {
    const near = 1 - ease((Math.hypot(viewer[0] - CATHEDRAL.x, viewer[2] - CATHEDRAL.z) - 14) / 22);
    return {time: this.time, still: this.still, bloom: this.bloom, age: this.age, near, phase: this.phase, visits: this.visits, low: this.low, distance: Math.hypot(viewer[0] - CATHEDRAL.x, viewer[2] - CATHEDRAL.z), height: viewer[1]};
  }
}

export function sporePosition(i, time, bloom, shrineY = 2.2, reduced = false) {
  const a = i * 2.39996323, r = .35 + (i % 11) * .42;
  const rise = reduced ? (i % 9) * .38 : ((time * .52 + i * 1.37) % 7.5);
  return [
    SHRINE.x + Math.cos(a) * r * (.35 + bloom * .9),
    shrineY + 1.1 + rise * (.35 + bloom * .85),
    SHRINE.z + Math.sin(a) * r * (.35 + bloom * .9)
  ];
}

export function createCathedralAtmosphere(gl, compileProgram, compact = false) {
  const vertex = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 point;layout(location=1) in vec4 tint;
  uniform mat4 vp;uniform float pixels;out vec4 glow;
  void main(){gl_Position=vp*vec4(point,1.);gl_PointSize=clamp(tint.a*pixels/max(.2,gl_Position.w),1.,72.);glow=tint;}`;
  const fragment = `#version 300 es
  precision highp float;in vec4 glow;out vec4 color;
  void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;
  float halo=exp(-r*5.)*(1.-smoothstep(.65,1.,r));float core=exp(-r*70.);
  color=vec4(glow.rgb*(halo*.36+core*.95),1.);}`;
  const program = compileProgram(vertex, fragment), vao = gl.createVertexArray(), buffer = gl.createBuffer();
  const vp = gl.getUniformLocation(program, 'vp'), pixels = gl.getUniformLocation(program, 'pixels');
  const count = compact ? 70 : 120, data = new Float32Array((count + 40) * 7);
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
  return function render(matrix, state, shrineY, reduced, height) {
    if (state.near < .02 && state.bloom < .02) return;
    let used = 0;
    const t = reduced ? 0 : state.time, strength = state.near * (.22 + .78 * state.bloom);
    for (let i = 0; i < count; i++) {
      const p = sporePosition(i, t, state.bloom, shrineY, reduced);
      const pulse = reduced ? 1 : .76 + .24 * Math.sin(t * .8 + i);
      const gold = i % 5 === 0;
      data.set([...p, (gold ? 1 : .42) * strength * pulse, (gold ? .82 : .7) * strength * pulse, (gold ? .32 : .38) * strength * pulse, .22 + (i % 4) * .04], used * 7);
      used++;
    }
    const heart = [-48, shrineY + 10.6, -59];
    data.set([...heart, .22 * strength, .72 * strength, .4 * strength, .55], used * 7);
    used++;
    gl.useProgram(program); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, used * 7));
    gl.uniformMatrix4fv(vp, false, matrix); gl.uniform1f(pixels, height);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, used);
    gl.depthMask(true); gl.disable(gl.BLEND);
  };
}
