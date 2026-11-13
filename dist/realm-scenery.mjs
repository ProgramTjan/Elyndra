import {REALM,FRUITS,realmGround} from './realm.mjs?v=stars51';

// Het landschap achter de poort. Eigen toevalsreeks: de vallei verschuift er niet door.
export function createRealm({orb,cone,beam,curveTube,tri,upload,material},{mobile=false,water=-2.3}={}){
  let seed=60221;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647,TAU=Math.PI*2;
  const X=REALM.x,Z=REALM.z,g=(lx,lz)=>realmGround(X+lx,Z+lz),colliders=[];
  const two=(a,b,c,col)=>{tri(a,b,c,col);tri(a,c,b,col);};
  // Vloeiende bochten: een kwadratische kromme door drie punten, en een zachte lijn door meer punten.
  const bend=(a,b,c,n=7)=>Array.from({length:n},(_,i)=>{const t=i/(n-1);return a.map((v,k)=>(1-t)*(1-t)*v+2*(1-t)*t*b[k]+t*t*c[k]);});
  const taper=(from,to,n)=>Array.from({length:n},(_,i)=>from+(to-from)*(i/(n-1)));
  const flow=(pts,n=14)=>Array.from({length:n},(_,i)=>{const u=i/(n-1)*(pts.length-1),k=Math.min(pts.length-2,Math.floor(u)),t=u-k,e=t*t*(3-2*t);return pts[k].map((v,q)=>v+(pts[k+1][q]-v)*e);});
  const clear=(lx,lz)=>Math.hypot(lx,lz)>24&&Math.hypot(lx-REALM.pool[0],lz-REALM.pool[1])>REALM.poolRadius+3&&!(Math.abs(lx)<5.5&&lz>12&&lz<82);

  // Grond: een schijf in de mist.
  material(1);const step=mobile?5:3.5,edge=150;
  for(let lx=-edge;lx<edge;lx+=step)for(let lz=-edge;lz<edge;lz+=step){
    const a=[X+lx,g(lx,lz),Z+lz],b=[X+lx+step,g(lx+step,lz),Z+lz],c=[X+lx+step,g(lx+step,lz+step),Z+lz+step],d=[X+lx,g(lx,lz+step),Z+lz+step],col=[.09,.19,.12];
    tri(a,c,b,col);tri(a,d,c,col);
  }
  // Stapstenen van de boog naar de boom, en keien langs de poel.
  material(3);
  for(let i=0;i<15;i++){const lz=64-i*3.4,lx=Math.sin(i*1.3)*1.1;orb(X+lx,g(lx,lz)+.02,Z+lz,1.0+rand()*.4,.16,.8+rand()*.3,[.44,.50,.47].map(v=>v*(.9+rand()*.2)),10,5);}
  for(let i=0;i<26;i++){const a=rand()*TAU,r=REALM.poolRadius-1.5+rand()*4,lx=REALM.pool[0]+Math.cos(a)*r,lz=REALM.pool[1]+Math.sin(a)*r,s=.4+rand()*1.1;orb(X+lx,g(lx,lz)+s*.12,Z+lz,s,s*.55,s*.85,[.36,.42,.40].map(v=>v*(.85+rand()*.3)),10,6);}
  const ground=upload();

  // De poel: stil water dat de lucht spiegelt.
  material(4);const rings=mobile?10:18,pr=REALM.poolRadius+2,px=X+REALM.pool[0],pz=Z+REALM.pool[1];
  for(let i=0;i<rings;i++){const a=i*TAU/rings,b=(i+1)*TAU/rings;tri([px,water,pz],[px+Math.cos(b)*pr,water,pz+Math.sin(b)*pr],[px+Math.cos(a)*pr,water,pz+Math.sin(a)*pr],[.55,0,0]);}
  // De lichtbron in het midden: een lichtende schijf net boven het water.
  material(0);orb(px,water+.04,pz,2.2,.05,2.2,[.55,1.5,1.35],16,4);orb(px,water+.08,pz,1.0,.06,1.0,[1.2,1.75,1.6],12,4);
  const pool=upload();

  // De Herinneringsboom: zilveren stam, brede wortels, een kroon van bleek en lichtend blad.
  const bark=[.50,.57,.55],base=g(0,0);
  material(5);
  {const spine=flow([[X,base-1,Z],[X+.6,base+8,Z-.3],[X-.5,base+17,Z+.5],[X+.3,base+26,Z],[X,base+33,Z-.4]],14);curveTube(spine,spine.map((_,i)=>{const t=i/13;return 5.2*Math.pow(1-t,1.6)+1.15+.9*Math.exp(-t*9);}),bark,mobile?12:18);}
  colliders.push({x:X,z:Z,r:4.4,h:34});
  for(let i=0;i<9;i++){const a=i*TAU/9+.2,len=9+rand()*6,ex=Math.cos(a)*len,ez=Math.sin(a)*len;
    curveTube(bend([X+Math.cos(a)*2.4,base+3.2,Z+Math.sin(a)*2.4],[X+Math.cos(a)*len*.45,base+2.4,Z+Math.sin(a)*len*.45],[X+ex,g(ex,ez)-.5,Z+ez]),taper(1.6,.3,7),bark.map(v=>v*.92),8);}
  const tips=[];
  for(let i=0;i<11;i++){const a=i*TAU/11+rand()*.3,from=base+15+rand()*13,reach=11+rand()*9,rise=5+rand()*8;
    const mid=[X+Math.cos(a)*reach*.5,from+rise*.75,Z+Math.sin(a)*reach*.5],tip=[X+Math.cos(a)*reach,from+rise,Z+Math.sin(a)*reach];
    curveTube(bend([X+Math.cos(a)*1.4,from,Z+Math.sin(a)*1.4],[mid[0],mid[1]+rise*.25,mid[2]],tip),taper(1.25,.22,7),bark,8);tips.push(mid,tip);
    const twig=[tip[0]+Math.cos(a+.9)*4,tip[1]+2.5,tip[2]+Math.sin(a+.9)*4];beam(tip,twig,.16,bark);tips.push(twig);}
  // De draden waaraan de vruchten hangen.
  for(const f of FRUITS){const top=base+19+rand()*4,y=realmGround(f.x,f.z)+f.height;beam([f.x,y+.35,f.z],[f.x+(X-f.x)*.25,top,f.z+(Z-f.z)*.25],.035,[.34,.42,.40]);}
  const tree=upload();

  // Kroon: bleek blad (materiaal 2 laat licht door) met lichtende blaadjes en hangende lichtdraden.
  material(2);const leafCount=mobile?26:44;
  for(const t of tips)for(let i=0;i<leafCount;i++){const a=rand()*TAU,b=rand()*2-1,d=Math.cbrt(rand())*5.2,c=[t[0]+Math.cos(a)*d*Math.sqrt(1-b*b),t[1]+b*d*.55,t[2]+Math.sin(a)*d*Math.sqrt(1-b*b)],ang=rand()*TAU,len=.8+rand()*.9;
    const lit=rand()<.16,col=lit?[.42,1.28,1.12]:[.16+rand()*.07,.40+rand()*.12,.37+rand()*.1];
    two([c[0]-Math.cos(ang)*len,c[1],c[2]-Math.sin(ang)*len],[c[0]+Math.cos(ang)*len,c[1]+.15,c[2]+Math.sin(ang)*len],[c[0]-Math.sin(ang)*len*.35,c[1]+.3+rand()*.3,c[2]+Math.cos(ang)*len*.35],col);}
  material(0);
  for(let i=0;i<(mobile?14:26);i++){const t=tips[Math.floor(rand()*tips.length)],lx=t[0]+(rand()-.5)*6,lz=t[2]+(rand()-.5)*6,drop=4+rand()*8;
    beam([lx,t[1],lz],[lx,t[1]-drop,lz],.022,[.30,1.10,1.0]);orb(lx,t[1]-drop,lz,.09,.13,.09,[.5,1.45,1.25],6,4);}
  const crown=upload();

  // Het bleke woud eromheen: slanke stammen met donker turkoois loof en hier en daar een lichtje.
  const count=mobile?58:128;
  for(let i=0,placed=0;i<400&&placed<count;i++){const a=rand()*TAU,r=28+Math.sqrt(rand())*84,lx=Math.cos(a)*r,lz=Math.sin(a)*r;if(!clear(lx,lz))continue;placed++;
    const y=g(lx,lz),h=13+rand()*12,w=.32+rand()*.22,x=X+lx,z=Z+lz;colliders.push({x,z,r:w+.25,h});
    material(5);cone(x,y-.3,z,w,w*.4,h,[.60,.66,.63].map(v=>v*(.85+rand()*.25)),8);
    material(5);for(let k=0;k<4;k++){const q=rand()*TAU,by=y+h*(.55+k*.1);beam([x,by,z],[x+Math.cos(q)*2.2,by+1.6,z+Math.sin(q)*2.2],.07,[.56,.62,.6]);}
    material(2);for(let k=0;k<(mobile?22:38);k++){const q=rand()*TAU,b=rand()*2-1,d=Math.cbrt(rand())*3.4,c=[x+Math.cos(q)*d*Math.sqrt(1-b*b),y+h*.82+b*d*.75,z+Math.sin(q)*d*Math.sqrt(1-b*b)],ang=rand()*TAU,len=.7+rand()*.8,lit=rand()<.07;
      two([c[0]-Math.cos(ang)*len,c[1],c[2]-Math.sin(ang)*len],[c[0]+Math.cos(ang)*len,c[1]+.12,c[2]+Math.sin(ang)*len],[c[0]-Math.sin(ang)*len*.35,c[1]+.35,c[2]+Math.cos(ang)*len*.35],lit?[.4,1.2,1.05]:[.08+rand()*.05,.27+rand()*.1,.25+rand()*.09]);}
    if(rand()<.4){material(0);orb(x+(rand()-.5)*2,y+h*.62,z+(rand()-.5)*2,.1,.14,.1,[.5,1.4,1.2],6,4);}
  }
  // Reuzen aan de rand: hoge bleke stammen die in de mist verdwijnen en de horizon vullen.
  for(let i=0;i<(mobile?20:38);i++){const a=i*TAU/(mobile?20:38)+rand()*.12,r=108+rand()*20,lx=Math.cos(a)*r,lz=Math.sin(a)*r,y=g(lx,lz),h=34+rand()*20,w=1.1+rand()*.8,x=X+lx,z=Z+lz;
    material(5);cone(x,y-1,z,w,w*.45,h,[.50,.57,.55].map(v=>v*(.8+rand()*.3)),9);
    material(2);for(let k=0;k<(mobile?26:46);k++){const q=rand()*TAU,b=rand()*2-1,d=Math.cbrt(rand())*8,c=[x+Math.cos(q)*d*Math.sqrt(1-b*b),y+h*.86+b*d*.6,z+Math.sin(q)*d*Math.sqrt(1-b*b)],ang=rand()*TAU,len=1.5+rand()*1.6;
      two([c[0]-Math.cos(ang)*len,c[1],c[2]-Math.sin(ang)*len],[c[0]+Math.cos(ang)*len,c[1]+.2,c[2]+Math.sin(ang)*len],[c[0]-Math.sin(ang)*len*.35,c[1]+.6,c[2]+Math.cos(ang)*len*.35],rand()<.05?[.4,1.2,1.05]:[.07+rand()*.04,.24+rand()*.08,.23+rand()*.07]);}}
  // Ondergroei: lage struiken van breed blad, met hier en daar een lichtend blad.
  for(let i=0,placed=0;i<500&&placed<(mobile?50:120);i++){const a=rand()*TAU,r=20+Math.sqrt(rand())*86,lx=Math.cos(a)*r,lz=Math.sin(a)*r;if(!clear(lx,lz))continue;placed++;
    const y=g(lx,lz),x=X+lx,z=Z+lz,size=.7+rand()*1.1;material(2);
    for(let k=0;k<9;k++){const q=k*TAU/9+rand()*.5,reach=size*(.6+rand()*.6),lift=size*(.35+rand()*.5),side=q+Math.PI/2;
      two([x,y+.05,z],[x+Math.cos(q)*reach+Math.cos(side)*.18*size,y+lift,z+Math.sin(q)*reach+Math.sin(side)*.18*size],[x+Math.cos(q)*reach-Math.cos(side)*.18*size,y+lift*.9,z+Math.sin(q)*reach-Math.sin(side)*.18*size],rand()<.08?[.36,1.15,1.0]:[.06+rand()*.05,.22+rand()*.1,.2+rand()*.08]);}}
  // Lichtgras: kleine lichtende sprieten in plukken, vooral langs het pad en de poel.
  material(0);
  for(let i=0;i<(mobile?90:220);i++){const a=rand()*TAU,r=6+Math.sqrt(rand())*88,lx=Math.cos(a)*r,lz=Math.sin(a)*r,y=g(lx,lz);if(y<water+.3)continue;
    const h=.35+rand()*.5,x=X+lx,z=Z+lz,q=rand()*TAU;two([x-Math.cos(q)*.05,y,z-Math.sin(q)*.05],[x+Math.cos(q)*.05,y,z+Math.sin(q)*.05],[x+(rand()-.5)*.2,y+h,z+(rand()-.5)*.2],rand()<.5?[.34,1.15,1.02]:[.16,.42,.36]);}
  // Lichtbloemen langs het pad en rond de poel: een dunne steel met een lichtend hart.
  for(let i=0;i<(mobile?40:84);i++){let lx,lz;if(i%2){lz=14+rand()*52;lx=(rand()<.5?-1:1)*(2.6+rand()*7);}else{const a=rand()*TAU,r=REALM.poolRadius+1+rand()*6;lx=REALM.pool[0]+Math.cos(a)*r;lz=REALM.pool[1]+Math.sin(a)*r;}
    const y=g(lx,lz);if(y<water+.3)continue;const h=.45+rand()*.6,x=X+lx,z=Z+lz,warm=rand()<.35;
    material(0);beam([x,y,z],[x+(rand()-.5)*.12,y+h,z+(rand()-.5)*.12],.016,[.30,.48,.42]);
    for(let k=0;k<5;k++){const q=k*TAU/5+i;two([x,y+h,z],[x+Math.cos(q)*.16,y+h+.07,z+Math.sin(q)*.16],[x+Math.cos(q+.7)*.14,y+h+.05,z+Math.sin(q+.7)*.14],warm?[1.05,.95,.7]:[.55,1.0,.95]);}
    orb(x,y+h+.03,z,.045,.045,.045,warm?[1.7,1.35,.6]:[.55,1.6,1.4],6,4);}
  const grove=upload();

  // De boog terug: ruwe steen met een binnenrand van licht, altijd wakker.
  const ax=X+REALM.arch[0],az=Z+REALM.arch[1],ay=g(REALM.arch[0],REALM.arch[1]);
  material(3);const stone=[.36,.42,.40],arc=Array.from({length:13},(_,i)=>{const t=i/12*Math.PI;return [ax-Math.cos(t)*5.4,ay+.2+Math.sin(t)*7.2,az];});
  curveTube(arc,arc.map(()=>.95),stone,8);
  for(const side of[-1,1]){orb(ax+side*5.4,ay+.3,az,1.5,.8,1.4,stone.map(v=>v*.9),10,6);colliders.push({x:ax+side*5.4,z:az,r:1.3,h:8});}
  material(0);const rim=Array.from({length:13},(_,i)=>{const t=i/12*Math.PI;return [ax-Math.cos(t)*4.5,ay+.2+Math.sin(t)*6.2,az];});
  curveTube(rim,rim.map(()=>.07),[.30,1.25,1.15],5);
  const arch=upload();

  // De vruchten zelf: een dichte knop, een turkooizen wondervrucht en een warme hartslagvrucht.
  material(0);orb(0,0,0,.22,.34,.22,[.30,.38,.35],10,7);orb(0,.3,0,.09,.12,.09,[.24,.30,.27],6,4);const bud=upload();
  material(0);orb(0,0,0,.40,.52,.40,[.42,1.50,1.30],14,9);orb(0,.02,0,.2,.28,.2,[.9,1.7,1.5],8,6);const wonder=upload();
  material(0);orb(0,0,0,.40,.52,.40,[1.60,.86,.28],14,9);orb(0,.02,0,.2,.28,.2,[1.9,1.4,.7],8,6);const heart=upload();
  material(0);
  return {ground,pool,tree,crown,grove,arch,bud,wonder,heart,colliders};
}
