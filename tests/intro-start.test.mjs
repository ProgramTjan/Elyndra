import assert from 'node:assert/strict';import fs from 'node:fs';
const uniformNames=new Set([...(fs.readFileSync(new URL('../dist/deer-mirror.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/world.js',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/brook-wonder.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/atmosphere.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/cathedral-wonder.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/gate-wonder.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/post.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/shaders.mjs',import.meta.url),'utf8')).matchAll(/uniform\s+\w+\s+(\w+)/g)].map(m=>m[1]));
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
// Isolate the shared encounter boundary: an active squirrel journey must suppress
// an otherwise valid dragon invitation, and releasing it restores the prompt.
const {SquirrelSecret}=await import('../dist/squirrel-secret.mjs?v=gathering42');
const originalSquirrelUpdate=SquirrelSecret.prototype.update;
try{
 SquirrelSecret.prototype.update=function(...args){return {...originalSquirrelUpdate.apply(this,args),active:true};};
 frame(time+=50);assert.equal($('dragon-invite').hidden,true,'An active squirrel journey hides the unavailable dragon invitation');
}finally{SquirrelSecret.prototype.update=originalSquirrelUpdate;}
frame(time+=50);assert.equal($('dragon-invite').hidden,false,'The dragon invitation returns when the squirrel journey is inactive');

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
for(let i=0;i<12;i++)frame(time+=50); // let the walker come to rest
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


// Menus and focused form controls own their input; gameplay resumes after closing.
function key(code,target='BODY',extra={}){let prevented=false;dispatchEvent({type:'keydown',code,repeat:false,target:{tagName:target},preventDefault(){prevented=true},...extra});return prevented;}
function release(code){dispatchEvent({type:'keyup',code});}
function horizontalDistance(a,b){return Math.hypot(a[0]-b[0],a[2]-b[2]);}
$('cathedral-view').onclick();frame(time+=50);
key('KeyW');$('help').onclick();const menuPosition=window.elyndraLook().pos;
assert.equal(key('ArrowDown','SELECT'),false,'Native select arrows must not be prevented');
for(let i=0;i<20;i++)frame(time+=50);
assert.equal(horizontalDistance(window.elyndraLook().pos,menuPosition),0,'Opening help clears held movement and select arrows do not move the visitor');
release('KeyW');release('ArrowDown');
assert.equal(key('Space','BUTTON'),false,'Space remains available to activate UI buttons');
const menuYaw=viewYaw;canvas.emit('pointerdown',{pointerId:91,pointerType:'touch',clientX:100,clientY:100});canvas.emit('pointermove',{pointerId:91,clientX:160,clientY:100});frame(time+=50);
assert.equal(viewYaw,menuYaw,'Touch look is blocked behind help');canvas.emit('pointerup',{});
$('closehelp').onclick();
assert.equal(key('Space','BUTTON'),false,'Focused gameplay buttons retain native Space activation');release('Space');
const ordinaryPosition=window.elyndraLook().pos;key('KeyW','BUTTON');frame(time+=50);release('KeyW');
assert(horizontalDistance(window.elyndraLook().pos,ordinaryPosition)>.1,'WASD still works after clicking a gameplay button');
for(let i=0;i<40;i++)frame(time+=50); // the last movement glides to a halt
const modifierPosition=window.elyndraLook().pos;key('KeyW','BODY',{ctrlKey:true});frame(time+=50);release('KeyW');
assert.equal(horizontalDistance(window.elyndraLook().pos,modifierPosition),0,'Browser modifier shortcuts do not move the visitor');
key('KeyW');$('travel').onclick();const travelPosition=window.elyndraLook().pos;for(let i=0;i<10;i++)frame(time+=50);release('KeyW');
assert.equal(horizontalDistance(window.elyndraLook().pos,travelPosition),0,'Opening travel clears held movement');key('Escape');assert($('travelmenu').hidden);

// Register the actual vision shortcut module and check modal/intro isolation.
for(const el of nodes.values()){el.getBoundingClientRect=()=>({width:800,height:600});el.replaceChildren=()=>{el.children=[]};el.classList.toggle=()=>{};}
const originalCreate=document.createElement;
document.createElement=()=>{const el=originalCreate();el.append=(...children)=>el.children.push(...children);el.querySelector=()=>({textContent:''});el.classList.toggle=()=>{};return el;};
const puzzleRequests=[];window.elyndraGame={unlocked:()=>false,count:()=>0};window.elyndraStartPuzzle=i=>puzzleRequests.push(i);
await import('../dist/visions.js');
$('intro-replay').onclick();key('KeyV');assert.equal(puzzleRequests.length,0,'V cannot open a puzzle during the film');
$('intro-skip').onclick();key('KeyV');assert.equal(puzzleRequests.length,0,'V cannot stack a puzzle over onboarding');
$('onboarding-free').onclick();$('conversation-dialog').showModal();key('KeyV');assert.equal(puzzleRequests.length,0,'V cannot stack a puzzle over a conversation');$('conversation-dialog').close();
$('help').onclick();key('KeyV');assert.equal(puzzleRequests.length,0,'V cannot open a puzzle behind help');$('closehelp').onclick();
key('KeyV','BODY',{ctrlKey:true});assert.equal(puzzleRequests.length,0,'Modified V remains a browser shortcut');
key('KeyV');assert.equal(puzzleRequests.length,1,'V still opens a nearby puzzle in normal play');release('KeyV');
console.log('Input ownership: menus clear movement, selects/buttons retain native keys, touch look is blocked behind help, normal WASD survives button focus, and V respects intro/modals/modifiers.');

// Play the keeper's response through the real conversation and world controllers.
// Earlier steps earned the dragon's trust; this harness also runs without storage.
assert(window.elyndraForestMemory().dragonKnown);
function litGardenFlowers(){
 let count=0;
 const uniform=gl.uniform1f;
 gl.uniform1f=(name,value)=>{if(name==='returnLight'&&value>0)count++;uniform(name,value)};
 try {frame(time+=50)} finally {gl.uniform1f=uniform}
 return count;
}
$('garden-view').onclick();
assert.equal(litGardenFlowers(),2,'A returning visitor sees two welcoming flowers in reduced motion');
await import('../dist/conversations.js');
$('destinations').children[3].onclick();frame(time+=50);
walkTo(91,46);frame(time+=50);
$('talk-near').onclick();
const choices=$('conversation-choices');
function chooseText(text){
 const option=choices.children.find(b=>b.textContent===text);
 assert(option,'Expected conversation choice: '+text);
 option.onclick();
}
if(choices.children.some(b=>b.textContent==='De moswachter'))chooseText('De moswachter');
chooseText('Bedoel je de draak in de tuin?');
assert.equal(window.elyndraForestMemory().keeperLight,false,'Asking about the dragon is not consent to send the greeting');
chooseText('Kun je hem nog groeten?');
chooseText('Ik ga kijken.');
$('garden-view').onclick();
assert.equal(litGardenFlowers(),3,'The explicit greeting lights a third real garden flower');
assert.match($('toast').textContent,/moswachter/);

// Follow the actual vision hotspot into the valley and complete the encounter.
window.elyndraGame={unlocked:()=>true,count:()=>4};
dispatchEvent(new CustomEvent('elyndra-reward',{detail:0}));
assert($('vision-dialog').open);
assert($('vision-visit-fox').hidden,'The travel action belongs only to the fox hotspot');
$('vision-points').children[1].onclick();
assert.equal($('vision-visit-fox').hidden,false);
assert.match($('vision-description').textContent,/dageraad/);
$('vision-points').children[0].onclick();assert($('vision-visit-fox').hidden);
$('vision-points').children[1].onclick();$('vision-visit-fox').onclick();
assert(!$('vision-dialog').open&&!window.elyndraVisionOpen,'Travelling closes the modal and resumes play');
frame(time+=50);
assert.equal(window.elyndraLook().flying,false);
assert(Math.abs(window.elyndraLook().hour-6)<.1);
const foxArrival=window.elyndraLook().pos;
assert(Math.hypot(foxArrival[0]+45,foxArrival[2]+26)<.2,'Arrival is the calm viewpoint, without collision displacement');
assert.equal($('fox-spring-view').hidden,true);
for(let i=0;i<280;i++)frame(time+=50);
assert(window.elyndraLook().dwellers.fox.met,'The arrival camera lets the visitor actually see the fox');
assert(window.elyndraLook().dwellers.springFound,'Stillness completes the dig through the world loop');
assert.equal($('fox-spring-view').hidden,false);
assert.match($('toast').textContent,/Water tussen de wortels/);
for(let i=0;i<400;i++)frame(time+=50);
assert.equal(window.elyndraLook().dwellers.fox.phase,'waiting');
$('garden-view').onclick();frame(time+=50);const returnHour=window.elyndraLook().hour;
$('fox-spring-view').onclick();frame(time+=50);
assert(window.elyndraLook().dwellers.springFound);
assert(Math.abs(window.elyndraLook().hour-returnHour)<.1,'Returning to the spring keeps the current light');
assert(Math.hypot(eye[0]+45,eye[2]+26)<.2);
const freePosition=[...eye];key('KeyD');for(let i=0;i<10;i++)frame(time+=50);release('KeyD');
assert(horizontalDistance(eye,freePosition)>1,'The encounter leaves normal walking available');
console.log('Fox vision handoff, natural view, completed source, unlocked return and free walking passed.');

// Complete a different puzzle last: the ceremony is gated by four letters,
// not by the keeper's puzzle, and stays optional on the reward screen.
const puzzleSave = 'elyndra-heartbeats-v1', bloomSave = 'elyndra-four-heartbeats-v1';
const finaleStore = new Map([[puzzleSave, JSON.stringify({
  version:1, solved:[true,true,false,true], stones:[true,false,true,true,false,false]
})]]);
globalThis.localStorage = {
  getItem:key => finaleStore.get(key) ?? null,
  setItem:(key,value) => finaleStore.set(key,value)
};
$('quest-body').querySelectorAll = () => [];
for (const id of ['balance-check','quest-reward','quest-replay']) nodes.set(id,element());
await import('../dist/quests.js');
window.elyndraStartPuzzle(-1);
assert($('quest-finale').hidden,'Three letters cannot open the finale');
window.elyndraStartPuzzle(2);
$('balance-check').onclick();
assert.equal($('quest-finale').hidden,false,'The fourth victory offers the finale with the vision reward');
assert.equal(window.elyndraLook().finale.elapsed,null,'Victory leaves the player free to choose');
$('quest-finale').onclick();
assert(!$('quest-dialog').open);
frame(time+=50);
assert.equal(window.elyndraLook().finale.beat,0);
const finalePosition=[...eye];
$('help').onclick();
const pausedFinale = window.elyndraLook().finale.elapsed;
for(let i=0;i<90;i++)frame(time+=50);
assert.equal(window.elyndraLook().finale.elapsed,pausedFinale);
$('closehelp').onclick();
const witnessed=new Set();
for(let i=0;i<370;i++){
  frame(time+=50);
  if(!$('finale-caption').hidden)witnessed.add($('finale-name').textContent);
}
assert.deepEqual([...witnessed],['Het geheugen','De drempel','Het evenwicht','De stem']);
assert.equal(window.elyndraLook().finale.elapsed,null,'The scene returns to exploration');
assert(horizontalDistance(eye,finalePosition)<.1,'The ceremony does not move the camera after arrival');
assert.equal(finaleStore.get(bloomSave),'bloom');
assert.equal(JSON.parse(finaleStore.get(puzzleSave)).solved.filter(Boolean).length,4);

// Reload the actual quest controller from the saved state. No puzzle event is
// needed to make a completed save eligible. Leaving a replay does not erase it.
await import('../dist/quests.js?restored-finale');
window.elyndraStartPuzzle(-1);
assert.equal($('quest-finale').hidden,false);
$('quest-finale').onclick();
frame(time+=50);
$('garden-view').onclick();frame(time+=50);
assert.equal(window.elyndraLook().finale.elapsed,null,'Travelling away ends the scene');
assert(window.elyndraLook().finale.leafOpened);
console.log('Finale: fourth puzzle in arbitrary order, optional reward, four beats, pause, saved overview, replay and departure passed.');

// Real conversation -> film -> pickup -> escort, using the same world and controls.
$('destinations').children[3].onclick();
for(let i=0;i<700;i++)frame(time+=50);
walkTo(91,46);frame(time+=50);
assert.equal(window.elyndraLook().squirrel.phase,'home');
$('talk-near').onclick();
if(choices.children.some(b=>b.textContent==='De eekhoorn'))chooseText('De eekhoorn');
chooseText('Kom je naar een samenkomst bij de moswachter?');
assert.equal(window.elyndraLook().gathering.phase,'idle','Asking is not acceptance');
const beforeFilm=window.elyndraLook();
chooseText('Ik help je. Laat maar zien!');
assert(!$('conversation-dialog').open&&!window.elyndraVisionOpen,'Native dialogue releases the film');
assert.equal(window.elyndraLook().gathering.phase,'cinematic');
assert.equal(window.elyndraCanInteract(),false);
frame(time+=50);const scenePosition=[...eye];
key('KeyW');canvas.emit('pointerdown',{pointerId:42,pointerType:'touch',clientX:100,clientY:100});
canvas.emit('pointermove',{pointerId:42,clientX:160,clientY:200});
for(let i=0;i<20;i++)frame(time+=50);
assert.deepEqual(eye,scenePosition,'Reduced motion camera is fixed and gameplay cannot steal it');
const filmAge=window.elyndraLook().gathering.elapsed;
document.hidden=true;for(let i=0;i<20;i++)frame(time+=50);document.hidden=false;
assert.equal(window.elyndraLook().gathering.elapsed,filmAge,'Background tab pauses film');
key('Escape');
assert.equal(window.elyndraLook().gathering.phase,'needNut');
assert.deepEqual(window.elyndraLook().pos,beforeFilm.pos,'Skip restores the player camera');
assert.equal(window.elyndraCanInteract(),true);
assert($('gathering-pickup').hidden,'Pickup requires proximity');
const waitPosition=window.elyndraLook().squirrel.position;
$('squirrel-invite').onclick();frame(time+=50);
assert.equal(window.elyndraLook().squirrel.phase,'gathering','Old secret cannot borrow an occupied actor');
$('help').onclick();const pauseAge=window.elyndraLook().gathering.elapsed;
for(let i=0;i<20;i++)frame(time+=50);
assert.equal(window.elyndraLook().gathering.elapsed,pauseAge);
$('closehelp').onclick();walkTo(96,50);walkTo(104,59);walkTo(106,64);frame(time+=50);
assert.equal($('gathering-pickup').hidden,false,'The nut is reachable via the existing cleared path');
$('gathering-pickup').onclick();frame(time+=50);
assert.equal(window.elyndraLook().gathering.phase,'escort');
for(let i=0;i<60&&window.elyndraLook().gathering.phase==='escort';i++){
 const p=window.elyndraLook().squirrel.position;walkTo(p[0]+1,p[2]+2,12);frame(time+=50);
}
assert.equal(window.elyndraLook().gathering.phase,'arrival');
for(let i=0;i<110;i++)frame(time+=50);
assert.equal(window.elyndraLook().gathering.phase,'done');
for(let i=0;i<200;i++)frame(time+=50);
assert.equal(window.elyndraLook().squirrel.phase,'home','The only squirrel returns to his previous role');
assert(window.elyndraLook().squirrel.revealed,'The old monument memory remains intact');
console.log('Gathering: real dialogue handoff, input isolation, fixed camera, skip, pause, reachable mobile pickup, escort and actor return passed.');

// The next chapter reuses the same cinematic controller and the existing fox.
assert.equal($('fox-invitation-view').hidden,false,'The second invitation unlocks after the first guest');
$('fox-invitation-view').onclick();frame(time+=50);
assert(window.elyndraLook().foxInvitation.reserved);
$('talk-near').onclick();
if(choices.children.some(b=>b.textContent==='De wortelvos'))chooseText('De wortelvos');
chooseText('Kom je naar de samenkomst?');
assert.equal(window.elyndraLook().foxInvitation.phase,'idle');
chooseText('Straks. Ik kom terug.');
assert.equal(window.elyndraLook().foxInvitation.phase,'idle','Declining leaves the old progress untouched');
$('talk-near').onclick();
if(choices.children.some(b=>b.textContent==='De wortelvos'))chooseText('De wortelvos');
chooseText('Kom je naar de samenkomst?');
const foxBefore=[...window.elyndraLook().pos];
chooseText('Ik help je. Wat heb je gevonden?');
assert.equal(window.elyndraLook().foxInvitation.phase,'film');assert(!window.elyndraVisionOpen);
assert.equal(window.elyndraCanInteract(),false);frame(time+=50);
const foxCamera=[...eye];key('KeyW');for(let i=0;i<20;i++)frame(time+=50);
assert.deepEqual(eye,foxCamera,'Reduced motion has a fixed camera');
const foxTime=window.elyndraLook().foxInvitation.elapsed;
document.hidden=true;for(let i=0;i<20;i++)frame(time+=50);document.hidden=false;
assert.equal(window.elyndraLook().foxInvitation.elapsed,foxTime);
$('gathering-skip').onclick();assert.deepEqual(window.elyndraLook().pos,foxBefore);
assert.equal(window.elyndraLook().foxInvitation.phase,'fragment');
const fragment=window.elyndraLook().foxInvitation.fragment;
walkTo(fragment[0]+.7,fragment[2]+1);frame(time+=50);
assert.equal($('gathering-pickup').hidden,false,'The fragment is reachable through the existing cathedral path');
key('KeyE');release('KeyE');assert.equal(window.elyndraLook().foxInvitation.phase,'wash');
const spring=window.elyndraLook().foxInvitation.spring;
walkTo(spring[0]+1,spring[2]+1);frame(time+=50);
assert.equal($('gathering-pickup').hidden,false);
$('gathering-pickup').onclick();assert.equal(window.elyndraLook().foxInvitation.phase,'washing');
$('help').onclick();const wash=window.elyndraLook().foxInvitation.washProgress;
for(let i=0;i<30;i++)frame(time+=50);assert.equal(window.elyndraLook().foxInvitation.washProgress,wash);
$('closehelp').onclick();for(let i=0;i<65;i++)frame(time+=50);
assert.equal(window.elyndraLook().foxInvitation.phase,'carry');
assert.equal($('gathering-note').hidden,false,'The source explains where to bring the cleaned fragment');
$('fox-invitation-view').onclick();for(let i=0;i<125;i++)frame(time+=50);
assert.equal(window.elyndraLook().foxInvitation.phase,'offering');
walkTo(91,46);frame(time+=50);$('talk-near').onclick();
if(choices.children.some(b=>b.textContent==='De moswachter'))chooseText('De moswachter');
chooseText('Ik heb een wortelfragment voor je.');
assert.match($('conversation-text').textContent,/Dit zat om het zaadje/);
assert.equal(window.elyndraLook().foxInvitation.phase,'done');
chooseText('Dan bewaren we het bij elkaar.');frame(time+=50);
assert.equal(window.elyndraLook().gathering.phase,'done');assert(window.elyndraLook().dwellers.springFound);
assert(window.elyndraLook().squirrel.revealed,'Fox invitation preserves the old monument');
console.log('Fox invitation: dialogue, decline, cinematic, fixed camera, skip, reachable fragment, keyboard pickup, mobile washing, pause, arrival and keeper handoff passed.');

// The dragon as third guest: he comes to rest by himself, is invited in dialogue,
// warms a seed lantern, and lands at the gathering once the visitor brings it.
const guest=()=>window.elyndraLook().dragonGuest;
frame(time+=50);assert.equal($('dragon-guest-view').hidden,false,'The third invitation opens after the fox has arrived');
assert.equal(guest().phase,'idle');
$('dragon-guest-view').onclick();
for(let i=0;i<800&&!$('talk-near').textContent.startsWith('Praat met de draak');i++)frame(time+=50);
assert.match($('talk-near').textContent,/^Praat met de draak/,'The dragon lands by himself and can be spoken to');
$('talk-near').onclick();chooseText('Kom je ook naar de samenkomst?');chooseText('Straks. Ik kom terug.');frame(time+=50);
assert.equal(guest().phase,'idle','Declining leaves the dragon as he was');
const dragonBefore=window.elyndraLook().pos;
$('talk-near').onclick();chooseText('Kom je ook naar de samenkomst?');chooseText('Ik help je. Laat maar zien.');
assert.equal(guest().phase,'film');assert(!window.elyndraVisionOpen);assert.equal(window.elyndraCanInteract(),false);frame(time+=50);
const dragonCamera=[...eye];key('KeyW');for(let i=0;i<20;i++)frame(time+=50);release('KeyW');
assert.deepEqual(eye,dragonCamera,'Reduced motion keeps one fixed shot of the lantern');
const dragonFilm=guest().elapsed;document.hidden=true;for(let i=0;i<20;i++)frame(time+=50);document.hidden=false;
assert.equal(guest().elapsed,dragonFilm,'A hidden tab pauses the film');
$('gathering-skip').onclick();assert.deepEqual(window.elyndraLook().pos,dragonBefore,'Skipping returns the visitor to where they stood');
assert.equal(guest().phase,'ember');
$('dragon-guest-view').onclick();frame(time+=50);
assert.equal($('gathering-pickup').hidden,false,'The travel button brings the lantern within reach');
assert.match($('gathering-pickup').textContent,/Neem de gloedlantaarn/);
key('KeyE');release('KeyE');assert.equal(guest().phase,'kindle');
key('KeyS');for(let i=0;i<120;i++)frame(time+=50);release('KeyS'); // backing away along the open path
assert.equal(guest().phase,'kindle','Walking never settles the glow');
$('help').onclick();const settling=guest().kindle;for(let i=0;i<40;i++)frame(time+=50);
assert.equal(guest().kindle,settling,'An open panel pauses the settling');
$('closehelp').onclick();for(let i=0;i<140;i++)frame(time+=50);
assert.equal(guest().phase,'carry','Standing still lets the glow settle');
assert.equal($('gathering-note').hidden,false,'The note explains where to carry the lantern');
assert.match($('dragon-guest-view').textContent,/De gloedlantaarn/);
$('dragon-guest-view').onclick();for(let i=0;i<220;i++)frame(time+=50);
assert.equal(guest().phase,'offering','The dragon lands once the lantern reaches the gathering');
assert(Math.hypot(...window.elyndraLook().dragonAt.map((v,i)=>v-guest().landing[i]))<.6,'The one existing dragon rests at his own place beside the guests');
walkTo(91,46);frame(time+=50);$('talk-near').onclick();
if(choices.children.some(b=>b.textContent==='De moswachter'))chooseText('De moswachter');
chooseText('Ik breng warmte van de draak.');
assert.match($('conversation-text').textContent,/Water, een teken en warmte/);
assert.equal(guest().phase,'done');
chooseText('Daar denken we samen over na.');frame(time+=50);
assert.equal(window.elyndraLook().foxInvitation.phase,'done','The fox stays a guest');
assert.equal(window.elyndraLook().gathering.phase,'done');assert(window.elyndraLook().squirrel.revealed);
for(let i=0;i<60;i++)frame(time+=50);assert.equal($('gathering-note').hidden,true,'The chapter closes quietly');
console.log('Dragon guest: self-arrival, decline, dialogue handoff, fixed camera, pause, skip, reachable lantern, stillness, flight, landing and keeper handoff passed.');

// The land behind the gate: walk through the awake gate, be answered by the tree, walk home through the arch.
const realm=()=>window.elyndraLook().realm;
assert.equal(realm().inside,false);
$('destinations').children[1].onclick();for(let i=0;i<10;i++)frame(time+=50);
for(let k=0;k<100&&!realm().inside;k++)walkTo(66,-118,4);release('KeyW');for(let i=0;i<5;i++)frame(time+=50);
assert.equal(realm().inside,true,'Walking through the awake gate leads to the land behind it');
assert.equal(realm().visited,true);
assert(window.elyndraLook().pos[2]>1500);
$('travel').onclick();assert.equal($('realm-view').hidden,false,'Once found, the land is listed for return visits');$('travel').onclick();
walkTo(6,2008,500);release('KeyW');
assert(Math.hypot(window.elyndraLook().pos[0],window.elyndraLook().pos[2]-2000)<17,'The stepping stones lead under the crown');
assert.equal(realm().answered,false);for(let i=0;i<140;i++)frame(time+=50);
assert.equal(realm().answered,true,'Standing still under the crown is answered');
assert(realm().lit>=4,'The four heartbeats burn in the tree');
key('KeyD');for(let i=0;i<4000;i++)frame(time+=50);release('KeyD');
assert(Math.hypot(window.elyndraLook().pos[0],window.elyndraLook().pos[2]-2000)<=104.5,'The mist keeps the visitor on the island');
for(let k=0;k<150&&Math.hypot(window.elyndraLook().pos[0]-27,window.elyndraLook().pos[2]-1985)>1.5;k++)walkTo(27,1985,4);release('KeyW');for(let i=0;i<80&&realm().inside;i++)frame(time+=50);
assert.equal(realm().inside,false,'The light well in the pool lifts the visitor out of the land');
assert(window.elyndraLook().flying&&window.elyndraLook().pos[1]>30,'It carries you to the floating gardens, as the gate used to');
$('realm-view').onclick();for(let i=0;i<5;i++)frame(time+=50);
for(let k=0;k<80&&realm().inside;k++)walkTo(0,2071,4);release('KeyW');
assert.equal(realm().inside,false,'Walking through the arch returns to the valley');
assert(window.elyndraLook().pos[2]>-110&&window.elyndraLook().pos[2]<-95,'You step out in front of the gate');
for(let i=0;i<40;i++)frame(time+=50);assert.equal(realm().inside,false,'Stepping out does not send you back');
console.log('Realm: gate passage, veil, menu entry, stepping stones, answer under the crown, containment and return through the arch passed.');
