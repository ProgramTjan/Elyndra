import assert from 'node:assert/strict';import {SPEAKERS,conversationNode,nearbySpeakers} from '../dist/conversation-model.mjs';
for(let who of Object.keys(SPEAKERS))for(let solved of[false,true]){const seen=new Set(),todo=['start'];while(todo.length){let key=todo.pop();if(seen.has(key))continue;seen.add(key);let node=conversationNode(who,key,{solved,all:solved,met:true});assert(node,`${who}/${key}`);assert(node.text.length>15);assert(node.choices.length<=3);for(let [label,next]of node.choices){assert(label);if(next==='puzzle')assert(who==='keeper'&&!solved);else if(next!=='end')todo.push(next);}}}
assert.notEqual(conversationNode('keeper','start').text,conversationNode('keeper','start',{solved:true}).text);
assert(conversationNode('deer','hear',{gate:true}).text.includes('poort'));
assert(conversationNode('keeper','start',{roots:true}).text.includes('wakker'));
assert(conversationNode('squirrel','keeper',{gate:true}).text.includes('poort'));
assert(nearbySpeakers([-37,2,-46],[-37,0,-46],0).includes('deer'));assert(!nearbySpeakers([-37,100,-46],[-37,0,-46],0).includes('deer'));assert(nearbySpeakers([92,2,46],[-37,0,-46],0).includes('squirrel'));
const listeners={},nodes=new Map(),storage=new Map();let focused,puzzle=-1,solved=false,canInteract=true;
function element(id){let events={};return{id,open:false,hidden:false,textContent:'',children:[],focus(){focused=this},replaceChildren(){this.children=[]},appendChild(b){this.children.push(b)},get firstElementChild(){return this.children[0]},addEventListener(type,f){(events[type]??=[]).push(f)},showModal(){this.open=true},close(){this.open=false;for(let f of events.close??[])f()},emit(type){for(let f of events[type]??[])f()}}}
for(let id of['conversation-dialog','conversation-choices','conversation-name','conversation-tag','conversation-text','talk-near','conversation-close','quest-dialog'])nodes.set(id,element(id));
const $=id=>nodes.get(id);globalThis.window=globalThis;globalThis.document={getElementById:$,createElement:()=>element('button'),get activeElement(){return focused},querySelector:()=>[...nodes.values()].find(x=>x.open)};globalThis.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};globalThis.addEventListener=(t,f)=>(listeners[t]??=[]).push(f);globalThis.dispatchEvent=e=>{for(let f of listeners[e.type]??[])f(e)};
window.elyndraCanInteract=()=>canInteract;window.elyndraGame={unlocked:()=>solved,count:()=>solved?4:0};window.elyndraStartPuzzle=i=>{puzzle=i;$('quest-dialog').showModal();window.elyndraVisionOpen=true;};
await import('../dist/conversations.js');const nearby=ids=>dispatchEvent({type:'elyndra-talk-near',detail:ids}),choose=i=>$('conversation-choices').children[i].onclick();
$('talk-near').focus();nearby(['keeper']);$('talk-near').onclick();assert($('conversation-dialog').open&&window.elyndraVisionOpen);choose(1);choose(0);choose(0);assert.equal(puzzle,3);assert(!$('conversation-dialog').open&&$('quest-dialog').open&&window.elyndraVisionOpen);
$('quest-dialog').close();window.elyndraVisionOpen=false;solved=true;$('talk-near').onclick();assert($('conversation-text').textContent.includes('Vier ritmes'));$('conversation-close').onclick();assert(!window.elyndraVisionOpen);assert(storage.get('elyndra-conversations-v1').includes('keeper'));
nearby(['keeper','squirrel']);$('talk-near').onclick();assert.equal($('conversation-choices').children.length,2);choose(1);choose(1);assert($('conversation-text').textContent.includes('noot'));$('conversation-dialog').emit('cancel');$('conversation-dialog').close();assert(!window.elyndraVisionOpen);
nearby([]);assert($('talk-near').hidden);$('talk-near').onclick();assert(!$('conversation-dialog').open);console.log('Conversations: reachable branches, solved follow-up, range/altitude, modal pause, puzzle handoff, multi-speaker choice, close and saved visits.');

nearby(['keeper']);
function pressTalk(extra={}){let prevented=false;dispatchEvent({type:'keydown',code:'KeyT',repeat:false,target:{tagName:'BODY'},preventDefault(){prevented=true},...extra});return prevented;}
canInteract=false;
$('talk-near').onclick();assert(!$('conversation-dialog').open,'Talk button respects intro/help/travel gameplay guard');
assert.equal(pressTalk(),false,'Blocked T does not steal a key from the current UI');assert(!$('conversation-dialog').open);
canInteract=true;
for(const extra of [{ctrlKey:true},{metaKey:true},{altKey:true},{target:{tagName:'SELECT'}},{target:{tagName:'INPUT'}},{target:{tagName:'DIV',isContentEditable:true}}]){assert.equal(pressTalk(extra),false);assert(!$('conversation-dialog').open,'Modified or editable T cannot start a conversation');}
assert.equal(pressTalk(),true);assert($('conversation-dialog').open,'Unmodified T still opens a nearby conversation');$('conversation-close').onclick();
console.log('Conversation shortcuts respect gameplay availability, form controls and browser modifiers.');

for(const [dragonKnown,keeperLight] of [[false,false],[true,false],[true,true]]){
 const ctx={dragonKnown,keeperLight,monument:true,solved:true,all:true};
 const start=conversationNode('keeper','start',ctx);
 assert(start.text.includes('ontvangstzaal'),'The monument remains part of the keeper’s greeting');
 assert.equal(start.choices.some(([,next])=>next==='dragon'),dragonKnown);
 if(dragonKnown){
  const dragon=conversationNode('keeper','dragon',ctx);
  assert.equal(dragon.choices.some(([,next])=>next==='sendLight'),!keeperLight);
  assert(dragon.choices.some(([,next])=>next==='sit'));
 }
}

// Het einde: het zaad en de drie plekken.
const PLACES={seedSpring:['spring','bron'],seedGardens:['gardens','lucht'],seedRealm:['realm','poort']};
assert(!conversationNode('keeper','start',{all:true}).choices.some(([,n])=>n==='seedChoice'),'closed seed offers no choice');
for(const phase of ['closed','planting','growing','grown'])assert(!conversationNode('keeper','start',{seedPhase:phase}).choices.some(([,n])=>n==='seedChoice'),phase);
const offered=conversationNode('keeper','start',{all:true,seedPhase:'offered',dragonGuestPhase:'done',foxPhase:'done'});
assert.deepEqual(offered.choices[0],['Waar mag het zaad groeien?','seedChoice'],'the seed question comes first');
const seedChoice=conversationNode('keeper','seedChoice',{seedPhase:'offered'});
assert.deepEqual(seedChoice.choices,[['Bij de bron.','seedSpring'],['In de zwevende tuinen.','seedGardens'],['Achter de poort.','seedRealm'],['Ik denk er nog over na.','end']]);
assert.match(seedChoice.text,/Herinneringsboom/);assert.match(seedChoice.text,/fout/);
for(const [node,[,word]] of Object.entries(PLACES)){const n=conversationNode('keeper',node,{seedPhase:'offered'});assert(n.text.includes(word),node);assert.match(n.text,/stil naast staan/);assert.equal(n.choices.length,1);assert.equal(n.choices[0][1],'end');}
const carrying=conversationNode('keeper','start',{seedPhase:'carrying',seedPlace:'gardens',dragonGuestPhase:'done'});
assert.match(carrying.text,/zwevende tuinen/);assert.deepEqual(carrying.choices[0],['Ik kies toch een andere plek.','seedChoice']);
assert(!carrying.text.includes('wacht alleen nog op een plek'),'once the seed travels the old guest line is gone');
const closing='Het woud kent je nu bij naam, ook al heb je die nooit gezegd.';
const epilogues=['spring','gardens','realm'].map(place=>{const t=conversationNode('keeper','start',{seedPhase:'grown',seedPlace:place,dragonGuestPhase:'done'}).text;assert(t.endsWith(closing+'”'),place);return t});
assert.equal(new Set(epilogues).size,3,'every place has its own epilogue');
assert(conversationNode('keeper','start',{seedPhase:'grown',seedPlace:'realm'}).text.includes('tiende vrucht'));
assert(conversationNode('keeper','start',{seedPhase:'grown',seedPlace:null}).text.includes(closing));
for(const n of [seedChoice,...epilogues.map(text=>({text})),carrying])assert(!/!/.test(n.text),'no exclamation marks in the ending');
// In het gesprek zelf: een keuze toont de zegen en meldt de plek aan de wereld.
const chosen=[];addEventListener('elyndra-seed-choose',e=>chosen.push(e.detail));
for(const [node,[place]] of Object.entries(PLACES)){
 window.elyndraForestMemory=()=>({seedPhase:'offered'});nearby(['keeper']);$('talk-near').onclick();
 assert.equal($('conversation-choices').children[0].textContent,'Waar mag het zaad groeien?');choose(0);
 const i=Object.keys(PLACES).indexOf(node);choose(i);
 assert.equal(chosen.at(-1),place);assert($('conversation-dialog').open,'the blessing stays readable');
 assert.equal($('conversation-text').textContent,conversationNode('keeper',node,{seedPhase:'offered'}).text);
 choose(0);assert(!$('conversation-dialog').open);
}
assert.deepEqual(chosen,['spring','gardens','realm']);
window.elyndraForestMemory=()=>({seedPhase:'offered'});$('talk-near').onclick();choose(0);choose(3);assert(!$('conversation-dialog').open);assert.equal(chosen.length,3,'thinking it over chooses nothing');
window.elyndraForestMemory=undefined;
console.log('Seed ending: offered, carrying, grown epilogues, three blessings and the elyndra-seed-choose event.');
