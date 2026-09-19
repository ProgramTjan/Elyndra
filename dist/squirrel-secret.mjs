import {IDENTITY} from './deer-motion.mjs?v=dragon22';
import {joint} from './wildlife-motion.mjs?v=dragon22';

export const MONUMENT=Object.freeze({x:130,z:148,scale:4.2,base:1.6,crown:12.15});
export const SECRET_KEY='elyndra-squirrel-monument-v1';
export const SQUIRREL_ROUTE=Object.freeze([[96,47],[104,59],[111,78],[121,103],[128,126],[130,140]]);
export const STUMPS=Object.freeze([[111,78],[121,103]]);
const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const turn=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
const facing=(a,b)=>Math.atan2(-(b[0]-a[0]),-(b[2]-a[2]));
export function readSecret(storage){try{return storage?.getItem(SECRET_KEY)==='found';}catch{return false;}}
export function saveSecret(storage){if(!storage)return false;try{storage.setItem(SECRET_KEY,'found');return true;}catch{return false;}}
export function inSquirrelPath(x,z){
 if(Math.hypot(x-MONUMENT.x,z-MONUMENT.z)<15)return true;
 return SQUIRREL_ROUTE.slice(1).some((b,i)=>{const a=SQUIRREL_ROUTE[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<3.2;});
}

export class SquirrelSecret {
 constructor(ground,remembered=false){
  this.ground=ground;this.home=[96,ground(86,36)+15.8,43];this.position=[...this.home];
  this.heading=0;this.phase='home';this.time=0;this.elapsed=0;this.away=0;this.revealed=remembered;
  this.reveal=remembered?1:0;this.justRevealed=false;this.gait=0;this.wobble=0;this.crownAge=0;
  this.visits=0;this.waypoint=0;this.pauseDone=-1;this.revisitReady=true;this.nearMonument=false;
 }
 onFoot(viewer){return Math.abs(viewer[1]-this.ground(viewer[0],viewer[2]))<6;}
 canInvite(viewer){return this.phase==='home'&&this.onFoot(viewer)&&Math.hypot(viewer[0]-96,viewer[2]-43)<26;}
 invite(viewer){
  if(!this.canInvite(viewer))return false;
  this.phase='invited';this.elapsed=0;this.away=0;this.waypoint=0;this.pauseDone=-1;this.visits++;
  this.revisitReady=false;return true;
 }
 canReveal(viewer){return this.phase==='ready'&&!this.revealed&&this.onFoot(viewer)&&Math.hypot(viewer[0]-MONUMENT.x,viewer[2]-(MONUMENT.z-5))<6;}
 touch(viewer){if(!this.canReveal(viewer))return false;this.phase='revealing';this.elapsed=0;return true;}
 go(phase){this.phase=phase;this.elapsed=0;}
 move(target,dt,speed=3.8){
  const d=Math.hypot(...target.map((v,i)=>v-this.position[i]));
  if(dist(target,this.position)>.05)this.heading=turn(this.heading,facing(this.position,target),1-Math.exp(-dt*6));
  this.position=mix(this.position,target,d?Math.min(1,speed*dt/d):1);
  this.gait=d>.08?1:0;
  return d<.16;
 }
 pathPoint(index){const [x,z]=SQUIRREL_ROUTE[index];return [x,this.ground(x,z),z];}
 startReturn(){this.returnFrom=[...this.position];this.waypoint=SQUIRREL_ROUTE.length-1;let best=Infinity;
  SQUIRREL_ROUTE.forEach((p,i)=>{const d=Math.hypot(p[0]-this.position[0],p[1]-this.position[2]);if(d<best){best=d;this.waypoint=i;}});
  this.go('returning');this.revisitReady=false;
 }
 update(dt,viewer,enabled=true,reduced=false,homeBreath=0){
  this.justRevealed=false;if(!enabled)return this.snapshot(viewer);
  dt=Math.max(0,Math.min(.05,dt));this.time+=dt;this.elapsed+=dt;this.gait=0;this.wobble=0;
  const onFoot=this.onFoot(viewer),near=dist(viewer,this.position)<16&&onFoot;
  const md=Math.hypot(viewer[0]-MONUMENT.x,viewer[2]-MONUMENT.z);
  this.nearMonument=md<28&&onFoot;
  this.away=near||this.nearMonument?0:this.away+dt;
  if(md>45)this.revisitReady=true;
  if(this.phase==='home'){
   this.position=[this.home[0],this.home[1]+homeBreath,this.home[2]];
   this.heading=turn(this.heading,dist(viewer,this.home)<26?facing(this.position,viewer):0,1-Math.exp(-dt*2));
   // A real journey to the monument, never a second squirrel or a teleport.
   if(this.revealed&&this.nearMonument&&this.revisitReady){this.go('visiting');this.waypoint=0;this.revisitReady=false;this.climbFrom=[...this.position];}
  } else if(this.phase==='invited'){
   this.heading=turn(this.heading,facing(this.position,viewer),1-Math.exp(-dt*3));
   if(this.elapsed>2.5){this.go('climbing');this.climbFrom=[...this.position];}
  } else if(this.phase==='climbing'||this.phase==='visiting'){
   const sequence=[this.climbFrom,[98,this.home[1]-3,42],[96,this.home[1]-8,39],[93,this.ground(93,40)+2,40],this.pathPoint(0)];
   const t=clamp(this.elapsed/7)*(sequence.length-1),i=Math.min(sequence.length-2,Math.floor(t));
   this.position=mix(sequence[i],sequence[i+1],ease(t-i));this.gait=1;
   this.heading=turn(this.heading,facing(sequence[i],sequence[i+1]),1-Math.exp(-dt*4));
   if(this.elapsed>=7){const alone=this.phase==='visiting';this.go(alone?'travelling':'leading');this.waypoint=1;}
  } else if(['leading','waiting','perching','return-to-you','travelling'].includes(this.phase)){
   const autonomous=this.phase==='travelling';
   if(!autonomous&&this.away>35){this.startReturn();}
   else if(this.phase==='return-to-you'){
    const d=dist(viewer,this.position);
    if(d<7&&onFoot){this.go('leading');}
    else {const ratio=d?Math.max(0,d-6)/d:0,x=this.position[0]+(viewer[0]-this.position[0])*ratio,z=this.position[2]+(viewer[2]-this.position[2])*ratio;this.move([x,this.ground(x,z),z],dt,3.5);}
   }else if(this.phase==='waiting'||this.phase==='perching'){
    this.heading=turn(this.heading,facing(this.position,viewer),1-Math.exp(-dt*3));
    if(this.phase==='perching'){
     const stump=STUMPS[this.waypoint===2?0:1];
     this.position[1]=this.ground(...stump)+.85*ease(this.elapsed/1.3);
     if(this.elapsed>2.6&&near){this.waypoint++;this.go('leading');}
    }else if(dist(viewer,this.position)<8&&onFoot)this.go('leading');
    if(this.elapsed>7&&dist(viewer,this.position)>10&&onFoot){this.go('return-to-you');}
   }else {
    if(!autonomous&&(!onFoot||dist(viewer,this.position)>13)){this.go('waiting');}
    else if(this.move(this.pathPoint(this.waypoint),dt,autonomous?6:3.8)){
     if(this.waypoint===SQUIRREL_ROUTE.length-1){this.go('placing');}
     else if(!autonomous&&(this.waypoint===2||this.waypoint===3)&&this.pauseDone!==this.waypoint){this.pauseDone=this.waypoint;this.go('perching');}
     else this.waypoint++;
    }
   }
  }else if(this.phase==='placing'){
   const target=[MONUMENT.x,this.ground(MONUMENT.x,MONUMENT.z-4)+.25,MONUMENT.z-4];this.move(target,dt,2);
   if(this.elapsed>3){this.go(this.revealed?'ascending':'ready');this.ascentFrom=[...this.position];}
  }else if(this.phase==='ready'){
   this.heading=turn(this.heading,facing(this.position,viewer),1-Math.exp(-dt*3));
   if(this.away>35)this.startReturn();
  }else if(this.phase==='revealing'){
   this.reveal=ease(this.elapsed/10);
   if(this.elapsed>=10){this.revealed=true;this.justRevealed=true;this.reveal=1;this.go('ascending');this.ascentFrom=[...this.position];}
  }else if(this.phase==='ascending'){
   const y=this.ground(MONUMENT.x,MONUMENT.z)+MONUMENT.base;
   const sequence=[this.ascentFrom,[MONUMENT.x+2.3,y+2,MONUMENT.z-1],[MONUMENT.x+1.5,y+5,MONUMENT.z-.8],[MONUMENT.x,y+7.2,MONUMENT.z],[MONUMENT.x,y+MONUMENT.crown-MONUMENT.base,MONUMENT.z-.15]];
   const t=clamp(this.elapsed/6)*4,i=Math.min(3,Math.floor(t));this.position=mix(sequence[i],sequence[i+1],ease(t-i));this.gait=1;
   if(this.elapsed>6){this.go('posing');this.heading=0;}
  }else if(this.phase==='posing'){
   this.heading=turn(this.heading,0,1-Math.exp(-dt*3));
   // One tiny loss of balance, then dignified composure. No wobble in reduced motion.
   if(!reduced&&this.elapsed>3.5&&this.elapsed<5.5)this.wobble=Math.sin((this.elapsed-3.5)*Math.PI)*.22;
   if(this.elapsed>8)this.go('proud');
  }else if(this.phase==='proud'){
   this.crownAge=this.elapsed;
   this.heading=turn(this.heading,this.elapsed%16<3?.35:0,1-Math.exp(-dt*2));
   if(this.away>25||this.elapsed>50){this.descentFrom=[...this.position];this.go('descending');}
  }else if(this.phase==='descending'){
   const target=this.pathPoint(SQUIRREL_ROUTE.length-1);this.position=mix(this.descentFrom,target,ease(this.elapsed/7));this.gait=1;
   if(this.elapsed>=7)this.startReturn();
  }else if(this.phase==='returning'){
   if(this.move(this.pathPoint(this.waypoint),dt,6)){
    if(this.waypoint>0)this.waypoint--;else{this.climbFrom=[...this.position];this.go('homeward');}
   }
  }else if(this.phase==='homeward'){
   const seq=[this.climbFrom,[93,this.ground(93,40)+2,40],[96,this.home[1]-8,39],[98,this.home[1]-3,42],this.home];
   const t=clamp(this.elapsed/7)*4,i=Math.min(3,Math.floor(t));this.position=mix(seq[i],seq[i+1],ease(t-i));this.gait=1;
   if(this.elapsed>=7)this.go('home');
  }
  return this.snapshot(viewer);
 }
 snapshot(viewer=this.home){return {phase:this.phase,position:[...this.position],heading:this.heading,time:this.time,elapsed:this.elapsed,
  revealed:this.revealed,reveal:this.reveal,justRevealed:this.justRevealed,gait:this.gait,wobble:this.wobble,
  canInvite:this.canInvite(viewer),canReveal:this.canReveal(viewer),nearMonument:this.nearMonument,
  active:!['home','returning','homeward','travelling','visiting'].includes(this.phase),
  acornPlaced:['ready','revealing','ascending','posing','proud','descending'].includes(this.phase),
  near:dist(viewer,this.position)<24||this.nearMonument};}
}

export function squirrelPose(state,reduced=false){
 const t=reduced?0:state.time,bounce=reduced?0:Math.abs(Math.sin(t*10))*.09*state.gait;
 const root=joint(IDENTITY,[state.position[0],state.position[1]+bounce,state.position[2]],state.heading);
 const body=joint(joint(root,[0,0,0],state.wobble,'z'),[0,0,0],state.gait*.2,'x');
 const head=joint(body,[0,1.35,-.15],state.phase==='waiting'||state.phase==='ready'?.18:0);
 const tail=joint(body,[0,.35,.3],reduced?0:Math.sin(t*2)*.08,'x');
 const bones=[body,head,tail];
 for(const [i,x,z]of [[0,-.23,-.12],[1,.23,-.12],[2,-.24,.18],[3,.24,.18]]){
  const tending=state.phase==='proud'&&state.elapsed%16<3&&i<2;
  const sway=tending?-.85:(reduced?0:Math.sin(t*10+i*Math.PI)*state.gait*.34);
  bones.push(joint(body,[x,i<2?.85:.25,z],sway,'x'));
 }
 return bones;
}
