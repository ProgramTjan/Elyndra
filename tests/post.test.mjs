import test from 'node:test';import assert from 'node:assert/strict';
import {sunOnScreen,rayStrength,createPost} from '../dist/post.mjs';

// A simple camera looking down -z: w = -z.
const lookNorth=[1,0,0,0,0,1,0,0,0,0,1,-1,0,0,0,0];

test('the sun is placed on screen, fades just outside it and vanishes behind the camera',()=>{
  const ahead=sunOnScreen(lookNorth,[0,0,0],[0,0,-1]);
  assert.deepEqual(ahead.uv,[.5,.5]);assert.equal(ahead.visible,1);
  const edge=sunOnScreen(lookNorth,[0,0,0],[.75,0,-.66]);assert(edge.uv[0]>1&&edge.visible>0&&edge.visible<1);
  assert.equal(sunOnScreen(lookNorth,[0,0,0],[0,0,1]).visible,0);
});

test('shafts of light are strongest at a low warm sun, grow in mist and stay faint under the moon',()=>{
  const noon=rayStrength({visible:1,warmth:0,night:0}),dawn=rayStrength({visible:1,warmth:1,night:0}),moon=rayStrength({visible:1,warmth:0,night:1});
  assert(dawn>noon*2);assert(moon>0&&moon<noon);
  assert(rayStrength({visible:1,warmth:1,night:0,mist:.9})>dawn);
  assert.equal(rayStrength({visible:0,warmth:1}),0);
});

test('without working shaders the world still draws directly',()=>{
  const gl=new Proxy({createShader:()=>({}),getShaderParameter:()=>false,getShaderInfoLog:()=>'no'},{get:(o,k)=>o[k]??(()=>{})});
  const warn=console.warn;console.warn=()=>{};const post=createPost(gl);console.warn=warn;
  assert.equal(post.ready,false);post.resize(100,100,4);assert.equal(post.begin(),false);post.end({});
});
