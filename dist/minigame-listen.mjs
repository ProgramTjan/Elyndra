// Het luisterspel: het derde ritme, de stem. De moswachter neuriet een korte frase
// in klokjes; jij antwoordt door in dezelfde volgorde over vier klinkende stenen te lopen.
// Geen tijd, geen straf: een verkeerde steen wist alleen het antwoord, en luisteren mag zo
// vaak als je wilt. Hier staat de logica en de bouw; world.js tekent en speelt het af.

// Alle plaatsen als losse gegevens, zodat de lead het speelveld kan verschuiven.
export const ORIGIN=Object.freeze([104,46]);          // de luistersteen, midden op de open grond
export const KEEPER=Object.freeze([86,36]);           // de moswachter zelf; daarheen staat de boog open
export const KEEPER_HEIGHT=9;                         // waar zijn neuriën vandaan komt (boven de grond)
export const PLAY_RADIUS=7;                           // alles ligt binnen deze straal rond ORIGIN
export const NEAR_RADIUS=22;                          // binnen deze straal toont de wereld het doel
export const ARC_RADIUS=4.5;                          // klinkstenen op deze afstand van de luistersteen
export const LISTEN_RADIUS=1.6;                       // op de luistersteen staan
export const STONE_ENTER=1.3;                         // een steen klinkt wie deze cirkel binnenstapt
export const STONE_LEAVE=1.9;                         // pas voorbij deze straal ben je er weer af
export const BASE_TOP=.25;                            // hoogte van een stenen voet boven de grond
export const NOTE_DELAY=.8,NOTE_GAP=1.1,NOTE_LIT=.8,ENTER_LIT=.6;
const FOOT_HEIGHT=4.5;                                // hoger dan dit boven de grond telt als vliegen

// Vier stenen in een boog, hoeken ten opzichte van de richting weg van de moswachter.
// Naast elkaar in de boog liggen ook naast elkaar in toon: stapsgewijs zingen is kort lopen.
export const STONES=Object.freeze([
 Object.freeze({name:'wortel',note:392,angle:-75*Math.PI/180}),
 Object.freeze({name:'mos',note:440,angle:-25*Math.PI/180}),
 Object.freeze({name:'water',note:523.25,angle:25*Math.PI/180}),
 Object.freeze({name:'ster',note:587.33,angle:75*Math.PI/180}),
]);
// Drie frases. Elke volgende begint zoals de vorige; geen toon twee keer achter elkaar,
// zodat je nooit op één steen hoeft te blijven trappelen. De laatste keert terug naar de wortel.
export const PHRASES=Object.freeze([
 Object.freeze([0,1,2]),
 Object.freeze([0,1,2,3]),
 Object.freeze([0,1,2,1,0]),
]);
export const MEMORIES=Object.freeze([
 'De moswachter weet weer hoe het zaad viel: licht als een veer, op een ochtend zonder wind.',
 'Hij weet weer dat de draak ooit in zijn hand paste, klein en nat en al warm.',
 'Hij weet weer hoe de rivier klonk toen ze nog tot aan zijn voeten kwam.',
]);
export const FINALE='Hij verstaat de vallei weer. Zijn stem is terug.';
export const WRONG='Bijna. Luister nog eens, of begin opnieuw bij de eerste toon.';
const PROMPT='Luister naar de moswachter';
const COUNT=['nul','één','twee','drie','vier','vijf'];
const ORDINAL=['één','twee','drie'];

const flat=(p,x,z)=>Math.hypot(p[0]-x,p[2]-z);
const list=names=>names.length<2?names.join(''):names.slice(0,-1).join(', ')+' en '+names[names.length-1];

// Alle posities, uitgerekend vanuit ground(). Zowel het spel als de bouw gebruiken dit.
export function listenLayout(ground,options={}){
 const origin=options.origin??ORIGIN,keeper=options.keeper??KEEPER,radius=options.arcRadius??ARC_RADIUS;
 const away=Math.atan2(origin[1]-keeper[1],origin[0]-keeper[0]);
 const stones=STONES.map((s,index)=>{
  const a=away+s.angle,x=origin[0]+Math.cos(a)*radius,z=origin[1]+Math.sin(a)*radius;
  // Het inlegwerk kijkt naar de luistersteen; rotatie om y, zoals de wereld die toepast.
  return {...s,index,x,z,ground:ground(x,z),y:ground(x,z)+BASE_TOP,rotation:Math.atan2(-(origin[0]-x),-(origin[1]-z))};
 });
 return {
  origin:[origin[0],ground(origin[0],origin[1]),origin[1]],
  keeper:[keeper[0],ground(keeper[0],keeper[1])+KEEPER_HEIGHT,keeper[1]],
  away,stones,
 };
}

export class ListenGame{
 constructor(ground,options={}){
  this.ground=ground;this.options=options;this.layout=listenLayout(ground,options);
  this.reset();
 }
 reset(){
  this.solved=false;this.begun=false;
  this.phase='idle';       // idle: wacht op luisteren · listen: hij neuriet · answer: jij loopt na
  this.phrase=0;this.answer=[];this.wrong=0;this.elapsed=0;this.time=0;
  this.inside=STONES.map(()=>false);this.litUntil=STONES.map(()=>-1);
 }
 near(p){return !!p&&flat(p,this.layout.origin[0],this.layout.origin[2])<NEAR_RADIUS;}
 onFoot(p,flying){return !flying&&p[1]-this.ground(p[0],p[2])<FOOT_HEIGHT;}
 onListening(p,flying){return !!p&&this.onFoot(p,flying)&&flat(p,this.layout.origin[0],this.layout.origin[2])<LISTEN_RADIUS;}
 prompt(p,{flying=false}={}){
  if(this.solved||this.phase==='listen')return null;
  return this.onListening(p,flying)?PROMPT:null;
 }
 // Luisteren mag altijd opnieuw; het antwoord tot nu toe vervalt, het aantal pogingen niet.
 interact(p,{flying=false}={}){
  if(!this.prompt(p,{flying}))return [];
  this.begun=true;this.phase='listen';this.elapsed=0;this.answer=[];
  return [];
 }
 bell(i,p,yaw){
  const s=this.layout.stones[i],e={type:'bell',note:s.note};
  // Klank links of rechts van de kijkrichting; vooruit is (sin yaw, -cos yaw), rechts (cos yaw, sin yaw).
  if(p&&Number.isFinite(yaw)){const dx=s.x-p[0],dz=s.z-p[2],d=Math.hypot(dx,dz);if(d>.01)e.pan=Math.max(-1,Math.min(1,(dx*Math.cos(yaw)+dz*Math.sin(yaw))/d))*.6;}
  return e;
 }
 update(seconds,p,{flying=false,yaw}={}){
  const dt=Math.min(.5,Math.max(0,Number(seconds)||0)),events=[];this.time+=dt;
  if(this.phase==='listen'){
   const phrase=PHRASES[this.phrase],before=this.elapsed;this.elapsed+=dt;
   phrase.forEach((s,k)=>{const at=NOTE_DELAY+k*NOTE_GAP;
    if(before<at&&this.elapsed>=at){this.litUntil[s]=this.time-(this.elapsed-at)+NOTE_LIT;events.push(this.bell(s,p,yaw));}});
   if(this.elapsed>=NOTE_DELAY+(phrase.length-1)*NOTE_GAP+NOTE_LIT){this.phase='answer';this.elapsed=0;this.answer=[];}
  }
  if(!p)return events;
  // Een steen klinkt bij binnenstappen van buitenaf. Wie erop blijft staan of binnen de
  // ruimere rand blijft, hoort niets; zo kun je dezelfde steen alleen opnieuw laten klinken door er even af te stappen.
  const foot=this.onFoot(p,flying);
  this.layout.stones.forEach((s,i)=>{const d=flat(p,s.x,s.z);
   if(this.inside[i]){if(!foot||d>STONE_LEAVE)this.inside[i]=false;}
   else if(foot&&d<STONE_ENTER){this.inside[i]=true;events.push(...this.enter(i,p,yaw));}
  });
  return events;
 }
 enter(i,p,yaw){
  // Tijdens het neuriën zwijgen de stenen: de moswachter heeft het woord.
  if(this.phase==='listen')return [];
  this.litUntil[i]=this.time+ENTER_LIT;
  const events=[this.bell(i,p,yaw)];
  if(this.phase!=='answer'||this.solved)return events;
  const phrase=PHRASES[this.phrase];
  if(phrase[this.answer.length]===i){
   this.answer.push(i);
   if(this.answer.length===phrase.length)events.push(...this.complete());
  }else{
   // Niets gaat verloren: alleen het antwoord tot nu toe vervalt. Wie op de eerste toon
   // stapt, is meteen opnieuw begonnen.
   this.wrong++;this.answer=i===phrase[0]?[i]:[];
   events.push({type:'toast',text:WRONG});
  }
  return events;
 }
 complete(){
  const done=this.phrase,events=[{type:'chime'}];
  this.phrase++;this.answer=[];this.wrong=0;this.phase='idle';this.elapsed=0;
  if(this.phrase<PHRASES.length){events.push({type:'toast',text:MEMORIES[done]});return events;}
  // De laatste herinnering en het slot in één toast: de wereld toont er maar één tegelijk.
  this.solved=true;this.phrase=PHRASES.length-1;
  events.push({type:'toast',text:`${MEMORIES[done]} ${FINALE}`},{type:'solved'});
  return events;
 }
 // Hoeveel hulp de woorden mogen geven: 0 niets, 1 de eerste steen, 2 de hele volgorde.
 guidance(){return this.wrong>=4?2:this.wrong>=2?1:0;}
 expected(){return this.phase==='answer'&&!this.solved?PHRASES[this.phrase][this.answer.length]:null;}
 lit(){return STONES.map((_,i)=>this.time<this.litUntil[i]);}
 words(){
  const title='Het luisterspel';
  if(this.solved)return ['De stem is terug','De moswachter verstaat de vallei weer. De stenen klinken nog, als je erover loopt.'];
  const phrase=PHRASES[this.phrase],which=`Frase ${ORDINAL[this.phrase]} van drie.`;
  if(this.phase==='listen')return [title,`${which} De moswachter neuriet. Kijk welke steen oplicht.`];
  if(this.phase==='answer'){
   let text=`${which} Loop de tonen na: nog ${COUNT[phrase.length-this.answer.length]}.`;
   const level=this.guidance();
   if(level===2)text+=` Loop ${list(phrase.map(s=>STONES[s].name))}.`;
   else if(level===1)text+=` Begin bij de steen die ${STONES[phrase[0]].name} heet.`;
   return [title,text];
  }
  if(!this.begun)return [title,'De moswachter wil je iets voorneuriën. Ga op de platte luistersteen staan en luister.'];
  return [title,`${which} Ga terug naar de luistersteen en luister.`];
 }
 visuals(clock=0,reduced=false){
  const lit=this.lit(),t=reduced?0:Number(clock)||0,motes=[];
  const parts=this.layout.stones.map((s,i)=>({mesh:lit[i]?'chimeLit':'chime',position:[s.x,s.y,s.z],rotation:s.rotation}));
  if(this.phase==='listen'){
   // Een paar lichtjes drijven van de moswachter naar de steen die nu klinkt.
   const target=this.layout.stones.find((_,i)=>lit[i]);
   if(target){const k=this.layout.keeper,n=reduced?3:7,to=[target.x,target.y+.6,target.z];
    for(let i=0;i<n;i++){const u=reduced?(i+1)/(n+1):((t*.35+i/n)%1),lift=Math.sin(u*Math.PI)*2.2;
     motes.push([k[0]+(to[0]-k[0])*u,k[1]+(to[1]-k[1])*u+lift,k[2]+(to[2]-k[2])*u]);}}
  }else{
   // Een kringetje boven de volgende steen, alleen als de woorden al hulp mogen geven.
   const next=this.expected();
   if(next!==null&&this.guidance()>=1){const s=this.layout.stones[next],n=reduced?4:8;
    for(let i=0;i<n;i++){const a=i*Math.PI*2/n+t*.6;motes.push([s.x+Math.cos(a)*.7,s.y+1.3+(reduced?0:Math.sin(t*1.7+i)*.08),s.z+Math.sin(a)*.7]);}}
  }
  return {parts,motes};
 }
 snapshot(){return {solved:this.solved,begun:this.begun,phase:this.phase,phrase:this.phrase,answer:[...this.answer],wrong:this.wrong,elapsed:this.elapsed,expected:this.expected(),lit:this.lit(),inside:[...this.inside]};}
}

// Het speelveld: de platte luistersteen met een ingesneden spiraal, vier lage voeten,
// wat mos en een paar kleine staande stenen. De klinkende kap is een los stuk, in twee versies.
export function createListenMeshes({orb,cone,beam,curveTube,tri,upload,material},ground,options={}){
 let seed=48271;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647,TAU=Math.PI*2;
 const L=listenLayout(ground,options),[ox,oy,oz]=L.origin,rock=[.42,.45,.41];
 material(3);
 // De luistersteen: breed en plat, iets in de grond gezakt zodat een helling hem niet laat zweven.
 const RX=1.55,RY=.2,cy=oy+.04;
 orb(ox,cy,oz,RX,RY,RX*.94,rock,18,6);
 for(const s of L.stones){
  cone(s.x,s.ground-.12,s.z,.78,.66,BASE_TOP+.12,rock.map(v=>v*(.88+rand()*.14)),10);
  orb(s.x,s.ground+.02,s.z,.95,.08,.95,rock.map(v=>v*.8),10,3);
 }
 // Kleine staande stenen aan de verre kant en tussen de klinkstenen; de kant naar de moswachter blijft open.
 for(let i=0;i<7;i++){
  const a=L.away+(i-3)*.42+(rand()-.5)*.15,r=6.1+rand()*.8,x=ox+Math.cos(a)*r,z=oz+Math.sin(a)*r,h=.5+rand()*.9,w=.18+rand()*.14;
  cone(x,ground(x,z)-.1,z,w,w*.45,h+.1,rock.map(v=>v*(.8+rand()*.25)),6);
 }
 material(0);
 // De spiraal: een dunne lichtlijn die het oppervlak van de steen volgt.
 const spiral=[],turns=2.25,steps=40;
 for(let i=0;i<=steps;i++){const u=i/steps,a=u*turns*TAU,r=.12+u*1.0,x=Math.cos(a)*r,z=Math.sin(a)*r*.94,e=1-(r/RX)**2;
  spiral.push([ox+x,cy+RY*Math.sqrt(Math.max(0,e))+.012,oz+z]);}
 curveTube(spiral,spiral.map(()=>.018),[.38,1.12,.98],5);
 // Mos in lage kussentjes rond de voeten en langs de luistersteen.
 for(let i=0;i<34;i++){
  const near=i<20?L.stones[i%4]:null,a=rand()*TAU,r=near?.7+rand()*.5:1.5+rand()*.6;
  const x=(near?near.x:ox)+Math.cos(a)*r,z=(near?near.z:oz)+Math.sin(a)*r,s=.12+rand()*.22;
  orb(x,ground(x,z)+.02,z,s,s*.35,s*.9,[.14+rand()*.06,.30+rand()*.12,.12+rand()*.05],7,4);
 }
 material(0);
 const scenery=upload();
 // De kap: een afgeronde steen van ruim een meter, met een rond inlegwerk erop (de wereld kiest dof of lichtend).
 const cap=inlay=>{
  material(3);orb(0,.1,0,.56,.2,.56,[.40,.44,.42],14,6);
  material(0);orb(0,.29,0,.3,.035,.3,inlay,12,3);orb(0,.315,0,.12,.02,.12,inlay.map(v=>v*1.08),8,3);
  for(let i=0;i<4;i++){const a=i*TAU/4+.4;beam([Math.cos(a)*.3,.29,Math.sin(a)*.3],[Math.cos(a)*.44,.25,Math.sin(a)*.44],.014,inlay);}
  material(0);return upload();
 };
 const chime=cap([.30,.52,.50]);
 const chimeLit=cap([.55,1.65,1.45]);
 material(0);
 return {scenery,chime,chimeLit};
}
