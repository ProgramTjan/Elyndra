export const MIRROR=Object.freeze({x:23,z:135,rx:14,rz:19,water:-2.28,shoreX:9,alignZ:139});
const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export function lakeGround(x,z,original){const r=Math.hypot((x-MIRROR.x)/MIRROR.rx,(z-MIRROR.z)/MIRROR.rz);return original+(-5-original)*ease((1-r)/.38);}
export class DeerMirror{
 constructor(ground){this.ground=ground;this.phase='drinking';this.elapsed=0;this.time=0;this.still=0;this.previous=null;this.away=0;this.alignment=0;this.hold=0;this.bloom=0;this.open=0;this.fade=1;this.x=11;this.z=135;this.completed=false;this.reed=0;}
 canAccept(viewer){return this.phase==='invitation'&&this.near(viewer);}
 near(v){return Math.hypot(v[0]-11,v[2]-135)<19&&Math.abs(v[1]-this.ground(v[0],v[2]))<6;}
 accept(viewer){if(!this.canAccept(viewer))return false;this.phase='entering';this.elapsed=0;return true;}
 update(dt,v,enabled=true){
  if(!enabled){this.previous=[...v];return this.snapshot(v);}
  dt=Math.max(0,Math.min(.05,dt));this.time+=dt;this.elapsed+=dt;
  const near=this.near(v),speed=this.previous&&dt?Math.hypot(v[0]-this.previous[0],v[2]-this.previous[2])/dt:0;this.previous=[...v];
  this.away=near?0:this.away+dt;
  if(this.phase==='drinking'){
   this.still=near&&speed<1?this.still+dt:Math.max(0,this.still-dt);
   this.bloom=ease(this.still/4);
   if(this.still>6){this.phase='invitation';this.elapsed=0;}
  }else if(this.phase==='entering'){
   const t=ease(this.elapsed/8);this.x=11+t*9;this.fade=1-ease((this.elapsed-3)/5);
   if(this.elapsed>=8){this.phase='searching';this.elapsed=0;this.fade=0;}
  }else if(this.phase==='searching'){
   // A broad reachable patch of bank, not a pixel-perfect camera puzzle.
   const target=near&&v[0]>5&&v[0]<13?1-ease(Math.hypot((v[0]-MIRROR.shoreX)/5,(v[2]-MIRROR.alignZ)/7)):0;
   this.alignment+=(target-this.alignment)*(1-Math.exp(-dt*3));
   this.hold=target>.90?this.hold+dt:Math.max(0,this.hold-dt*.7);
   if(this.hold>2.5){this.phase='opening';this.elapsed=0;}
  }else if(this.phase==='opening'){
   this.open=ease(this.elapsed/8);
   if(this.elapsed>9){this.phase='beyond';this.elapsed=0;this.completed=true;}
  }else if(this.phase==='beyond'){
   this.open=1;if(this.elapsed>15){this.phase='returning';this.elapsed=0;this.reed=1;}
  }else if(this.phase==='returning'){
   const t=ease(this.elapsed/7);this.x=11;this.z=145-10*t;this.fade=ease(this.elapsed/4);this.open*=Math.exp(-dt*.3);
   if(this.elapsed>7){this.phase='farewell';this.elapsed=0;this.fade=1;}
  }else if(this.phase==='farewell'){
   this.bloom=Math.max(0,1-this.elapsed/8);this.open*=Math.exp(-dt);
   if(this.elapsed>18){this.phase='rest';this.elapsed=0;}
  }else if(this.phase==='rest'&&this.away>12){this.reset();}
  if(this.away>20&&!['drinking','rest','returning','farewell'].includes(this.phase)){
   if(this.fade<1){this.phase='returning';this.elapsed=0;}else this.reset();
  }
  return this.snapshot(v);
 }
 reset(){this.phase='drinking';this.elapsed=0;this.still=0;this.hold=0;this.open=0;this.bloom=0;this.fade=1;this.x=11;this.z=135;this.alignment=0;this.reed=0;}
 snapshot(v=[0,0,0]){return {phase:this.phase,time:this.time,elapsed:this.elapsed,near:this.near(v),canAccept:this.canAccept(v),bloom:this.bloom,open:this.open,fade:this.fade,alignment:this.alignment,completed:this.completed,
  actor:{x:this.x,z:this.z,heading:this.phase==='returning'?0:-Math.PI/2,drinking:this.phase==='drinking'||this.phase==='invitation',moving:this.phase==='entering'||this.phase==='returning'},
  reflection:{x:17,z:['searching','opening','beyond'].includes(this.phase)?135+(v[2]-139)*.32:135,heading:-Math.PI/2,drinking:false,stillHead:['searching','opening','beyond'].includes(this.phase)},
  petal:this.phase==='farewell'?1-ease((this.elapsed-5)/4):0};}
}

// Projecting the reflected antler centre onto the water makes the moon alignment
// genuinely depend on where the visitor stands. Its target is fixed at the
// reflection's appearance from the successful position on the bank.
export function surfacePoint(eye,p){const t=(MIRROR.water-eye[1])/(p[1]-eye[1]);return eye.map((v,i)=>v+(p[i]-v)*t);}
export function createMirrorRenderer(gl,compile){
 const vertex=`#version 300 es
 precision highp float;layout(location=0)in vec3 a;layout(location=2)in vec3 c;layout(location=3)in float material;
 uniform mat4 vp;uniform mat4 animalBones[18];uniform float water;uniform float reflected;out vec3 P;out vec3 C;
 void main(){int bone=int(clamp(floor(material/10.)-5.,0.,17.));vec3 p=reflected>.5?(animalBones[bone]*vec4(a,1.)).xyz:a;
 if(reflected>.5)p.y=2.*water-p.y;P=p;C=c;gl_Position=vp*vec4(p,1.);}`;
 const fragment=`#version 300 es
 precision highp float;in vec3 P;in vec3 C;out vec4 color;
 uniform vec3 eye;uniform vec3 moon;uniform float water;uniform float reflected;uniform float time;uniform float opening;uniform float bloom;
 float line(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}
 void main(){if(eye.y<=water)discard;float t=(water-eye.y)/(P.y-eye.y);vec3 q=mix(eye,P,t);
 vec2 uv=(q.xz-vec2(23.,135.))/vec2(14.,19.);float edge=1.-smoothstep(.82,1.,length(uv));if(edge<=0.)discard;
 if(reflected>.5){color=vec4(mix(vec3(.10,.28,.32),C*.72,.7)+C*bloom*.12,edge*.82*(C.r>1.?bloom:1.));return;}
 vec2 p=q.xz;vec3 col=vec3(.018,.065,.10);float moonLight=1.-smoothstep(.36,.60,length(p-moon.xz));
 col+=vec3(.85,.88,.67)*moonLight;
 // A submerged forest with depth bands and slowly passing, gentle silhouettes.
 vec2 f=vec2((p.y-135.)*.13,(p.x-10.)*.14);
 for(int i=0;i<11;i++){float fi=float(i),x=-2.8+fi*.55;float trunk=1.-smoothstep(.025,.07,abs(f.x-x-.05*sin(f.y*1.4+fi)));
 float branch=1.-smoothstep(.02,.06,line(f,vec2(x,.7),vec2(x+sin(fi)*.6,1.7+mod(fi,3.)*.3)));
 col+=vec3(.018,.065,.075)*max(trunk,branch)*opening;}
 for(int i=0;i<3;i++){float fi=float(i),x=sin(time*.045+fi*2.1)*1.5,y=1.+fi*.35;
 vec2 b=(f-vec2(x,y))/vec2(.45,.17);float body=1.-smoothstep(.8,1.,length(b));
 float head=1.-smoothstep(.09,.15,length(f-vec2(x-.36,y+.15)));
 float legs=0.;for(int j=0;j<4;j++){float foot=x-.28+float(j)*.17;legs=max(legs,1.-smoothstep(.016,.04,line(f,vec2(foot,y),vec2(foot+.02*sin(time*.3+float(j)),y-.34))));}
 col=mix(col,vec3(.055,.16,.19),max(body,max(head,legs))*opening*.9);}
 for(int i=0;i<38;i++){float fi=float(i),a=fi*2.399,r=sqrt((fi+.5)/38.);vec2 star=vec2(23.+cos(a)*r*11.,135.+sin(a)*r*15.);
 float light=exp(-length(p-star)*25.);col+=vec3(.34,.68,.75)*light*opening;}
 col+=vec3(.07,.20,.22)*opening*(.5+.5*sin(p.x*.5+p.y*.15));
 color=vec4(col,edge*max(moonLight*.9,.24+opening*.67));}`;
 const program=compile(vertex,fragment),U={};for(const n of ['vp','animalBones[0]','water','reflected','eye','moon','time','opening','bloom'])U[n]=gl.getUniformLocation(program,n);
 return (matrix,eye,state,bones,stag,blossoms,pool,moon,reduced)=>{
  if(!state.near&&state.open<.01)return;
  gl.useProgram(program);gl.uniformMatrix4fv(U.vp,false,matrix);gl.uniformMatrix4fv(U['animalBones[0]'],false,new Float32Array(bones.flat()));
  gl.uniform3fv(U.eye,eye);gl.uniform3fv(U.moon,moon);gl.uniform1f(U.water,MIRROR.water);gl.uniform1f(U.time,reduced?0:state.time);gl.uniform1f(U.opening,state.open);gl.uniform1f(U.bloom,state.bloom);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  gl.uniform1f(U.reflected,0);gl.bindVertexArray(pool.vao);gl.drawArrays(gl.TRIANGLES,0,pool.count);
  // Reflected geometry lies below the bed; clip to the visible water footprint.
  gl.disable(gl.DEPTH_TEST);gl.uniform1f(U.reflected,1);gl.bindVertexArray(stag.vao);gl.drawArrays(gl.TRIANGLES,0,stag.count);
  if(state.bloom>.05){gl.bindVertexArray(blossoms.vao);gl.drawArrays(gl.TRIANGLES,0,blossoms.count);}
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);
 };
}
