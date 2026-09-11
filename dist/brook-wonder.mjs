// The encounter uses elapsed active time; looking around never breaks the spell.
export const BROOK = Object.freeze({x: 13.467, z: -8, water: -2.3});
const clamp = x => Math.max(0, Math.min(1, x));
export const ease = x => { x = clamp(x); return x*x*(3-2*x); };
const mix = (a,b,t) => a+(b-a)*t;

export class BrookWonder {
  constructor() {
    this.time=0; this.still=0; this.bloom=0; this.away=0;
    this.age=-1; this.visits=0; this.phase='far'; this.previous=null;
  }
  update(dt, viewer, enabled=true) {
    dt=Math.min(.05,Math.max(0,dt));
    if(!enabled){this.previous=[...viewer];return this.snapshot(viewer);}
    this.time+=dt;
    const distance=Math.hypot(viewer[0]-BROOK.x,viewer[2]-BROOK.z);
    const nearby=distance<29 && viewer[1]<14;
    const settled=distance<17 && viewer[1]<9;
    const speed=this.previous && dt>0 ? Math.hypot(viewer[0]-this.previous[0],viewer[2]-this.previous[2])/dt : 0;
    this.previous=[...viewer];
    this.away=nearby?0:this.away+dt;
    if(nearby && this.phase==='far'){this.phase='invitation';this.visits++;}
    if(this.age<0){
      this.still=settled && speed<.75 ? this.still+dt : Math.max(0,this.still-dt*.6);
      if(this.still>=6){this.age=0;this.phase='awakening';}
    }else{
      this.age+=dt;
      if(this.age>13)this.phase='constellation';
      if(this.age>28)this.phase='afterglow';
    }
    const target=nearby && this.age>=0 ? ease(this.age/13) : 0;
    this.bloom+=(target-this.bloom)*(1-Math.exp(-dt*.9));
    if(this.away>12){this.age=-1;this.still=0;this.phase='far';}
    return this.snapshot(viewer);
  }
  snapshot(viewer){
    const near=1-ease((Math.hypot(viewer[0]-BROOK.x,viewer[2]-BROOK.z)-15)/25);
    return {time:this.time,still:this.still,bloom:this.bloom,age:this.age,near,phase:this.phase,visits:this.visits};
  }
}

// World positions for an inviting swimmer, sparse spores, and a domed star field.
export function guidePosition(time, bloom, reduced=false){
  const t=reduced?0:time;
  return [BROOK.x-4.5+Math.sin(t*.23)*2.2*(1-bloom),BROOK.water+.16+(reduced?0:Math.sin(t*1.4)*.035),BROOK.z+5+Math.cos(t*.23)*3.6*(1-bloom)];
}
export function starPosition(i,time,bloom,reduced=false){
  const t=reduced?0:time, a=i*2.39996323;
  const r=2+((i*17)%101)/101*10;
  const loose=[BROOK.x+Math.cos(a)*r+Math.sin(t*.23+i)*.7,BROOK.water+.8+((i*13)%89)/89*6+Math.sin(t*.45+i)*.3,BROOK.z+Math.sin(a)*r];
  const dome=[BROOK.x+Math.cos(a)*r,6.4+Math.sqrt(Math.max(0,144-r*r))*.52,BROOK.z+Math.sin(a)*r];
  return reduced ? dome : loose.map((v,k)=>mix(v,dome[k],bloom));
}

// A bounded detour joins the dragon's existing flight continuously at both ends.
export function visitingFlight(age,normalPosition,reduced=false){
  if(reduced||age<4||age>58)return null;
  const t=age-4, a=t*.075+Math.PI*.65;
  const weight=ease(t/15)*(1-ease((t-38)/16));
  const local=[BROOK.x+Math.cos(a)*23,23+Math.sin(t*.13)*3,BROOK.z+Math.sin(a)*22];
  return local.map((v,k)=>mix(normalPosition[k],v,weight));
}

// One streamed point batch: soft glows with depth testing, no extra image downloads.
export function createBrookAtmosphere(gl, compileProgram, compact=false){
  const vertex=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 point;layout(location=1) in vec4 tint;
  uniform mat4 vp;uniform float pixels;out vec4 glow;
  void main(){gl_Position=vp*vec4(point,1.);gl_PointSize=clamp(tint.a*pixels/max(.2,gl_Position.w),1.,96.);glow=tint;}`;
  const fragment=`#version 300 es
  precision highp float;in vec4 glow;out vec4 color;
  void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;
  float halo=exp(-r*5.)*(1.-smoothstep(.65,1.,r));float core=exp(-r*65.);
  color=vec4(glow.rgb*(halo*.38+core*.95),1.);}`;
  const program=compileProgram(vertex,fragment),vao=gl.createVertexArray(),buffer=gl.createBuffer();
  const vp=gl.getUniformLocation(program,'vp'),pixels=gl.getUniformLocation(program,'pixels');
  const count=compact?100:180, data=new Float32Array((count+140)*7);
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,28,12);
  return function render(matrix,state,night,reduced,height){
    const companion=state.companion;
    if(Math.max(state.near,companion?.near??0,companion?.gardenNear??0)<.001)return;
    let used=0;
    function point(p,r,g,b,size){data.set([...p,r,g,b,size],used*7);used++;}
    const t=reduced?0:state.time;
    for(let i=0;i<count;i++){
      const p=starPosition(i,t,state.bloom,reduced);
      const pulse=reduced?1:.78+.22*Math.sin(t*.9+i*1.7);
      const strength=state.near*(.30+.70*state.bloom)*pulse;
      const gold=i%7===0;
      point(p,(gold?1:.33)*strength,(gold?.72:.85)*strength,(gold?.32:1)*strength,.28+(i%5)*.045);
    }
    // A low, unhurried ribbon traces the current and the swimmer's path.
    for(let i=0;i<34;i++){
      const z=BROOK.z-15+i*.85;
      const p=[BROOK.x+Math.sin(i*.24-t*.3)*3.2,BROOK.water+.12,z];
      const f=state.near*(.2+.5*state.bloom)*(reduced?.7:.5+.5*Math.sin(i*.6-t));
      point(p,.15*f,.65*f,.70*f,.22);
    }
    const guide=companion?.position??guidePosition(state.time,state.bloom,reduced),guideNear=companion?.near??state.near;
    const heading=state.guideHeading??0;
    point([guide[0]-Math.sin(heading)*.85,guide[1]+.75,guide[2]-Math.cos(heading)*.85],.95*guideNear,.75*guideNear,.26*guideNear,.48);
    if(companion){
      const garden=state.garden,near=companion.gardenNear,bloom=companion.bloom;
      for(const flower of state.flowers){
        const open=companion.discovered?ease((companion.gardenAge-flower.delay)/8):0;
        point([flower.x,flower.y+.88,flower.z],near*(.08+open*.7),near*(.12+open*.8),near*(.08+open*.36),.32+open*.18);
      }
      for(let i=0;i<45;i++){
        const a=i*2.399+t*.05,r=2+(i%11)*.72;
        const p=[garden.x+Math.cos(a)*r,2+(i%7)*.55+Math.sin(t*.25+i)*.15,garden.z+Math.sin(a)*r];
        point(p,.30*near*bloom,.66*near*bloom,.50*near*bloom,.20+(i%3)*.04);
      }
      for(const p of state.trail??[])point(p,.53*guideNear,.62*guideNear,.27*guideNear,.22);
    }
    gl.useProgram(program);gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,data.subarray(0,used*7));
    gl.uniformMatrix4fv(vp,false,matrix);gl.uniform1f(pixels,height);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);
    gl.drawArrays(gl.POINTS,0,used);
    gl.depthMask(true);gl.disable(gl.BLEND);
  };
}
