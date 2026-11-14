// Het lichtspoor: ritme 1, de lichtpoort. Uit een kristal op een lage zuil valt een straal
// warm licht. Drie staande spiegelstenen kun je per achtste slag draaien; wie de straal langs
// alle drie leidt, stuurt haar naar de poort, en de poort ontwaakt. Geen klok, niets dat
// verloren kan gaan: een verkeerde slag laat het licht alleen een andere kant op gaan.
//
// Meetkunde. Alle posities liggen op een raster dat 45 graden gedraaid staat, zodat de straal
// alleen diagonaal loopt en elke spiegel haar een kwart slag laat keren:
//   bron (47,-93) → ZO → spiegel 1 (53,-87) → NO → spiegel 2 (59,-93) → NW → spiegel 3 (54,-98) → NO → doel (66,-110).
// Elke spiegel heeft één spiegelende voorkant; de achterkant is ruwe steen en houdt het licht
// tegen. Daardoor is van de 8^3 standen er precies één die het spel oplost: de stand die
// 180 graden gedraaid is ligt op dezelfde lijn, maar keert het licht haar rug toe.
// Verschuif je posities, houd dan elk been diagonaal en de laatste spiegel op de lijn x+z=-44.

export const ORIGIN=[52,-94];          // midden van het speelveld (x,z), west van de trap
export const PLAY_RADIUS=9;            // alles staat binnen deze straal van ORIGIN
export const NEAR_RADIUS=26;           // binnen deze afstand toont de wereld het doel
export const STAIR_X=66,STAIR_CLEAR=5; // de trap loopt langs x=66; niets binnen 5 m daarvan
export const BEAM_HEIGHT=2.2;          // de straal loopt zo hoog boven de grond
export const REACH=3.2;                // een spiegel draai je binnen deze afstand, te voet
export const MIRROR_HALF=1.2;          // een spiegel is een verticaal vlak van 2,4 m breed
export const MAX_BOUNCES=8,MAX_RANGE=60;
export const TARGET=[66,-110],TARGET_RADIUS=2.5;
export const RING_HEIGHT=12;           // het midden van de stenen ring boven ground(66,-110)
export const SOURCE={x:47,z:-93,facing:3};   // facing in achtsten: 0 noord, 2 oost, 3 zuidoost
export const MOTE_SPACING=.9,MAX_MOTES=70,DRIFT_SPEED=.35;
export const HINT_AFTER=[90,180];      // seconden zonder nieuwe voortgang
// Drie spiegels in de volgorde waarin het licht ze moet raken. `solution` en `start` zijn standen
// in achtsten (0 = voorkant naar het noorden, elke slag 45 graden met de klok mee).
export const MIRRORS=Object.freeze([
 Object.freeze({id:'zuil',name:'de spiegel bij de omgevallen zuil',x:53,z:-87,solution:0,start:6,note:523.25}),
 Object.freeze({id:'steen',name:'de spiegel bij de gebeitelde steen',x:59,z:-93,solution:6,start:3,note:659.25}),
 Object.freeze({id:'keien',name:'de spiegel bij de drie keien',x:54,z:-98,solution:2,start:0,note:783.99})
]);
// Herkenningspunten waar de spiegels naar heten, plus wat losse brokstukken voor karakter.
export const LANDMARKS=Object.freeze({
 column:[[49.2,-87.2],[47.7,-87.6],[46.2,-88.3]],   // omgevallen zuiltrommels, van voet naar top
 stump:[50.8,-86.3],                              // de voet die nog staat
 carved:[58.4,-89],                               // de gebeitelde steen
 boulders:[[51,-97],[50,-98.4],[51.6,-99.1]],     // de drie keien
 rubble:[[44.5,-96.5],[46.5,-100],[57,-87.6],[59,-98.5]]
});
const NUMBERS=['geen','één','twee','drie'];
const TAU=Math.PI*2,EPS=1e-7;

// Richting van een stand in achtsten, als [dx,dz] (zelfde afspraak als yaw: 0 kijkt naar -z).
export function facing(k){const a=((k%8)+8)%8*Math.PI/4;return [Math.sin(a),-Math.cos(a)];}
// Echte spiegeling van richting d aan een vlak met normaal n (beide eenheidsvectoren).
export function reflect(d,n){const k=2*(d[0]*n[0]+d[1]*n[1]);return [d[0]-k*n[0],d[1]-k*n[1]];}

// Volgt de straal in het platte vlak. mirrors: [{x,z,facing}]. Geeft de knikpunten, de spiegels
// die het licht weerkaatsen (in volgorde) en waar het eindigt:
//  'target'      het doel voor de poort is geraakt
//  'mirror back' de straal stuit op de stenen achterkant van een spiegel
//  'nothing'     de straal loopt uit in het open veld (na hoogstens MAX_RANGE meter)
//  'bounces'     meer dan MAX_BOUNCES weerkaatsingen
// Een straal die precies langs het vlak scheert (evenwijdig) gaat erlangs.
export function trace(source,mirrors,{target=TARGET,radius=TARGET_RADIUS,half=MIRROR_HALF,maxBounces=MAX_BOUNCES,range=MAX_RANGE}={}){
 let p=[source.x,source.z],d=facing(source.facing),left=range,from=-1;
 const points=[[...p]],hits=[];
 for(;;){
  // Dichtstbijzijnde spiegel op de straal.
  let best=Infinity,which=-1,side=0;
  mirrors.forEach((m,i)=>{
   if(i===from)return;
   const n=facing(m.facing),t=[-n[1],n[0]],den=d[0]*n[0]+d[1]*n[1];
   if(Math.abs(den)<EPS)return;
   const s=((m.x-p[0])*n[0]+(m.z-p[1])*n[1])/den;
   if(s<=EPS||s>=best)return;
   const q=[p[0]+d[0]*s-m.x,p[1]+d[1]*s-m.z];
   if(Math.abs(q[0]*t[0]+q[1]*t[1])>half+EPS)return;
   best=s;which=i;side=den;
  });
  // Het doel: de eerste snijding van de straal met de cirkel.
  let goal=Infinity;
  {const fx=p[0]-target[0],fz=p[1]-target[1],b=fx*d[0]+fz*d[1],c=fx*fx+fz*fz-radius*radius,disc=b*b-c;
   if(disc>=0){const s1=-b-Math.sqrt(disc),s2=-b+Math.sqrt(disc),s=s1>EPS?s1:s2>EPS?s2:Infinity;goal=s;}}
  const step=Math.min(best,goal);
  if(step>left){p=[p[0]+d[0]*left,p[1]+d[1]*left];points.push(p);return {points,hits,end:'nothing'};}
  p=[p[0]+d[0]*step,p[1]+d[1]*step];points.push(p);left-=step;
  if(goal<=best)return {points,hits,end:'target'};
  if(side>0)return {points,hits,end:'mirror back',blocked:which};
  if(hits.length>=maxBounces)return {points,hits,end:'bounces'};
  hits.push(which);d=reflect(d,facing(mirrors[which].facing));from=which;
 }
}
// Opgelost als de straal alle spiegels raakt en daarna het doel.
export const solves=result=>result.end==='target'&&new Set(result.hits).size===MIRRORS.length;

const flat=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const cap=s=>s[0].toUpperCase()+s.slice(1);

export class LightGame {
 constructor(ground,options={}){
  this.ground=ground;
  this.source=options.source||SOURCE;this.mirrors=options.mirrors||MIRRORS;this.target=options.target||TARGET;
  this.hintAfter=options.hintAfter||HINT_AFTER;
  this.ring=[this.target[0],ground(this.target[0],this.target[1])+RING_HEIGHT,this.target[1]];
  this.reset();
 }
 reset(){
  this._solved=false;this.announced=false;this.begun=false;
  this.turns=this.mirrors.map(m=>m.start);
  this.idle=0;this.best=0;this.result=this.light();
  this.best=this.lit();
 }
 // De voortgang kan van buitenaf hersteld worden: dan staan de spiegels meteen goed.
 get solved(){return this._solved;}
 set solved(v){this._solved=!!v;if(v){this.turns=this.mirrors.map(m=>m.solution);this.announced=true;this.result=this.light();this.best=this.lit();}}
 light(){return trace(this.source,this.mirrors.map((m,i)=>({x:m.x,z:m.z,facing:this.turns[i]})),{target:this.target});}
 lit(){return new Set(this.result.hits).size;}
 near(pos){return !!pos&&Math.hypot(pos[0]-ORIGIN[0],pos[2]-ORIGIN[1])<NEAR_RADIUS;}
 // De spiegel waar je nu bij staat (dichtstbijzijnde binnen REACH, te voet), of -1.
 station(pos,{flying=false}={}){
  if(!pos||flying||this._solved)return -1;
  let best=-1,d=REACH;
  this.mirrors.forEach((m,i)=>{const k=flat([pos[0],pos[2]],[m.x,m.z]);if(k<=d){d=k;best=i;}});
  return best;
 }
 prompt(pos,state={}){return this.station(pos,state)>=0?'Draai de spiegel':null;}
 interact(pos,state={}){
  const i=this.station(pos,state),events=[];
  if(i<0)return events;
  const before=this.lit();
  this.begun=true;this.turns[i]=(this.turns[i]+1)%8;this.result=this.light();
  events.push({type:'bell',note:this.mirrors[i].note});
  const now=this.lit();
  if(now>before)events.push({type:'chime'});
  // Alleen een nieuw hoogste aantal telt als voortgang voor de hulp in words().
  if(now>this.best){this.best=now;this.idle=0;}
  if(solves(this.result)&&!this.announced){
   this._solved=true;this.announced=true;
   events.push({type:'toast',text:'Het licht vindt de weg naar de poort weer.'},{type:'solved'});
  }
  return events;
 }
 update(seconds,pos){
  // De hulp telt alleen terwijl je in het speelveld bent: wie net aankomt, krijgt eerst het doel.
  if(!this._solved&&this.near(pos))this.idle+=Math.min(.5,Math.max(0,seconds||0));
  return [];
 }
 // De eerste spiegel in de volgorde die nog niet goed staat, en hoeveel slagen ze nog nodig heeft.
 next(){
  const i=this.mirrors.findIndex((m,k)=>this.turns[k]!==m.solution);
  return i<0?null:{index:i,turns:(this.mirrors[i].solution-this.turns[i]+8)%8};
 }
 words(){
  if(this._solved)return ['Het lichtspoor','Het licht loopt weer langs de drie spiegels naar de poort. Ze staan nu stil.'];
  const n=this.lit(),total=this.mirrors.length;
  let text=!this.begun
   ?'Uit de lichtsteen valt een straal. Draai de drie staande spiegels tot het licht ze alle drie raakt en naar de poort gaat.'
   :n===total?'Het licht raakt alle drie de spiegels, maar gaat nog niet naar de poort.'
   :`Het licht raakt nu ${NUMBERS[n]} van de drie spiegels.`;
  if(!this.begun&&n>0)text+=` Nu raakt het licht ${n===1?'één spiegel':NUMBERS[n]+' spiegels'}.`;
  const next=this.next();
  if(next&&this.idle>=this.hintAfter[1]){
   const slag=next.turns===1?'nog één keer':`nog ${NUMBERS[next.turns]??next.turns} keer`;
   text+=` Draai ${this.mirrors[next.index].name} ${slag}.`;
  }else if(next&&this.idle>=this.hintAfter[0])text+=` ${cap(this.mirrors[next.index].name)} wacht op je.`;
  return ['Het lichtspoor',text];
 }
 // Het pad van de straal in 3D: elk punt op BEAM_HEIGHT boven de grond. Opgelost stijgt het laatste been naar de ring.
 path(){
  const pts=this.result.points,g=this.ground,lift=p=>[p[0],g(p[0],p[1])+BEAM_HEIGHT,p[1]];
  const segments=[];
  const flatLegs=this._solved?pts.length-2:pts.length-1;
  for(let i=0;i<flatLegs;i++)segments.push({a:pts[i],b:pts[i+1],rise:false});
  if(this._solved){const last=pts[pts.length-2];segments.push({a:lift(last),b:this.ring,rise:true});}
  return segments.map(s=>s.rise?s:{a:lift(s.a),b:lift(s.b),flat:[s.a,s.b],rise:false});
 }
 visuals(clock=0,reduced=false){
  const parts=this.mirrors.map((m,i)=>({mesh:this.result.hits.includes(i)?'mirrorLit':'mirror',position:[m.x,this.ground(m.x,m.z),m.z],rotation:-this.turns[i]*Math.PI/4}));
  // Lichtjes op gelijke afstand langs de hele straal; met beweging schuiven ze langzaam mee.
  const segments=this.path(),lengths=segments.map(s=>s.rise?Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1],s.b[2]-s.a[2]):flat(s.flat[0],s.flat[1]));
  const total=lengths.reduce((a,b)=>a+b,0),limit=reduced?Math.floor(MAX_MOTES/2):MAX_MOTES-1;
  const spacing=Math.max(reduced?MOTE_SPACING*2:MOTE_SPACING,total/limit);
  const phase=reduced?spacing/2:((clock*DRIFT_SPEED)%spacing+spacing)%spacing;
  const motes=[];
  for(let s=phase,k=0,start=0;s<total&&motes.length<MAX_MOTES;s+=spacing){
   // Benen lopen alleen vooruit: schuif door tot het been waarin dit lichtje valt.
   while(k<segments.length-1&&s>start+lengths[k]){start+=lengths[k];k++;}
   const seg=segments[k],t=lengths[k]>0?Math.min(1,(s-start)/lengths[k]):0;
   if(seg.rise)motes.push(seg.a.map((v,q)=>v+(seg.b[q]-v)*t));
   else{const x=seg.flat[0][0]+(seg.flat[1][0]-seg.flat[0][0])*t,z=seg.flat[0][1]+(seg.flat[1][1]-seg.flat[0][1])*t;motes.push([x,this.ground(x,z)+BEAM_HEIGHT,z]);}
  }
  return {parts,motes};
 }
 snapshot(){
  return {solved:this._solved,begun:this.begun,turns:[...this.turns],lit:this.lit(),best:this.best,idle:this.idle,
   end:this.result.end,hits:[...this.result.hits],points:this.result.points.map(p=>[...p])};
 }
}

export function createLightMeshes(kit,ground){
 const {orb,cone,beam,curveTube,tri,material,upload}=kit;
 let seed=41017;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const g=(x,z)=>ground(x,z),stone=[.40,.43,.41],moss=[.24,.33,.22],vary=c=>c.map(v=>v*(.88+rand()*.22));
 // Een vierhoek met de normaal naar buiten (tri berekent de normaal uit de volgorde).
 const quad=(a,b,c,d,out,col)=>{
  const u=b.map((v,i)=>v-a[i]),w=c.map((v,i)=>v-a[i]),n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
  if(n[0]*out[0]+n[1]*out[1]+n[2]*out[2]>=0){tri(a,b,c,col);tri(a,c,d,col);}else{tri(a,c,b,col);tri(a,d,c,col);}
 };
 const box=(x0,x1,y0,y1,z0,z1,col,skip='')=>{
  const P=(x,y,z)=>[x,y,z];
  if(!skip.includes('n'))quad(P(x0,y0,z0),P(x1,y0,z0),P(x1,y1,z0),P(x0,y1,z0),[0,0,-1],col.n??col);
  if(!skip.includes('s'))quad(P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1),[0,0,1],col.s??col);
  quad(P(x0,y0,z0),P(x0,y0,z1),P(x0,y1,z1),P(x0,y1,z0),[-1,0,0],col);
  quad(P(x1,y0,z0),P(x1,y0,z1),P(x1,y1,z1),P(x1,y1,z0),[1,0,0],col);
  quad(P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1),[0,1,0],col);
 };

 // De lichtsteen: een lage zuil met een kristal dat op straalhoogte gloeit.
 material(3);
 {const {x,z}=SOURCE,y=g(x,z);
  cone(x,y-.3,z,.95,.8,.55,vary(stone),10);cone(x,y+.2,z,.55,.42,1.55,vary(stone),9);cone(x,y+1.7,z,.62,.55,.18,vary(stone),9);
  orb(x+.3,y+.25,z-.4,.35,.2,.3,moss,8,5);
  material(0);orb(x,y+BEAM_HEIGHT,z,.24,.42,.24,[1.6,1.45,1.0],10,7);orb(x,y+BEAM_HEIGHT,z,.12,.24,.12,[1.9,1.75,1.3],8,5);
  // Een klein schild aan de achterkant (noordwest) laat zien naar welke kant het licht valt.
  material(3);const f=facing(SOURCE.facing);beam([x-f[0]*.35,y+1.85,z-f[1]*.35],[x-f[0]*.35,y+2.65,z-f[1]*.35],.16,vary(stone));}
 // Drie lage ronde voetstukken.
 material(3);
 for(const m of MIRRORS){const y=g(m.x,m.z);cone(m.x,y-.25,m.z,1.05,.95,.6,vary(stone),12);cone(m.x,y+.33,m.z,.95,.9,.04,vary([.46,.49,.46]),12);}
 // De omgevallen zuil: een staande voet en drie trommels die in het gras zijn gerold.
 {const [sx,sz]=LANDMARKS.stump,y=g(sx,sz);cone(sx,y-.3,sz,.62,.58,1.5,vary(stone),10);orb(sx,y+1.2,sz,.5,.12,.5,vary(stone),8,4);}
 LANDMARKS.column.forEach(([x,z],i)=>{
  const a=.4+i*.5+rand()*.3,r=.55,y=g(x,z)+r*.85,l=.62;
  beam([x-Math.cos(a)*l,y,z-Math.sin(a)*l],[x+Math.cos(a)*l,y,z+Math.sin(a)*l],r,vary(stone));
  orb(x,g(x,z)+.05,z,.6,.12,.5,moss,8,4);
 });
 // De gebeitelde steen: een staand blok met ingesneden ringen.
 {const [x,z]=LANDMARKS.carved,y=g(x,z);
  box(x-.45,x+.45,y-.3,y+1.7,z-.3,z+.3,vary(stone));orb(x,y+1.7,z,.45,.14,.3,vary(stone),8,4);
  material(0);for(let k=0;k<3;k++){const h=y+.45+k*.42,ring=Array.from({length:9},(_,i)=>{const t=i/8*TAU;return [x+Math.cos(t)*.22,h+Math.sin(t)*.16,z-.31];});
   curveTube(ring,ring.map(()=>.025),[.22,.25,.24],5);}
  material(3);}
 // De drie keien.
 for(const [x,z] of LANDMARKS.boulders){const s=.55+rand()*.35;orb(x,g(x,z)+s*.35,z,s*1.1,s*.75,s,vary(stone),10,6);orb(x,g(x,z)+s*.95,z,s*.6,s*.12,s*.5,moss,7,4);}
 // Brokstukken: gebeitelde blokken half in het gras.
 for(const [x,z] of LANDMARKS.rubble){const y=g(x,z),w=.35+rand()*.3,h=.25+rand()*.35;box(x-w,x+w,y-.2,y+h,z-w*.7,z+w*.7,vary(stone));}
 material(0);const scenery=upload();

 // De spiegelsteen rond de oorsprong: een hoge smalle plaat, voorkant naar lokaal -z (de stand 0, noord).
 // Lijst en achterkant van steen; het spiegelvlak ligt net voor de lijst.
 const mirror=face=>{
  material(3);
  const col=Object.assign([...stone],{n:stone,s:[.34,.36,.34]});
  box(-1.32,1.32,.32,.62,-.22,.22,col);box(-1.32,1.32,3.12,3.42,-.22,.22,col);
  box(-1.32,-1.08,.62,3.12,-.22,.22,col);box(1.08,1.32,.62,3.12,-.22,.22,col);
  box(-1.08,1.08,.62,3.12,-.02,.18,[.33,.35,.33],'n');
  orb(0,3.5,0,.3,.14,.18,stone,8,4);
  material(0);quad([-1.08,.62,-.04],[1.08,.62,-.04],[1.08,3.12,-.04],[-1.08,3.12,-.04],[0,0,-1],face);
  // Een smalle lichtere rand verraadt van opzij welke kant spiegelt.
  quad([-1.08,.62,-.05],[-1.0,.62,-.05],[-1.0,3.12,-.05],[-1.08,3.12,-.05],[0,0,-1],face.map(v=>Math.min(v*1.08,1.9)));
  material(0);return upload();
 };
 const plain=mirror([.75,.85,.9]),lit=mirror([.98,1,.9]);
 material(0);
 return {scenery,mirror:plain,mirrorLit:lit};
}
