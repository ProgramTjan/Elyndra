import test from 'node:test';import assert from 'node:assert/strict';
import {ListenGame,createListenMeshes,listenLayout,ORIGIN,KEEPER,STONES,PHRASES,MEMORIES,FINALE,WRONG,PLAY_RADIUS,ARC_RADIUS,LISTEN_RADIUS,STONE_ENTER,STONE_LEAVE,NEAR_RADIUS,NOTE_DELAY,NOTE_GAP,NOTE_LIT,ENTER_LIT} from '../dist/minigame-listen.mjs';

const ground=(x,z)=>2+.04*x-.03*z+.3*Math.sin(x*.2)*Math.cos(z*.15);
const foot=(x,z)=>[x,ground(x,z)+2.4,z];
const kit=()=>{let n=0;const f=()=>{};return {orb:f,cone:f,beam:f,curveTube:f,tri:f,material:f,upload:()=>({id:++n})};};
const DT=1/30;
const bells=ev=>ev.filter(e=>e.type==='bell').map(e=>e.note);

// Een kleine bezoeker: loopt in kleine stapjes en verzamelt alle events.
function visitor(game){
 const v={game,pos:foot(ORIGIN[0],ORIGIN[1]),events:[]};
 v.tick=(seconds=DT,opts={})=>{const e=game.update(seconds,v.pos,{moving:false,yaw:0,...opts});v.events.push(...e);return e;};
 v.wait=s=>{const out=[];for(let t=0;t<s;t+=DT)out.push(...v.tick());return out;};
 v.walk=(x,z)=>{const out=[],[sx,,sz]=v.pos,d=Math.hypot(x-sx,z-sz),n=Math.max(1,Math.ceil(d/.12));
  for(let i=1;i<=n;i++){const u=i/n;v.pos=foot(sx+(x-sx)*u,sz+(z-sz)*u);out.push(...v.tick(DT,{moving:true}));}return out;};
 v.stone=i=>{const s=game.layout.stones[i];return v.walk(s.x,s.z);};
 // Via een punt naast de luistersteen, zodat je nooit over een andere klinksteen loopt.
 v.home=()=>v.walk(ORIGIN[0],ORIGIN[1]);
 v.listen=()=>{v.home();assert.equal(game.prompt(v.pos,{flying:false}),'Luister naar de moswachter');game.interact(v.pos,{flying:false,yaw:0});return v.wait(NOTE_DELAY+NOTE_GAP*6+1);};
 v.answer=phrase=>{const out=[];for(const s of phrase){out.push(...v.stone(s));out.push(...v.home());}return out;};
 return v;
}

test('the layout lies within the play area, opens toward the keeper and keeps the stones apart',()=>{
 const L=listenLayout(ground);
 assert.equal(L.stones.length,4);assert.deepEqual(STONES.map(s=>s.note),[392,440,523.25,587.33]);assert.deepEqual(STONES.map(s=>s.name),['wortel','mos','water','ster']);
 const toKeeper=Math.hypot(KEEPER[0]-ORIGIN[0],KEEPER[1]-ORIGIN[1]);
 for(const s of L.stones){
  const r=Math.hypot(s.x-ORIGIN[0],s.z-ORIGIN[1]);assert(Math.abs(r-ARC_RADIUS)<1e-9);assert(r+STONE_ENTER<PLAY_RADIUS);
  assert(Math.hypot(s.x-KEEPER[0],s.z-KEEPER[1])>toKeeper,'the stones lie on the far side; the arc opens toward the keeper');
  assert(r-STONE_LEAVE>LISTEN_RADIUS,'leaving a stone is possible without reaching the listening stone');
  assert.equal(s.y,ground(s.x,s.z)+.25);assert(Number.isFinite(s.rotation));
 }
 for(const a of L.stones)for(const b of L.stones)if(a!==b)assert(Math.hypot(a.x-b.x,a.z-b.z)>STONE_LEAVE+STONE_ENTER,'standing near one stone never enters another');
 assert.equal(L.keeper[1],ground(KEEPER[0],KEEPER[1])+9);
});

test('the phrases are singable: short steps, no repeats, each begins like the one before',()=>{
 assert.deepEqual(PHRASES.map(p=>p.length),[3,4,5]);
 for(const p of PHRASES)for(let i=1;i<p.length;i++){assert.notEqual(p[i],p[i-1]);assert(Math.abs(p[i]-p[i-1])<=2);}
 for(let k=1;k<PHRASES.length;k++){const prev=PHRASES[k-1],n=Math.min(3,prev.length);assert.deepEqual(PHRASES[k].slice(0,n),prev.slice(0,n));}
 assert.equal(new Set(MEMORIES).size,3);
 for(const t of [...MEMORIES,FINALE,WRONG])assert(!t.includes('!'),'no exclamation marks');
});

test('the action is offered only on the listening stone, on foot, and not while he hums',()=>{
 const g=new ListenGame(ground),on=foot(ORIGIN[0]+.5,ORIGIN[1]);
 assert.equal(g.prompt(on,{flying:false}),'Luister naar de moswachter');assert(g.prompt(on,{}).length<=28);
 assert.equal(g.prompt(on,{flying:true}),null);
 assert.equal(g.prompt([on[0],on[1]+10,on[2]],{flying:false}),null,'high above is not on foot');
 assert.equal(g.prompt(foot(ORIGIN[0]+2,ORIGIN[1]),{}),null);
 assert.deepEqual(g.interact(foot(ORIGIN[0]+2,ORIGIN[1]),{}),[]);assert.equal(g.begun,false,'pressing elsewhere does nothing');
 g.interact(on,{flying:false,yaw:0});assert.equal(g.begun,true);assert.equal(g.phase,'listen');
 assert.equal(g.prompt(on,{}),null,'no button while he hums');
 assert(g.near(on));assert(g.near(foot(ORIGIN[0]+NEAR_RADIUS-.5,ORIGIN[1])));assert(!g.near(foot(ORIGIN[0]+NEAR_RADIUS+.5,ORIGIN[1])));
});

test('in the listen phase he hums the phrase at a calm tempo and lights the matching stone',()=>{
 const g=new ListenGame(ground),v=visitor(g);
 g.interact(v.pos,{flying:false});
 const times=[];let t=0;
 for(let i=0;i<200&&g.phase==='listen';i++){
  const e=v.tick(.05);t+=.05;
  for(const b of e.filter(e=>e.type==='bell')){times.push([t,b.note]);
   const s=STONES.findIndex(s=>s.note===b.note);assert.equal(g.lit()[s],true,'the sounding stone is lit');
   assert.deepEqual(g.visuals(0).parts.map(p=>p.mesh).filter(m=>m==='chimeLit').length,1);
   assert(g.visuals(1.3).motes.length>0,'motes drift toward the lit stone');}
 }
 assert.deepEqual(times.map(x=>x[1]),PHRASES[0].map(i=>STONES[i].note));
 times.forEach(([at],k)=>assert(Math.abs(at-(NOTE_DELAY+k*NOTE_GAP))<.051,`note ${k} at ${at}`));
 assert.equal(g.phase,'answer');assert(Math.abs(t-(NOTE_DELAY+2*NOTE_GAP+NOTE_LIT))<.06,'the answer begins after the last note fades');
 assert.deepEqual(g.lit(),[false,false,false,false]);
 // Een grote sprong in de tijd laat geen toon vallen.
 const h=new ListenGame(ground);h.interact(foot(...ORIGIN),{});let heard=[];for(let i=0;i<20;i++)heard.push(...bells(h.update(.5,foot(...ORIGIN),{})));
 assert.deepEqual(heard,[392,440,523.25]);
});

test('a light stays on for its note and fades again',()=>{
 const g=new ListenGame(ground),v=visitor(g);g.interact(v.pos,{});
 v.wait(NOTE_DELAY+.05);assert.equal(g.lit()[PHRASES[0][0]],true);
 v.wait(NOTE_LIT);assert.equal(g.lit()[PHRASES[0][0]],false);
});

test('a stone sounds when you enter it from outside, and only again after stepping off',()=>{
 const g=new ListenGame(ground),v=visitor(g),s=g.layout.stones[2];
 let e=v.walk(s.x-STONE_ENTER-.3,s.z);assert.deepEqual(bells(e),[]);
 e=v.walk(s.x,s.z);assert.deepEqual(bells(e),[523.25],'entering sounds once');
 assert.equal(g.lit()[2],true);v.wait(ENTER_LIT+.05);assert.equal(g.lit()[2],false);
 assert.deepEqual(bells(v.wait(2)),[],'standing on it is quiet');
 e=v.walk(s.x+STONE_ENTER+.2,s.z);e.push(...v.walk(s.x,s.z));assert.deepEqual(bells(e),[],'stepping only to the rim does not count as leaving');
 e=v.walk(s.x+STONE_LEAVE+.2,s.z);e.push(...v.walk(s.x,s.z));assert.deepEqual(bells(e),[523.25],'stepping off and on sounds again');
 // Vliegend over de stenen gebeurt niets.
 const f=new ListenGame(ground);let fly=[];for(let x=s.x-4;x<s.x+4;x+=.1)fly.push(...f.update(DT,foot(x,s.z),{flying:true}));assert.deepEqual(fly,[]);
 // Tijdens het neuriën zwijgen de stenen.
 const q=new ListenGame(ground),w=visitor(q);q.interact(w.pos,{});e=w.walk(q.layout.stones[3].x,q.layout.stones[3].z);
 assert.deepEqual(bells(e).filter(n=>n===587.33),[]);
});

test('before listening the stones only sound; nothing is answered',()=>{
 const g=new ListenGame(ground),v=visitor(g);
 const e=v.answer(PHRASES[0]);assert.equal(bells(e).length,3);assert.equal(g.phase,'idle');assert.equal(g.phrase,0);
 assert.equal(e.filter(x=>x.type!=='bell').length,0,'no toast, no chime');assert.equal(g.begun,false);
});

test('a repeated stone in a phrase needs stepping off and on again',()=>{
 const g=new ListenGame(ground),v=visitor(g);g.phrase=2;
 v.listen();assert.equal(g.phase,'answer');
 v.stone(0);v.stone(1);v.stone(2);assert.deepEqual(g.answer,[0,1,2]);
 // Terug naar mos en wortel, langs de boog.
 v.stone(1);assert.deepEqual(g.answer,[0,1,2,1]);
 const e=v.stone(0);assert(e.some(x=>x.type==='solved'));assert.equal(g.solved,true);
});

test('a wrong stone clears the answer gently and costs nothing',()=>{
 const g=new ListenGame(ground),v=visitor(g);v.listen();
 v.stone(0);v.stone(1);assert.deepEqual(g.answer,[0,1]);
 const e=v.stone(3);
 assert.deepEqual(e.filter(x=>x.type==='toast').map(x=>x.text),[WRONG]);assert.deepEqual(bells(e),[587.33],'the wrong stone still sounds');
 assert.deepEqual(g.answer,[]);assert.equal(g.wrong,1);assert.equal(g.phase,'answer');assert.equal(g.phrase,0,'no phrase is lost');
 // Opnieuw beginnen bij de eerste toon telt meteen als begin.
 v.stone(0);assert.deepEqual(g.answer,[0]);v.stone(2);assert.deepEqual(g.answer,[],'skipping a note is also just a retry');
 v.stone(0);v.stone(1);const done=v.stone(2);
 assert(done.some(x=>x.type==='chime'));assert.equal(g.phrase,1);assert.equal(g.wrong,0,'a new phrase starts without hints');
});

test('you may listen again at any time, as often as you like',()=>{
 const g=new ListenGame(ground),v=visitor(g);v.listen();v.stone(0);v.stone(1);
 const e=v.listen();assert.deepEqual(bells(e),PHRASES[0].map(i=>STONES[i].note),'the phrase plays again');
 assert.deepEqual(g.answer,[],'listening again starts the answer afresh');assert.equal(g.phase,'answer');
 for(let i=0;i<3;i++)v.listen();assert.equal(g.phrase,0);assert.equal(g.wrong,0);
});

test('a full walk: three phrases, three memories, one solved',()=>{
 const g=new ListenGame(ground),v=visitor(g),seen=[g.words()[1]];
 for(let k=0;k<3;k++){
  const heard=v.listen();assert.deepEqual(bells(heard),PHRASES[k].map(i=>STONES[i].note));
  seen.push(g.words()[1]);
  const e=v.answer(PHRASES[k]);seen.push(g.words()[1]);
  assert.equal(e.filter(x=>x.type==='chime').length,1);
  const toast=e.filter(x=>x.type==='toast').map(x=>x.text);assert.equal(toast.length,1);assert(toast[0].startsWith(MEMORIES[k]));
 }
 assert.equal(g.solved,true);assert.equal(v.events.filter(e=>e.type==='solved').length,1);
 assert(v.events.find(e=>e.type==='toast'&&e.text.includes(FINALE)),'a closing toast');
 assert.equal(new Set(seen).size,seen.length,'the words change at every step');
 // Daarna klinken de stenen nog, maar er komt niets meer.
 const after=[...v.answer(PHRASES[2]),...v.answer([3,0,2])];
 assert.equal(after.filter(e=>e.type==='solved'||e.type==='toast'||e.type==='chime').length,0);
 assert(bells(after).length>0);assert.equal(g.prompt(foot(...ORIGIN),{}),null);
 assert.deepEqual(g.interact(foot(...ORIGIN),{}),[]);
 assert.match(g.words()[0],/stem is terug/);
});

test('random walking never solves it and never begins it',()=>{
 let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const g=new ListenGame(ground),v=visitor(g);
 for(let i=0;i<400;i++){const a=rand()*Math.PI*2,r=rand()*7;v.walk(ORIGIN[0]+Math.cos(a)*r,ORIGIN[1]+Math.sin(a)*r);}
 assert.equal(g.solved,false);assert.equal(g.begun,false);assert.equal(v.events.filter(e=>e.type!=='bell').length,0);
});

test('the words describe each step and give more help after repeated misses',()=>{
 const g=new ListenGame(ground),v=visitor(g);
 const [title,start]=g.words();assert.equal(title,'Het luisterspel');assert.match(start,/luistersteen/);
 g.interact(v.pos,{});assert.match(g.words()[1],/Frase één van drie\..*neuriet/);
 v.wait(5);assert.equal(g.words()[1],'Frase één van drie. Loop de tonen na: nog drie.');
 v.stone(0);assert.equal(g.words()[1],'Frase één van drie. Loop de tonen na: nog twee.');
 v.stone(1);v.stone(0);assert.doesNotMatch(g.words()[1],/wortel/,'one miss gives no hint yet');
 v.stone(3);v.home();assert.equal(g.wrong,2);
 assert.equal(g.words()[1],'Frase één van drie. Loop de tonen na: nog drie. Begin bij de steen die wortel heet.');
 v.stone(3);v.home();v.stone(2);v.home();assert.equal(g.wrong,4);
 assert.equal(g.words()[1],'Frase één van drie. Loop de tonen na: nog drie. Loop wortel, mos en water.');
 v.answer(PHRASES[0]);assert.equal(g.words()[1],'Frase twee van drie. Ga terug naar de luistersteen en luister.');
 v.listen();assert.equal(g.words()[1],'Frase twee van drie. Loop de tonen na: nog vier.');
 for(let i=0;i<4;i++){v.stone(3);v.home();}
 assert.match(g.words()[1],/Loop wortel, mos, water en ster\.$/);
 for(const w of [g.words()])assert(!w[1].includes('!'));
});

test('a ring of motes marks the next stone only once help is allowed',()=>{
 const g=new ListenGame(ground),v=visitor(g);v.listen();
 assert.equal(g.visuals(2).motes.length,0,'no guidance at first');
 v.stone(3);v.home();v.stone(3);v.home();assert.equal(g.guidance(),1);
 const s=g.layout.stones[PHRASES[0][0]],m=g.visuals(2).motes;assert(m.length>0&&m.length<80);
 for(const p of m)assert(Math.hypot(p[0]-s.x,p[2]-s.z)<1.2,'the ring hangs over the next stone');
 v.stone(0);const n=g.layout.stones[PHRASES[0][1]];for(const p of g.visuals(2).motes)assert(Math.hypot(p[0]-n.x,p[2]-n.z)<1.2,'it moves on with you');
});

test('visuals are finite, use known meshes, match the lit state and stand still when reduced',()=>{
 const g=new ListenGame(ground),v=visitor(g),meshes=createListenMeshes(kit(),ground);
 const check=(clock,reduced)=>{const vis=g.visuals(clock,reduced);
  assert.equal(vis.parts.length,4);assert(vis.motes.length<80);
  vis.parts.forEach((p,i)=>{assert(meshes[p.mesh],p.mesh);assert.equal(p.mesh,g.lit()[i]?'chimeLit':'chime');assert(p.position.every(Number.isFinite));assert(Number.isFinite(p.rotation));
   const s=g.layout.stones[i];assert.deepEqual(p.position,[s.x,s.y,s.z],'each stone keeps its own place');});
  for(const m of vis.motes){assert.equal(m.length,3);assert(m.every(Number.isFinite));}
  return vis;};
 check(0,false);g.interact(v.pos,{});
 for(let i=0;i<120;i++){v.tick(.05);check(i*.05,false);
  const a=check(i*.05,true),b=check(i*.05+3,true);assert.deepEqual(a,b,'no animation when reduced');
  if(g.phase==='listen'&&g.lit().some(Boolean))assert(a.motes.length<=check(i*.05,false).motes.length);}
 v.stone(1);assert.equal(g.visuals(0).parts[1].mesh,'chimeLit','a stone you enter lights up');
});

test('reset brings everything back, and the lead may restore a solved game',()=>{
 const g=new ListenGame(ground),v=visitor(g);v.listen();v.stone(0);v.stone(2);v.home();
 g.reset();assert.deepEqual(g.snapshot(),new ListenGame(ground).snapshot());
 const restored=new ListenGame(ground);restored.solved=true;
 assert.equal(restored.prompt(foot(...ORIGIN),{}),null);assert.match(restored.words()[1],/verstaat de vallei/);
 const w=visitor(restored);assert.equal(w.answer([0,1,2]).filter(e=>e.type==='solved').length,0);
 assert.doesNotThrow(()=>JSON.stringify(g.snapshot()));
});

test('the meshes build with a stub kit, within budget, and follow tuned positions',()=>{
 const m=createListenMeshes(kit(),ground);for(const k of ['scenery','chime','chimeLit'])assert(m[k],k);
 let tris=0,emissive=0;const n=()=>{};
 const count=(segments=12,rings=7)=>segments*rings*2;
 const k={orb:(x,y,z,a,b,c,col,s,r)=>{tris+=count(s,r);if(col.some(v=>v>1.01))emissive++;},cone:(x,y,z,a,b,h,col,s=8)=>{tris+=s*4;},beam:()=>{tris+=16;},curveTube:(p,r,col,s=10)=>{tris+=(p.length-1)*s*2;if(col.some(v=>v>1.01))emissive++;},tri:()=>{tris++;},material:n,upload:()=>({})};
 createListenMeshes(k,ground);assert(tris<6000,`triangles ${tris}`);assert(emissive>0,'the lit inlay and the spiral glow');
 const tuned=new ListenGame(ground,{origin:[0,0]});assert(tuned.near(foot(1,1)));assert(!tuned.near(foot(...ORIGIN)));
 assert.equal(tuned.prompt(foot(0,0),{}),'Luister naar de moswachter');
});
