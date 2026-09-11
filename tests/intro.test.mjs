import assert from 'node:assert/strict';
import {INTRO_SHOTS,INTRO_DURATION,introFrame} from '../dist/intro-route.mjs';
assert.equal(INTRO_DURATION,22);
let visited=new Set();for(let t=0;t<=22;t+=.025){const f=introFrame(t);visited.add(f.index);assert(f.position.every(Number.isFinite));assert(Number.isFinite(f.yaw)&&Number.isFinite(f.pitch));assert(f.fade>=0&&f.fade<=1.00001);assert(f.progress>=0&&f.progress<=1)}
assert.equal(visited.size,4);assert(!introFrame(21.9).done);assert(introFrame(22).done);assert.deepEqual(introFrame(100).position,INTRO_SHOTS.at(-1).to);
console.log('Intro: four finite camera paths, 22-second ending, safe fade and progress bounds.');
