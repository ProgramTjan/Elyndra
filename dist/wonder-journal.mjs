// Het reismenu toont een wonder pas nadat je het zelf hebt gevonden.
// Tot die tijd fluistert het woud één aanwijzing: het dichtstbijzijnde geheim.
export const JOURNAL_KEY='elyndra-wonders-v1';
export const WONDERS=Object.freeze([
  {id:'brook',button:'brook-view',place:[13.5,-8],found:['awakening','constellation','afterglow'],
    whisper:'Waar de beek onder de wortelbogen door stroomt, loont het om stil te blijven staan.',
    name:'De adem van Elyndra'},
  {id:'cathedral',button:'cathedral-breath',place:[-48,-65],found:['awakening','breath','song','afterglow'],
    whisper:'Onder de bogen van de wortelkathedraal ademt iets, als de zon laag staat en jij stil bent.',
    name:'De adem van de kathedraal'},
  {id:'gate',button:'gate-mirror',place:[66,-110],found:['awakening','mirror','afterglow'],
    whisper:'Een wakkere poort toont in de schemering meer dan steen. Blijf ervoor staan.',
    name:'De spiegel van de poort'},
  {id:'dew',button:'garden-dew',place:[-96,-180],found:['awakening','seeding','afterglow'],
    whisper:'Na regen houden de zwevende tuinen hun water niet lang vast. Vlieg ertussen en wacht.',
    name:'Dauw van de tuinen'},
  {id:'deer',button:'deer-mirror-view',place:[11,135],found:['invitation','entering','searching','opening','beyond','returning'],
    whisper:'Aan het sterrenmeer drinkt een hert dat het niet altijd eens is met zijn spiegelbeeld. Ga naast hem staan.',
    name:'Het hert aan het sterrenmeer'},
  {id:'realm',button:'realm-view',place:[66,-110],found:['entered'],
    whisper:'Een wakkere poort is meer dan een boog van steen. Loop er eens doorheen.',
    name:'Het land achter de poort'},
]);

export function readJournal(storage){
  try{const saved=JSON.parse(storage.getItem(JOURNAL_KEY)||'[]');return Array.isArray(saved)?saved.filter(id=>WONDERS.some(w=>w.id===id)):[];}catch{return [];}
}
export function saveJournal(storage,journal){
  try{storage.setItem(JOURNAL_KEY,JSON.stringify([...journal.found]));}catch{}
}
// ?alles in het adres opent het hele menu: handig om te testen of iets te laten zien.
export function revealAll(search=''){
  try{return new URLSearchParams(search).has('alles');}catch{return false;}
}

export class WonderJournal{
  constructor(found=[],{all=false}={}){this.found=new Set(found);this.all=all;}
  knows(id){return this.all||this.found.has(id);}
  // phases: {brook:'far',cathedral:'awakening',...}. Geeft de wonderen terug die nu voor het eerst gevonden zijn.
  observe(phases){
    const fresh=[];
    for(const w of WONDERS){if(this.found.has(w.id))continue;if(w.found.includes(phases[w.id])){this.found.add(w.id);fresh.push(w);}}
    return fresh;
  }
  // Het dichtstbijzijnde wonder dat nog niet gevonden is, of null als alles gevonden is.
  nearest(position){
    let best=null,distance=Infinity;
    for(const w of WONDERS){if(this.knows(w.id))continue;const d=Math.hypot(position[0]-w.place[0],position[2]-w.place[1]);if(d<distance){distance=d;best=w;}}
    return best;
  }
}
