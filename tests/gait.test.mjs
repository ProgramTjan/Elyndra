import test from 'node:test';import assert from 'node:assert/strict';
import {glide,HeadBob} from '../dist/gait.mjs';

test('walking starts and stops within a step instead of snapping',()=>{
  let v=[0,0,0];v=glide(v,[6.5,0,0],1/60);assert(v[0]>0&&v[0]<6.5*.3,'the first frame is a start, not full speed');
  for(let i=0;i<30;i++)v=glide(v,[6.5,0,0],1/60);assert(v[0]>6.4,'full speed within half a second');
  let slide=0;for(let i=0;i<60;i++){v=glide(v,[0,0,0],1/60);slide+=v[0]/60;}
  assert.deepEqual(v,[0,0,0],'comes fully to rest');assert(slide>.15&&slide<.45,'stops within a short step, slid '+slide.toFixed(2));
});

test('flying carries more glide than walking',()=>{
  const stop=flying=>{let v=[16,0,0],d=0;for(let i=0;i<600;i++){v=glide(v,[0,0,0],1/60,flying);d+=v[0]/60;}return d;};
  assert(stop(true)>stop(false)*2);assert(stop(true)<4,'still precise enough to hover between the islands');
});

test('the view dips gently with each step and rests when you stop, fly or prefer less motion',()=>{
  const b=new HeadBob();let low=0,high=-1;
  for(let i=0;i<300;i++){const y=b.update(6.5/60);low=Math.min(low,y);high=Math.max(high,y);}
  assert(low<-.03&&low>=-.05,'a few centimetres, got '+low);assert(high<=0);
  for(let i=0;i<120;i++)b.update(0);assert.equal(b.update(0),0);
  const fly=new HeadBob();for(let i=0;i<120;i++)assert.equal(fly.update(.3,{grounded:false}),0);
  const calm=new HeadBob();for(let i=0;i<120;i++)assert.equal(calm.update(.1,{still:true}),0);
  const run=new HeadBob();let deep=0;for(let i=0;i<300;i++)deep=Math.min(deep,run.update(14.3/60,{running:true}));assert(deep<low);
});
