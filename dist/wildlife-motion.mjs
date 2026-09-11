import {IDENTITY,multiply} from './deer-motion.mjs?v=water19';
export function translate(x,y,z){const m=[...IDENTITY];m[12]=x;m[13]=y;m[14]=z;return m;}
export function rotate(a,axis='y'){let c=Math.cos(a),s=Math.sin(a);return axis==='x'?[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]:axis==='z'?[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]:[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];}
export function joint(parent,position,angle=0,axis='y'){return multiply(parent,multiply(translate(...position),rotate(angle,axis)));}
export function packBones(bones){return new Float32Array([...bones,...Array.from({length:18-bones.length},()=>IDENTITY)].flat());}
export class BrookMotion{
 constructor(x,z,heading,phase,ground){Object.assign(this,{x,z,heading,phase,ground});this.look=0;this.interest=0;}
 update(dt,time,viewer,reduced=false){dt=Math.min(.05,Math.max(0,dt));const t=reduced?this.phase:time+this.phase,dx=viewer[0]-this.x,dz=viewer[2]-this.z,distance=Math.hypot(dx,dz),interest=reduced?0:Math.max(0,1-distance/12),lx=Math.cos(this.heading)*dx-Math.sin(this.heading)*dz,lz=Math.sin(this.heading)*dx+Math.cos(this.heading)*dz;
 const angle=Math.atan2(-lx,-lz),target=reduced?0:Math.max(-.65,Math.min(.65,angle))*interest+Math.sin(t*.43)*.11*(1-interest);this.look+=(target-this.look)*(1-Math.exp(-dt*2.2));this.interest+=(interest-this.interest)*(1-Math.exp(-dt*1.5));
 const root=joint(IDENTITY,[this.x,this.ground(this.x,this.z),this.z],this.heading),body=joint(root,[0,reduced?0:Math.sin(t*1.6)*.012,0]);const head=joint(body,[0,.73,-.64],this.look);let bones=[body,joint(head,[0,0,0],reduced?0:Math.sin(t*.8)*.04+this.interest*.09,'x')];let tail=body;
 for(let k=0;k<4;k++){tail=joint(tail,k===0?[0,.46,.67]:[0,0,k===1?.52:.46],reduced?0:Math.sin(t*1.15-k*.65)*(.09+k*.018)*(1-this.interest*.35));bones.push(tail);}
 bones.push(root);for(let side of[-1,1])bones.push(joint(bones[1],[side*.27,.02,-.05],side*(.10+(reduced?0:Math.sin(t*1.8+side)*.055)+this.interest*.10),'z'));
 return {bones,position:[this.x,this.ground(this.x,this.z),this.z],interest:this.interest,look:this.look};
 }
}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function dragonPose(time,reduced=false){const t=reduced?0:time,angle=t*.035,cycle=t%12,flapping=reduced?0:smooth(cycle/.8)*(1-smooth((cycle-4.2)/1.3));const stroke=Math.sin(t*2.4),wing=.10+flapping*(stroke*.50-.08),flex=flapping*Math.sin(t*2.4-.65)*.21;
 // Clear the tallest garden crowns, while keeping the established circular route.
 const position=[-96+Math.cos(angle)*34,80+Math.sin(t*.18)*2,-180+Math.sin(angle)*34],heading=Math.PI-angle,root=joint(joint(IDENTITY,position,heading),[0,0,0],reduced?0:-.10,'z'),body=joint(root,[0,0,0],reduced?0:Math.cos(t*.18)*.10,'x');
 let bones=[body,joint(body,[0,.10,-1.25],reduced?0:Math.sin(t*.32)*.06),null];bones[2]=joint(bones[1],[0,.28,-1.50],reduced?0:Math.sin(t*.4)*.035,'x');
 for(let side of[-1,1]){let shoulder=joint(body,[side*.48,.20,-.70],side*wing,'z');bones.push(shoulder,joint(shoulder,[side*2.4,.05,.35],side*flex,'z'));}
 let tail=joint(body,[0,-.05,1.30],reduced?0:Math.sin(t*.65)*.10);bones.push(tail);tail=joint(tail,[0,-.06,1.25],reduced?0:Math.sin(t*.65-.7)*.13);bones.push(tail);
 return {bones,position,heading,flapping,wing,flex};
}
