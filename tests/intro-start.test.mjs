import assert from 'node:assert/strict';import fs from 'node:fs';
const uniformNames=new Set([...(fs.readFileSync(new URL('../dist/deer-mirror.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/world.js',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/brook-wonder.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/atmosphere.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/cathedral-wonder.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/gate-wonder.mjs',import.meta.url),'utf8')).matchAll(/uniform\s+\w+\s+(\w+)/g)].map(m=>m[1]));
let raf;const nodes=new Map(),events=new Map();let eye,viewYaw,viewPitch;
const gl=new Proxy({FRAMEBUFFER_COMPLETE:1,checkFramebufferStatus:()=>1,getShaderParameter:()=>true,getProgramParameter:()=>true,createShader:()=>({}),createProgram:()=>({}),createVertexArray:()=>({}),createBuffer:()=>({}),bufferData:(target,data)=>{assert(data.every(Number.isFinite),'Uploaded geometry must be finite')},createTexture:()=>({}),createFramebuffer:()=>({}),getUniformLocation:(p,n)=>{assert(uniformNames.has(n.split('[')[0]),'Shader uniform exists: '+n);return n},uniform1f:(u,v)=>{if(u==='yaw')viewYaw=v;if(u==='pitch')viewPitch=v},uniformMatrix4fv:(u,t,v)=>{assert(Array.from(v).every(Number.isFinite),'Shader matrices must be finite')},uniform3fv:(u,v)=>{if(u==='eye')eye=[...v]}},{get:(o,k)=>o[k]??(()=>{})});
function element(){const handlers={};return{style:{},children:[],hidden:false,open:false,classList:{add(){},remove(){}},textContent:'',innerHTML:'',getContext:()=>gl,appendChild(e){this.children.push(e)},addEventListener(k,f){(handlers[k]??=[]).push(f)},emit(k,e){for(const f of handlers[k]??[])f(e)},focus(){},showModal(){this.open=true},close(){this.open=false;for(let f of handlers.close??[])f()},setAttribute(){},setPointerCapture(){}}}
for(const m of fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').matchAll(/id="([^"]+)"/g))nodes.set(m[1],element());
globalThis.document={hidden:false,body:element(),getElementById(id){assert(nodes.has(id),id);return nodes.get(id)},querySelector:()=>[...nodes.values()].find(n=>n.open)??null,createElement:element};
globalThis.window=globalThis;globalThis.innerWidth=400;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;globalThis.matchMedia=q=>({matches:q.includes('coarse')||q.includes('reduced-motion')});globalThis.requestAnimationFrame=f=>{raf=f};globalThis.setTimeout=()=>1;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>1;globalThis.addEventListener=(k,f)=>{if(!events.has(k))events.set(k,[]);events.get(k).push(f)};globalThis.dispatchEvent=e=>{for(const f of events.get(e.type)??[])f(e)};globalThis.CustomEvent=class{constructor(type,args){this.type=type;this.detail=args.detail}};
await import('../dist/world.js');const frame=raf,$=id=>nodes.get(id);let time=0;frame(time+=50);
$('enter').onclick();assert.equal($('intro-film').hidden,false,'Explicit watch must play even with reduced motion');for(let i=0;i<445;i++)frame(time+=50);assert($('onboarding').open,'Film ends with explanation');$('onboarding-free').onclick();frame(time+=50);const position=[...eye];
$('intro-replay').onclick();assert.equal($('intro-film').hidden,false,'Explicit replay must also play');frame(time+=50);$('intro-skip').onclick();assert($('onboarding').open);$('onboarding-free').onclick();frame(time+=50);assert(Math.hypot(...eye.map((x,i)=>x-position[i]))<.2);
const oldYaw=viewYaw,oldPitch=viewPitch;const canvas=$('world');canvas.emit('pointerdown',{pointerId:1,pointerType:'touch',clientX:100,clientY:100});canvas.emit('pointermove',{pointerId:1,pointerType:'touch',clientX:140,clientY:140});frame(time+=50);assert(Math.abs(viewYaw-oldYaw-.16)<1e-6,'Touch right must turn right');assert(Math.abs(viewPitch-oldPitch+.12)<1e-6,'Vertical behavior must stay unchanged');canvas.emit('pointerup',{});const touchYaw=viewYaw;canvas.emit('pointerdown',{pointerId:2,pointerType:'mouse',clientX:100,clientY:100});canvas.emit('pointermove',{pointerId:2,pointerType:'mouse',clientX:140,clientY:100});frame(time+=50);assert(Math.abs(viewYaw-touchYaw-.16)<1e-6,'Mouse drag right must turn right');canvas.emit('pointerup',{});
globalThis.devicePixelRatio=2;const beforeQuality=[...eye];$('quality').value='fast';$('quality').onchange();frame(time+=50);assert.equal(canvas.width,400);$('quality').value='high';$('quality').onchange();frame(time+=50);assert.equal(canvas.width,800);assert(Math.hypot(...eye.map((v,i)=>v-beforeQuality[i]))<.2,'Quality preserves camera');$('cathedral-view').onclick();frame(time+=50);const fixed=[...eye];$('cathedral-view').onclick();frame(time+=50);assert.deepEqual(eye,fixed,'Reference viewpoint is repeatable');
$('weather').value='rain';$('weather').onchange();frame(time+=50);
assert.equal($('fly').textContent,'Landen','Flight stays free under chosen rain');
$('time').onclick();frame(time+=50);
assert.equal($('time').textContent,'Middag','Light button advances the named hour');
$('cathedral-breath').onclick();frame(time+=50);
assert.equal($('fly').textContent,'Vliegen','The shrine is reached on foot; flight stays available');
assert.equal($('time').textContent,'Gouden uur');
for(let i=0;i<320;i++)frame(time+=50);
assert.equal($('brook-title').textContent,'Een vergeten hartslag','Low sun and stillness wake the seed shrine');
assert.equal($('brook-caption').hidden,false);
$('gate-mirror').onclick();frame(time+=50);
assert.equal($('fly').textContent,'Vliegen','The gate is reached on foot; flight stays available');
assert.equal($('time').textContent,'Schemering');
for(let i=0;i<320;i++)frame(time+=50);
assert.equal($('brook-title').textContent,'Een bos dat hier niet groeit','Dusk and a waking ring hold the other forest');
assert.equal($('brook-caption').hidden,false);
$('start-direct').onclick();assert($('onboarding').open,'Direct explanation stays animation-free');assert.equal($('intro-film').hidden,true);
console.log('Passed: explicit watch/replay with reduced motion, 22-second completion, skip, direct guide, camera restore, reversed touch yaw and preserved mouse/vertical controls.');
// Exercise optional proximity audio without a physical audio device.
const audioGains=[];function audioParam(){return{value:0,setTargetAtTime(v){assert(Number.isFinite(v));this.value=v},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}}function audioNode(){return{connect(){},start(){},stop(){},frequency:audioParam(),Q:audioParam()}}
globalThis.AudioContext=class{constructor(){this.currentTime=1;this.sampleRate=100;this.destination={}}resume(){}createGain(){let n={...audioNode(),gain:audioParam()};audioGains.push(n);return n}createOscillator(){return audioNode()}createBuffer(ch,n){return{getChannelData:()=>new Float32Array(n)}}createBufferSource(){return audioNode()}createBiquadFilter(){return audioNode()}};
$('onboarding-free').onclick();$('sound').onclick();$('cathedral-view').onclick();frame(time+=50);const nearGain=audioGains[1].gain.value;assert(nearGain>0,'Local tone is audible near cathedral');$('destinations').children[2].onclick();frame(time+=50);assert.equal(audioGains[1].gain.value,0,'Local tone fades away from cathedral');$('sound').onclick();assert.equal(audioGains[0].gain.value,0,'Sound toggle silences all layers');console.log('Passed: optional audio, proximity falloff and mute.');

// The new travel destination opens a walkable listening spot, with finite frames.
$('brook-view').onclick();frame(time+=50);assert.equal($('fly').textContent,'Vliegen');
assert(Math.hypot(eye[0]-13.467,eye[2]+8)<17,'Arrival must be inside the listening radius');
for(let i=0;i<460;i++)frame(time+=50);
assert.equal($('brook-title').textContent,'Een hemel onder de wortels','Stillness reveals the constellation');
assert.equal($('brook-caption').hidden,false);
console.log('Brook arrival, encounter integration and reduced-motion constellation passed.');
// Walk to the hidden garden through the normal controls; discovering it unlocks return travel.
assert.equal($('garden-view').hidden,true,'Secret destination starts undiscovered');
for(let i=0;i<180 && Math.hypot(eye[0]+9,eye[2]+46)>1;i++){
 const desired=Math.atan2(-9-eye[0],-(-46-eye[2]));
 const turn=Math.atan2(Math.sin(desired-viewYaw),Math.cos(desired-viewYaw));
 canvas.emit('pointerdown',{pointerId:7,pointerType:'touch',clientX:100,clientY:100});
 canvas.emit('pointermove',{pointerId:7,pointerType:'touch',clientX:100+turn/.004,clientY:100});
 canvas.emit('pointerup',{});
 dispatchEvent({type:'keydown',code:'KeyW',repeat:false,preventDefault(){}});frame(time+=50);
}
dispatchEvent({type:'keyup',code:'KeyW'});
for(let i=0;i<320;i++)frame(time+=50);
assert.equal($('garden-view').hidden,false,'Arriving by foot reveals the secret destination');
$('garden-view').onclick();frame(time+=50);
assert(Math.hypot(eye[0]+9,eye[2]+46)<12,'Unlocked return travel arrives in the garden');
console.log('Garden: normal walking, discovery, flower render and unlocked return travel passed.');

// Continue the same visit until the dragon lands; camera remains under user control.
for(let i=0;i<480;i++)frame(time+=50);
assert.equal($('brook-title').textContent,'Hij blijft','The garden leads to a landed dragon');
assert(Math.hypot(eye[0]+4,eye[2]+37)<.1,'The landing must not move the visitor');
console.log('Dragon landing integration and visitor camera control passed.');

// Invite through the actual UI and walk the shared route with normal movement input.
function walkTo(x,z,limit=240){
 for(let i=0;i<limit&&Math.hypot(eye[0]-x,eye[2]-z)>.55;i++){
  const desired=Math.atan2(x-eye[0],-(z-eye[2])),turn=Math.atan2(Math.sin(desired-viewYaw),Math.cos(desired-viewYaw));
  canvas.emit('pointerdown',{pointerId:9,pointerType:'touch',clientX:100,clientY:100});
  canvas.emit('pointermove',{pointerId:9,pointerType:'touch',clientX:100+turn/.004,clientY:100});
  canvas.emit('pointerup',{});dispatchEvent({type:'keydown',code:'KeyW',repeat:false,preventDefault(){}});frame(time+=50);
 }
 dispatchEvent({type:'keyup',code:'KeyW'});
}
walkTo(-8.25,-38.3);for(let i=0;i<220;i++)frame(time+=50);
assert.equal($('dragon-invite').hidden,false,'A trusted greeting reveals the invitation');
const invitedFrom=[...eye];$('dragon-invite').onclick();frame(time+=50);
assert.equal(window.elyndraLook().invitation.phase,'accepting');
assert(Math.hypot(...eye.map((v,i)=>v-invitedFrom[i]))<.1,'Accepting does not take the camera');
for(let i=0;i<900&&window.elyndraLook().invitation.phase!=='waiting';i++)frame(time+=50);
assert.equal(window.elyndraLook().invitation.phase,'waiting');
for(let i=0;i<30&&window.elyndraLook().invitation.phase!=='weaving';i++){
 const p=window.elyndraLook().invitation.pose.position;walkTo(p[0]+1,p[2]+3,25);
 for(let j=0;j<20;j++)frame(time+=50);
}
assert.equal(window.elyndraLook().invitation.phase,'weaving','The existing controls can complete the cleared route');
for(const [x,z] of [[-23,-16],[-19,-16],[-19,-12],[-23,-12]])walkTo(x,z);
for(let i=0;i<180;i++)frame(time+=50);
assert(window.elyndraLook().invitation.flowers.length>=4,'Walking creates the constellation');
assert.equal($('dragon-invite').hidden,false);
const paused=window.elyndraLook().invitation;window.elyndraVisionOpen=true;
for(let i=0;i<80;i++)frame(time+=50);
assert.deepEqual(window.elyndraLook().invitation,paused,'A modal pauses the integrated journey');
window.elyndraVisionOpen=false;
dispatchEvent({type:'keydown',code:'KeyR',repeat:false,target:{tagName:'BODY'}});frame(time+=50);
assert.equal(window.elyndraLook().invitation.phase,'farewell','Keyboard and touch share the same action');
for(let i=0;i<570;i++)frame(time+=50);
assert.equal(window.elyndraLook().invitation.phase,'idle');
assert.equal(window.elyndraLook().dragon.phase,'orbit','The ordinary dragon resumes after farewell');
console.log('Invitation: touch, keyboard, walkable route, waiting, light flowers, paused dialogs and return to ordinary flight passed.');

// The squirrel is reached from normal travel, then followed on foot.
$('destinations').children[3].onclick();for(let i=0;i<80;i++)frame(time+=50);
assert.equal($('squirrel-invite').hidden,false,'The keeper destination makes the invitation discoverable');
walkTo(96,50);$('squirrel-invite').onclick();frame(time+=50);
assert.equal(window.elyndraLook().squirrel.phase,'invited');
const audience=[...eye];for(let i=0;i<205;i++)frame(time+=50);
assert(Math.hypot(eye[0]-audience[0],eye[2]-audience[2])<.01,'His climb never moves the camera');
for(let i=0;i<250&&window.elyndraLook().squirrel.phase!=='ready';i++){
 const p=window.elyndraLook().squirrel.position;walkTo(p[0]+1.7,p[2]-2.2,12);
 for(let j=0;j<12;j++)frame(time+=50);
}
assert.equal(window.elyndraLook().squirrel.phase,'ready','The trail and stump colliders allow a complete walk');
assert.equal($('squirrel-view').hidden,true,'The monument remains secret before the reveal');
walkTo(130,140);frame(time+=50);assert.equal($('squirrel-invite').hidden,false);
const sqPaused=window.elyndraLook().squirrel;window.elyndraVisionOpen=true;
for(let i=0;i<80;i++)frame(time+=50);assert.deepEqual(window.elyndraLook().squirrel,sqPaused);window.elyndraVisionOpen=false;
dispatchEvent({type:'keydown',code:'KeyG',repeat:false,target:{tagName:'BODY'}});frame(time+=50);
assert.equal(window.elyndraLook().squirrel.phase,'revealing');
for(let i=0;i<530;i++)frame(time+=50);
assert(window.elyndraLook().squirrel.revealed);assert.equal($('squirrel-view').hidden,false);
assert.equal(window.elyndraSquirrelContext().monument,true);
$('squirrel-view').onclick();frame(time+=50);
assert(Math.abs(viewYaw-Math.PI)<.001,'Return travel looks towards the monument');
assert(Math.hypot(eye[0]-130,eye[2]-134)<.01);
console.log('Squirrel: invitation at keeper, complete walk, camera freedom, touchstone, reveal, remembered context and return viewpoint passed.');

// The lake encounter is reachable and completable through ordinary visitor inputs.
$('deer-mirror-view').onclick();frame(time+=50);
for(let i=0;i<130;i++)frame(time+=50);
assert.equal($('deer-mirror-invite').hidden,false);
const lakeEye=[...eye];$('deer-mirror-invite').onclick();frame(time+=50);
assert.equal(window.elyndraLook().mirror.phase,'entering');
assert(Math.hypot(...eye.map((v,i)=>v-lakeEye[i]))<.1,'Invitation preserves the visitor camera');
for(let i=0;i<170;i++)frame(time+=50);
assert.equal(window.elyndraLook().mirror.phase,'searching');
const mirrorPaused=window.elyndraLook().mirror;window.elyndraVisionOpen=true;
for(let i=0;i<80;i++)frame(time+=50);
assert.deepEqual(window.elyndraLook().mirror,mirrorPaused);window.elyndraVisionOpen=false;
walkTo(9,139);for(let i=0;i<70;i++)frame(time+=50);
assert.equal(window.elyndraLook().mirror.phase,'opening','Ordinary walking can align the reflection');
for(let i=0;i<650;i++)frame(time+=50);
assert.equal(window.elyndraLook().mirror.phase,'farewell');
assert.equal(window.elyndraLook().mirror.fade,1,'The deer returns visibly');
assert(window.elyndraLook().mirror.completed);
console.log('Deer mirror: travel, invitation, free camera, modal pause, walking alignment, underwater forest and visible return passed.');
