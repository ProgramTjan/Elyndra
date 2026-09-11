export const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
export function multiply(a,b){let out=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function translation(x,y,z){let m=[...IDENTITY];m[12]=x;m[13]=y;m[14]=z;return m;}
function rotation(a,axis){let c=Math.cos(a),s=Math.sin(a);return axis==='x'?[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]:axis==='z'?[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]:[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];}
function point(m,p){return [0,1,2].map(i=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]);}
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),scale=(a,s)=>a.map(v=>v*s);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>scale(a,1/(Math.hypot(...a)||1));
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
// Both bones retain their length. The knee bends in a preferred forward/backward plane.
export function solveLeg(hip,foot,bend,upper=.86,lower=.90){const delta=sub(foot,hip),raw=Math.hypot(...delta),distance=Math.max(.1,Math.min(upper+lower-.001,raw)),axis=norm(delta),end=add(hip,scale(axis,distance));let across=sub(bend,scale(axis,bend.reduce((s,v,i)=>s+v*axis[i],0)));across=norm(across);const along=(upper*upper-lower*lower+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,upper*upper-along*along));return {knee:add(add(hip,scale(axis,along)),scale(across,height)),foot:end,error:Math.abs(raw-distance)};}
function segment(a,b,forward){const y=norm(sub(a,b));let x=norm(cross(y,forward));if(Math.hypot(...x)<.5)x=[1,0,0];let z=cross(x,y);return [...x,0,...y,0,...z,0,...a,1];}
export class DeerMotion{
 constructor(ground){this.ground=ground;this.angle=0;this.walkTime=0;this.active=-1;this.order=[0,3,1,2];this.next=0;this.headYaw=0;this.headPitch=0;this.feet=[];this.hips=[[-.38,1.50,-.67],[.38,1.50,-.67],[-.38,1.50,.72],[.38,1.50,.72]];}
 update(dt,time,viewer,reduced=false){dt=Math.min(.05,Math.max(0,dt));const before=[-37+1.6*Math.sin(this.angle),-46+1.6*(1-Math.cos(this.angle))],near=Math.hypot(viewer[0]-before[0],viewer[2]-before[1]);const phase=time%24,moving=!reduced&&phase>8&&phase<16&&near>4;
 if(moving){this.angle+=dt*.105;this.walkTime+=dt;}const x=-37+1.6*Math.sin(this.angle),z=-46+1.6*(1-Math.cos(this.angle)),heading=-Math.PI/2-this.angle,y=this.ground(x,z),breath=reduced?0:Math.sin(time*1.7)*.018;
 const root=multiply(translation(x,y+breath,z),rotation(heading,'y')),forward=[-Math.sin(heading),0,-Math.cos(heading)];const desired=this.hips.map(h=>{let p=point(root,[h[0],0,h[2]]);p[1]=this.ground(p[0],p[2])+.10;return p;});
 if(!this.feet.length)this.feet=desired.map(p=>[...p]);
 if(!reduced&&this.active<0){for(let j=0;j<4;j++){let index=this.order[(this.next+j)%4],d=Math.hypot(this.feet[index][0]-desired[index][0],this.feet[index][2]-desired[index][2]);if(d>(moving?.17:.085)){this.active=index;this.next=(this.next+j+1)%4;this.step=0;this.from=[...this.feet[index]];this.to=add(desired[index],scale(forward,moving?.18:0));this.to[1]=this.ground(this.to[0],this.to[2])+.10;break;}}}
 if(this.active>=0){this.step+=dt/.62;let t=Math.min(1,this.step),e=smooth(t);this.feet[this.active]=this.from.map((v,i)=>v+(this.to[i]-v)*e+(i===1?Math.sin(t*Math.PI)*.17:0));if(t===1)this.active=-1;}
 const dx=viewer[0]-x,dz=viewer[2]-z,lx=Math.cos(heading)*dx-Math.sin(heading)*dz,lz=Math.sin(heading)*dx+Math.cos(heading)*dz;let target=near<10?Math.max(-.55,Math.min(.55,Math.atan2(-lx,-lz))):Math.sin(time*.24)*.15;
 if(reduced)target=0;this.headYaw+=(target-this.headYaw)*(1-Math.exp(-dt*2));const pitch=reduced?0:-.12-.16*(.5+.5*Math.sin(time*.35));this.headPitch+=(pitch-this.headPitch)*(1-Math.exp(-dt*1.8));
 const neck=multiply(root,multiply(translation(0,1.94,-.66),rotation(this.headPitch*.35,'x'))),head=multiply(neck,multiply(translation(0,.85,-.44),multiply(rotation(this.headYaw,'y'),rotation(this.headPitch,'x'))));let bones=[root,neck,head];
 for(let side of[-1,1]){const ear=reduced?0:Math.sin(time*2.3+side)*Math.pow(.5+.5*Math.sin(time*.7+side),6)*.24;bones.push(multiply(head,multiply(translation(side*.23,.24,-.04),rotation(side*(.55+ear),'z'))));}
 bones.push(multiply(root,multiply(translation(0,1.96,1.02),rotation(reduced?0:Math.sin(time*1.15)*.08,'x'))));
 let maxFootError=0;for(let i=0;i<4;i++){const hip=point(root,this.hips[i]),bend=scale(forward,i<2?1:-1),leg=solveLeg(hip,this.feet[i],bend);maxFootError=Math.max(maxFootError,leg.error);bones.push(segment(hip,leg.knee,forward),segment(leg.knee,leg.foot,forward),multiply(translation(...leg.foot),rotation(heading,'y')));}
 return {bones,position:[x,y,z],heading,moving,active:this.active,feet:this.feet.map(p=>[...p]),maxFootError};
 }
}
