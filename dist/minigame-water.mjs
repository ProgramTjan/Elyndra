// De waterloop: ritme 0, de wortelkathedraal. Het bronwater vindt zijn weg niet meer.
// Op de grond ligt een klein net van houten wortelgoten met zes sluisjes. Wie bij een
// sluisje staat en de knop indrukt, draait het een stand verder. Pas als alle drie de
// wortelkommen tegelijk water krijgen en er niets wegloopt in een droge kuil, stroomt
// het weer. Geen klok, geen fout: een verkeerde stand laat het water gewoon anders lopen.
//
// Alle posities hieronder zijn [dx,dz] in meters ten opzichte van ORIGIN; de hoogte komt
// uit ground(). Wie het speelveld wil verplaatsen, past alleen ORIGIN aan (of geeft
// options.origin mee). Alles ligt binnen 12 m van ORIGIN.
export const ORIGIN=[-32,-52];
export const REACH=3.2;            // horizontale afstand waarbinnen een sluisje te draaien is (te voet)
export const NEAR_RADIUS=20;       // horizontaal: je bent in het speelveld
export const HINTS=[90,180];       // seconden zonder vooruitgang voor de eerste en de tweede wenk
export const SPRING=[0,10.2];      // waar het water opwelt; de bronsteen ligt er net achter
export const SPRING_STONE=[0,10.9];
export const JUNCTION=[0,.2];      // de knoop: twee goten komen samen en lopen door naar de mossteen

// De drie wortelkommen en de twee droge kuilen.
export const BASINS=[
 {id:'westkom',name:'de westkom',at:[-8.6,-1.8]},
 {id:'noordkom',name:'de noordkom',at:[0,-8.8]},
 {id:'oostkom',name:'de oostkom',at:[5.6,-7.8]}
];
export const HOLLOWS=[
 {id:'westkuil',name:'de droge kuil in het westen',at:[-4.4,-6.8]},
 {id:'oostkuil',name:'de droge kuil in het oosten',at:[9.6,-5.2]}
];
export const BASIN_RADIUS=1.05,HOLLOW_RADIUS=.8;

// Zes sluisjes, van stroomopwaarts naar stroomafwaarts. Elke stand noemt waar het water
// heen gaat ('to': de knopen die water krijgen) en wat de tweede wenk erover zegt.
// Verdelers (splitter) hebben drie standen, wissels (diverter) twee, de schuif (gate) open of dicht.
export const SLUICES=[
 {id:'steen',name:'de sluis bij de bronsteen',kind:'splitter',at:[0,7.2],note:130.81,
  settings:[{to:['wortel'],say:'het water alleen naar het westen sturen'},{to:['wortel','boog'],say:'het water naar twee kanten laten gaan'},{to:['boog'],say:'het water alleen naar het oosten sturen'}]},
 {id:'wortel',name:'de sluis bij de gespleten wortel',kind:'diverter',at:[-4.6,4.2],note:146.83,
  settings:[{to:['westkom'],say:'het water naar de westkom sturen'},{to:['knoop'],say:'het water naar de knoop in het midden sturen'}]},
 {id:'boog',name:'de sluis bij de lage wortelboog',kind:'splitter',at:[4.6,4.2],note:164.81,
  settings:[{to:['knoop'],say:'het water alleen naar de knoop sturen'},{to:['knoop','varens'],say:'het water naar twee kanten laten gaan'},{to:['varens'],say:'het water alleen naar de varens sturen'}]},
 {id:'varens',name:'de schuif bij de varens',kind:'gate',at:[7.6,1],note:196,
  settings:[{to:[],say:'dicht blijven'},{to:['stronk'],say:'open staan'}]},
 {id:'stronk',name:'de sluis bij de holle stronk',kind:'diverter',at:[7.8,-3],note:220,
  settings:[{to:['oostkom'],say:'het water naar de oostkom sturen'},{to:['oostkuil'],say:'het water naar de droge kuil sturen'}]},
 {id:'mossteen',name:'de sluis bij de mossteen',kind:'diverter',at:[0,-3.6],note:246.94,
  settings:[{to:['noordkom'],say:'het water naar de noordkom sturen'},{to:['westkuil'],say:'het water naar de droge kuil sturen'}]}
];
// Herkenningspunten die de wenken noemen; ze staan naast de goten, niet erop.
export const LANDMARKS={wortel:[-6.4,5.4],boog:[[4.4,6],[6.6,4.4]],varens:[[9.2,1.8],[9,.2],[8.5,2.7]],stronk:[9.8,-2.4],mossteen:[1.8,-3.2]};

// De goten: een gerichte graaf. Elke rand krijgt een eigen waterstrook ('flow'+index).
export const EDGES=[
 ['bron','steen'],['steen','wortel'],['steen','boog'],
 ['wortel','westkom'],['wortel','knoop'],['boog','knoop'],['boog','varens'],
 ['knoop','mossteen'],['varens','stronk'],['stronk','oostkom'],['stronk','oostkuil'],
 ['mossteen','noordkom'],['mossteen','westkuil']
];
// De beginstand: het water vindt alleen de noordkom. Zes keer draaien maakt het af.
export const START=Object.freeze([2,1,0,0,1,0]);
export const SOLUTION=Object.freeze([1,0,1,1,0,0]);

const SLUICE_INDEX=Object.fromEntries(SLUICES.map((s,i)=>[s.id,i]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const flat=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
// Kop voor een mesh waarvan de lange kant naar lokaal -z wijst (zelfde conventie als de wereld).
const heading=(a,b)=>Math.atan2(-(b[0]-a[0]),-(b[2]-a[2]));
const cap=s=>s[0].toUpperCase()+s.slice(1);

// Welke randen water krijgen bij deze standen. Puur: dezelfde standen geven altijd hetzelfde.
export function flow(settings){
 const wet=EDGES.map(()=>false),reached=new Set(['bron']),queue=['bron'];
 while(queue.length){
  const node=queue.shift(),k=SLUICE_INDEX[node];
  const open=k===undefined?null:SLUICES[k].settings[settings[k]].to;
  EDGES.forEach(([from,to],i)=>{
   if(from!==node||(open&&!open.includes(to)))return;
   wet[i]=true;if(!reached.has(to)){reached.add(to);queue.push(to);}
  });
 }
 const basins=BASINS.map(b=>reached.has(b.id)),hollows=HOLLOWS.map(h=>reached.has(h.id));
 return {wet,basins,hollows,fed:basins.filter(Boolean).length,waste:hollows.some(Boolean),reached:[...reached]};
}
export function isSolved(settings){const f=flow(settings);return f.fed===BASINS.length&&!f.waste;}
export const turn=(settings,k)=>settings.map((v,i)=>i===k?(v+1)%SLUICES[i].settings.length:v);
// Hoe vaak je minstens moet draaien van de ene stand naar de andere (elke sluis draait rond).
export const actionsBetween=(a,b)=>a.reduce((n,v,i)=>n+((b[i]-v)%SLUICES[i].settings.length+SLUICES[i].settings.length)%SLUICES[i].settings.length,0);
export const correctCount=settings=>settings.filter((v,i)=>v===SOLUTION[i]).length;

// Wereldposities van alle knopen en de bemonsterde loop van elke goot.
const RADIUS={bron:.45,knoop:.38,sluice:.42,basin:BASIN_RADIUS-.05,hollow:HOLLOW_RADIUS-.1};
export function waterLayout(ground,origin=ORIGIN){
 const point=([dx,dz],y=0)=>{const x=origin[0]+dx,z=origin[1]+dz;return [x,ground(x,z)+y,z];};
 const nodes={bron:point(SPRING),knoop:point(JUNCTION)},trim={bron:RADIUS.bron,knoop:RADIUS.knoop};
 for(const s of SLUICES){nodes[s.id]=point(s.at);trim[s.id]=RADIUS.sluice;}
 for(const b of BASINS){nodes[b.id]=point(b.at);trim[b.id]=RADIUS.basin;}
 for(const h of HOLLOWS){nodes[h.id]=point(h.at);trim[h.id]=RADIUS.hollow;}
 const edges=EDGES.map(([from,to])=>{
  const a=nodes[from],b=nodes[to],d=flat(a,b),ux=(b[0]-a[0])/d,uz=(b[2]-a[2])/d;
  const s=trim[from],e=d-trim[to],n=Math.max(2,Math.ceil((e-s)/.6)+1);
  // De goot volgt de grond in stukjes van hoogstens 60 cm.
  const samples=Array.from({length:n},(_,i)=>{const t=s+(e-s)*i/(n-1),x=a[0]+ux*t,z=a[2]+uz*t;return [x,ground(x,z),z];});
  return {from,to,length:e-s,dir:[ux,uz],samples};
 });
 return {origin,nodes,edges};
}
// Een punt op de goot, u van 0 (bovenstrooms) tot 1, met een hoogte boven de grond.
export function along(edge,u,lift=0){
 const s=edge.samples,t=clamp(u,0,1)*(s.length-1),k=Math.min(s.length-2,Math.floor(t)),f=t-k;
 return s[k].map((v,i)=>v+(s[k+1][i]-v)*f+(i===1?lift:0));
}

export class WaterGame {
 constructor(ground,options={}){
  this.ground=ground;this.origin=options.origin||ORIGIN;this.hints=options.hints||HINTS;
  this.layout=waterLayout(ground,this.origin);
  this.stations=SLUICES.map(s=>this.layout.nodes[s.id]);
  // Waar het water een sluis binnenkomt: daaruit volgt hoe de schuif staat als hij verdeelt of dicht is.
  this.inlets=SLUICES.map(s=>this.layout.nodes[EDGES.find(([,to])=>to===s.id)[0]]);
  this.reset();
 }
 reset(){
  this.settings=[...START];this._solved=false;this.begun=false;
  this.idle=0;this.best=correctCount(this.settings);this.at=null;
  this.filled=flow(this.settings).basins.slice();   // welke kommen al eens water kregen (dan klinkt geen nieuw klokje)
 }
 get solved(){return this._solved;}
 // De lead herstelt voortgang met game.solved=true: dan staat het net meteen goed en stroomt het.
 set solved(v){this._solved=!!v;if(this._solved){this.settings=[...SOLUTION];this.filled=BASINS.map(()=>true);this.best=SLUICES.length;}}
 near(pos){return !!pos&&Math.hypot(pos[0]-this.origin[0],pos[2]-this.origin[1])<=NEAR_RADIUS;}
 onFoot(pos){return pos[1]-this.ground(pos[0],pos[2])<4.5;}
 // Het dichtstbijzijnde sluisje binnen bereik, te voet; anders null.
 station(pos,{flying=false}={}){
  if(!pos||flying||!this.onFoot(pos))return null;
  let best=null,d=REACH;
  this.stations.forEach((s,i)=>{const k=flat(pos,s);if(k<=d){d=k;best=i;}});
  return best;
 }
 prompt(pos,{flying=false}={}){
  if(this.solved)return null;
  const k=this.station(pos,{flying});if(k===null)return null;
  const s=SLUICES[k];
  if(s.kind==='gate')return this.settings[k]===0?'Open de schuif':'Sluit de schuif';
  return s.kind==='splitter'?'Draai de verdeelsluis':'Draai de sluis';
 }
 interact(pos,{flying=false,yaw=0}={}){
  if(this.solved)return [];
  const k=this.station(pos,{flying});if(k===null)return [];
  this.begun=true;this.at=k;this.settings=turn(this.settings,k);
  // Het klokje klinkt aan de kant waar de sluis staat.
  const s=this.stations[k],d=flat(pos,s)||1,pan=clamp(((s[0]-pos[0])*Math.cos(yaw)+(s[2]-pos[2])*Math.sin(yaw))/d,-1,1)*.6;
  const events=[{type:'bell',note:SLUICES[k].note,pan}],f=flow(this.settings);
  f.basins.forEach((wet,i)=>{if(wet&&!this.filled[i]){this.filled[i]=true;events.push({type:'chime'});}});
  const correct=correctCount(this.settings);
  if(correct>this.best){this.best=correct;this.idle=0;}
  if(isSolved(this.settings)){
   this._solved=true;this.idle=0;
   events.push({type:'toast',text:'Het water vindt zijn weg weer door de wortels.'},{type:'solved'});
  }
  return events;
 }
 update(seconds,pos,{flying=false}={}){
  seconds=clamp(Number(seconds)||0,0,1);
  this.at=this.solved?null:this.station(pos,{flying});
  if(!this.solved&&this.near(pos))this.idle+=seconds;
  return [];
 }
 // De eerste sluis (stroomopwaarts) die nog niet goed staat: daar begint de wenk.
 next(){const k=this.settings.findIndex((v,i)=>v!==SOLUTION[i]);return k<0?null:k;}
 words(){
  if(this.solved)return ['Het water stroomt weer','De drie kommen lopen vol. Onder de wortels hoor je de rivier weer.'];
  const f=flow(this.settings);
  const count=['Nog geen van de drie kommen krijgt water.','Eén van de drie kommen krijgt water.','Twee van de drie kommen krijgen water.','Alle drie de kommen krijgen water.'][f.fed];
  const lines=[this.begun?count:'Leid het bronwater door de goten naar de drie wortelkommen. Loop naar een sluisje en draai het.'];
  if(this.begun&&f.waste)lines.push('Maar er loopt ook water weg in een droge kuil.');
  else if(this.begun&&f.fed<3)lines.push('Ze moeten het tegelijk krijgen, en de droge kuilen niets.');
  const k=this.next();
  if(k!==null&&this.idle>=this.hints[1])lines.push(`${cap(SLUICES[k].name)} wil ${SLUICES[k].settings[SOLUTION[k]].say}.`);
  else if(k!==null&&this.idle>=this.hints[0])lines.push(`Kijk eens bij ${SLUICES[k].name}.`);
  return ['De waterloop',lines.join(' ')];
 }
 // Hoe de schuif staat: één uitgang = hij wijst ernaar; twee = hij wijst stroomop en deelt;
 // geen = hij ligt dwars over de goot.
 gateRotation(k){
  const s=this.stations[k],to=SLUICES[k].settings[this.settings[k]].to,inlet=this.inlets[k];
  if(to.length===1)return heading(s,this.layout.nodes[to[0]]);
  if(to.length===2)return heading(s,inlet);
  return heading(inlet,s)+Math.PI/2;
 }
 // Lichtjes die met het water meedrijven: elk heeft een rand en een plek u (0..1) daarop.
 drift(clock,reduced=false){
  const f=flow(this.settings),out=[],wet=this.layout.edges.map((e,i)=>({e,i})).filter(({i})=>f.wet[i]);
  const total=wet.reduce((n,{e})=>n+Math.max(1,Math.round(e.length/1.4)),0),scale=Math.min(1,60/Math.max(1,total));
  for(const {e,i} of wet){
   const n=reduced?1:Math.max(1,Math.floor(Math.max(1,Math.round(e.length/1.4))*scale));
   for(let j=0;j<n;j++){
    const u=reduced?.5:((j/n+clock*.9/e.length+i*.137)%1+1)%1;
    out.push({edge:i,index:j,u,point:along(e,u,.2+(reduced?0:Math.sin(clock*2.3+j*1.7+i)*.03))});
   }
  }
  return out.slice(0,60);
 }
 visuals(clock=0,reduced=false){
  const f=flow(this.settings),parts=[],N=this.layout.nodes;
  f.wet.forEach((w,i)=>{if(w)parts.push({mesh:'flow'+i,position:[0,0,0],rotation:0});});
  this.stations.forEach((s,i)=>parts.push({mesh:'gate',position:[s[0],s[1]+.12,s[2]],rotation:this.gateRotation(i)}));
  if(this.at!==null&&!this.solved){const s=this.stations[this.at];parts.push({mesh:'gateLit',position:[s[0],s[1]+.12,s[2]],rotation:this.gateRotation(this.at)});}
  BASINS.forEach((b,i)=>{if(f.basins[i]){const p=N[b.id];parts.push({mesh:'basinLit',position:[p[0],p[1]+.13,p[2]],rotation:0});}});
  return {parts,motes:this.drift(clock,reduced).map(m=>m.point)};
 }
 snapshot(){
  const f=flow(this.settings);
  return {settings:[...this.settings],solved:this.solved,begun:this.begun,basins:f.basins,hollows:f.hollows,wet:f.wet,
   idle:this.idle,best:this.best,filled:[...this.filled],at:this.at,next:this.next()};
 }
}

// De meshes: het vaste net in wereldcoördinaten, een waterstrook per goot (ook wereld),
// en drie kleine stukken rond de oorsprong: de schuif, het lichtje erbij en de volle kom.
export function createWaterMeshes({orb,cone,beam,curveTube,tri,upload,material},ground,{origin=ORIGIN}={}){
 let seed=40917;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647,TAU=Math.PI*2;
 const L=waterLayout(ground,origin),N=L.nodes,P=([dx,dz],y=0)=>{const x=origin[0]+dx,z=origin[1]+dz;return [x,ground(x,z)+y,z];};
 // Een driehoek waarvan de normaal naar 'dir' wijst (ook als de grond helt).
 const face=(a,b,c,col,dir=[0,1,0])=>{const u=b.map((v,i)=>v-a[i]),v=c.map((w,i)=>w-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(n[0]*dir[0]+n[1]*dir[1]+n[2]*dir[2]>=0)tri(a,b,c,col);else tri(a,c,b,col);};
 const quad=(a,b,c,d,col,dir)=>{face(a,b,c,col,dir);face(a,c,d,col,dir);};
 const at=(p,side,n,y)=>[p[0]+n[0]*side,p[1]+y,p[2]+n[1]*side];
 const wood=[.33,.24,.14],root=[.30,.22,.13],rock=[.40,.41,.37],moss=[.20,.33,.13];

 // De goten: een vloer en twee lage wanden, stukje voor stukje over de grond gelegd.
 material(5);
 for(const e of L.edges){
  const n=[-e.dir[1],e.dir[0]],out=[n[0],0,n[1]],inn=[-n[0],0,-n[1]];
  for(let i=0;i<e.samples.length-1;i++){
   const p=e.samples[i],q=e.samples[i+1],col=wood.map(v=>v*(.9+rand()*.18));
   quad(at(p,-.2,n,.07),at(p,.2,n,.07),at(q,.2,n,.07),at(q,-.2,n,.07),col.map(v=>v*.8));
   for(const s of[-1,1]){const dir=s>0?out:inn,o=s*.27,w=s*.2,back=s>0?inn:out;
    quad(at(p,w,n,.24),at(p,o,n,.24),at(q,o,n,.24),at(q,w,n,.24),col);
    quad(at(p,o,n,-.06),at(p,o,n,.24),at(q,o,n,.24),at(q,o,n,-.06),col,dir);
    quad(at(p,w,n,.07),at(p,w,n,.24),at(q,w,n,.24),at(q,w,n,.07),col.map(v=>v*.85),back);}
  }
 }
 // Een houten plankier onder elk sluisje en onder de knoop, zodat de goten er netjes op uitkomen.
 for(const id of[...SLUICES.map(s=>s.id),'knoop']){const p=N[id];cone(p[0],p[1]-.08,p[2],.56,.52,.2,wood.map(v=>v*.92),10);}
 // De gespleten wortel: één wortel die uit de grond komt en zich in tweeën splitst.
 {const b=P(LANDMARKS.wortel),fork=[b[0]+.2,b[1]+1.15,b[2]-.1];
  curveTube([[b[0]-.9,b[1]-.2,b[2]+.6],[b[0]-.5,b[1]+.35,b[2]+.35],[b[0]-.15,b[1]+.8,b[2]+.1],fork],[.24,.22,.19,.16],root,8);
  for(const s of[-1,1]){const end=P([LANDMARKS.wortel[0]+.9+s*.2,LANDMARKS.wortel[1]-.2+s*.9]);
   curveTube([fork,[fork[0]+.35,fork[1]+.25,fork[2]+s*.35],[fork[0]+.7,fork[1]-.1,fork[2]+s*.65],[end[0],end[1]+.35,end[2]],[end[0]+.05,end[1]-.15,end[2]]],[.15,.13,.11,.09,.07],root,7);}}
 // De lage wortelboog: een oude wortel die als een poortje uit de grond rijst.
 {const [a,b]=LANDMARKS.boog.map(p=>P(p)),pts=Array.from({length:9},(_,i)=>{const t=i/8,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t;return [x,a[1]+(b[1]-a[1])*t-.2+Math.sin(t*Math.PI)*2.5,z];});
  curveTube(pts,pts.map((_,i)=>.26-Math.sin(i/8*Math.PI)*.1),root,8);}
 // De holle stronk.
 {const p=P(LANDMARKS.stronk);cone(p[0],p[1]-.1,p[2],.72,.58,1.15,root.map(v=>v*.95),10);}
 // Stenen: de bronsteen, de mossteen en een paar mossige keien die het plein karakter geven.
 material(3);
 const mossy=(p,s)=>{material(3);orb(p[0],p[1]+s*.25,p[2],s,s*.62,s*.85,rock.map(v=>v*(.86+rand()*.2)),10,6);material(0);orb(p[0]+s*.08,p[1]+s*.58,p[2]-s*.05,s*.78,s*.22,s*.62,moss.map(v=>v*(.85+rand()*.3)),8,4);};
 mossy(P(SPRING_STONE),.82);mossy(P(LANDMARKS.mossteen),.75);
 const stones=mossyStones(ground,origin);for(const [dx,dz,s] of stones)mossy(P([dx,dz]),s);
 // De bron: een klein plasje voor de steen dat altijd licht geeft, want daar welt het water steeds op.
 material(0);{const p=N.bron;orb(p[0],p[1]+.06,p[2],.5,.05,.42,[.35,1.15,1.5],12,4);orb(p[0],p[1]+.09,p[2],.22,.05,.2,[.8,1.5,1.7],8,4);}
 // De kommen: een ring van steen met een donkere bodem. De droge kuilen: stoffig, met wat dor hout.
 const ring=(p,r,lift)=>Array.from({length:15},(_,i)=>{const a=i/14*TAU,x=p[0]+Math.cos(a)*r,z=p[2]+Math.sin(a)*r;return [x,ground(x,z)+lift,z];});
 const floor=(p,r,y,col)=>{for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU;face([p[0],p[1]+y,p[2]],[p[0]+Math.cos(a)*r,ground(p[0]+Math.cos(a)*r,p[2]+Math.sin(a)*r)+y,p[2]+Math.sin(a)*r],[p[0]+Math.cos(b)*r,ground(p[0]+Math.cos(b)*r,p[2]+Math.sin(b)*r)+y,p[2]+Math.sin(b)*r],col);}};
 for(const b of BASINS){const p=N[b.id];material(3);const pts=ring(p,BASIN_RADIUS,.1);curveTube(pts,pts.map(()=>.2),rock,8);floor(p,BASIN_RADIUS,.06,[.21,.22,.20]);}
 for(const h of HOLLOWS){const p=N[h.id];material(1);floor(p,HOLLOW_RADIUS,.04,[.24,.19,.13]);material(3);
  for(let i=0;i<7;i++){const a=i/7*TAU+rand()*.4,x=p[0]+Math.cos(a)*HOLLOW_RADIUS,z=p[2]+Math.sin(a)*HOLLOW_RADIUS,s=.12+rand()*.1;orb(x,ground(x,z)+s*.4,z,s,s*.6,s*.8,[.44,.38,.29],6,4);}
  material(5);for(let i=0;i<2;i++){const a=rand()*TAU,c=[p[0]+Math.cos(a)*.3,p[1]+.08,p[2]+Math.sin(a)*.3];beam(c,[c[0]+Math.cos(a+1.6)*.5,c[1]+.03,c[2]+Math.sin(a+1.6)*.5],.025,[.38,.33,.26]);}}
 // De varens bij de schuif: bundels geveerd blad (materiaal 2 laat licht door).
 material(2);
 for(const f of LANDMARKS.varens){const p=P(f);for(let k=0;k<7;k++){const a=k/7*TAU+rand()*.4,len=.7+rand()*.35,tip=[p[0]+Math.cos(a)*len,p[1]+.45+rand()*.25,p[2]+Math.sin(a)*len],side=[-Math.sin(a)*.12,0,Math.cos(a)*.12],mid=[p[0]+Math.cos(a)*len*.5,p[1]+.55,p[2]+Math.sin(a)*len*.5],col=[.11+rand()*.04,.30+rand()*.08,.11];
  for(const s of[-1,1]){const m=[mid[0]+side[0]*s,mid[1],mid[2]+side[2]*s];tri([p[0],p[1]+.02,p[2]],m,tip,col);tri([p[0],p[1]+.02,p[2]],tip,m,col);}}}
 material(0);
 const scenery=upload();

 // Het water zelf: een dunne lichtende strook net boven de bodem van elke goot.
 const flows={};
 L.edges.forEach((e,i)=>{
  material(0);const n=[-e.dir[1],e.dir[0]];
  for(let k=0;k<e.samples.length-1;k++){const p=e.samples[k],q=e.samples[k+1],col=[.35,1.15,1.5];quad(at(p,-.15,n,.11),at(p,.15,n,.11),at(q,.15,n,.11),at(q,-.15,n,.11),col);}
  flows['flow'+i]=upload();
 });
 // De schuif: een scharnierpaal met een plank die naar lokaal -z wijst.
 material(5);
 {const col=[.36,.26,.15],y0=.04,y1=.3,len=.82,t=.035;
  cone(0,0,0,.07,.06,.82,col,8);orb(0,.86,0,.09,.07,.09,col.map(v=>v*.9),8,5);
  quad([-t,y0,0],[-t,y1,0],[-t,y1,-len],[-t,y0,-len],col,[-1,0,0]);quad([t,y0,0],[t,y1,0],[t,y1,-len],[t,y0,-len],col,[1,0,0]);
  quad([-t,y1,0],[t,y1,0],[t,y1,-len],[-t,y1,-len],col.map(v=>v*1.1));quad([-t,y0,-len],[t,y0,-len],[t,y1,-len],[-t,y1,-len],col,[0,0,-1]);}
 material(0);const gate=upload();
 // Het lichtje voor de sluis waar je staat: warm, boven op de paal en langs de plank.
 material(0);orb(0,.98,0,.13,.13,.13,[1.6,1.15,.5],10,6);orb(0,.36,-.8,.06,.06,.06,[1.5,1.1,.5],6,4);
 const gateLit=upload();
 // Een volle kom: een lichtende waterschijf.
 material(0);for(let i=0;i<16;i++){const a=i/16*TAU,b=(i+1)/16*TAU,r=BASIN_RADIUS*.86;face([0,0,0],[Math.cos(a)*r,0,Math.sin(a)*r],[Math.cos(b)*r,0,Math.sin(b)*r],[.35,1.15,1.5]);}
 orb(0,.01,0,.3,.02,.3,[.8,1.5,1.7],8,3);
 const basinLit=upload();
 material(0);
 return {scenery,...flows,gate,gateLit,basinLit};
}

// Mossige keien op vaste, vrije plekken: niet op een goot, niet bij een sluis of kom.
export function mossyStones(ground,origin=ORIGIN){
 let seed=7151;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const L=waterLayout(ground,origin),spots=[];
 const keep=[...Object.values(L.nodes).map(p=>[p[0]-origin[0],p[2]-origin[1]]),SPRING_STONE,LANDMARKS.wortel,LANDMARKS.stronk,LANDMARKS.mossteen,...LANDMARKS.boog,...LANDMARKS.varens];
 for(let i=0;i<300&&spots.length<7;i++){
  const a=rand()*Math.PI*2,r=4+rand()*6.5,dx=Math.cos(a)*r,dz=Math.sin(a)*r,s=.35+rand()*.35;
  if(clearance(L,[dx,dz],origin)<s+.9)continue;
  if(keep.some(k=>Math.hypot(k[0]-dx,k[1]-dz)<s+1.9)||spots.some(k=>Math.hypot(k[0]-dx,k[1]-dz)<s+k[2]+1))continue;
  spots.push([dx,dz,s]);
 }
 return spots;
}
// Kleinste horizontale afstand van een lokaal punt tot de middellijn van een goot.
export function clearance(layout,[dx,dz],origin=ORIGIN){
 const x=origin[0]+dx,z=origin[1]+dz;let best=Infinity;
 for(const e of layout.edges){const a=e.samples[0],b=e.samples[e.samples.length-1],vx=b[0]-a[0],vz=b[2]-a[2],l=vx*vx+vz*vz;
  const t=clamp(((x-a[0])*vx+(z-a[2])*vz)/l,0,1);best=Math.min(best,Math.hypot(a[0]+vx*t-x,a[2]+vz*t-z));}
 return best;
}
