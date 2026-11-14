import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {GROUPS,CHECKPOINTS,progress,reachable,applyCheckpoint,forget,describe} from '../dist/reset.mjs';
import {restoreState} from '../dist/puzzle-model.mjs';
import {readJournal,WONDERS} from '../dist/wonder-journal.mjs';
import {SquirrelGathering} from '../dist/squirrel-gathering.mjs';
import {FoxInvitation} from '../dist/fox-invitation.mjs';
import {DragonGuest} from '../dist/dragon-guest.mjs';
import {readSpring} from '../dist/rare-dwellers.mjs';

const store=(seed={})=>{const m=new Map(Object.entries(seed));return{m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
const ground=()=>0;
const [HB,FINALE]=GROUPS.rhythms,[SQ,FX,DR,SPRING]=GROUPS.gathering,[SEED]=GROUPS.ending;
const solved=JSON.stringify({version:1,solved:[true,true,true,true],hints:[0,2,0,1]});
const seed=JSON.stringify({place:'bron',phase:'planted'});
const allKeys=Object.values(GROUPS).flat();
const throwing={getItem(){throw new Error('blocked')},setItem(){throw new Error('full')},removeItem(){throw new Error('blocked')}};
const atStage={
  begin:()=>store({[HB]:JSON.stringify({version:1,solved:[true,false,false,false],hints:[1,0,0,0]})}),
  awake:()=>store({[HB]:solved,[FINALE]:'bloom',[SQ]:'done',[FX]:'escort-not-valid'}),
  gathered:()=>store({[HB]:solved,[FINALE]:'bloom',[SQ]:'done',[FX]:'done',[DR]:'done',[SPRING]:'found'}),
  ended:()=>store({[HB]:solved,[FINALE]:'bloom',[SQ]:'done',[FX]:'done',[DR]:'done',[SPRING]:'found',[SEED]:seed}),
};

test('the inventory is complete: every localStorage key in dist/ is classified',()=>{
  // Filter: alleen 'elyndra-…' literals die echt als opslagsleutel dienen: argument van getItem/setItem/removeItem
  // of toegewezen aan een constante met KEY in de naam. Eventnamen (addEventListener/dispatchEvent) vallen er zo buiten.
  const dir=new URL('../dist/',import.meta.url),found=new Set();
  for(const f of fs.readdirSync(dir).filter(f=>/\.(m?js)$/.test(f))){
    const src=fs.readFileSync(new URL(f,dir),'utf8');
    for(const re of[/(?:get|set|remove)Item\(\s*['"`](elyndra-[\w-]+)['"`]/g,/\b\w*KEY\w*\s*=\s*['"`](elyndra-[\w-]+)['"`]/g])
      for(const m of src.matchAll(re))found.add(m[1]);
  }
  assert.ok(found.size>=15,'the scan finds the known keys: '+[...found]);
  for(const k of found)assert.ok(allKeys.includes(k),k+' is not classified in GROUPS');
  // Omgekeerd: elke ingedeelde sleutel bestaat nog in de code, behalve het zaad dat een collega nog toevoegt.
  for(const k of allKeys)if(k!==SEED)assert.ok(found.has(k),k+' is classified but no longer used');
});

test('no key is in two groups, all keys carry the elyndra- prefix and GROUPS is frozen',()=>{
  assert.equal(new Set(allKeys).size,allKeys.length);
  for(const k of allKeys)assert.match(k,/^elyndra-/);
  assert.deepEqual(Object.keys(GROUPS),['settings','rhythms','gathering','ending','wonders','meetings']);
  assert.ok(Object.isFrozen(GROUPS)&&Object.values(GROUPS).every(Object.isFrozen)&&Object.isFrozen(CHECKPOINTS));
  assert.deepEqual(CHECKPOINTS.map(c=>c.id),['begin','awake','gathered']);
  assert.equal(CHECKPOINTS[1].description,'Vier ritmes klinken. De samenkomst moet nog beginnen.');
  assert.deepEqual(GROUPS.ending,['elyndra-seed-v1']);
});

test('progress reads empty, partial, complete and corrupt storage',()=>{
  assert.deepEqual(progress(store()),{rhythms:0,finale:false,gathering:'none',ending:null,wonders:0,stage:'begin'});
  const partial=progress(atStage.begin());assert.equal(partial.rhythms,1);assert.equal(partial.stage,'begin');
  const mid=progress(atStage.awake());assert.deepEqual([mid.rhythms,mid.finale,mid.gathering,mid.stage],[4,true,'squirrel','awake']);
  const full=progress(store({...Object.fromEntries(atStage.ended().m),'elyndra-wonders-v1':JSON.stringify(['brook','deer','nonsense'])}));
  assert.deepEqual(full,{rhythms:4,finale:true,gathering:'dragon',ending:{place:'bron',phase:'planted'},wonders:2,stage:'ended'});
  assert.equal(progress(atStage.gathered()).stage,'gathered');
  // Kapotte waarden: veilige stand, geen fout.
  const bad=store({[HB]:'{oops',[FINALE]:'nope',[SQ]:'zzz',[FX]:'done',[DR]:'done',[SEED]:'[1]','elyndra-wonders-v1':'{x'});
  assert.deepEqual(progress(bad),{rhythms:0,finale:false,gathering:'none',ending:null,wonders:0,stage:'begin'});
  assert.equal(progress(store({[HB]:JSON.stringify({version:2,solved:[true,true,true,true]})})).rhythms,0);
  assert.equal(progress(store({[HB]:JSON.stringify({version:1,solved:'yes'}),[SEED]:'{"place":3}'})).ending,null);
  assert.equal(progress(store({[SQ]:'done',[FX]:'done',[DR]:'done'})).gathering,'dragon','chapters alone do not make the stage');
  assert.equal(progress(store({[SQ]:'done',[FX]:'done',[DR]:'done'})).stage,'begin');
});

test('a throwing storage gives safe defaults and changes nothing',()=>{
  assert.deepEqual(progress(throwing),{rhythms:0,finale:false,gathering:'none',ending:null,wonders:0,stage:'begin'});
  assert.deepEqual(reachable(throwing).map(c=>c.id),['begin']);
  assert.equal(reachable(throwing,{all:true}).length,3);
  for(const c of CHECKPOINTS)assert.deepEqual(applyCheckpoint(throwing,c.id),[]);
  assert.deepEqual(forget(throwing,'wonders'),[]);assert.deepEqual(forget(throwing,'meetings'),[]);
  assert.equal(describe(throwing),'Je bent bij: het begin. Nog geen wonderen gevonden.');
  assert.deepEqual(progress(null),progress(store()),'a missing storage also reads as empty');
});

test('reachable offers the checkpoints at or before the current stage; all opens every one',()=>{
  const ids=s=>reachable(s).map(c=>c.id);
  assert.deepEqual(ids(store()),['begin']);assert.deepEqual(ids(atStage.begin()),['begin']);
  assert.deepEqual(ids(atStage.awake()),['begin','awake']);
  assert.deepEqual(ids(atStage.gathered()),['begin','awake','gathered']);
  assert.deepEqual(ids(atStage.ended()),['begin','awake','gathered']);
  for(const s of['begin','awake','gathered','ended'])assert.deepEqual(reachable(atStage[s](),{all:true}),[...CHECKPOINTS]);
  assert.deepEqual(reachable(store(),{all:true}).map(c=>c.id),['begin','awake','gathered']);
});

const keeping={'elyndra-quality':'high','elyndra-auto-tier':'{"tier":"fast"}','elyndra-calm-hud':'off','elyndra-weather':'rain',
  'elyndra-wonders-v1':'["brook","gate"]','elyndra-met-dwellers':'["fox"]','elyndra-starcoats-v1':'met','elyndra-realm-v1':'visited',
  'elyndra-keeper-light-v1':'sent','elyndra-conversations-v1':'{"keeper":true}','elyndra-secret-garden':'found',
  'elyndra-squirrel-monument-v1':'found','elyndra-dragon-known':'yes'};
const untouched=[...GROUPS.settings,...GROUPS.wonders,...GROUPS.meetings];

test('every checkpoint from every starting stage gives the canonical state and spares settings, wonders and meetings',()=>{
  const canonical={
    begin:{},
    awake:{[HB]:JSON.stringify({version:1,solved:[true,true,true,true],hints:[0,0,0,0]}),[FINALE]:'bloom'},
    gathered:{[HB]:JSON.stringify({version:1,solved:[true,true,true,true],hints:[0,0,0,0]}),[FINALE]:'bloom',[SQ]:'done',[FX]:'done',[DR]:'done',[SPRING]:'found'},
  };
  for(const from of['empty','begin','awake','gathered','ended'])for(const c of CHECKPOINTS){
    const s=from==='empty'?store():atStage[from]();for(const [k,v] of Object.entries(keeping))s.setItem(k,v);
    const keep=untouched.map(k=>s.getItem(k));
    const changed=applyCheckpoint(s,c.id);
    const story=Object.fromEntries([...s.m].filter(([k])=>[...GROUPS.rhythms,...GROUPS.gathering,...GROUPS.ending].includes(k)));
    assert.deepEqual(story,canonical[c.id],`${from} -> ${c.id}`);
    assert.deepEqual(untouched.map(k=>s.getItem(k)),keep,`${from} -> ${c.id} leaves the rest alone`);
    assert.ok(changed.every(k=>[...GROUPS.rhythms,...GROUPS.gathering,...GROUPS.ending].includes(k)),'only story keys are reported');
    assert.equal(progress(s).stage,c.id==='begin'?'begin':c.id,`${from} -> ${c.id} reads back`);
    assert.deepEqual(applyCheckpoint(s,c.id),[],'applying twice changes nothing');
  }
  assert.deepEqual(applyCheckpoint(atStage.ended(),'begin').sort(),[...GROUPS.rhythms,...GROUPS.gathering,...GROUPS.ending].sort());
  assert.deepEqual(applyCheckpoint(atStage.ended(),'gathered'),[HB,SEED],'only the seed goes, the rhythm hints are normalised');
  assert.throws(()=>applyCheckpoint(store(),'ended'),RangeError);assert.throws(()=>applyCheckpoint(store(),'nonsense'),RangeError);
});

test('the values written are accepted by the real loaders',()=>{
  const s=store(keeping);
  applyCheckpoint(s,'begin');
  assert.deepEqual(restoreState(s.getItem(HB)).solved,[false,false,false,false]);
  for(const C of[[SquirrelGathering,'idle'],[FoxInvitation,'idle'],[DragonGuest,'idle']])assert.equal(new C[0](ground,s).phase,C[1]);
  assert.equal(readSpring(s),false);

  applyCheckpoint(s,'awake');
  const hb=restoreState(s.getItem(HB));assert.deepEqual(hb.solved,[true,true,true,true]);assert.deepEqual(hb.hints,[0,0,0,0]);
  assert.equal(JSON.parse(s.getItem(HB)).version,1);
  assert.equal(s.getItem(FINALE),'bloom');
  for(const C of[SquirrelGathering,FoxInvitation,DragonGuest])assert.equal(new C(ground,s).phase,'idle');
  assert.equal(readSpring(s),false);

  applyCheckpoint(s,'gathered');
  assert.deepEqual(restoreState(s.getItem(HB)).solved,[true,true,true,true]);
  assert.equal(new SquirrelGathering(ground,s).phase,'done');
  const fox=new FoxInvitation(ground,s),dragon=new DragonGuest(ground,s);
  assert.equal(fox.phase,'done');assert.equal(dragon.phase,'done');
  assert.equal(fox.active,false);assert.equal(dragon.active,false);
  assert.equal(readSpring(s),true,'the fox chapter needs its spring');
  // Het slot van de wereld (world.js) heeft geen export: de waarde 'bloom' is wat die code leest.
  assert.match(fs.readFileSync(new URL('../dist/world.js',import.meta.url),'utf8'),/localStorage\.getItem\(FINALE_KEY\) === 'bloom'/);
  // De wonderen en ontmoetingen lezen na afloop nog steeds hetzelfde.
  assert.deepEqual(readJournal(s),['brook','gate']);
});

test('forget removes only wonders or only meetings, and refuses the rest',()=>{
  const s=atStage.ended();for(const [k,v] of Object.entries(keeping))s.setItem(k,v);
  const before=new Map(s.m);
  assert.deepEqual(forget(s,'wonders'),['elyndra-wonders-v1']);
  assert.equal(s.getItem('elyndra-wonders-v1'),null);assert.deepEqual(readJournal(s),[]);
  for(const k of allKeys.filter(k=>k!=='elyndra-wonders-v1'))assert.equal(s.getItem(k),before.get(k)??null);
  assert.deepEqual(forget(s,'wonders'),[],'nothing left to forget');
  assert.deepEqual(forget(s,'meetings').sort(),[...GROUPS.meetings].sort());
  for(const k of GROUPS.meetings)assert.equal(s.getItem(k),null);
  for(const k of[...GROUPS.settings,...GROUPS.rhythms,...GROUPS.gathering,...GROUPS.ending])assert.equal(s.getItem(k),before.get(k)??null,k);
  assert.deepEqual(forget(store(),'meetings'),[]);
  for(const g of['settings','rhythms','gathering','ending','nonsense',undefined])assert.throws(()=>forget(store(),g),RangeError);
});

test('describe summarises the stage and the wonders in one Dutch sentence',()=>{
  assert.equal(describe(store()),'Je bent bij: het begin. Nog geen wonderen gevonden.');
  const s=atStage.gathered();s.setItem('elyndra-wonders-v1','["brook","gate"]');
  assert.equal(describe(s),`Je bent bij: de samenkomst is compleet. Twee van de ${WONDERS.length===6?'zes':WONDERS.length} wonderen gevonden.`);
  assert.equal(describe(s),'Je bent bij: de samenkomst is compleet. Twee van de zes wonderen gevonden.');
  s.setItem('elyndra-wonders-v1','["brook"]');assert.match(describe(s),/Eén van de zes wonderen gevonden\.$/);
  s.setItem('elyndra-wonders-v1',JSON.stringify(WONDERS.map(w=>w.id)));assert.match(describe(s),/Alle zes wonderen gevonden\.$/);
  assert.match(describe(atStage.awake()),/^Je bent bij: de vallei is gewekt\./);
  assert.match(describe(atStage.ended()),/^Je bent bij: het slot van het verhaal\./);
  assert.equal(describe(store({[HB]:'{oops',[SEED]:'x','elyndra-wonders-v1':'??'})),'Je bent bij: het begin. Nog geen wonderen gevonden.');
});
