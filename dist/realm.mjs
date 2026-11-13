// Het land achter de poort: het turkooizen woud dat je in de visie door de boog ziet.
// Je komt er door een wakkere lichtpoort heen te lopen. In het midden staat de
// Herinneringsboom: voor alles wat je in de vallei hebt gevonden of gewekt draagt
// hij een lichtvrucht, en wie stil onder zijn kroon staat, krijgt antwoord.
// Hier staat alleen het rekenwerk; realm-scenery.mjs bouwt het landschap.
export const REALM_KEY='elyndra-realm-v1';
export const REALM=Object.freeze({x:0,z:2000,radius:104,ceiling:42,arrive:[0,58],arch:[0,68],archHalf:4.4,pool:[27,-15],poolRadius:14,crown:17});
export const VALLEY_GATE=Object.freeze({x:66,z:-110,half:8.6,back:[66,-103]});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};

export const inRealm=p=>p[2]>1500;
export const local=p=>[p[0]-REALM.x,p[2]-REALM.z];

// Een zachte kom met een heuvel onder de boom, een poel en een oplopende rand in de mist.
export function realmGround(x,z){
  const lx=x-REALM.x,lz=z-REALM.z,r=Math.hypot(lx,lz);
  let h=1.1+1.3*Math.sin(lx*.045+.6)*Math.cos(lz*.05)+.6*Math.sin(lz*.021-lx*.017);
  h+=3.4*Math.exp(-(r*r)/(21*21));
  const pool=Math.hypot(lx-REALM.pool[0],lz-REALM.pool[1]);h-=smooth(1-pool/REALM.poolRadius)*7.2;
  const rim=Math.min(1.5,Math.max(0,(r-92)/22));h+=rim*rim*16;
  return h;
}

// Houd de bezoeker binnen het eiland in de mist. Geeft de (eventueel bijgestuurde) positie terug.
export function contain(p,groundAt=realmGround){
  const [lx,lz]=local(p),r=Math.hypot(lx,lz),next=[...p];
  if(r>REALM.radius){const k=REALM.radius/r;next[0]=REALM.x+lx*k;next[2]=REALM.z+lz*k;}
  next[1]=Math.min(next[1],groundAt(next[0],next[2])+REALM.ceiling);
  return next;
}

// Door de wakkere poort naar het noorden lopen brengt je erheen; door de boog aan de
// zuidkant van het eiland lopen brengt je terug. Vliegen mag, zolang je door de opening gaat.
export function passage(previous,next,{awake=false}={}){
  if(!previous)return null;
  if(!inRealm(next)){
    if(awake&&!inRealm(previous)&&previous[2]>VALLEY_GATE.z&&next[2]<=VALLEY_GATE.z&&Math.abs(next[0]-VALLEY_GATE.x)<VALLEY_GATE.half&&Math.abs(previous[2]-next[2])<3)return 'enter';
    return null;
  }
  const [ax,az]=local(previous),[bx,bz]=local(next);
  if(inRealm(previous)&&az<REALM.arch[1]&&bz>=REALM.arch[1]&&Math.abs(bx-REALM.arch[0])<REALM.archHalf&&Math.abs(bz-az)<3)return 'leave';
  return null;
}
// De lichtbron midden in de poel: wie erin blijft staan, wordt naar de zwevende tuinen getild.
export const WELL_SECONDS=2.5;
export function inWell(p){if(!inRealm(p))return false;const [lx,lz]=local(p);return Math.hypot(lx-REALM.pool[0],lz-REALM.pool[1])<3.2;}
export function arrival(groundAt=realmGround){const x=REALM.x+REALM.arrive[0],z=REALM.z+REALM.arrive[1];return {pos:[x,groundAt(x,z)+2.4,z],yaw:0,pitch:.12};}
export function homecoming(groundAt){const [x,z]=VALLEY_GATE.back;return {pos:[x,groundAt(x,z)+2.4,z],yaw:Math.PI,pitch:.04};}

// Negen vruchten in een kring onder de kroon: vijf wonderen en vier hartslagen.
const KINDS=[['brook','wonder','de adem aan de beek'],['heart0','heart','de eerste hartslag'],['cathedral','wonder','de adem van de kathedraal'],['heart1','heart','de tweede hartslag'],['gate','wonder','de spiegel van de poort'],['heart2','heart','de derde hartslag'],['dew','wonder','de dauw van de tuinen'],['heart3','heart','de vierde hartslag'],['deer','wonder','het hert en zijn spiegelbeeld']];
export const FRUITS=Object.freeze(KINDS.map(([id,kind,name],i)=>{
  const angle=i*Math.PI*2/KINDS.length+.35,r=9.5+(i%3)*1.7;
  return Object.freeze({id,kind,name,x:REALM.x+Math.cos(angle)*r,z:REALM.z+Math.sin(angle)*r,height:3.3+(i%4)*.55});
}));
export function fruitStates(found=[],heartbeats=[]){
  const known=new Set(found);
  return FRUITS.map(f=>({...f,lit:f.kind==='wonder'?known.has(f.id):!!heartbeats[Number(f.id.slice(5))]}));
}
export function answer(states){
  const lit=states.filter(s=>s.lit).length,total=states.length,dark=states.find(s=>!s.lit);
  if(lit===0)return 'Negen knoppen, allemaal nog dicht. De boom wacht op wat je in de vallei vindt.';
  if(lit===total)return 'Alle negen vruchten branden. De boom kent de hele vallei, en hij kent jou.';
  return `${lit} van de negen vruchten branden. Een knop wacht nog op ${dark.name}.`;
}

// Wie stil onder de kroon staat, krijgt na een paar tellen antwoord. Eén keer per bezoek aan de boom.
export const LISTEN_SECONDS=5;
export class Listening{
  constructor(){this.still=0;this.answered=false;this.glow=0;}
  update(seconds,p,{moving=false,grounded=true}={}){
    const [lx,lz]=local(p),under=inRealm(p)&&grounded&&Math.hypot(lx,lz)<REALM.crown;
    seconds=Math.max(0,seconds);this.glow=Math.max(0,this.glow-seconds/7);
    if(!under){this.still=0;this.answered=false;return false;}
    this.still=moving?0:this.still+seconds;
    if(this.answered||this.still<LISTEN_SECONDS)return false;
    this.answered=true;this.glow=1;return true;
  }
}

export function readVisited(storage){try{return storage.getItem(REALM_KEY)==='visited';}catch{return false;}}
export function saveVisited(storage){try{storage.setItem(REALM_KEY,'visited');}catch{}}
