import {MONUMENT,STUMPS} from './squirrel-secret.mjs?v=squirrel34';

// The same sculpture in warm fur and weathered stone. Seven joints keep the
// living squirrel's head, curled tail and paws attached during the journey.
export function createSquirrelSculptures({orb,cone,beam,curveTube,tri,upload,material}){
 const origins=[[0,0,0],[0,1.35,-.15],[0,.35,.3],[-.23,.85,-.12],[.23,.85,-.12],[-.24,.25,.18],[.24,.25,.18]];
 function sculpt(stone=false){
  const scale=stone?MONUMENT.scale:1;
  let part=0;
  const bone=i=>{part=i;material(stone?3:(i+5)*10);};
  const pt=p=>p.map((v,i)=>(v+(stone?origins[part][i]:0))*scale);
  const ball=(p,r,c,s=14,n=8)=>orb(...pt(p),...r.map(v=>v*scale),c,s,n);
  const tube=(ps,rs,c,n=10)=>curveTube(ps.map(pt),rs.map(v=>v*scale),c,n);
  const line=(a,b,r,c)=>beam(pt(a),pt(b),r*scale,c);
  const fur=stone?[.39,.43,.37]:[.48,.24,.10],light=stone?[.55,.57,.45]:[.72,.44,.22],dark=stone?[.18,.24,.20]:[.045,.055,.03];
  bone(0);ball([0,.65,.08],[.37,.62,.32],fur,20,12);ball([0,.82,-.18],[.27,.39,.13],light,18,10);
  ball([-.23,.25,.2],[.24,.25,.27],fur);ball([.23,.25,.2],[.24,.25,.27],fur);
  for(let j=0;j<6;j++)line([-.12+j*.05,.96,-.307],[-.10+j*.04,1.13,-.28],.012,light);
  bone(1);ball([0,0,0],[.34,.32,.31],fur,20,12);ball([0,-.12,-.24],[.23,.16,.21],light,16,10);
  ball([0,-.09,-.42],[.075,.055,.055],dark);line([-.08,-.2,-.395],[.08,-.2,-.395],.012,dark);
  for(const side of[-1,1]){
   ball([side*.22,.33,.015],[.12,.32,.09],fur);ball([side*.22,.35,-.053],[.055,.20,.032],light);
   line([side*.20,.5,.012],[side*.27,.71,.015],.024,fur);
   ball([side*.272,.055,-.18],[.085,.105,.061],dark,14,9);
   ball([side*.29,.087,-.229],[.023,.026,.016],stone?[.57,.61,.49]:[1.06,.97,.70],8,5);
   for(let j=0;j<3;j++)line([side*.14,-.13,-.31],[side*(.37+j*.025),-.14+j*.045,-.36],.006,light);
  }
  bone(2);const tail=[[0,0,0],[0,.25,.47],[0,.9,.77],[0,1.42,.54],[0,1.50,.16],[0,1.25,.05]];
  tube(tail,[.18,.30,.36,.30,.21,.075],fur,18);
  for(let side of[-1,1])for(let j=0;j<8;j++){
   const t=j/7;line([side*.16,.25+t*1.14,.5+Math.sin(t*Math.PI)*.2],[side*(.31-Math.abs(t-.5)*.12),.38+t*1.10,.59+Math.sin(t*Math.PI)*.18],.018,light);
  }
  for(let i=3;i<7;i++){
   bone(i);const side=i%2?-1:1;
   if(i<5){tube([[0,0,0],[-side*.05,-.16,-.22],[-side*.12,-.1,-.38]],[.095,.07,.075],fur);ball([-side*.12,-.1,-.38],[.09,.06,.12],light);}
   else{ball([0,-.15,-.10],[.14,.10,.29],fur);for(let j=0;j<3;j++)line([-.065+j*.065,-.19,-.29],[-.065+j*.065,-.19,-.39],.018,dark);}
  }
  // An acorn held importantly against the chest, like a royal orb.
  bone(0);ball([0,.8,-.48],[.14,.20,.14],stone?[.50,.45,.28]:[.64,.42,.15]);ball([0,.94,-.48],[.16,.085,.16],stone?[.27,.30,.22]:[.28,.22,.10]);line([0,1,-.48],[.015,1.10,-.46],.022,dark);
  if(stone){
   // A conspicuously oversized acorn crown and little carved leaf points.
   ball([0,2.12,-.10],[.25,.32,.25],[.56,.47,.26],20,12);
   ball([0,2.31,-.10],[.29,.12,.29],[.34,.36,.22],18,9);
   line([0,2.40,-.1],[.035,2.51,-.1],.035,[.40,.36,.20]);
   // Lichen islands and fine old cracks soften the stone without new textures.
   for(let j=0;j<15;j++){const a=j*2.399,y=.24+(j%5)*.21;ball([Math.cos(a)*.32,y,.1+Math.sin(a)*.28],[.055,.08,.022],[.20+j%3*.015,.31,.15],7,4);}
   tube([[-.17,.58,-.285],[-.13,.78,-.31],[-.19,.91,-.26]],[.008,.01,.006],[.17,.22,.18],5);
  }
  const result=upload();material(0);return result;
 }
 const squirrel=sculpt(),statue=sculpt(true);
 material(3);
 cone(0,-.2,0,3.5,3.5,.45,[.27,.31,.28],12);
 cone(0,.25,0,3.1,2.9,.35,[.42,.46,.39],12);
 cone(0,.60,0,2.8,2.6,.72,[.33,.38,.32],12);
 cone(0,1.32,0,3,3,.28,[.53,.55,.44],12);
 // Front plaque; its acorn relief echoes the crown.
 orb(0,.93,-2.68,.8,.30,.06,[.20,.27,.23],16,8);
 orb(0,.94,-2.76,.13,.18,.035,[.65,.57,.32],12,8);
 orb(0,1.04,-2.78,.16,.06,.035,[.50,.47,.27],12,6);
 const pedestal=upload();material(0);
 const covers=[];
 for(const side of[-1,1]){
  material(0);orb(side*1.9,2.7,0,2.7,3.5,3.6,[.11,.22,.095],18,12);
  for(let j=0;j<8;j++){
   const z=-2.9+j*.83,x=side*(.35+j%3*.55);
   material(5);curveTube([[x,0,z],[x+side*.5,2.8,z-.25],[side*2,5.3,z],[side*4.2,.15,z+.5]],[.24,.32,.20,.12],[.23,.17,.095],8);
   material(0);orb(side*(1.5+j%3*.45),3.7+(j%2)*.45,z,.65,.18,.42,[.20,.34,.12],8,5);
  }
  covers.push(upload());
 }
 material(3);orb(0,.14,0,.8,.35,.65,[.32,.38,.32],14,8);orb(0,.43,-.03,.19,.028,.23,[.08,.14,.12],10,5);const touchstone=upload();
 material(0);orb(0,0,0,.13,.18,.13,[.78,.52,.19],12,7);orb(0,.1,0,.16,.07,.16,[.34,.28,.12],12,7);beam([0,.14,0],[.02,.25,0],.023,[.46,.31,.12]);const acorn=upload();
 material(5);cone(0,0,0,.62,.48,.85,[.25,.17,.085],12);cone(0,.85,0,.48,.48,.035,[.55,.39,.19],12);const stump=upload();
 material(0);tri([-.24,0,0],[0,.07,-.1],[.24,0,0],[.53,.47,.17]);tri([.24,0,0],[0,.07,.1],[-.24,0,0],[.27,.38,.14]);const leaf=upload();
 material(0);return {squirrel,statue,pedestal,covers,touchstone,acorn,stump,leaf};
}
