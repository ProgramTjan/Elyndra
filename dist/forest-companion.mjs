import {BROOK,ease,guidePosition} from './brook-wonder.mjs?v=garden21';

export const GARDEN=Object.freeze({x:-9,z:-46});
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const pointAt=t=>{
  t=Math.max(0,Math.min(1,t));
  // First swim upstream, then climb the low western bank into the clearing.
  const z=-3-43*t, bank=ease((t-.65)/.35);
  return [13.467-4.5+(15+Math.sin(z*.012)*16-13.467)-bank*11.5,0,z];
};

export class ForestCompanion {
  constructor(ground,remembered=false){
    this.ground=ground;this.phase='resting';this.progress=0;this.timer=0;this.away=0;
    this.position=guidePosition(0,0,true);this.heading=0;this.bloom=remembered?1:0;
    this.discovered=remembered;this.gardenAge=remembered?20:0;this.wake=false;
  }
  height(x,z){return Math.max(BROOK.water+.12,this.ground(x,z)+.06);}
  restart(){this.phase='resting';this.progress=0;this.timer=0;this.away=0;}
  update(dt,viewer,wonder,enabled=true,reduced=false){
    dt=Math.max(0,Math.min(.05,dt));this.wake=false;
    if(!enabled)return this.snapshot(viewer);
    const gardenDistance=Math.hypot(viewer[0]-GARDEN.x,viewer[2]-GARDEN.z);
    const inGarden=gardenDistance<12 && Math.abs(viewer[1]-this.ground(viewer[0],viewer[2]))<9;
    const near=distance(viewer,this.position)<18 && Math.abs(viewer[1]-this.position[1])<9;
    this.away=near?0:this.away+dt;
    if(this.phase==='resting'){
      this.moveToward(guidePosition(wonder.time,wonder.bloom,reduced),dt,.9);
      if(wonder.age>36&&near){this.phase='inviting';this.timer=0;}
    }else if(this.phase==='inviting'){
      // A clear invitation with no countdown: moving closer accepts it.
      this.timer+=dt;
      if(distance(viewer,this.position)<5.2 && this.timer>2){this.phase='leading';this.timer=0;}
    }else if(this.phase==='leading'||this.phase==='waiting'){
      // Hysteresis prevents flickering between waiting and swimming.
      if(!near || distance(viewer,this.position)>12)this.phase='waiting';
      if(this.phase==='waiting' && near && distance(viewer,this.position)<8)this.phase='leading';
      if(this.phase==='leading'){
        this.progress=Math.min(1,this.progress+dt/35);
        const p=pointAt(this.progress);p[1]=this.height(p[0],p[2]);
        this.moveToward(p,dt,1.7);
        if(this.progress===1&&distance(this.position,p)<.3){this.phase='arrived';}
      }
    }else if(this.phase==='arrived'){
      const p=[GARDEN.x+2,this.height(GARDEN.x+2,GARDEN.z+1),GARDEN.z+1];
      this.moveToward(p,dt,.6);
    }
    // If the visitor leaves, swim home along the same path. Never teleport away.
    if(this.away>28&&this.phase!=='resting'&&this.phase!=='returning')this.phase='returning';
    if(this.phase==='returning'){
      this.progress=Math.max(0,this.progress-dt/30);
      const p=pointAt(this.progress);p[1]=this.height(p[0],p[2]);this.moveToward(p,dt,1.8);
      if(this.progress===0&&distance(this.position,p)<.3){this.phase='resting';this.away=0;}
      if(near&&distance(viewer,this.position)<7){this.phase='leading';this.away=0;}
    }
    // The garden can also be found independently; altitude alone cannot unlock it.
    if(inGarden){
      this.gardenAge+=dt;
      if(this.gardenAge>2&&!this.discovered){this.discovered=true;this.wake=true;}
    }
    const target=this.discovered?ease(this.gardenAge/14):0;
    this.bloom+=(target-this.bloom)*(1-Math.exp(-dt*.7));
    return this.snapshot(viewer);
  }
  moveToward(target,dt,speed){
    const dx=target[0]-this.position[0],dz=target[2]-this.position[2],d=Math.hypot(dx,dz);
    const step=Math.min(d,speed*dt);
    if(d>.00001){
      const desired=Math.atan2(-dx,-dz),delta=Math.atan2(Math.sin(desired-this.heading),Math.cos(desired-this.heading));
      this.heading+=delta*(1-Math.exp(-dt*3));
      this.position[0]+=dx/d*step;this.position[2]+=dz/d*step;
    }
    this.position[1]=this.height(this.position[0],this.position[2]);
  }
  snapshot(viewer){
    return {phase:this.phase,position:[...this.position],heading:this.heading,progress:this.progress,
      bloom:this.bloom,discovered:this.discovered,wake:this.wake,
      near:1-ease((distance(viewer,this.position)-15)/25),
      gardenNear:1-ease((Math.hypot(viewer[0]-GARDEN.x,viewer[2]-GARDEN.z)-16)/30),
      gardenAge:this.gardenAge};
  }
}

export function gardenFlower(i,ground){
  const a=i*2.39996323,r=2.4+Math.sqrt((i+.5)/34)*8.4;
  const x=GARDEN.x+Math.cos(a)*r,z=GARDEN.z+Math.sin(a)*r;
  return {x,z,y:Math.max(BROOK.water+.2,ground(x,z)),delay:r*.38,rotation:a};
}

export function companionTrail(progress,ground){
 return Array.from({length:18},(_,i)=>{
  const p=pointAt(Math.max(0,progress-i*.015));p[1]=Math.max(BROOK.water+.16,ground(p[0],p[2])+.18);return p;
 });
}
