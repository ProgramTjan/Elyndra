import {FOX, springPosition, poseRootFox} from './rare-dwellers.mjs?v=fox43';

export const FOX_INVITATION_KEY='elyndra-gathering-fox-v1';
export const FOX_FILM_SECONDS=9;
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const flat=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const face=(a,b)=>Math.atan2(a[0]-b[0],a[2]-b[2]);

// Owns the existing fox only when this chapter is available. No second actor.
export class FoxInvitation {
 constructor(ground,storage){
  this.ground=ground;this.storage=storage;this.available=false;
  this.phase='idle';this.elapsed=0;this.time=0;this.washProgress=0;this.reduced=false;
  this.spring=springPosition(ground);this.dig=this.point(...FOX.dig);
  this.fragment=this.point(-45.6,-39,.16);this.meeting=this.point(94,49);
  try{const value=storage?.getItem(FOX_INVITATION_KEY);if(['fragment','wash','carry','done'].includes(value))this.phase=value;}catch{}
 }
 point(x,z,y=0){return[x,this.ground(x,z)+y,z];}
 get active(){return !['idle','done'].includes(this.phase);}
 get reserved(){return this.available||this.phase!=='idle';}
 get cinematic(){return this.phase==='film';}
 get atKeeper(){return ['arrival','offering','done'].includes(this.phase);}
 get clean(){return ['carry','arrival','offering','done'].includes(this.phase);}
 onFoot(p){return Math.abs(p[1]-this.ground(p[0],p[2]))<4.5;}
 near(p,target,r){return this.onFoot(p)&&flat(p,target)<r;}
 save(value){try{this.storage?.setItem(FOX_INVITATION_KEY,value);}catch{}}
 enter(phase){this.phase=phase;this.elapsed=0;}
 canInvite(p){return this.available&&this.phase==='idle'&&this.near(p,this.dig,8);}
 start(p,reduced=false){
  if(!this.canInvite(p))return false;
  this.reduced=reduced;this.enter('film');this.save('fragment');return true;
 }
 skip(){if(!this.cinematic)return false;this.enter('fragment');return true;}
 action(p){
  if(this.phase==='fragment'&&this.near(p,this.fragment,3.5))return 'Neem het wortelfragment';
  if(this.phase==='wash'&&this.near(p,this.spring,3.3))return 'Spoel het fragment in de bron';
  return null;
 }
 interact(p){
  if(!this.action(p))return false;
  if(this.phase==='fragment'){this.enter('wash');this.save('wash');}
  else{this.enter('washing');this.washProgress=0;}
  return true;
 }
 canDeliver(p){return this.phase==='offering'&&this.near(p,this.point(86,36),23);}
 deliver(p){if(!this.canDeliver(p))return false;this.enter('done');this.save('done');return true;}
 update(dt,p,enabled=true){
  if(!enabled||!this.reserved)return;
  dt=Math.min(.5,Math.max(0,dt));this.time+=dt;this.elapsed+=dt;
  if(this.cinematic&&this.elapsed>=FOX_FILM_SECONDS)this.skip();
  else if(this.phase==='washing'){
   if(this.near(p,this.spring,3.8))this.washProgress+=dt;
   if(this.washProgress>=3){this.enter('carry');this.save('carry');}
  }else if(this.phase==='carry'&&this.near(p,this.meeting,25))this.enter('arrival');
  else if(this.phase==='arrival'&&this.elapsed>=6)this.enter('offering');
 }
 pose(viewer,reduced=false){
  let position=[...this.dig],heading=face(this.dig,this.fragment),gait=0,dig=0,sit=0,gaze=1,fade=1;
  if(this.cinematic){dig=this.elapsed<6?ease(this.elapsed/.8)*(1-ease((this.elapsed-5)/1)):0;sit=ease((this.elapsed-6)/1);}
  else if(this.phase==='carry'){
   const end=this.point(...FOX.exit),t=ease(this.elapsed/6);
   position=mix(this.dig,end,t);position[1]=this.ground(position[0],position[2]);
   heading=face(this.dig,end);gait=1;fade=1-ease((this.elapsed-4.5)/1.5);
  }else if(this.atKeeper){
   const from=this.point(104,59),t=this.phase==='arrival'?ease(this.elapsed/6):1;
   position=mix(from,this.meeting,t);position[1]=this.ground(position[0],position[2]);
   heading=face(from,this.meeting);gait=this.phase==='arrival'?1:0;sit=this.phase==='arrival'?0:1;
  }else sit=this.phase==='idle'?.3:.8;
  return poseRootFox({position,heading,gait,dig,sit,gaze,fade,listen:0,spring:0},this.ground,viewer,this.time,reduced);
 }
 camera(reduced=false){
  const t=reduced?1:ease(this.elapsed/5);
  return {position:mix(this.point(-41,-33,2.7),this.point(-42,-35.5,2.2),t),target:this.point(-46.4,-39.5,.65)};
 }
 offeringPosition(){
  if(this.phase==='done')return this.point(94.7,48.5,.25);
  if(this.phase==='washing')return[this.spring[0],this.spring[1]+.15,this.spring[2]];
  if(this.phase==='fragment')return this.fragment;
  if(this.cinematic&&this.elapsed>4)return[this.fragment[0],this.fragment[1]-(1-ease((this.elapsed-4)/2))*.3,this.fragment[2]];
  return null;
 }
 travelTarget(){return this.clean?this.meeting:this.dig;}
 words(){
  if(this.cinematic)return this.elapsed<6?['Iets onder de wortels','“Hapjes? Nee. Ik zoek iets dat het water heeft bewaard.”']:['Een teken onder de aarde','Tussen zijn poten komt een gebogen wortelfragment tevoorschijn.'];
  const words={
   fragment:['Een geschenk voor de moswachter','Neem het wortelfragment naast de vos. Er zit iets onder de aarde.'],
   wash:['Wat het water bewaart','Loop naar het bronnetje bij zijn poten en spoel het fragment schoon.'],
   washing:['Een teken wordt zichtbaar','Blijf even bij het water. Onder de aarde ligt een teken als een open zaad.'],
   carry:['Een herinnering voor de moswachter','De vos neemt zijn eigen pad. Breng het fragment naar de moswachter, te voet of via Ontdek plekken.'],
   arrival:['De tweede gast','Tussen de varens verschijnt de vos. Hij zoekt een plek naast de hapjes.'],
   offering:['Twee gasten, één raadsel','Spreek de moswachter aan en laat hem het wortelfragment zien.']
  };return words[this.phase]??null;
 }
 snapshot(){return {phase:this.phase,elapsed:this.elapsed,washProgress:this.washProgress,cinematic:this.cinematic,reserved:this.reserved,fragment:[...this.fragment],spring:[...this.spring],meeting:[...this.meeting]};}
}

export function createFoxOffering({orb,curveTube,beam,upload,material}){
 material(0);
 curveTube([[-.38,0,.08],[-.16,.06,-.12],[.12,.04,-.1],[.35,.01,.12]],[.09,.12,.1,.05],[.32,.19,.09],10);
 orb(0,.05,0,.22,.065,.16,[.66,.52,.28],12,6);
 const shell=upload();
 material(3);
 curveTube([[-.12,.125,.04],[-.11,.14,-.08],[0,.15,-.12],[.11,.14,-.08],[.12,.125,.04]],[.018,.018,.018,.018,.018],[.64,1.05,.72],8);
 beam([0,.15,-.1],[0,.15,.1],.016,[.64,1.05,.72]);
 const mark=upload();material(0);return {shell,mark};
}
