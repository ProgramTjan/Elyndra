import {DRAGON_REST} from './dragon-encounter.mjs?v=dragon22';

// De draak als derde gast. Hij brengt geen eten en geen herinnering, maar warmte:
// hij ademt een oude zaadlantaarn aan, de speler laat de gloed tot rust komen en
// draagt haar naar de moswachter. De draak vliegt zijn eigen weg en landt erbij.
export const DRAGON_GUEST_KEY='elyndra-gathering-dragon-v1';
export const DRAGON_FILM_SECONDS=9;
export const KINDLE_SECONDS=4;
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const flat=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const headingTo=(a,b)=>Math.atan2(-(b[0]-a[0]),-(b[2]-a[2]));
const turn=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
const cubic=(a,b,c,d,t)=>a.map((v,i)=>(1-t)**3*v+3*(1-t)**2*t*b[i]+3*(1-t)*t*t*c[i]+t**3*d[i]);
const ORBIT={radius:34,height:46,speed:.16};
const CLIMB_SECONDS=14,LAND_SECONDS=8;

// Neemt de bestaande draak pas over wanneer de speler hem heeft uitgenodigd. Geen tweede draak.
export class DragonGuest {
 constructor(ground,storage){
  this.ground=ground;this.storage=storage;this.available=false;
  this.phase='idle';this.elapsed=0;this.time=0;this.kindle=0;this.reduced=false;this.previous=null;this.from=null;
  this.rest=[DRAGON_REST.x,ground(DRAGON_REST.x,DRAGON_REST.z)+1.55,DRAGON_REST.z];
  // De lantaarn ligt op het vrije pad voor zijn rustplek, ruim buiten zijn kop: zo is er plaats om erbij te staan.
  this.lantern=this.along(6.2,.22);this.meeting=this.point(94,49);this.landing=this.point(85,51,1.55);
  try{const value=storage?.getItem(DRAGON_GUEST_KEY);if(['ember','kindle','carry','done'].includes(value))this.phase=value;}catch{}
 }
 point(x,z,y=0){return[x,this.ground(x,z)+y,z];}
 // Een punt op het vrijgehouden pad vanaf zijn rustplek (richting de open plek), met optionele zijstap.
 along(distance,y=0,side=0){const ax=.4472,az=.8944;return this.point(DRAGON_REST.x+ax*distance-az*side,DRAGON_REST.z+az*distance+ax*side,y);}
 get active(){return !['idle','done'].includes(this.phase);}
 get reserved(){return this.phase!=='idle';}
 get cinematic(){return this.phase==='film';}
 get carried(){return ['kindle','carry','arrival','offering'].includes(this.phase);}
 get atKeeper(){return ['arrival','offering','done'].includes(this.phase);}
 onFoot(p){return Math.abs(p[1]-this.ground(p[0],p[2]))<4.5;}
 near(p,target,r){return this.onFoot(p)&&flat(p,target)<r;}
 save(value){try{this.storage?.setItem(DRAGON_GUEST_KEY,value);}catch{}}
 enter(phase){this.phase=phase;this.elapsed=0;}
 // De draak moet zelf zijn komen rusten; dan pas kun je hem aanspreken.
 canInvite(p,encounter){
  return this.available&&this.phase==='idle'&&['resting','greeting'].includes(encounter?.phase)&&this.near(p,this.rest,12);
 }
 // Waar je hem kunt aanspreken, of null als hij vliegt of nog niet is geland.
 speaker(p,encounter){
  if(this.canInvite(p,encounter))return this.rest;
  if(['ember','kindle'].includes(this.phase))return this.rest;
  if(this.phase==='offering'||this.phase==='done')return this.landing;
  return null;
 }
 start(p,encounter,reduced=false){
  if(!this.canInvite(p,encounter))return false;
  this.reduced=reduced;this.enter('film');this.save('ember');return true;
 }
 skip(){if(!this.cinematic)return false;this.enter('ember');return true;}
 action(p){return this.phase==='ember'&&this.near(p,this.lantern,3.6)?'Neem de gloedlantaarn':null;}
 interact(p){
  if(!this.action(p))return false;
  this.enter('kindle');this.kindle=0;this.save('kindle');return true;
 }
 canDeliver(p){return this.phase==='offering'&&this.near(p,this.point(86,36),23);}
 deliver(p){if(!this.canDeliver(p))return false;this.enter('done');this.save('done');return true;}
 update(dt,p,enabled=true){
  if(!enabled||(!this.available&&!this.reserved)){this.previous=null;return;}
  dt=Math.min(.5,Math.max(0,dt));this.time+=dt;this.elapsed+=dt;
  const speed=this.previous&&dt>0?flat(p,this.previous)/dt:0;this.previous=[...p];
  if(this.cinematic&&this.elapsed>=DRAGON_FILM_SECONDS)this.skip();
  else if(this.phase==='kindle'){
   // De gloed went alleen aan wie stilstaat; lopen laat haar weer flakkeren.
   if(this.onFoot(p)&&speed<.5)this.kindle+=dt;else this.kindle=Math.max(0,this.kindle-dt*.6);
   if(this.kindle>=KINDLE_SECONDS){this.enter('carry');this.save('carry');}
  }else if(this.phase==='carry'&&this.near(p,this.meeting,25)){this.from=this.flight();this.enter('arrival');}
  else if(this.phase==='arrival'&&this.elapsed>=LAND_SECONDS)this.enter('offering');
 }
 orbit(angle){return[this.meeting[0]+Math.cos(angle)*ORBIT.radius,this.meeting[1]+ORBIT.height,this.meeting[2]+Math.sin(angle)*ORBIT.radius];}
 // Zijn eigen weg naar de samenkomst: opstijgen, oversteken en hoog boven de moswachter cirkelen.
 flight(){
  const wait=2.5,t=this.elapsed-wait,entry=-2.2,gate=this.orbit(entry);
  if(t<=0)return {position:[...this.rest],heading:DRAGON_REST.heading,settle:1-ease(this.elapsed/wait)*.4,bow:ease(this.elapsed/1.2)*(1-ease((this.elapsed-1.4)/1))};
  if(t<CLIMB_SECONDS){
   const u=ease(t/CLIMB_SECONDS),a=this.rest,b=[a[0]+6,a[1]+34,a[2]+10],c=[gate[0]-40,gate[1]+6,gate[2]-26];
   const p=cubic(a,b,c,gate,u),q=cubic(a,b,c,gate,Math.min(1,u+.002));
   return {position:p,heading:u<.998?headingTo(p,q):headingTo(gate,this.orbit(entry+.05)),settle:Math.max(0,.6-t*.6),bow:0};
  }
  const angle=entry+(t-CLIMB_SECONDS)*ORBIT.speed,p=this.orbit(angle);
  return {position:p,heading:headingTo(p,this.orbit(angle+.05)),settle:0,bow:0};
 }
 pose(viewer){
  let position=[...this.rest],heading=DRAGON_REST.heading,settle=1,bow=0,look=0;
  const watch=(from,base)=>Math.max(-.8,Math.min(.8,Math.atan2(Math.sin(headingTo(from,viewer)-base),Math.cos(headingTo(from,viewer)-base))));
  if(this.cinematic){heading=headingTo(this.rest,this.lantern);bow=ease(this.elapsed/1.6)*(1-ease((this.elapsed-7.4)/1.4))*.9;}
  else if(this.phase==='ember'||this.phase==='kindle'){heading=headingTo(this.rest,this.lantern);bow=.18;look=watch(this.rest,heading);}
  else if(this.phase==='carry'){({position,heading,settle,bow}=this.flight());}
  else if(this.phase==='arrival'){
   const from=this.from??this.flight(),u=ease(this.elapsed/LAND_SECONDS),a=from.position,d=this.landing;
   const b=[a[0]+(d[0]-a[0])*.2,a[1]-4,a[2]+(d[2]-a[2])*.2],c=[d[0]+9,d[1]+13,d[2]+12];
   position=cubic(a,b,c,d,u);const next=cubic(a,b,c,d,Math.min(1,u+.002));
   const facing=headingTo(this.landing,this.meeting);
   heading=turn(u<.998?headingTo(position,next):facing,facing,ease((u-.72)/.28));settle=ease((this.elapsed-5.4)/2.6);
  }else{position=[...this.landing];heading=headingTo(this.landing,this.meeting);bow=.12;look=watch(this.landing,heading);}
  return {position,heading,settle,bow,look};
 }
 camera(reduced=false){
  const t=reduced?1:ease(this.elapsed/5.5);
  return {position:mix(this.along(13,3),this.along(10.6,2.3,1.1),t),target:this.along(4.4,1.05)};
 }
 // Hoe fel de lantaarn brandt (0..1) en of de draak op dit moment ademt.
 glow(){
  if(this.cinematic)return ease((this.elapsed-2.2)/4.6);
  if(this.phase==='kindle')return .55+.45*ease(this.kindle/KINDLE_SECONDS)+Math.sin(this.time*9)*.08*(1-ease(this.kindle/KINDLE_SECONDS));
  return this.reserved?1:0;
 }
 breathing(){return this.cinematic&&this.elapsed>1.6&&this.elapsed<7.2;}
 // Waar de lantaarn in de wereld staat; null zolang de speler haar draagt.
 offeringPosition(){
  if(this.phase==='done')return this.point(96.2,47.4,.24);
  if(this.cinematic||this.phase==='ember')return this.lantern;
  return null;
 }
 travelTarget(){return this.carried||this.phase==='done'?this.meeting:this.rest;}
 // Waar de reisknop je neerzet om de lantaarn te pakken: erachter, met de draak in beeld.
 standpoint(){return this.along(9);}
 words(){
  if(this.cinematic)return this.elapsed<6.4?['Warmte onder oude veren','De draak buigt zich over een zaadlantaarn die al heel lang koud is. Hij ademt uit.']:['Een gloed die blijft','In de lantaarn blijft iets branden, ook nu hij zijn adem inhoudt.'];
  const words={
   ember:['Een geschenk voor zijn oude vriend','Neem de gloedlantaarn bij de draak. Hij kijkt of je voorzichtig bent.'],
   kindle:['De gloed moet aan je wennen','Blijf even stilstaan. Wie loopt, laat haar flakkeren.'],
   carry:['Warmte voor de moswachter','De draak kiest de lucht. Draag de lantaarn naar de moswachter, te voet of via Ontdek plekken.'],
   arrival:['De derde gast','Boven de boomkruinen vouwt de draak zijn vleugels. Hij landt naast de anderen.'],
   offering:['Drie gasten bij het zaad','Spreek de moswachter aan en geef hem de warmte van zijn oude vriend.']
  };return words[this.phase]??null;
 }
 snapshot(){return {phase:this.phase,elapsed:this.elapsed,kindle:this.kindle,cinematic:this.cinematic,reserved:this.reserved,carried:this.carried,lantern:[...this.lantern],rest:[...this.rest],meeting:[...this.meeting],landing:[...this.landing]};}
}

// Een zaadlantaarn: vier ribben van oud hout om een kern die warm licht geeft.
export function createDragonOffering({orb,curveTube,upload,material}){
 material(5);
 for(let i=0;i<4;i++){const a=i*Math.PI/2+.4,c=Math.cos(a),s=Math.sin(a);
  curveTube([[c*.05,0,s*.05],[c*.21,.14,s*.21],[c*.2,.34,s*.2],[c*.03,.5,s*.03]],[.022,.026,.024,.016],[.30,.21,.11],6);}
 material(0);orb(0,.52,0,.045,.05,.045,[.34,.24,.12],8,5);orb(0,.0,0,.09,.035,.09,[.26,.19,.10],8,4);
 const shell=upload();
 material(0);orb(0,.24,0,.085,.105,.085,[.42,.33,.20],10,7);
 const cold=upload();
 material(0);orb(0,.24,0,.10,.125,.10,[1.55,.78,.26],12,8);orb(0,.25,0,.05,.07,.05,[1.75,1.25,.62],8,6);
 const ember=upload();
 return {shell,cold,ember};
}

// Waar de gedragen lantaarn in beeld hangt: rechts onder, een armlengte voor de speler.
export function heldPosition(eye,yaw,pitch){
 const cp=Math.cos(pitch),forward=[Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp],right=[Math.cos(yaw),0,Math.sin(yaw)];
 return [eye[0]+forward[0]*1.05+right[0]*.44,eye[1]+forward[1]*1.05-.62,eye[2]+forward[2]*1.05+right[2]*.44];
}
