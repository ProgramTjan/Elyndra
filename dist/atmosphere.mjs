// Daylight is a slow breath: eight minutes around the valley, named hours you can skip to.
export const DAY_SECONDS = 480;
export const WEATHERS = Object.freeze(['clear', 'mist', 'rain']);
export const LIGHT_STOPS = Object.freeze([6.2, 8.5, 12, 17.2, 19.5, 22]);
const clamp = x => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
export function wrapHour(hour) {
  return ((hour % 24) + 24) % 24;
}
export function hourName(hour) {
  const h = wrapHour(hour);
  if (h >= 5 && h < 7.5) return 'Dageraad';
  if (h >= 7.5 && h < 11) return 'Ochtend';
  if (h >= 11 && h < 16) return 'Middag';
  if (h >= 16 && h < 18.2) return 'Gouden uur';
  if (h >= 18.2 && h < 20.6) return 'Schemering';
  return 'Nacht';
}
export function nextLightHour(hour) {
  const h = wrapHour(hour);
  for (const stop of LIGHT_STOPS) if (stop > h + 0.4) return stop;
  return LIGHT_STOPS[0];
}
export function nightFromHour(hour) {
  const h = wrapHour(hour);
  if (h >= 7.5 && h <= 16.5) return 0;
  if (h > 16.5 && h < 19.5) return (h - 16.5) / 3 * 0.42;
  if (h >= 19.5 && h < 21) return 0.42 + (h - 19.5) / 1.5 * 0.58;
  if (h >= 21 || h < 5) return 1;
  return clamp(1 - (h - 5) / 2.5);
}
export function warmthFromHour(hour) {
  const h = wrapHour(hour);
  const sunset = Math.exp(-(((h - 18) / 1.25) ** 2));
  const sunrise = Math.exp(-(((h - 6.15) / 1.05) ** 2));
  return Math.max(sunset, sunrise);
}
export function sunDirection(hour) {
  const h = wrapHour(hour);
  if (h < 5.8 || h > 18.4) {
    const l = Math.hypot(.25, .4, .58);
    return [.25 / l, .4 / l, .58 / l];
  }
  const t = (h - 6) / 12;
  const x = -(.15 + t * .55);
  const y = .18 + Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * .62;
  const z = -(.75 - t * .4);
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}
export function pickVisitHour(random = Math.random) {
  const r = random();
  if (r < .55) return 8 + random() * 8;
  if (r < .8) return 16 + random() * 3.4;
  return (20.5 + random() * 5.5) % 24;
}
export function pickVisitWeather(pref = 'auto', random = Math.random) {
  if (WEATHERS.includes(pref)) return pref;
  const r = random();
  if (r < .5) return 'clear';
  if (r < .8) return 'mist';
  return 'rain';
}
function weatherAmounts(kind, rainAge = 0) {
  if (kind === 'mist') return {rain: 0, mist: .88, wet: .08, phase: 'mist'};
  if (kind === 'rain') {
    const after = rainAge > 90;
    if (after) return {rain: mix(.85, 0, clamp((rainAge - 90) / 20)), mist: mix(.42, .3, clamp((rainAge - 90) / 20)), wet: mix(.45, .82, clamp((rainAge - 90) / 16)), phase: 'afterglow'};
    return {rain: .86, mist: .42, wet: mix(.25, .55, clamp(rainAge / 40)), phase: 'rain'};
  }
  return {rain: 0, mist: .08, wet: 0, phase: 'clear'};
}

export class Atmosphere {
  constructor({hour = 9, weather = 'clear', preference = 'auto', cycle = true} = {}) {
    this.hour = wrapHour(hour);
    this.preference = preference === 'auto' || WEATHERS.includes(preference) ? preference : 'auto';
    this.locked = this.preference !== 'auto';
    this.weather = this.locked ? this.preference : (WEATHERS.includes(weather) ? weather : 'clear');
    this.cycle = cycle;
    this.rainAge = 0;
    Object.assign(this, weatherAmounts(this.weather, this.rainAge));
  }
  jumpTo(hour) {
    this.hour = wrapHour(hour);
    return this.snapshot();
  }
  setPreference(pref) {
    this.preference = pref === 'auto' || WEATHERS.includes(pref) ? pref : 'auto';
    this.locked = this.preference !== 'auto';
    if (this.locked) {
      this.weather = this.preference;
      this.rainAge = this.weather === 'rain' ? 0 : 0;
      Object.assign(this, weatherAmounts(this.weather, this.rainAge));
    }
    return this.snapshot();
  }
  update(dt, enabled = true) {
    dt = Math.max(0, Math.min(.05, dt));
    if (enabled && this.cycle) this.hour = wrapHour(this.hour + dt * 24 / DAY_SECONDS);
    if (this.weather === 'rain') this.rainAge += dt;
    const target = weatherAmounts(this.weather, this.locked ? 0 : this.rainAge);
    if (this.locked && this.weather === 'rain') {
      target.rain = .86; target.mist = .42; target.wet = mix(.3, .6, clamp(this.rainAge / 50)); target.phase = 'rain';
    }
    const follow = 1 - Math.exp(-dt * 1.8);
    this.rain += (target.rain - this.rain) * follow;
    this.mist += (target.mist - this.mist) * follow;
    this.wet += (target.wet - this.wet) * follow;
    this.phase = target.phase;
    return this.snapshot();
  }
  snapshot() {
    return {
      hour: this.hour, name: hourName(this.hour), weather: this.weather, phase: this.phase,
      night: nightFromHour(this.hour), warmth: warmthFromHour(this.hour),
      rain: this.rain, mist: this.mist, wet: this.wet,
      sun: sunDirection(this.hour), preference: this.preference, cycle: this.cycle
    };
  }
}

function hash(i) {
  return ((Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) >>> 0) ^ (Math.imul(i, 0xc2b2ae35) >>> 0)) / 4294967296;
}

// Falling sparks around the visitor; reduced motion holds them as hanging beads.
export function rainPosition(i, eye, time, reduced = false) {
  const span = 30, fall = reduced ? 0 : (time * 17 + hash(i + 3) * 40) % 36;
  return [
    eye[0] + (hash(i) - .5) * span * 2,
    eye[1] + 20 - fall,
    eye[2] + (hash(i + 11) - .5) * span * 2
  ];
}

export function createWeatherAtmosphere(gl, compileProgram, compact = false) {
  const vertex = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 point;layout(location=1) in vec4 tint;
  uniform mat4 vp;uniform float pixels;out vec4 glow;
  void main(){gl_Position=vp*vec4(point,1.);gl_PointSize=clamp(tint.a*pixels/max(.2,gl_Position.w),1.,28.);glow=tint;}`;
  const fragment = `#version 300 es
  precision highp float;in vec4 glow;out vec4 color;
  void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;
  float streak=exp(-p.x*p.x*18.)*exp(-p.y*p.y*3.2);color=vec4(glow.rgb*streak,1.);}`;
  const program = compileProgram(vertex, fragment), vao = gl.createVertexArray(), buffer = gl.createBuffer();
  const vp = gl.getUniformLocation(program, 'vp'), pixels = gl.getUniformLocation(program, 'pixels');
  const count = compact ? 90 : 170, data = new Float32Array(count * 7);
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
  return function render(matrix, eye, state, reduced, height) {
    if (state.rain < .05) return;
    let used = 0;
    const t = reduced ? 0 : state.time ?? 0, strength = state.rain;
    for (let i = 0; i < count; i++) {
      const p = rainPosition(i, eye, t, reduced);
      data.set([...p, .55 * strength, .68 * strength, .72 * strength, .16 + (i % 4) * .03], used * 7);
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
