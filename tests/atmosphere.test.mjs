import assert from 'node:assert/strict';
import {
  Atmosphere, DAY_SECONDS, LIGHT_STOPS, hourName, nextLightHour, nightFromHour,
  pickVisitHour, pickVisitWeather, rainPosition, sunDirection, warmthFromHour, wrapHour
} from '../dist/atmosphere.mjs';

assert.equal(wrapHour(-1), 23);
assert.equal(wrapHour(24.5), .5);
assert.equal(hourName(6.4), 'Dageraad');
assert.equal(hourName(9), 'Ochtend');
assert.equal(hourName(13), 'Middag');
assert.equal(hourName(17), 'Gouden uur');
assert.equal(hourName(19.8), 'Schemering');
assert.equal(hourName(23), 'Nacht');
assert.equal(hourName(2), 'Nacht');
assert.equal(nextLightHour(8), 8.5);
assert.equal(nextLightHour(22.2), LIGHT_STOPS[0]);
assert.equal(nightFromHour(12), 0);
assert.equal(nightFromHour(23), 1);
assert(nightFromHour(18.5) > .1 && nightFromHour(18.5) < .6);
assert(warmthFromHour(18) > warmthFromHour(12));
assert(warmthFromHour(6.2) > warmthFromHour(12));
const noon = sunDirection(13);
assert(noon.every(Number.isFinite));
assert(noon[1] > sunDirection(7)[1], 'Sun climbs toward midday');
assert(sunDirection(0)[1] > 0, 'Moonlight stays above the horizon for a fill light');

const seq = [0, 0, 0];
let i = 0;
const rng = () => seq[i++] ?? 0;
assert.equal(pickVisitWeather('rain', rng), 'rain');
i = 0;
assert.equal(pickVisitWeather('auto', () => .2), 'clear');
assert.equal(pickVisitWeather('auto', () => .6), 'mist');
assert.equal(pickVisitWeather('auto', () => .9), 'rain');
const dayHour = pickVisitHour(() => .1);
assert(dayHour >= 8 && dayHour <= 16);

const sky = new Atmosphere({hour: 9, weather: 'clear', preference: 'auto'});
const start = sky.hour;
for (let n = 0; n < 200; n++) sky.update(.05);
assert(Math.abs(sky.hour - (start + 10 * 24 / DAY_SECONDS)) < 1e-6, 'Eight-minute days advance 0.5 hours in ten seconds');
const paused = sky.hour;
sky.update(.05, false);
assert.equal(sky.hour, paused, 'Paused worlds do not skip daylight');

sky.jumpTo(19.5);
assert.equal(hourName(sky.hour), 'Schemering');
const jumped = sky.jumpTo(8.5);
assert.equal(jumped.name, 'Ochtend');
assert.equal(jumped.night, 0);

const rain = new Atmosphere({hour: 10, weather: 'rain', preference: 'auto'});
assert(rain.snapshot().rain > .7);
for (let n = 0; n < 2200; n++) rain.update(.05);
assert.equal(rain.phase, 'afterglow');
assert(rain.rain < .2, 'Visit rain can dry into sparkle');
assert(rain.wet > .6);

const locked = new Atmosphere({hour: 10, weather: 'rain', preference: 'rain'});
for (let n = 0; n < 2200; n++) locked.update(.05);
assert.equal(locked.phase, 'rain');
assert(locked.rain > .7, 'Chosen rain stays for the visit');

locked.setPreference('mist');
for (let n = 0; n < 40; n++) locked.update(.05);
assert.equal(locked.weather, 'mist');
assert(locked.rain < .15);
assert(locked.mist > .6);

const keep = new Atmosphere({hour: 11, weather: 'mist', preference: 'auto'});
keep.setPreference('auto');
assert.equal(keep.weather, 'mist', 'Auto mid-visit keeps the weather this visit already chose');

const eye = [0, 4, 0];
const a = rainPosition(3, eye, 1);
const b = rainPosition(3, eye, 1);
assert.deepEqual(a, b);
const moving = rainPosition(3, eye, 4);
assert.notEqual(moving[1], a[1]);
assert.deepEqual(rainPosition(4, eye, 9, true), rainPosition(4, eye, 0, true));

console.log('Atmosphere: hours, cycle, weather preference, afterglow and rain points passed.');
