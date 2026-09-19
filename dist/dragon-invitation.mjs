// A visitor-led encounter. No camera control, inventory, score or required sound.
export const CLEARING = Object.freeze({x: -23, z: -16, radius: 7});
export const DRAGON_PATH = Object.freeze([[-14,-40],[-10,-32],[-13,-24],[-29,-20]]);
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => {x=clamp(x); return x*x*(3-2*x);};
const distance = (a,b) => Math.hypot(a[0]-b[0],a[2]-b[2]);
const mix = (a,b,t) => a.map((x,i)=>x+(b[i]-x)*t);
const angle = (a,b,t) => a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
const headingTo = (a,b) => Math.atan2(-(b[0]-a[0]),-(b[2]-a[2]));
const cubic = (a,b,c,d,t) => a.map((v,i)=>(1-t)**3*v+3*(1-t)**2*t*b[i]+3*(1-t)*t*t*c[i]+t**3*d[i]);

// Clear only this narrow flight corridor and glade; keep the procedural seed stable.
export function inDragonGlade(x,z) {
  if(Math.hypot(x-CLEARING.x,z-CLEARING.z)<CLEARING.radius+4)return true;
  return DRAGON_PATH.slice(1).some((b,i)=>{
    const a=DRAGON_PATH[i],dx=b[0]-a[0],dz=b[1]-a[1];
    const t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));
    return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<4.5;
  });
}

export class DragonInvitation {
  constructor(ground) {
    this.ground=ground;this.phase='idle';this.time=0;this.elapsed=0;this.away=0;
    this.pose=null;this.flowers=[];this.breath=0;this.breathTarget=null;
    this.spark=null;this.sparkAge=30;this.completed=false;this.released=false;this.departedPose=null;
    this.lastStep=null;this.cooldown=0;
  }
  canInvite(encounter,viewer) {
    return this.phase==='idle'&&this.cooldown===0&&encounter.known&&encounter.trust>.75&&encounter.bow>.45&&
      ['resting','greeting'].includes(encounter.phase)&&encounter.position&&
      distance(viewer,encounter.position)>2.6&&distance(viewer,encounter.position)<10&&
      Math.abs(viewer[1]-this.ground(viewer[0],viewer[2]))<6;
  }
  invite(encounter,viewer) {
    if(!this.canInvite(encounter,viewer))return false;
    this.pose={...encounter,position:[...encounter.position]};this.start=[...this.pose.position];
    this.phase='accepting';this.elapsed=0;this.away=0;this.flowers=[];this.lastStep=null;
    this.breath=0;this.completed=false;this.spark=null;this.sparkAge=30;this.released=false;
    return true;
  }
  finish() {
    if(this.phase!=='weaving'||this.elapsed<8)return false;
    this.phase='farewell';this.elapsed=0;this.completed=true;this.farewellStart=[...this.pose.position];
    this.farewellTarget=null;return true;
  }
  depart() {
    this.phase='departing';this.elapsed=0;this.departedPose={...this.pose,position:[...this.pose.position]};
  }
  move(target,dt,speed=2.3) {
    const d=Math.hypot(...target.map((v,i)=>v-this.pose.position[i]));
    this.pose.position=mix(this.pose.position,target,d>0?Math.min(1,speed*dt/d):1);
  }
  update(dt,viewer,normal,enabled=true,reduced=false) {
    this.released=false;
    if(!enabled)return this.snapshot();
    dt=Math.max(0,Math.min(.05,dt));this.time+=dt;this.elapsed+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
    if(this.spark){
      this.sparkAge+=dt;
      const target=[viewer[0]+1.25,viewer[1]-.35,viewer[2]-1.1];
      this.spark=mix(this.spark,target,1-Math.exp(-dt*1.6));
      if(this.sparkAge>18)this.spark=null;
    }
    for(const f of this.flowers)f.age+=dt;
    if(this.phase==='idle')return this.snapshot();
    const p=this.pose.position,d=distance(viewer,p);
    const onFoot=Math.abs(viewer[1]-this.ground(viewer[0],viewer[2]))<6;
    this.away=d>32||!onFoot?this.away+dt:0;
    if(this.away>12&&this.phase!=='departing'){this.completed=false;this.depart();}
    const facing=headingTo(p,viewer),relative=Math.atan2(Math.sin(facing-this.pose.heading),Math.cos(facing-this.pose.heading));
    this.pose.look+=(Math.max(-.8,Math.min(.8,relative))-this.pose.look)*(1-Math.exp(-dt*2));
    if(this.phase==='accepting') {
      this.pose.bow+=(1-this.pose.bow)*(1-Math.exp(-dt*2));
      if(this.elapsed>=3){this.phase='takingoff';this.elapsed=0;this.start=[...p];}
    } else if(this.phase==='takingoff') {
      const t=ease(this.elapsed/5),[x,z]=DRAGON_PATH[1];
      this.pose.position=mix(this.start,[x,this.ground(x,z)+6,z],t);
      this.pose.heading=angle(this.pose.heading,headingTo(this.start,[x,0,z]),1-Math.exp(-dt));
      this.pose.settle=1-t;this.pose.bow=1-t;
      if(this.elapsed>=5){this.phase='leading';this.elapsed=0;this.waypoint=2;}
    } else if(this.phase==='leading'||this.phase==='waiting') {
      if(this.phase==='leading'&&(d>14||!onFoot)) {this.phase='waiting';this.waitAnchor=[...p];this.elapsed=0;}
      if(this.phase==='waiting'&&d<9&&onFoot) {this.phase='leading';this.elapsed=0;}
      if(this.phase==='leading') {
        const [x,z]=DRAGON_PATH[this.waypoint],target=[x,this.ground(x,z)+6,z];
        this.pose.heading=angle(this.pose.heading,headingTo(p,target),1-Math.exp(-dt*1.6));
        this.move(target,dt);
        if(Math.hypot(...target.map((v,i)=>v-this.pose.position[i]))<.15) {
          if(this.waypoint<DRAGON_PATH.length-1)this.waypoint++;
          else {this.phase='awakening';this.elapsed=0;this.start=[...this.pose.position];}
        }
      } else {
        const t=reduced?0:this.elapsed*.45,r=reduced?0:1.1*ease(this.elapsed/3);
        this.move([this.waitAnchor[0]+Math.sin(t)*r,this.waitAnchor[1],this.waitAnchor[2]+(Math.cos(t)-1)*r],dt,1.2);
        this.pose.heading=angle(this.pose.heading,facing,1-Math.exp(-dt*.7));
      }
    } else if(this.phase==='awakening') {
      const [x,z]=DRAGON_PATH.at(-1),t=ease(this.elapsed/6);
      this.pose.position=mix(this.start,[x,this.ground(x,z)+1.55,z],t);
      this.pose.heading=angle(this.pose.heading,headingTo(p,[CLEARING.x,0,CLEARING.z]),1-Math.exp(-dt));
      this.pose.settle=t;this.pose.bow=t*.35;
      if(this.elapsed>=6){this.phase='weaving';this.elapsed=0;}
    } else if(this.phase==='weaving') {
      const inGlade=Math.hypot(viewer[0]-CLEARING.x,viewer[2]-CLEARING.z)<CLEARING.radius&&onFoot;
      this.pose.heading=angle(this.pose.heading,facing,1-Math.exp(-dt*.65));
      this.pose.bow+=(.65-this.pose.bow)*(1-Math.exp(-dt));
      if(inGlade) {
        const target=[viewer[0],this.ground(viewer[0],viewer[2])+.7,viewer[2]];
        this.breathTarget=this.breathTarget?mix(this.breathTarget,target,1-Math.exp(-dt*2)):target;
        if(!this.lastStep||distance(viewer,this.lastStep)>1.6) {
          // Crossing a previous line brightens the scene without piling up meshes.
          if(this.flowers.length<24&&!this.flowers.some(f=>Math.hypot(f.x-viewer[0],f.z-viewer[2])<1.35)) {
            this.flowers.push({x:viewer[0],z:viewer[2],y:this.ground(viewer[0],viewer[2]),age:0});
          }
          this.lastStep=[...viewer];
        }
      }
      this.breath+=((inGlade?1:0)-this.breath)*(1-Math.exp(-dt));
    } else if(this.phase==='farewell') {
      this.breath*=Math.exp(-dt);
      if(!this.farewellTarget) {
        // Stop beside the visitor, keeping the body and snout out of their camera.
        const a=headingTo(this.farewellStart,viewer)+.42;
        const x=viewer[0]+Math.sin(a)*4.1,z=viewer[2]+Math.cos(a)*4.1;
        this.farewellTarget=[x,this.ground(x,z)+1.55,z];
      }
      this.pose.position=mix(this.farewellStart,this.farewellTarget,ease(this.elapsed/4));
      this.pose.heading=angle(this.pose.heading,facing,1-Math.exp(-dt));
      this.pose.bow=ease(this.elapsed/3);this.pose.look+=reduced?0:Math.sin(this.elapsed*.6)*dt*.12;
      if(this.elapsed>=7) {
        this.spark=[...this.breathTarget??this.pose.position];this.spark[1]+=1;this.sparkAge=0;this.depart();
      }
    } else if(this.phase==='departing') {
      const a=this.departedPose.position,t=ease(this.elapsed/20),end=normal.position;
      this.pose.position=cubic(a,[a[0],a[1]+25,a[2]],[end[0],Math.max(70,end[1]+12),end[2]+12],end,t);
      const next=cubic(a,[a[0],a[1]+25,a[2]],[end[0],Math.max(70,end[1]+12),end[2]+12],end,Math.min(1,t+.002));
      const travel=headingTo(this.pose.position,next);
      this.pose.heading=angle(angle(this.departedPose.heading,travel,ease(this.elapsed/4)),normal.heading,ease((t-.75)/.25));
      this.pose.settle=1-ease(this.elapsed/4);this.pose.bow*=Math.exp(-dt);this.pose.look*=Math.exp(-dt);this.breath*=Math.exp(-dt);
      if(this.elapsed>=20) {this.phase='idle';this.pose=null;this.flowers=[];this.released=true;this.cooldown=5;}
    }
    return this.snapshot();
  }
  snapshot() {
    const fade=this.phase==='departing'?1-ease(this.elapsed/16):1;
    return {phase:this.phase,active:this.phase!=='idle',elapsed:this.elapsed,time:this.time,
      pose:this.pose?{...this.pose,position:[...this.pose.position]}:null,
      flowers:this.flowers.map(f=>({...f,bloom:ease(f.age/2)*fade})),breath:this.breath,
      breathTarget:this.breathTarget?[...this.breathTarget]:null,spark:this.spark?[...this.spark]:null,
      sparkGlow:this.spark?1-ease((this.sparkAge-12)/6):0,completed:this.completed,released:this.released,
      canFinish:this.phase==='weaving'&&this.elapsed>=8};
  }
}

// One bounded particle buffer: breath, connected stars, and the farewell light.
export function createInvitationGlow(gl,compileProgram,compact=false) {
  const program=compileProgram(`#version 300 es
precision highp float;
layout(location=0) in vec3 point;layout(location=1) in vec4 tint;
uniform mat4 vp;uniform float pixels;out vec4 glow;
void main(){gl_Position=vp*vec4(point,1.);gl_PointSize=clamp(tint.a*pixels/max(.2,gl_Position.w),1.,42.);glow=tint;}`,
`#version 300 es
precision highp float;in vec4 glow;out vec4 color;
void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;
float light=exp(-r*5.)*(1.-smoothstep(.6,1.,r));color=vec4(glow.rgb*light,1.);}`);
  const vao=gl.createVertexArray(),buffer=gl.createBuffer(),data=new Float32Array(1100*7);
  const vp=gl.getUniformLocation(program,'vp'),pixels=gl.getUniformLocation(program,'pixels');
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,28,12);
  return (matrix,state,mouth,ground,reduced,height)=>{
    if(!state.active&&!state.spark)return;
    let used=0;
    const add=(p,c,size)=>{if(used<1100)data.set([...p,...c,size],used++*7);};
    const t=reduced?0:state.time;
    if(state.breath>.01&&state.breathTarget&&mouth) {
      const n=compact?70:140;
      for(let i=0;i<n;i++) {
        const u=reduced?(i+.5)/n:(i/n+t*.32)%1,a=i*2.399+t*.7,r=Math.sin(u*Math.PI)*(.12+u*.7);
        const p=mix(mouth,state.breathTarget,u);p[0]+=Math.cos(a)*r;p[1]+=Math.sin(u*Math.PI)*1.6+Math.sin(a)*r;p[2]+=Math.sin(a)*r;
        add(p,[.8*state.breath,.65*state.breath,.28*state.breath],.12+u*.18);
      }
    }
    const fs=state.flowers;
    fs.forEach((f,i)=>{
      if(f.bloom<.01)return;
      add([f.x,f.y+.95,f.z],[.7*f.bloom,.95*f.bloom,.8*f.bloom],.48);
      if(i) {
        const a=fs[i-1],n=compact?9:17,strength=Math.min(a.bloom,f.bloom);
        for(let j=1;j<n;j++) {const u=j/n,x=a.x+(f.x-a.x)*u,z=a.z+(f.z-a.z)*u;
          add([x,ground(x,z)+.3,z],[.30*strength,.62*strength,.55*strength],.075);
        }
      }
    });
    if(state.phase==='awakening'||state.phase==='weaving') {
      const strength=state.phase==='awakening'?ease(state.elapsed/6):1;
      for(let i=0;i<(compact?22:44);i++) {
        const a=i*2.399,r=1.5+Math.sqrt((i%22)/22)*4.5,x=CLEARING.x+Math.cos(a)*r,z=CLEARING.z+Math.sin(a)*r;
        add([x,ground(x,z)+.5+(reduced?(i%4)*.3:(i*.37+t*.15)%2.5),z],[.18*strength,.32*strength,.28*strength],.13);
      }
    }
    if(state.spark) {add(state.spark,[1.1*state.sparkGlow,.85*state.sparkGlow,.4*state.sparkGlow],.45);}
    gl.useProgram(program);gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,data.subarray(0,used*7));gl.uniformMatrix4fv(vp,false,matrix);gl.uniform1f(pixels,height);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.drawArrays(gl.POINTS,0,used);
    gl.depthMask(true);gl.disable(gl.BLEND);
  };
}
