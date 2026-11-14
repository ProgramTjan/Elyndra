import {REALM} from './realm.mjs?v=story52';

// Deel 5, de keuze. De moswachter vraagt waar het laatste zaad mag groeien. De speler
// kiest, draagt het erheen, legt het neer en blijft erbij stilstaan. Dan groeit er een
// jonge lichtboom, en de vallei verandert blijvend, op elke plek anders. Geen keuze is fout.
// Hier staat alleen de logica en het bouwen van de meshes; world.js past de gevolgen toe.
export const SEED_KEY='elyndra-seed-v1';
export const PLANT_SECONDS=5;      // stilstaan bij het neergelegde zaad, bij elkaar opgeteld
export const GROW_SECONDS=14;      // van spruit tot boom
export const LEAVE_DISTANCE=12;    // verder weg en het zaad wacht weer in je hand
export const SEED_KEEPER=Object.freeze([94,49]);   // waar de reisknop je bij de moswachter neerzet (de samenkomst)
export const GARDEN_SITE=Object.freeze([-96,44.5,-180]); // boven op het grote zwevende eiland
export const KEEPER_CLOSING='Je kwam als bezoeker. Het woud kent je nu bij naam, ook al heb je die nooit gezegd.';
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const flat=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const full=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const TAU=Math.PI*2;

// reach: waar de actieknop verschijnt; still: binnen deze afstand telt stilstaan mee.
// travel: een standplek een paar meter van de plantplek, voor het reismenu.
export const SEED_PLACES=Object.freeze({
 spring:Object.freeze({id:'spring',name:'Bij de bron',toward:'Het zaad naar de bron',flying:false,reach:4,still:6,turn:.6,
  site:g=>[-42,g(-42,-36),-36],travel:Object.freeze([-39.5,-33.5]),
  keeper:'Wat bij de bron groeit, is van iedereen die drinkt.',
  epilogue:'De rivier stroomt breder en helderder. Langs de oevers wordt het groen dieper. Wie drinkt, drinkt een beetje van de boom.',
  where:'Draag het zaad naar de bron bij de wortelkathedraal, waar de vos dronk. Leg het daar neer.'}),
 gardens:Object.freeze({id:'gardens',name:'In de zwevende tuinen',toward:'Het zaad naar de tuinen',flying:true,reach:7,still:9,turn:2.1,
  site:GARDEN_SITE,travel:Object.freeze([-92,-178]),
  keeper:'Wat in de lucht groeit, reist verder dan wij.',
  epilogue:'Boven de eilanden ruist een jonge kroon. Af en toe dwarrelt een lichtzaad over de vallei. Niemand weet waar het landt.',
  where:'Breng het zaad naar het grote zwevende eiland. Vliegen mag. Leg het boven op het eiland neer.'}),
 realm:Object.freeze({id:'realm',name:'Achter de poort',toward:'Het zaad naar de poort',flying:false,reach:4,still:6,turn:-.9,
  site:g=>[REALM.x-13,g(REALM.x-13,REALM.z+9),REALM.z+9],travel:Object.freeze([REALM.x-10.5,REALM.z+11.5]),
  keeper:'Wat achter de poort groeit, wacht op wie nog komt.',
  epilogue:'Naast de Herinneringsboom staat nu een jonge boom. Aan de oude kroon hangt een tiende vrucht. De poort blijft wakker.',
  where:'Ga door de wakkere poort naar de Herinneringsboom. Leg het zaad naast hem neer.'})
});
const IDS=Object.keys(SEED_PLACES);
const first=text=>text.match(/^[^.]*\./)[0];

export class SeedChoice {
 constructor(ground,storage){
  this.ground=ground;this.storage=storage;this._available=false;
  this.phase='closed';this.place=null;this.still=0;this.elapsed=0;this.carryTime=0;
  // Opslag is optioneel en mag stuk zijn; dan begint het hoofdstuk gewoon dicht.
  try{
   const saved=JSON.parse(storage?.getItem(SEED_KEY)??'null');
   const phase={carrying:'carrying',planting:'carrying',growing:'grown',grown:'grown'}[saved?.phase];
   if(phase&&IDS.includes(saved.place)){this.place=saved.place;this.phase=phase;}
  }catch{}
 }
 // De lead zet dit aan zodra de draak er is. Wie nog niet gekozen heeft, krijgt de vraag.
 get available(){return this._available;}
 set available(value){
  this._available=!!value;
  if(this._available&&this.phase==='closed')this.phase='offered';
  else if(!this._available&&this.phase==='offered')this.phase='closed';
 }
 get info(){return this.place?SEED_PLACES[this.place]:null;}
 siteOf(id){const s=SEED_PLACES[id].site;return typeof s==='function'?s(this.ground):[...s];}
 get site(){return this.place?this.siteOf(this.place):null;}
 save(){
  const phase={carrying:'carrying',planting:'carrying',growing:'growing',grown:'grown'}[this.phase];
  if(!phase)return;try{this.storage?.setItem(SEED_KEY,JSON.stringify({place:this.place,phase}));}catch{}
 }
 onFoot(p,flying){return !flying&&Math.abs(p[1]-this.ground(p[0],p[2]))<4.5;}
 // Afstand tot de plantplek: in de tuinen in drie dimensies, elders over de grond.
 distance(p){return this.info.flying?full(p,this.site):flat(p,this.site);}
 atSite(p,flying,radius=this.info.reach){
  if(!this.place)return false;
  if(!this.info.flying&&!this.onFoot(p,flying))return false;
  return this.distance(p)<=radius;
 }
 choose(id){
  if(!IDS.includes(id)||!['offered','carrying'].includes(this.phase))return false;
  if(this.place!==id)this.carryTime=0;
  this.place=id;this.phase='carrying';this.still=0;this.save();return true;
 }
 action(p,{flying=false}={}){return this.phase==='carrying'&&this.atSite(p,flying)?'Leg het zaad neer':null;}
 interact(p,{flying=false}={}){
  if(!this.action(p,{flying}))return [];
  this.phase='planting';this.still=0;return [{type:'bell',note:392}];
 }
 update(seconds,p,{moving=false,flying=false}={}){
  const dt=Math.min(.5,Math.max(0,seconds||0)),events=[];
  if(this.phase==='closed'&&this._available)this.phase='offered';
  if(this.phase==='carrying')this.carryTime+=dt;
  else if(this.phase==='planting'){
   if(this.distance(p)>LEAVE_DISTANCE){
    this.phase='carrying';this.still=0;
    events.push({type:'toast',text:'Het zaad gaat weer met je mee. Het wacht tot je terugkomt.'});
   }else if(!moving&&this.atSite(p,flying,this.info.still)){
    // Lopen pauzeert het tellen, maar wist niets: wat je al stilstond, telt.
    this.still+=dt;
    if(this.still>=PLANT_SECONDS){this.still=PLANT_SECONDS;this.phase='growing';this.elapsed=0;this.save();events.push({type:'bell',note:523.25});}
   }
  }else if(this.phase==='growing'){
   this.elapsed+=dt;
   if(this.elapsed>=GROW_SECONDS){
    this.elapsed=GROW_SECONDS;this.phase='grown';this.save();
    events.push({type:'toast',text:first(this.info.epilogue)},{type:'chime'});
   }
  }
  return events;
 }
 get growth(){return this.phase==='grown'?1:this.phase==='growing'?clamp(this.elapsed/GROW_SECONDS):0;}
 effects(){
  const growth=this.growth,grown=this.phase==='grown';
  return {river:this.place==='spring'?growth:0,seeds:this.place==='gardens'&&grown,
   gateAwake:this.place==='realm'&&grown,tenthFruit:this.place==='realm'&&grown,growth};
 }
 // Wat er bij de plantplek staat: eerst een gloed als wegwijzer, dan het zaad, dan de boom.
 visuals(clock=0,reduced=false){
  const out={parts:[],motes:[],carried:this.phase==='carrying'};
  if(!this.place||!['carrying','planting','growing','grown'].includes(this.phase))return out;
  const s=this.site,rot=this.info.turn,t=reduced?0:clock,part=mesh=>out.parts.push({mesh,position:[...s],rotation:rot});
  part('glow');
  if(this.phase==='carrying'){
   // Een paar zwevende lichtjes boven de plek, zodat je haar van ver ziet.
   for(let i=0;i<(reduced?3:6);i++)out.motes.push([s[0]+Math.cos(i*2.4)*.5,s[1]+1.2+i*.9+Math.sin(t*.8+i)*.25,s[2]+Math.sin(i*2.4)*.5]);
  }else if(this.phase==='planting'){
   part('seed');const k=this.still/PLANT_SECONDS,n=Math.round((reduced?4:10)*(.3+.7*k));
   for(let i=0;i<n;i++){const a=i*TAU/n+t*.4,r=1.4-k*.9;out.motes.push([s[0]+Math.cos(a)*r,s[1]+.25+((i*.37+t*.3)%1)*.6,s[2]+Math.sin(a)*r]);}
  }else if(this.phase==='growing'){
   const g=this.growth;part(g<1/3?'sprout':g<2/3?'sapling':'tree');
   const n=reduced?10:30,height=1+g*6.5;
   for(let i=0;i<n;i++){const a=i*2.399+t*.3,r=.6+(i%5)*.35,u=reduced?(i/n):((i*.618+t*.35)%1);
    out.motes.push([s[0]+Math.cos(a)*r,s[1]+.2+u*height,s[2]+Math.sin(a)*r]);}
  }else{
   part('tree');const n=reduced?8:20;
   for(let i=0;i<n;i++){const a=i*TAU/n+t*.12,r=3.2+Math.sin(i*1.7)*.4;
    out.motes.push([s[0]+Math.cos(a)*r,s[1]+5.4+Math.sin(i*2.3+t*.5)*.6,s[2]+Math.sin(a)*r]);}
  }
  return out;
 }
 words(){
  const info=this.info;
  if(this.phase==='offered')return ['Waar mag het groeien?','De moswachter houdt het laatste zaad in zijn stenen hand. Spreek hem aan en kies een plek. Geen keuze is fout.'];
  if(this.phase==='carrying'){
   let text=info.where;
   if(this.carryTime>=180)text+=' Via Ontdek plekken ben je er zo. Wil je toch een andere plek, vraag het de moswachter.';
   else if(this.carryTime>=90)text+=' Je kunt ook via Ontdek plekken reizen.';
   return [info.toward,text];
  }
  if(this.phase==='planting')return this.still<PLANT_SECONDS/2
   ?['Blijf erbij','Het zaad ligt in de aarde. Sta stil. Wie loopt, laat het wachten.']
   :['Het zaad hoort je','Nog even stilstaan. Het begint te bewegen.'];
  if(this.phase==='growing'){const g=this.growth;
   if(g<1/3)return ['Een spruit','Twee blaadjes openen zich. Ze zoeken het licht.'];
   if(g<2/3)return ['Een jonge boom','Een bleke stam strekt zich. De blaadjes gaan gloeien.'];
   return ['Een boom van licht',`De moswachter zegt: “${info.keeper}”`];}
  if(this.phase==='grown')return [info.name,`${info.epilogue} De moswachter zegt: “${KEEPER_CLOSING}”`];
  return null;
 }
 // Waar de reisknop je heen brengt: naar de moswachter om te kiezen, daarna naar de plek.
 travelTarget(){
  if(this.phase==='offered')return [SEED_KEEPER[0],this.ground(SEED_KEEPER[0],SEED_KEEPER[1]),SEED_KEEPER[1]];
  return this.place&&this.phase!=='closed'?this.site:null;
 }
 snapshot(){return {phase:this.phase,place:this.place,available:this._available,still:this.still,elapsed:this.elapsed,carryTime:this.carryTime,growth:this.growth,site:this.site};}
 reset(){
  this.place=null;this.still=0;this.elapsed=0;this.carryTime=0;this.phase=this._available?'offered':'closed';
  try{if(this.storage?.removeItem)this.storage.removeItem(SEED_KEY);else this.storage?.setItem(SEED_KEY,'');}catch{}
 }
}

// Alles rond de lokale oorsprong: de lead zet het neer via visuals().parts.
// De kleuren volgen de Herinneringsboom in realm-scenery.mjs: dit is zijn jonge broertje.
export function createSeedMeshes({orb,beam,curveTube,tri,upload,material}){
 let seed=51127;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const two=(a,b,c,col)=>{tri(a,b,c,col);tri(a,c,b,col);};
 const bend=(a,b,c,n=7)=>Array.from({length:n},(_,i)=>{const t=i/(n-1);return a.map((v,k)=>(1-t)*(1-t)*v+2*(1-t)*t*b[k]+t*t*c[k]);});
 const flow=(pts,n)=>Array.from({length:n},(_,i)=>{const u=i/(n-1)*(pts.length-1),k=Math.min(pts.length-2,Math.floor(u)),t=u-k,e=t*t*(3-2*t);return pts[k].map((v,q)=>v+(pts[k+1][q]-v)*e);});
 const bark=[.50,.57,.55],lit=[.42,1.28,1.12],pale=()=>[.16+rand()*.07,.40+rand()*.12,.37+rand()*.1];
 const leaf=(c,len,col)=>{const ang=rand()*TAU;two([c[0]-Math.cos(ang)*len,c[1],c[2]-Math.sin(ang)*len],[c[0]+Math.cos(ang)*len,c[1]+len*.15,c[2]+Math.sin(ang)*len],[c[0]-Math.sin(ang)*len*.35,c[1]+len*.35,c[2]+Math.cos(ang)*len*.35],col);};

 // Het gedragen zaad: een donkere schil met een warme kern die erdoor gloeit, en een piepkleine scheut.
 material(5);orb(0,.075,0,.07,.075,.07,[.20,.15,.09],10,6);
 material(0);orb(0,.115,0,.05,.045,.05,[1.6,.9,.32],8,5);orb(0,.125,0,.025,.025,.025,[1.8,1.3,.65],6,4);
 beam([0,.14,0],[.012,.18,0],.006,[.32,.62,.42]);two([.012,.178,0],[.04,.19,.012],[.03,.172,-.01],[.36,.95,.7]);
 const seedMesh=upload();

 // Spruit: een steeltje van veertig centimeter met twee blaadjes.
 material(0);beam([0,0,0],[.02,.36,0],.012,[.32,.55,.45]);orb(0,.01,0,.06,.02,.06,[.30,.24,.15],8,3);
 material(2);for(const side of[-1,1])two([.02,.34,0],[.02+side*.16,.40,.04],[.02+side*.12,.43,-.05],[.30,.95,.82]);
 material(0);orb(.02,.37,0,.02,.025,.02,lit,6,4);
 const sprout=upload();

 // Jonge boom: een slanke bleke stam van ruim twee meter en een handvol lichtende blaadjes.
 material(5);const stem=flow([[0,-.05,0],[.05,.7,-.02],[-.04,1.4,.03],[.02,2.1,0]],7);
 curveTube(stem,stem.map((_,i)=>.06*(1-i/7)+.012),bark,7);
 const sprigs=[];for(let i=0;i<3;i++){const a=i*TAU/3+.5,from=stem[3+i],tip=[from[0]+Math.cos(a)*.45,from[1]+.35,from[2]+Math.sin(a)*.45];beam(from,tip,.012,bark);sprigs.push(tip);}
 sprigs.push(stem[6]);
 material(2);for(const t of sprigs)for(let i=0;i<4;i++)leaf([t[0]+(rand()-.5)*.25,t[1]+(rand()-.3)*.2,t[2]+(rand()-.5)*.25],.11+rand()*.06,rand()<.6?lit:pale());
 const sapling=upload();

 // De boom: zilveren stam, zes takken, een kroon van klein blad en een paar hangende lichtdraden.
 material(5);const spine=flow([[0,-.3,0],[.12,1.4,-.05],[-.1,3,.08],[.08,4.6,0],[0,6.1,-.06]],10);
 curveTube(spine,spine.map((_,i)=>{const t=i/9;return .34*Math.pow(1-t,1.5)+.06+.1*Math.exp(-t*9);}),bark,10);
 for(let i=0;i<4;i++){const a=i*TAU/4+.4,len=.9+rand()*.4;
  curveTube(bend([Math.cos(a)*.15,.25,Math.sin(a)*.15],[Math.cos(a)*len*.5,.12,Math.sin(a)*len*.5],[Math.cos(a)*len,-.08,Math.sin(a)*len],5),[.11,.08,.06,.04,.02],bark.map(v=>v*.92),5);}
 const tips=[];
 for(let i=0;i<6;i++){const a=i*TAU/6+rand()*.3,k=2+Math.floor(i*.9),from=spine[Math.min(8,k+2)],reach=1.6+rand()*.9,rise=.9+rand()*.9;
  const mid=[Math.cos(a)*reach*.5,from[1]+rise*.7,Math.sin(a)*reach*.5],tip=[Math.cos(a)*reach,from[1]+rise,Math.sin(a)*reach];
  curveTube(bend([from[0],from[1],from[2]],[mid[0],mid[1]+rise*.25,mid[2]],tip,6),[.09,.075,.06,.045,.03,.018],bark,6);tips.push(mid,tip);}
 tips.push(spine[9]);
 material(2);
 for(const t of tips)for(let i=0;i<45;i++){const a=rand()*TAU,b=rand()*2-1,d=Math.cbrt(rand())*1.15,c=[t[0]+Math.cos(a)*d*Math.sqrt(1-b*b),t[1]+b*d*.6,t[2]+Math.sin(a)*d*Math.sqrt(1-b*b)];
  leaf(c,.17+rand()*.16,rand()<.2?lit:pale());}
 material(0);for(let i=0;i<6;i++){const t=tips[(i*3+1)%tips.length],x=t[0]+(rand()-.5)*.9,z=t[2]+(rand()-.5)*.9,drop=.9+rand()*1.3;
  beam([x,t[1],z],[x,t[1]-drop,z],.008,[.30,1.10,1.0]);orb(x,t[1]-drop,z,.035,.05,.035,[.5,1.45,1.25],6,4);}
 const tree=upload();

 // Een zachte gloed op de grond: teal buitenrand, warm hart.
 material(0);orb(0,.03,0,1.5,.025,1.5,[.30,1.05,.95],16,3);orb(0,.05,0,.55,.03,.55,[1.1,1.5,1.2],12,3);
 const glow=upload();
 material(0);
 return {seed:seedMesh,sprout,sapling,tree,glow};
}
