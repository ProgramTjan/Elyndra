import {ease} from './brook-wonder.mjs?v=dragon22';

export const DRAGON_REST=Object.freeze({x:-14,z:-40,heading:-1.862});
const lerp=(a,b,t)=>a+(b-a)*t;
const angle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
const cubic=(a,b,c,d,t)=>a.map((v,i)=>(1-t)**3*v+3*(1-t)**2*t*b[i]+3*(1-t)*t*t*c[i]+t**3*d[i]);

export class DragonEncounter {
  constructor(ground,remembered=false){
    this.ground=ground;this.phase='orbit';this.elapsed=0;this.away=0;this.calm=0;
    this.trust=remembered?.6:0;this.known=remembered;this.bow=0;this.look=0;this.previous=null;
    this.position=null;this.heading=DRAGON_REST.heading;this.settle=0;this.greeted=false;
  }
  update(dt,normal,viewer,garden,enabled=true,reduced=false){
    dt=Math.max(0,Math.min(.05,dt));this.greeted=false;
    if(!enabled){this.previous=[...viewer];return this.snapshot();}
    const foot=this.ground(DRAGON_REST.x,DRAGON_REST.z),target=[DRAGON_REST.x,foot+1.55,DRAGON_REST.z];
    const distance=Math.hypot(viewer[0]-target[0],viewer[2]-target[2]);
    const onGround=Math.abs(viewer[1]-this.ground(viewer[0],viewer[2]))<6;
    const nearby=distance<28&&onGround;
    const speed=this.previous&&dt>0?Math.hypot(viewer[0]-this.previous[0],viewer[2]-this.previous[2])/dt:0;
    this.previous=[...viewer];this.away=nearby?0:this.away+dt;
    if(this.phase==='orbit'){
      this.calm=garden.discovered&&garden.gardenAge>12&&nearby?this.calm+dt:0;
      if(this.calm>2){
        this.phase='approaching';this.elapsed=0;this.start=[...normal.position];this.startHeading=normal.heading;
        this.position=[...normal.position];this.heading=normal.heading;
      }
    }else if(this.phase==='approaching'){
      this.elapsed+=dt;const t=ease(this.elapsed/20);
      const a=this.start,b=[a[0],Math.max(a[1],65),a[2]+30],c=[target[0]+22,target[1]+32,target[2]+20];
      const p=cubic(a,b,c,target,t),next=cubic(a,b,c,target,Math.min(1,t+.001));
      const travelHeading=Math.atan2(-(next[0]-p[0]),-(next[2]-p[2]));
      this.position=p;
      this.heading=angle(angle(this.startHeading,travelHeading,ease(t/.18)),DRAGON_REST.heading,ease((t-.65)/.35));
      this.settle=ease((this.elapsed-16)/4);
      if(this.elapsed>=20){this.phase='resting';this.position=target;this.settle=1;this.elapsed=0;}
    }else if(this.phase==='resting'||this.phase==='greeting'){
      this.position=target;this.elapsed+=dt;
      const desired=Math.atan2(-(viewer[0]-target[0]),-(viewer[2]-target[2]));
      const relative=Math.atan2(Math.sin(desired-this.heading),Math.cos(desired-this.heading));
      const gentle=distance>2.6&&distance<10&&onGround&&Math.abs(relative)<1.35&&speed<8.5;
      this.trust=Math.max(0,Math.min(1,this.trust+dt*(gentle?.16:-.035)));
      const gaze=nearby?Math.max(-.65,Math.min(.65,relative)):0;
      this.look+=(gaze-this.look)*(1-Math.exp(-dt*1.8));
      const bowTarget=gentle?ease((this.trust-.3)/.7):0;
      this.bow+=(bowTarget-this.bow)*(1-Math.exp(-dt*.9));
      if(this.trust>.82&&gentle&&!this.known){this.known=true;this.greeted=true;}
      this.phase=this.bow>.45?'greeting':'resting';
      if(this.away>25){this.phase='departing';this.elapsed=0;this.departure=[...target];this.departHeading=this.heading;}
    }else if(this.phase==='departing'){
      this.elapsed+=dt;const t=ease(this.elapsed/22),a=this.departure;
      const b=[a[0]+20,a[1]+40,a[2]+12],c=[normal.position[0],Math.max(80,normal.position[1]+10),normal.position[2]+28];
      this.position=cubic(a,b,c,normal.position,t);
      const next=cubic(a,b,c,normal.position,Math.min(1,t+.001));
      const h=Math.atan2(-(next[0]-this.position[0]),-(next[2]-this.position[2]));
      this.heading=angle(angle(this.departHeading,h,ease(t/.15)),normal.heading,ease((t-.8)/.2));
      this.settle=1-ease(this.elapsed/4);this.bow*=Math.exp(-dt);this.look*=Math.exp(-dt);
      if(this.elapsed>=22){this.phase='orbit';this.position=null;this.calm=0;this.settle=0;}
    }
    return this.snapshot();
  }
  snapshot(){return {phase:this.phase,position:this.position?[...this.position]:null,heading:this.heading,
    settle:this.settle,look:this.look,bow:this.bow,known:this.known,greeted:this.greeted,trust:this.trust};}
}
