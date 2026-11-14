import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {lifeTarget,waterLevelAt,ValleyLife,RIVER_BASE,RIVER_DROP} from '../dist/valley-life.mjs';

test('the valley begins quiet: a low river, dull colours and few birds',()=>{
  const start=lifeTarget([false,false,false,false]);
  assert.equal(start.drop,RIVER_DROP);assert(start.flow<.3);assert(start.colour<.2);assert(start.song<.4);assert.equal(start.count,0);
});

test('each rhythm gives back its own part',()=>{
  const none=lifeTarget([]),water=lifeTarget([true]),light=lifeTarget([false,true]),breath=lifeTarget([false,false,true]),all=lifeTarget([true,true,true,true]);
  assert.equal(water.drop,0);assert.equal(water.flow,1);assert.equal(light.drop,RIVER_DROP,'light does not fill the river');
  assert(light.colour>water.colour+.2,'the light brings most of the colour');
  assert.equal(breath.song,1);assert(water.song<.5);
  assert(all.colour>=.99&&all.colour<=1);assert.equal(all.count,4);
  for(const k of ['flow','colour','song'])assert(all[k]>=none[k]);
});

test('a seed planted at the spring lifts the river above its old level',()=>{
  const grown=lifeTarget([true,true,true,true],{river:1}),half=lifeTarget([true,true,true,true],{river:.5});
  assert(grown.drop<0&&half.drop<0&&half.drop>grown.drop);assert(grown.flow>1);assert(grown.colour>1);
  assert.equal(lifeTarget([false,true,true,true],{river:1}).drop,RIVER_DROP,'without the water rhythm there is nothing to lift');
});

test('the river is low north of the lake and the star lake always stays full',()=>{
  assert.equal(waterLevelAt(-60,RIVER_DROP),RIVER_BASE-RIVER_DROP);assert.equal(waterLevelAt(80,RIVER_DROP),RIVER_BASE-RIVER_DROP);
  assert.equal(waterLevelAt(110,RIVER_DROP),RIVER_BASE);assert.equal(waterLevelAt(135,RIVER_DROP),RIVER_BASE);
  const mid=waterLevelAt(95,RIVER_DROP);assert(mid>RIVER_BASE-RIVER_DROP&&mid<RIVER_BASE);
  assert.equal(waterLevelAt(-60,0),RIVER_BASE);assert.equal(waterLevelAt(2000,RIVER_DROP),RIVER_BASE,'the pool behind the gate is untouched');
});

test('the shader lowers the water with the same rule the game uses for walking',()=>{
  const src=fs.readFileSync(new URL('../dist/shaders.mjs',import.meta.url),'utf8');
  assert.match(src,/P\.y-=riverDrop\*\(1\.-smoothstep\(80\.,110\.,P\.z\)\)/);
});

test('the valley comes back gradually, and a saved game starts where it was',()=>{
  const life=new ValleyLife([false,false,false,false]);assert.equal(life.now.drop,RIVER_DROP);
  life.aim([true,false,false,false]);life.update(1);assert(life.now.drop<RIVER_DROP&&life.now.drop>1,'still rising after a second');
  for(let i=0;i<600;i++)life.update(.1);assert.equal(life.now.drop,0);assert.equal(life.now.flow,1);assert.equal(life.waterAt(0),RIVER_BASE);
  const saved=new ValleyLife([true,true,true,true]);assert.equal(saved.now.drop,0,'no replay of the rising river on reload');
  life.update(-5);assert(Number.isFinite(life.now.colour));
});
