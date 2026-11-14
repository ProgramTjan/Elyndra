import assert from 'node:assert/strict';import fs from 'node:fs';
const uniformNames=new Set([...(fs.readFileSync(new URL('../dist/deer-mirror.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/world.js',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/brook-wonder.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/atmosphere.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/cathedral-wonder.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/gate-wonder.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/post.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('../dist/shaders.mjs',import.meta.url),'utf8')).matchAll(/uniform\s+\w+\s+(\w+)/g)].map(m=>m[1]));
let raf;const nodes=new Map(),events=new Map();let eye,viewYaw,viewPitch;
const gl=new Proxy({FRAMEBUFFER_COMPLETE:1,checkFramebufferStatus:()=>1,getShaderParameter:()=>true,getProgramParameter:()=>true,createShader:()=>({}),createProgram:()=>({}),createVertexArray:()=>({}),createBuffer:()=>({}),bufferData:(target,data)=>{assert(data.every(Number.isFinite),'Uploaded geometry must be finite')},createTexture:()=>({}),createFramebuffer:()=>({}),getUniformLocation:(p,n)=>{assert(uniformNames.has(n.split('[')[0]),'Shader uniform exists: '+n);return n},uniform1f:(u,v)=>{if(u==='yaw')viewYaw=v;if(u==='pitch')viewPitch=v},uniformMatrix4fv:(u,t,v)=>{assert(Array.from(v).every(Number.isFinite),'Shader matrices must be finite')},uniform3fv:(u,v)=>{if(u==='eye')eye=[...v]}},{get:(o,k)=>o[k]??(()=>{})});
function element(){const handlers={};return{style:{},children:[],hidden:false,open:false,classList:{add(){},remove(){}},textContent:'',innerHTML:'',getContext:()=>gl,appendChild(e){this.children.push(e)},addEventListener(k,f){(handlers[k]??=[]).push(f)},emit(k,e){for(const f of handlers[k]??[])f(e)},focus(){},showModal(){this.open=true},close(){this.open=false;for(let f of handlers.close??[])f()},setAttribute(){},setPointerCapture(){}}}
for(const m of fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').matchAll(/id="([^"]+)"/g))nodes.set(m[1],element());
globalThis.document={hidden:false,body:element(),getElementById(id){assert(nodes.has(id),id);return nodes.get(id)},querySelector:()=>[...nodes.values()].find(n=>n.open)??null,createElement:element};
globalThis.window=globalThis;globalThis.innerWidth=400;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;globalThis.matchMedia=q=>({matches:q.includes('coarse')||q.includes('reduced-motion')});globalThis.requestAnimationFrame=f=>{raf=f};globalThis.setTimeout=()=>1;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>1;globalThis.addEventListener=(k,f)=>{if(!events.has(k))events.set(k,[]);events.get(k).push(f)};globalThis.dispatchEvent=e=>{for(const f of events.get(e.type)??[])f(e)};globalThis.CustomEvent=class{constructor(type,args){this.type=type;this.detail=args.detail}};
// Een verse vallei: de rivier staat laag, de ritmes worden in de wereld zelf hersteld.
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),key:i=>[...store.keys()][i]??null,get length(){return store.size}};
globalThis.location={search:'',reload(){globalThis.reloaded=true}};
await import('../dist/world.js');const frame=raf,$=id=>nodes.get(id);let time=0;frame(time+=50);
const canvas=$('world');
$('quest-body').querySelectorAll=()=>[];for(const id of ['quest-guide','quest-reward','quest-replay'])nodes.set(id,element());
await import('../dist/quests.js');
$('start-direct').onclick();$('onboarding-free').onclick();frame(time+=50);$('instructions').hidden=true;$('travelmenu').hidden=true;frame(time+=50);
function walkTo(x,z,limit=240){
 for(let i=0;i<limit&&Math.hypot(eye[0]-x,eye[2]-z)>.55;i++){
  const desired=Math.atan2(x-eye[0],-(z-eye[2])),turn=Math.atan2(Math.sin(desired-viewYaw),Math.cos(desired-viewYaw));
  canvas.emit('pointerdown',{pointerId:9,pointerType:'touch',clientX:100,clientY:100});
  canvas.emit('pointermove',{pointerId:9,pointerType:'touch',clientX:100+turn/.004,clientY:100});
  canvas.emit('pointerup',{});dispatchEvent({type:'keydown',code:'KeyW',repeat:false,preventDefault(){}});frame(time+=50);
 }
 dispatchEvent({type:'keyup',code:'KeyW'});
}
const look=()=>window.elyndraLook();
const press=()=>{dispatchEvent({type:'keydown',code:'KeyE',repeat:false,preventDefault(){}});frame(time+=50);dispatchEvent({type:'keyup',code:'KeyE'});frame(time+=50);};
assert(Math.abs(look().life.drop-1.5)<1e-9,'A silent valley starts with a nearly dry river');
assert(look().life.colour<.2&&look().life.song<.5,'Colour and birdsong are dimmed at the start');
assert.equal(look().play.filter(p=>p.solved).length,0);

// De herstelkeuzes staan onder het vraagteken en vragen om een tweede tik.
const resets=$('reset-choices').children;assert(resets.length>=3,'Begin, forgotten wonders and forgotten meetings are always offered');
assert($('reset-status').textContent.length>0);

// De kroniek brengt je naar de waterloop; de sluisjes draai je te voet, met E.
const {ORIGIN,SLUICES,START,SOLUTION}=await import('../dist/minigame-water.mjs?v=story52');
dispatchEvent(new CustomEvent('elyndra-guide',{detail:0}));frame(time+=50);
assert(Math.hypot(eye[0]-ORIGIN[0],eye[2]-ORIGIN[1])<20,'The chronicle sets the visitor beside the water course');
for(let i=0;i<20;i++)frame(time+=50);
assert.equal($('gathering-note').hidden,false,'The world itself says what is silent here');
assert.equal($('gathering-eyebrow').textContent,'HET WATER · DE WORTELKATHEDRAAL');
for(let k=0;k<SLUICES.length;k++){
 const turns=((SOLUTION[k]-START[k])%SLUICES[k].settings.length+SLUICES[k].settings.length)%SLUICES[k].settings.length;if(!turns)continue;
 walkTo(ORIGIN[0]+SLUICES[k].at[0],ORIGIN[1]+SLUICES[k].at[1]+1.6,400);for(let i=0;i<12;i++)frame(time+=50);
 assert.equal(look().play[0].at,k,'Sluice '+SLUICES[k].id+' is reachable on foot');
 assert.equal($('gathering-pickup').hidden,false,'A one-thumb action button appears at the sluice');
 for(let t=0;t<turns;t++)press();
}
assert.deepEqual(look().play[0].settings,[...SOLUTION]);
assert(look().play[0].solved,'All three bowls fill without waste');
assert.equal(window.elyndraGame.count(),0,'The chronicle waits a moment so the water is seen first');
for(let i=0;i<140;i++)frame(time+=50);
assert.equal(window.elyndraGame.count(),1,'The restored rhythm is written into the chronicle');
assert($('quest-dialog').open);$('quest-dialog').close();
for(let i=0;i<400;i++)frame(time+=50);
assert(look().life.drop<1.2,'The river starts to rise once the water is back');
assert(store.has('elyndra-heartbeats-v1'));

// Terug naar het begin: twee tikken, daarna is de voortgang weg.
$('help').onclick();const begin=[...resets].find(b=>b.textContent.includes('begin')||b.textContent.includes('Begin'));assert(begin,'A way back to the beginning exists');
begin.onclick();assert(store.has('elyndra-heartbeats-v1'),'The first tap only asks for confirmation');assert(begin.textContent.startsWith('Zeker weten?'));
begin.onclick();assert(!store.has('elyndra-heartbeats-v1')||!JSON.parse(store.get('elyndra-heartbeats-v1')).solved.some(Boolean),'The second tap clears the rhythms');
assert(globalThis.reloaded,'The world reloads into the earlier situation');
console.log('Story world: dry river, chronicle guide, water course on foot, delayed chronicle, rising river and reset passed.');
