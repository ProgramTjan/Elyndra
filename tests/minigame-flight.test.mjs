import test from 'node:test';import assert from 'node:assert/strict';
import {FlightGame,createFlightMeshes,CENTRE,DROPS,NOTES,CATCH_RADIUS,HOME_RADIUS,HOVER_SECONDS,HINT_AFTER} from '../dist/minigame-flight.mjs';

const kit=()=>{let n=0;const f=()=>{};return {orb:f,cone:f,beam:f,curveTube:f,tri:f,material:f,upload:()=>({id:++n})};};
const fly={moving:true,flying:true},still={moving:false,flying:true},walk={moving:true,flying:false};
const make=()=>new FlightGame(()=>0);
const d3=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const catchAll=(g,order=DROPS.map((_,i)=>i))=>{const ev=[];for(const i of order)ev.push(...g.update(.1,DROPS[i],fly));return ev;};

test('the nine drops hang on a loose spiral, in range and at least 9 m apart',()=>{
  assert.equal(DROPS.length,9);assert.equal(NOTES.length,9);
  for(const p of DROPS){
    const r=Math.hypot(p[0]-CENTRE[0],p[2]-CENTRE[2]);
    assert(r>=11.95&&r<=34.05,'horizontal distance '+r);assert(p[1]>=30&&p[1]<=58);
  }
  for(const a of DROPS)for(const b of DROPS)if(a!==b)assert(d3(a,b)>=9);
});

test('there is no action button',()=>{
  const g=make();assert.equal(g.prompt(CENTRE,{flying:true}),null);assert.deepEqual(g.interact(CENTRE,{flying:true}),[]);
});

test('near is true within 70 m horizontally of the centre, whatever the height',()=>{
  const g=make();
  assert(g.near([CENTRE[0]+69,300,CENTRE[2]]));assert(!g.near([CENTRE[0]+71,40,CENTRE[2]]));assert(g.near([CENTRE[0],0,CENTRE[2]-60]));
});

test('a drop is caught only when flying and within 3.5 m',()=>{
  const g=make(),p=DROPS[0];
  assert.deepEqual(g.update(.1,p,walk),[],'on foot nothing happens');
  assert.equal(g.caught.length,0);
  g.update(.1,[p[0]+CATCH_RADIUS+.2,p[1],p[2]],fly);assert.equal(g.caught.length,0,'just out of reach');
  const ev=g.update(.1,[p[0]+CATCH_RADIUS-.2,p[1],p[2]],fly);
  assert.deepEqual(ev,[{type:'bell',note:NOTES[0]}]);assert.equal(g.caught.length,1);assert(g.begun);
  assert.deepEqual(g.update(.1,p,fly),[],'a caught drop is not caught twice');
});

test('the distance is three dimensional',()=>{
  const g=make(),p=DROPS[3];
  g.update(.1,[p[0],p[1]-6,p[2]],fly);assert.equal(g.caught.length,0,'right below is too far');
  g.update(.1,[p[0],p[1]-3,p[2]],fly);assert.equal(g.caught.length,1);
});

test('the order is free and the notes rise in the order caught',()=>{
  const g=make(),order=[8,2,5,0,7,1,4,3,6],ev=catchAll(g,order);
  assert.deepEqual(g.caught,order);
  assert.deepEqual(ev.filter(e=>e.type==='bell').map(e=>e.note),NOTES);
  assert.equal(ev.filter(e=>e.type==='chime').length,1);assert.equal(ev.at(-1).type,'chime','the chime follows the ninth bell');
  assert(!g.solved,'catching alone does not solve');
});

test('flying on foot or hovering at the centre early does nothing',()=>{
  const g=make();
  for(let i=0;i<100;i++)g.update(.1,CENTRE,still);assert(!g.solved);assert.equal(g.hover,0,'hover is not counted before all nine are caught');
});

test('bringing the dew home needs 3 s of hovering still within 9 m of the centre',()=>{
  const g=make();catchAll(g);
  const near=[CENTRE[0]+HOME_RADIUS-.5,CENTRE[1],CENTRE[2]];
  let ev=[];for(let i=0;i<20;i++)ev.push(...g.update(.1,near,still));
  assert(!g.solved,'2 s is not enough');
  for(let i=0;i<10;i++)ev.push(...g.update(.1,near,still));
  assert(g.solved);assert.deepEqual(ev.map(e=>e.type),['toast','solved']);assert.match(ev[0].text,/ademen/);assert(!/!/.test(ev[0].text));
});

test('moving resets the hover count, and nothing else',()=>{
  const g=make();catchAll(g);
  for(let i=0;i<25;i++)g.update(.1,CENTRE,still);assert(g.hover>2);
  g.update(.1,CENTRE,fly);assert.equal(g.hover,0);assert.equal(g.caught.length,9);
  for(let i=0;i<25;i++)g.update(.1,CENTRE,still);assert(!g.solved,'the count began again');
  for(let i=0;i<10;i++)g.update(.1,CENTRE,still);assert(g.solved);
});

test('hovering outside 9 m or on foot does not count',()=>{
  const g=make();catchAll(g);
  for(let i=0;i<60;i++)g.update(.1,[CENTRE[0]+HOME_RADIUS+1,CENTRE[1],CENTRE[2]],still);assert(!g.solved);
  for(let i=0;i<60;i++)g.update(.1,CENTRE,{moving:false,flying:false});assert(!g.solved,'cannot be solved on foot');
  assert.equal(g.hover,0);
});

test('the distance to the centre is three dimensional',()=>{
  const g=make();catchAll(g);
  for(let i=0;i<60;i++)g.update(.1,[CENTRE[0],CENTRE[1]+HOME_RADIUS+2,CENTRE[2]],still);assert(!g.solved);
});

test('solved is emitted exactly once and the game goes quiet afterwards',()=>{
  const g=make();let all=catchAll(g);
  for(let i=0;i<100;i++)all.push(...g.update(.1,CENTRE,still));
  assert.equal(all.filter(e=>e.type==='solved').length,1);assert.equal(all.filter(e=>e.type==='toast').length,1);
  assert.deepEqual(g.update(.1,DROPS[0],fly),[]);
});

test('a long frame is limited so one hitch cannot finish the hover',()=>{
  const g=make();catchAll(g);g.update(100,CENTRE,still);assert(!g.solved);
});

test('random flying never solves it by accident',()=>{
  const g=make();let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<3000;i++)g.update(.1,[CENTRE[0]+(rand()-.5)*200,CENTRE[1]+(rand()-.5)*60,CENTRE[2]+(rand()-.5)*200],{moving:rand()<.7,flying:rand()<.8});
  assert(!g.solved);
});

test('reset returns to the unsolved start and the game can be won again',()=>{
  const g=make();catchAll(g);for(let i=0;i<40;i++)g.update(.1,CENTRE,still);assert(g.solved);
  g.reset();assert(!g.solved);assert(!g.begun);assert.equal(g.caught.length,0);assert.equal(g.hover,0);assert.equal(g.visuals(0,false).parts.length,9);
  catchAll(g);for(let i=0;i<40;i++)g.update(.1,CENTRE,still);assert(g.solved);
});

test('solved can be set from outside without leaving drops hanging',()=>{
  const g=make();g.solved=true;assert.equal(g.visuals(1,false).parts.length,0);assert.deepEqual(g.update(.1,DROPS[0],fly),[]);assert.match(g.words()[1],/thuis/);
});

test('words state the goal, the progress and change with it',()=>{
  const g=make();g.update(.1,[CENTRE[0]+40,CENTRE[1],CENTRE[2]],fly);
  const w0=g.words();assert.equal(w0.length,2);assert.match(w0[1],/negen/);assert(!/!/.test(w0.join(' ')));
  g.update(.1,DROPS[0],fly);g.update(.1,DROPS[1],fly);g.update(.1,DROPS[2],fly);g.update(.1,DROPS[3],fly);
  assert.match(g.words()[1],/Vier van de negen druppels gevangen\./);
  assert.notDeepEqual(g.words(),w0);
  const rest=[4,5,6,7,8];for(const i of rest)g.update(.1,DROPS[i],fly);
  const home=g.words();assert.match(home[0],/thuis/);assert.match(home[1],/zweef/i);
  for(let i=0;i<40;i++)g.update(.1,CENTRE,still);
  assert.notDeepEqual(g.words(),home);assert.match(g.words()[1],/ademen weer/);
});

test('someone on foot is told the dew hangs too high',()=>{
  const g=make();g.update(.1,[CENTRE[0],5,CENTRE[2]+20],walk);
  assert.match(g.words()[1],/te hoog/);
  g.update(.1,[CENTRE[0],45,CENTRE[2]+20],fly);assert(!/te hoog/.test(g.words()[1]));
});

test('after 60 s without a catch the nearest uncaught drop is named by direction',()=>{
  const g=make();const p=[DROPS[0][0]+4,DROPS[0][1]+1,DROPS[0][2]+10];
  for(let i=0;i<HINT_AFTER*2-2;i++)g.update(.5,p,fly);
  assert(!/dichtstbijzijnde/.test(g.words()[1]),'not yet');
  for(let i=0;i<4;i++)g.update(.5,p,fly);
  assert.match(g.words()[1],/dichtstbijzijnde druppel hangt in het oosten, lager van de tuinen/,'drop 0 is east and 6 m below the centre');
  g.update(.1,DROPS[0],fly);assert(!/dichtstbijzijnde/.test(g.words()[1]),'a catch resets the wait');
});

test('direction words follow the compass: north is -z, east is +x',()=>{
  const g=make(),c=CENTRE;
  assert.match(g.direction([c[0],c[1],c[2]-20]),/noorden$/);assert.match(g.direction([c[0],c[1],c[2]+20]),/zuiden$/);
  assert.match(g.direction([c[0]+20,c[1]+8,c[2]]),/oosten, hoger/);assert.match(g.direction([c[0]-20,c[1]-8,c[2]]),/westen, lager/);
  assert.match(g.direction([c[0]-15,c[1],c[2]-15]),/noordwesten/);
});

test('visuals are finite, use existing mesh keys and keep the motes under 70',()=>{
  const meshes=createFlightMeshes(kit(),()=>0);
  for(const reduced of [false,true])for(const clock of [0,1.7,1e4]){
    const g=make();g.update(.1,[CENTRE[0]+30,CENTRE[1]+5,CENTRE[2]+30],fly);
    for(let n=0;n<=9;n++){
      const v=g.visuals(clock,reduced);
      assert.equal(v.parts.length,9-n);
      for(const p of v.parts){assert(p.mesh in meshes);assert(p.position.every(Number.isFinite));assert(Number.isFinite(p.rotation));}
      assert(v.motes.length<70,'motes '+v.motes.length);assert(v.motes.length>0);
      for(const m of v.motes){assert.equal(m.length,3);assert(m.every(Number.isFinite));}
      if(n<9)g.update(.1,DROPS[n],fly);
    }
  }
});

test('motes ring the uncaught drops, trail toward the nearest one and ring the centre at the end',()=>{
  const g=make(),far=[CENTRE[0]+30,CENTRE[1],CENTRE[2]+30];g.update(.1,far,fly);
  const v=g.visuals(0,false);assert(v.motes.length>=54+1&&v.motes.length<=62);
  catchAll(g);const end=g.visuals(2,false);
  assert(end.motes.length>=8);for(const m of end.motes)assert(Math.abs(Math.hypot(m[0]-CENTRE[0],m[2]-CENTRE[2])-HOME_RADIUS)<1e-6,'only the home ring remains');
});

test('reduced motion does not animate and shows fewer motes',()=>{
  const g=make();g.update(.1,[CENTRE[0]+20,CENTRE[1],CENTRE[2]+20],fly);
  assert.deepEqual(g.visuals(0,true),g.visuals(500,true));
  assert(g.visuals(0,true).motes.length<g.visuals(0,false).motes.length);
  const live=g.visuals(0,false),later=g.visuals(1,false);assert.notDeepEqual(live.parts,later.parts);
  assert.deepEqual(g.visuals(0,true).parts.map(p=>p.position[1]),DROPS.map(p=>p[1]),'no bob when reduced');
});

test('the bob is visual only: the logical position stays put',()=>{
  const g=make();g.visuals(3,false);g.visuals(9,false);
  g.update(.1,DROPS[4],fly);assert.deepEqual(g.caught,[4]);
});

test('snapshot is plain data and the mesh creator provides the keys',()=>{
  const g=make();g.update(.1,DROPS[0],fly);assert.deepEqual(JSON.parse(JSON.stringify(g.snapshot())),g.snapshot());assert.deepEqual(g.snapshot().caught,[0]);
  const m=createFlightMeshes(kit(),()=>0);assert(m.scenery&&m.drop);assert.notEqual(m.scenery,m.drop);
});
