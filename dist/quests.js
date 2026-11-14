import {TITLES,PLACES,GAMES,freshState,restoreState} from './puzzle-model.mjs?v=story52';
// De kroniek: vertelt wat er stil is en wat er terug is, en wijst de weg. De ritmes zelf
// worden in de wereld hersteld; die spellen roepen elyndraGame.solve(i) aan.
const $=id=>document.getElementById(id),dialog=$('quest-dialog'),body=$('quest-body'),KEY='elyndra-heartbeats-v1';let state,storage=true;try{state=restoreState(localStorage.getItem(KEY))}catch{state=freshState();storage=false}
let current=-1,priorFocus=null;
const AT=['bij de wortelkathedraal','bij de lichtpoort','in de zwevende tuinen','bij de moswachter'];
const RETURNED=['De rivier stroomt weer vol.','De lichtpoort gloeit weer en de kleuren worden dieper.','De vogels zingen weer voluit.','De moswachter verstaat de vallei weer.'];
const STILL=[
 'Onder de wortelkathedraal staat het bronwater stil. De drie wortelkommen zijn leeg, en de rivier is bijna droog. Zet de sluisjes in de wortelgoten open en dicht tot het water alle kommen vult.',
 'De lichtpoort slaapt. Het licht valt langs haar heen, en de kleuren van de vallei blijven dof. Draai de staande spiegelstenen tot één lichtstraal de poort raakt.',
 'In de zwevende tuinen valt de dauw voordat iemand hem opvangt. Daarom zingen er zo weinig vogels. Vlieg langs de eilanden en vang de dauw voor hij valt.',
 'De moswachter neuriet nog in zijn klokjes, maar niemand antwoordt hem. Luister naar wat hij neuriet. Antwoord door over de klinkende stenen te lopen.'
];
const BACK=['Het water stroomt weer.','Het licht vindt de poort.','De tuinen ademen weer.','De moswachter hoort je.'];
const restored=()=>state.solved.filter(Boolean).length;
function pause(){window.elyndraVisionOpen=true;dispatchEvent(new Event('elyndra-vision-open'))}
function solve(i){if(!Number.isInteger(i)||i<0||i>3||state.solved[i])return;state.solved[i]=true;save();dispatchEvent(new CustomEvent('elyndra-puzzle-solved',{detail:i}));open(i);$('quest-reward')?.focus()}
function update(){window.elyndraGame={unlocked:i=>!!state.solved[i],count:restored,restored:()=>[...state.solved],solve};$('vision-count').textContent=restored()+'/4';if(!storage)$('quest-storage').textContent='Opslaan is hier niet beschikbaar; voortgang blijft alleen tijdens deze sessie bewaard.';dispatchEvent(new CustomEvent('elyndra-game-update',{detail:{solved:[...state.solved]}}))}
function save(){state.hints=[0,0,0,0];try{localStorage.setItem(KEY,JSON.stringify(state))}catch{storage=false}update()}
function message(t){$('quest-message').textContent=t}
function open(i=-1){if(!Number.isInteger(i)||i<-1||i>3)i=-1;priorFocus=document.activeElement;current=i;const vision=$('vision-dialog');if(vision?.open)vision.close();pause();if(!dialog.open)dialog.showModal();render();$('quest-close').focus()}
window.elyndraStartPuzzle=open;
function render(){
 const done=current>=0&&state.solved[current];
 $('quest-finale').hidden=!((current<0||done)&&state.solved.every(Boolean)&&window.elyndraFinaleReady?.());
 message('');$('quest-title').textContent=current<0?'De kroniek':TITLES[current];$('quest-overview').hidden=current<0;
 // De oude hulpknoppen blijven in de HTML voor andere code, maar horen niet meer bij het verhaal.
 for(const id of ['quest-hint','quest-hint-text','quest-reset'])$(id).hidden=true;
 if(current<0)return overview();if(done)return wonScreen();guide()}
function chronicle(){const count=restored(),back=state.solved.flatMap((v,i)=>v?[RETURNED[i]]:[]);
 if(count===0)return 'De vallei is stil geworden. De rivier is bijna drooggevallen, er zingen weinig vogels en de kleuren zijn dof. De moswachter bewaart het laatste zaad in zijn stenen hand, maar het wil niet ontwaken. Vier ritmes zijn stilgevallen. Je mag ze in elke volgorde terugbrengen.';
 if(count===4)return 'Alle vier ritmes zijn terug. '+back.join(' ')+' Ga naar hem toe en luister. Het zaad in zijn hand wacht.';
 const missing=state.solved.flatMap((v,i)=>v?[]:[i]);
 const tail=count===3?`Alleen ${TITLES[missing[0]].toLowerCase()} ontbreekt nog, ${AT[missing[0]]}.`:count===2?'Het zaad slaapt nog. Twee plekken wachten op je.':'De andere plekken wachten nog. Er is geen haast.';
 return `${['Eén ritme is','Twee ritmes zijn','Drie ritmes zijn'][count-1]} terug. ${back.join(' ')} ${tail}`}
function overview(){const count=restored();body.innerHTML=`<p class="quest-intro">${chronicle()}</p><div class="quest-progress" aria-label="${count} van 4 ritmes hersteld">${state.solved.map(v=>`<span class="${v?'done':''}">${v?'✦':'◇'}</span>`).join('')}</div><div class="quest-cards">${TITLES.map((t,i)=>`<button data-quest="${i}" class="quest-card ${state.solved[i]?'solved':''}"><span class="quest-card-number">0${i+1}</span><span><strong>${t}</strong><small>${PLACES[i]} · ${GAMES[i].toLowerCase()}</small><em>${state.solved[i]?'✦ Hersteld · visioen open':'◇ Nog stil'}</em></span></button>`).join('')}</div>`;for(let b of body.querySelectorAll('[data-quest]'))b.onclick=()=>{current=Number(b.dataset.quest);render()}}
function guide(){const i=current;body.innerHTML=`<div class="quest-victory"><span class="quest-seal">◇</span><p class="quest-eyebrow">${PLACES[i].toUpperCase()} · NOG STIL</p><h3>${GAMES[i]}</h3><p>${STILL[i]}</p><p class="puzzle-instruction">Geen haast. Je kunt altijd weglopen en later terugkomen.</p><button id="quest-guide" class="primary">Breng me erheen</button></div>`;$('quest-guide').onclick=()=>{dialog.close();dispatchEvent(new CustomEvent('elyndra-guide',{detail:i}))};$('quest-guide').focus?.()}
function wonScreen(){const count=restored();body.innerHTML=`<div class="quest-victory"><span class="quest-seal">✦</span><p class="quest-eyebrow">${TITLES[current].toUpperCase()} · ${count} / 4</p><h3>${BACK[current]}</h3><p>${count===4?'Alle vier ritmes klinken. De vallei is wakker, en dit visioen is van jou.':RETURNED[current]+' Achter het zichtbare wacht een visioen van wie hier leeft.'}</p><button id="quest-reward" class="primary">Onthul ${PLACES[current].toLowerCase()} ↗</button></div>`;$('quest-reward').onclick=()=>{const i=current;dialog.close();dispatchEvent(new CustomEvent('elyndra-reward',{detail:i}))}}
let hearForestOnClose = false;
$('quest-finale').onclick = () => {
  if (!dialog.open || $('quest-finale').hidden) return;
  hearForestOnClose = true;
  dialog.close();
};
dialog.addEventListener('close', () => {
  if (!hearForestOnClose) return;
  hearForestOnClose = false;
  if (!document.querySelector('dialog[open]')) dispatchEvent(new Event('elyndra-hear-forest'));
});
$('quest-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{window.elyndraVisionOpen=!!document.querySelector('dialog[open]');if(!window.elyndraVisionOpen)priorFocus?.focus()});$('quest-overview').onclick=()=>{current=-1;render()};
addEventListener('keydown',e=>{if(dialog.open&&e.code==='KeyV')e.preventDefault()});update();
