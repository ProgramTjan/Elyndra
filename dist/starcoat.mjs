import {IDENTITY,multiply} from './deer-motion.mjs?v=dragon22';
import {joint} from './wildlife-motion.mjs?v=dragon22';
import {REALM,inRealm,realmGround} from './realm.mjs?v=stars51';

// De sterrenvachten: de donkere, met sterren bespikkelde dieren die in de poortvisie
// aan het water drinken. Ze leven alleen achter de poort, aan de poel.
// Wie komt aanrennen, ziet hun koppen omhoog gaan. Wie stil blijft staan, mag blijven:
// ze drinken verder, en één van hen kijkt je aan.
export const STARCOAT_KEY='elyndra-starcoats-v1';
export const TRUST_SECONDS=6;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const grow=(m,s)=>multiply(m,[s,0,0,0,0,s,0,0,0,0,s,0,0,0,0,1]);
const headingTo=(from,to)=>Math.atan2(-(to[0]-from[0]),-(to[2]-from[2]));
const towards=(v,target,rate,dt)=>v+(target-v)*(1-Math.exp(-rate*dt));

// Drie dieren aan de waterlijn, elk met een eigen maat en tempo.
const HERD=[[2.35,1.3,0],[3.75,1.1,1.7],[5.3,1.42,3.1]];
export function herdPlaces(groundAt=realmGround){
  const px=REALM.x+REALM.pool[0],pz=REALM.z+REALM.pool[1];
  return HERD.map(([angle,size,phase])=>{
    // Loop vanuit het midden naar buiten tot de oever net boven het water uitkomt: daar staat ze.
    let r=5;while(r<REALM.poolRadius-.5&&groundAt(px+Math.cos(angle)*r,pz+Math.sin(angle)*r)<-2.05)r+=.2;r+=.9;
    const x=px+Math.cos(angle)*r,z=pz+Math.sin(angle)*r,position=[x,groundAt(x,z),z];
    return {position,heading:headingTo(position,[px,0,pz]),size,phase};
  });
}

export class Starcoats{
  constructor(groundAt=realmGround,storage){
    this.storage=storage;this.animals=herdPlaces(groundAt).map(a=>({...a,drink:1,alert:0,gaze:0}));
    this.still=0;this.trust=0;this.greeted=false;this.chosen=-1;this.time=0;this.met=false;
    try{this.met=storage?.getItem(STARCOAT_KEY)==='met';}catch{}
  }
  // Geeft 'greeting' terug op het moment dat een van hen je aankijkt; anders null.
  update(seconds,viewer,{moving=false,running=false,grounded=true}={}){
    if(!inRealm(viewer)){this.still=0;this.trust=0;this.greeted=false;this.chosen=-1;return null;}
    const dt=Math.min(.25,Math.max(0,seconds));this.time+=dt;
    const distances=this.animals.map(a=>Math.hypot(viewer[0]-a.position[0],viewer[2]-a.position[2])),nearest=Math.min(...distances),near=nearest<15;
    this.still=near&&grounded&&!moving?this.still+dt:0;
    this.trust=towards(this.trust,this.still>=TRUST_SECONDS?1:0,this.still>=TRUST_SECONDS?.8:2.5,dt);
    let event=null;
    if(this.still>=TRUST_SECONDS&&!this.greeted){this.greeted=true;this.chosen=distances.indexOf(nearest);event='greeting';
      if(!this.met){this.met=true;try{this.storage?.setItem(STARCOAT_KEY,'met');}catch{}}}
    if(!near)this.greeted=false,this.chosen=-1;
    for(const [i,a] of this.animals.entries()){
      const d=distances[i],startled=running&&nearest<22,wary=(moving&&d<13)||d<4.5||!grounded&&d<18;
      const alert=startled?1:wary?.75:0,rate=startled?9:alert>a.alert?4:.9;
      a.alert=towards(a.alert,this.trust>.6&&!startled?Math.min(alert,.15):alert,rate,dt);
      const sip=.5+.5*Math.sin(this.time*.35+a.phase); // af en toe heft ze de kop om te slikken
      a.drink=towards(a.drink,a.alert>.3?0:sip>.18?1:.25,a.alert>.3?5:1.4,dt);
      a.gaze=towards(a.gaze,i===this.chosen&&this.still<TRUST_SECONDS+7?1:a.alert,2.2,dt);
    }
    return event;
  }
  // Skeletten voor het tekenen: per dier [romp, hals, kop, staart].
  poses(viewer,clock,reduced=false){
    return this.animals.map(a=>{
      const t=reduced?0:clock+a.phase*3,breathe=reduced?0:Math.sin(t*1.3)*.012,chosen=a.gaze>a.alert+.2;
      const root=grow(joint(IDENTITY,[a.position[0],a.position[1]+1.06*a.size,a.position[2]],a.heading),a.size);
      const body=joint(root,[0,breathe,0],-a.drink*.07+a.alert*.03,'x');
      const lower=a.drink*(1-a.gaze*.9);
      let neck=joint(body,[0,.2,-.62],-lower*1.28+a.alert*.22+(reduced?0:Math.sin(t*5)*.015*lower),'x');
      const turn=clamp(Math.atan2(Math.sin(headingTo(a.position,viewer)-a.heading),Math.cos(headingTo(a.position,viewer)-a.heading)),-1.25,1.25)*a.gaze;
      neck=joint(neck,[0,0,0],turn*.45,'y');
      let head=joint(neck,[0,.62,-.3],turn*.55,'y');
      head=joint(head,[0,0,0],lower*.55-(chosen?.12:0),'x');
      const tail=joint(body,[0,.12,.74],reduced?0:Math.sin(t*1.7)*.22+Math.sin(t*7)*.06*a.alert,'y');
      return {bones:[body,neck,head,tail],position:a.position,heading:a.heading,size:a.size,alert:a.alert,drink:a.drink,gaze:a.gaze,trust:this.trust};
    });
  }
  snapshot(){return {still:this.still,trust:this.trust,greeted:this.greeted,chosen:this.chosen,met:this.met,animals:this.animals.map(a=>({alert:a.alert,drink:a.drink,gaze:a.gaze}))};}
}

// Eén mesh voor alle drie: nachtblauwe vacht, lange hals, en sterren die licht geven.
export function createStarcoatMesh({orb,cone,beam,curveTube,tri,ruff=()=>{},upload,material}){
  let seed=31337;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const bone=i=>material(i*10+50),coat=[.10,.15,.27],shade=[.06,.09,.17],belly=[.17,.23,.34],hoof=[.03,.035,.05],star=()=>rand()<.3?[1.5,1.35,.9]:[.62,1.5,1.65];
  const two=(a,b,c,col)=>{tri(a,b,c,col);tri(a,c,b,col);};
  const stars=(x,y,z,rx,ry,rz,count,top=1.9)=>{for(let i=0;i<count;i++){const a=rand()*top,b=rand()*Math.PI*2,s=.018+rand()*.03;orb(x+Math.sin(a)*Math.cos(b)*rx*1.01,y+Math.cos(a)*ry*1.01,z+Math.sin(a)*Math.sin(b)*rz*1.01,s,s,s,star(),5,3);}};
  bone(0);
  orb(0,0,0,.33,.36,.78,coat,22,12);orb(0,-.06,-.52,.27,.31,.3,coat,14,8);orb(0,.02,.52,.3,.33,.32,coat,14,8);orb(0,-.2,0,.25,.2,.6,belly,14,7);
  ruff(0,0,0,.33,.36,.78,150,.1,coat,{arc:[.4,2.4],sweep:[0,-.25,.9],width:.4,tip:[.18,.27,.44]});
  ruff(0,.02,0,.32,.37,.76,60,.13,shade,{arc:[0,.45],sweep:[0,.15,.9],width:.4});
  ruff(0,-.1,-.6,.24,.3,.22,70,.16,belly,{arc:[1.4,2.8],turn:[3.5,5.9],sweep:[0,-.8,.15]});
  stars(0,0,0,.33,.36,.78,76);
  for(const [side,front] of [[-1,1],[1,1],[-1,0],[1,0]]){const x=side*.19,z=front?-.5:.5;
    curveTube([[x,-.12,z],[x*1.02,-.5,z+(front?.02:.07)],[x,-.82,z+(front?-.01:-.02)],[x,-1.0,z]],[.1,.06,.045,.04],coat,8);
    orb(x,-.52,z+(front?.03:.07),.062,.07,.062,shade,8,5);orb(x,-1.02,z-.02,.055,.045,.075,hoof,8,5);
    ruff(x,-.9,z,.05,.07,.05,10,.07,coat,{arc:[1.2,2.4],sweep:[0,-.8,.2],width:.4});}
  bone(1);
  curveTube([[0,-.04,.06],[0,.2,-.08],[0,.44,-.2],[0,.64,-.3]],[.22,.17,.135,.115],coat,12);
  ruff(0,.3,-.13,.15,.36,.15,60,.12,shade,{arc:[.3,2.6],turn:[-.3,3.4],sweep:[0,-.5,.7],width:.4,tip:[.10,.16,.27]});
  ruff(0,.26,-.2,.15,.3,.13,40,.13,belly,{arc:[.6,2.5],turn:[3.6,5.8],sweep:[0,-.85,0]});
  stars(0,.3,-.13,.16,.34,.16,14,3);
  bone(2);
  orb(0,.04,-.1,.125,.115,.19,coat,16,9);orb(0,-.005,-.3,.075,.07,.15,coat,12,7);orb(0,-.03,-.42,.05,.04,.05,[.03,.03,.045],8,5);
  for(const side of[-1,1]){
    orb(side*.095,.07,-.17,.028,.03,.02,[.02,.025,.03],8,6);orb(side*.1,.078,-.176,.008,.008,.006,[1.4,1.6,1.7],5,3);
    two([side*.07,.12,-.02],[side*.2,.2,.03],[side*.12,.34,-.02],coat);two([side*.085,.14,-.03],[side*.17,.2,.01],[side*.125,.29,-.03],[.16,.2,.3]);
    // Twee korte, lichtende hoorntjes.
    curveTube([[side*.05,.13,-.1],[side*.075,.26,-.08],[side*.06,.36,-.02]],[.022,.016,.006],[.55,1.25,1.35],6);}
  stars(0,.04,-.1,.125,.115,.19,7,1.4);
  ruff(0,.04,-.1,.125,.115,.19,36,.06,coat,{arc:[0,1.5],turn:[-.3,3.4],sweep:[0,.2,.8],width:.4});
  bone(3);
  curveTube([[0,0,0],[0,-.1,.14],[0,-.36,.2],[0,-.62,.18]],[.05,.04,.03,.02],coat,7);
  ruff(0,-.5,.19,.05,.16,.05,34,.2,shade,{sweep:[0,-.9,.15],width:.35,tip:[.4,1.05,1.15]});
  orb(0,-.72,.18,.03,.04,.03,[.6,1.5,1.6],6,4);
  const mesh=upload();material(0);return mesh;
}
