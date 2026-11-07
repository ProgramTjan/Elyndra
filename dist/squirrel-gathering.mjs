// The first invitation to the gathering. Borrows the existing squirrel actor;
// the world returns it to its ordinary route when this encounter finishes.
export const GATHERING_KEY = 'elyndra-gathering-squirrel-v1';
export const SCENE_SECONDS = 10;
const mix = (a,b,t) => a.map((v,i)=>v+(b[i]-v)*t);
const ease = t => { t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
const distance = (a,b) => Math.hypot(a[0]-b[0],a[2]-b[2]);

export class SquirrelGathering {
  constructor(ground,storage) {
    this.ground=ground; this.storage=storage;
    this.home=[96,ground(86,36)+15.8,43];
    this.stash=this.point(104,59); this.nut=this.point(106,64,.22);
    this.meeting=this.point(96,47); this.position=[...this.stash];
    this.phase='idle'; this.time=0; this.elapsed=0; this.heading=0;
    this.gait=0; this.reach=0; this.justFinished=false;
    try {
      const saved=storage?.getItem(GATHERING_KEY);
      if(['needNut','escort','done'].includes(saved))this.phase=saved;
    } catch {}
  }
  point(x,z,y=0) { return [x,this.ground(x,z)+y,z]; }
  get active() { return !['idle','done'].includes(this.phase); }
  get cinematic() { return this.phase==='cinematic'; }
  get sceneTime() { return this.reduced&&this.elapsed<8?5.5+this.elapsed*2.5/8:this.elapsed; }
  save(value) { try { this.storage?.setItem(GATHERING_KEY,value); } catch {} }
  start(reduced=false) {
    if(this.phase!=='idle')return false;
    this.reduced=reduced; this.phase='cinematic'; this.elapsed=0; this.position=[...this.home];
    this.save('needNut'); // Reloading never forces a repeat of the film.
    return true;
  }
  skip() {
    if(!this.cinematic)return false;
    this.phase='needNut'; this.elapsed=0; this.position=[...this.stash];
    this.gait=0; this.reach=0; this.heading=Math.atan2(-2,-5);
    return true;
  }
  canCollect(viewer) {
    return this.phase==='needNut' && distance(viewer,this.nut)<3.5 &&
      Math.abs(viewer[1]-this.ground(viewer[0],viewer[2]))<4;
  }
  collect(viewer) {
    if(!this.canCollect(viewer))return false;
    this.phase='escort'; this.elapsed=0; this.save('escort'); return true;
  }
  update(dt,viewer,enabled=true) {
    this.justFinished=false;
    if(!enabled||!this.active)return;
    dt=Math.max(0,Math.min(.5,dt)); this.time+=dt; this.elapsed+=dt;
    this.gait=0; this.reach=0;
    if(this.cinematic) {
      const t=this.sceneTime;
      const climb=[this.home,[98,this.home[1]-3,42],[96,this.home[1]-8,39],this.point(93,40,2),this.meeting];
      if(t<3.5) {
        const progress=t/3.5*4, i=Math.min(3,Math.floor(progress));
        this.position=mix(climb[i],climb[i+1],ease(progress-i)); this.gait=1;
      } else if(t<5.5) {
        this.position=mix(this.meeting,this.stash,ease((t-3.5)/2)); this.gait=1;
      } else {
        this.position=[...this.stash];
        this.reach=t<8?Math.sin((t-5.5)/2.5*Math.PI*2)**2:0;
      }
      this.heading=Math.atan2(-8,-12);
      if(t>=SCENE_SECONDS)this.skip();
    } else if(this.phase==='escort') {
      const d=distance(this.position,this.meeting);
      if(distance(viewer,this.position)<12 && Math.abs(viewer[1]-this.ground(viewer[0],viewer[2]))<6) {
        this.heading=Math.atan2(-(this.meeting[0]-this.position[0]),-(this.meeting[2]-this.position[2]));
        this.position=mix(this.position,this.meeting,d?Math.min(1,dt*2.7/d):1);
        this.position[1]=this.ground(this.position[0],this.position[2]); this.gait=1;
        if(d<.2){this.phase='arrival';this.elapsed=0;this.position=[...this.meeting];}
      }
    } else if(this.phase==='arrival' && this.elapsed>5) {
      this.phase='done';this.justFinished=true;this.save('done');
    }
  }
  actor(original) {
    if(!this.active)return original;
    return {...original,phase:'gathering',position:[...this.position],heading:this.heading,
      time:this.time,elapsed:this.elapsed,gait:this.gait,wobble:0,reach:this.reach,
      carrying:this.phase==='escort'||this.phase==='arrival'||(this.cinematic&&this.sceneTime>=6.8),
      active:true,canInvite:false,canReveal:false,justRevealed:false};
  }
  nuts() {
    if(this.phase==='idle')return [];
    if(this.phase==='done'||this.phase==='arrival')return [this.point(96.7,47,.2),this.point(96.9,47.4,.2),this.point(96.5,47.6,.2)];
    const result=[];
    if(this.cinematic && this.sceneTime<8) {
      for(let i=0;i<3;i++) {
        const p=this.point(104.5+i*.3,59.7+i*.2,.22);
        if(this.sceneTime>5.5+i*.8)result.push(mix(p,[104.4,this.stash[1]+.95,59.5],ease((this.sceneTime-5.5-i*.8)/.6)));
        else result.push(p);
      }
    } else if(this.phase==='needNut'||this.cinematic) {
      result.push(this.cinematic?mix(this.point(104.4,59.5,1),this.nut,ease((this.sceneTime-8)/2)):[...this.nut]);
    }
    if(this.phase==='escort'||(this.cinematic&&this.sceneTime>=8)||this.phase==='needNut') {
      for(const side of [-1,1])result.push([this.position[0]-Math.sin(this.heading)*.35+Math.cos(this.heading)*side*.15,this.position[1]+.9,this.position[2]-Math.cos(this.heading)*.35-Math.sin(this.heading)*side*.15]);
    }
    return result;
  }
  camera(reduced=false) {
    if(reduced)return {position:this.point(107.5,65,3.2),target:this.point(104.5,60.5,.8)};
    const t=ease((this.elapsed-3.5)/2);
    return {position:mix([this.position[0]+5,this.position[1]+3.5,this.position[2]+8],this.point(107.5,65,3.2),t),
      target:mix([this.position[0],this.position[1]+1,this.position[2]],this.point(104.5,60.5,.8),t)};
  }
  words(viewer) {
    if(this.cinematic)return this.sceneTime<5.5?['Voor iedereen iets lekkers','“Een samenkomst? Dan neem ik de hapjes mee!”']:
      this.sceneTime<8?['Een zorgvuldig plan','Eén voor de moswachter. Eén voor jou. En één voor…']:
        ['Een noot met eigen plannen','“Hé! Jij bent niet uitgenodigd om weg te rollen.”'];
    if(this.phase==='needNut')return ['Een noot met eigen plannen','Volg het pad naast de moswachter. De noot glanst bij de eekhoorn.'];
    if(this.phase==='escort')return ['Samen naar de moswachter',distance(viewer,this.position)>12?'Hij wacht op je bij het pad. Kom te voet terug; er is geen haast.':'“Jij draagt die, ik de andere. Zo begint een feest.” Volg zijn staart.'];
    if(this.phase==='arrival')return ['De eerste gast is er','De moswachter bromt: “Er is plek voor meer.” De eekhoorn legt zijn noten in het mos.'];
    return null;
  }
}
