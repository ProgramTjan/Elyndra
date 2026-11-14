// De vlucht: ritme 2, de zwevende tuinen. De adem is uit de eilanden getrokken en hangt
// als dauw in de lucht. Wie vliegt, vangt de druppels en brengt ze stil naar het hart
// van de tuinen. Geen knop, geen klok, niets dat verloren kan gaan.
export const CENTRE=[-90,40,-150];
// Negen druppels op een losse spiraal om het hart: 12 tot 34 m horizontaal, hoogte 30 tot 58, minstens 9 m uit elkaar.
export const DROPS=[[-78.5,34,-146.5],[-103.3,52,-143.7],[-83.4,40,-166.2],[-83,56,-131],[-110.5,31,-160.5],[-65.2,47,-156.8],[-105.2,57,-125.9],[-95.6,36,-180.8],[-62.9,45,-129.4]];
// Een pentatonische ladder: elke vangst klinkt hoger dan de vorige, wat de volgorde ook is.
export const NOTES=[392,440,523.25,587.33,659.25,783.99,880,1046.5,1174.66];
export const CATCH_RADIUS=3.5;      // 3D-afstand waarbinnen een druppel wordt gevangen (alleen vliegend)
export const HOME_RADIUS=9;         // 3D-afstand tot CENTRE waarbinnen je de dauw thuisbrengt
export const HOVER_SECONDS=3;       // zo lang stilhangen, vliegend, bij het hart
export const HINT_AFTER=60;         // seconden zonder vangst voordat de richting wordt genoemd
export const NEAR_RADIUS=70;        // horizontaal: je bent in het speelgebied
const NUMBERS=['nul','een','twee','drie','vier','vijf','zes','zeven','acht','negen'];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

export class FlightGame {
 constructor(ground,options={}){
  this.ground=ground;
  this.centre=options.centre||CENTRE;this.drops=options.drops||DROPS;this.notes=options.notes||NOTES;
  this.hoverSeconds=options.hoverSeconds??HOVER_SECONDS;this.hintAfter=options.hintAfter??HINT_AFTER;
  this.reset();
 }
 reset(){
  this.solved=false;this.begun=false;
  this.caught=[];          // indices in de volgorde van vangen
  this.hover=0;this.idle=0; // stilhangen bij het hart; seconden sinds de laatste vangst
  this.last=null;this.flying=false;
 }
 near(pos){return !!pos&&Math.hypot(pos[0]-this.centre[0],pos[2]-this.centre[2])<=NEAR_RADIUS;}
 // Er is geen knop in dit spel: alles gebeurt in update().
 prompt(){return null;}
 interact(){return [];}
 // Wat nog hangt. Is het spel van buitenaf opgelost (voortgang hersteld), dan hangt er niets meer.
 remaining(){return this.solved?[]:this.drops.map((_,i)=>i).filter(i=>!this.caught.includes(i));}
 nearest(){
  const from=this.last||this.centre;let best=-1,d=Infinity;
  for(const i of this.remaining()){const k=dist(from,this.drops[i]);if(k<d){d=k;best=i;}}
  return best;
 }
 update(seconds,pos,{moving=false,flying=false}={}){
  const events=[];
  if(this.solved||!pos)return events;
  const dt=Math.min(.5,Math.max(0,seconds||0));
  this.last=[...pos];this.flying=!!flying;this.idle+=dt;
  if(this.caught.length<this.drops.length){
   if(!flying)return events;
   this.begun=true;
   // Dichtstbijzijnde eerst, zodat twee druppels in één beeld toch in een vaste volgorde klinken.
   const hit=this.remaining().filter(i=>dist(pos,this.drops[i])<=CATCH_RADIUS).sort((a,b)=>dist(pos,this.drops[a])-dist(pos,this.drops[b]));
   for(const i of hit){
    this.caught.push(i);this.idle=0;
    events.push({type:'bell',note:this.notes[this.caught.length-1]});
    if(this.caught.length===this.drops.length)events.push({type:'chime'});
   }
   return events;
  }
  // Alles gevangen: breng de dauw thuis door stil te hangen. Bewegen zet alleen de telling terug.
  if(flying&&!moving&&dist(pos,this.centre)<=HOME_RADIUS){
   this.hover+=dt;
   if(this.hover>=this.hoverSeconds-1e-9){
    this.solved=true;
    events.push({type:'toast',text:'De tuinen ademen weer, heel zacht.'},{type:'solved'});
   }
  }else this.hover=0;
  return events;
 }
 // Richting van een punt ten opzichte van het hart, in gewoon Nederlands (noord is -z, oost is +x).
 direction(p){
  const dx=p[0]-this.centre[0],dz=p[2]-this.centre[2],dy=p[1]-this.centre[1],parts=[];
  const ns=dz<0?'noorden':'zuiden',ew=dx>0?'oosten':'westen';
  if(Math.abs(dz)>=Math.abs(dx)*1.8)parts.push(ns);
  else if(Math.abs(dx)>=Math.abs(dz)*1.8)parts.push(ew);
  else parts.push(dz<0?(dx>0?'noordoosten':'noordwesten'):(dx>0?'zuidoosten':'zuidwesten'));
  const h=parts[0],height=dy>=3?', hoger':dy<=-3?', lager':'';
  return `in het ${h}${height}`;
 }
 words(){
  if(this.solved)return ['De vlucht','De dauw is thuis. De tuinen ademen weer.'];
  const n=this.caught.length,total=this.drops.length;
  if(n>=total){
   const text=this.flying
    ?'Alle dauw is gevangen. Zweef stil in het hart van de tuinen, binnen de lichtkring.'
    :'Alle dauw is gevangen. Vlieg naar het hart van de tuinen en zweef daar stil.';
   return ['Breng de dauw thuis',text];
  }
  let text=n===0?`Dauwdruppels hangen in de lucht tussen de eilanden. Vlieg erheen om ze te vangen. Er zijn er negen.`
   :`${NUMBERS[n][0].toUpperCase()+NUMBERS[n].slice(1)} van de ${NUMBERS[total]} druppels gevangen.`;
  if(!this.flying)text+=' De dauw hangt te hoog om te voet te bereiken.';
  if(this.idle>=this.hintAfter){const i=this.nearest();if(i>=0)text+=` De dichtstbijzijnde druppel hangt ${this.direction(this.drops[i])} van de tuinen.`;}
  return ['De dauw vangen',text];
 }
 visuals(clock,reduced){
  const parts=[],motes=[],t=reduced?0:clock;
  const left=this.remaining(),per=reduced?3:6;
  for(const i of left){
   const p=this.drops[i];
   // De logische plek staat vast; alleen het beeld deint zacht.
   parts.push({mesh:'drop',position:[p[0],p[1]+(reduced?0:Math.sin(t*1.3+i*1.7)*.35),p[2]],rotation:reduced?0:t*.35+i});
   for(let k=0;k<per;k++){
    const a=k/per*Math.PI*2+t*.6+i;
    motes.push([p[0]+Math.cos(a)*1.3,p[1]+Math.sin(a*2+i)*.3,p[2]+Math.sin(a)*1.3]);
   }
  }
  const target=this.nearest();
  if(target>=0&&this.last){
   const to=this.drops[target],d=dist(this.last,to),n=reduced?4:8;
   if(d>1)for(let k=0;k<n;k++){
    // Een vage stippellijn van maximaal 40 m vanaf je laatste plek richting de druppel.
    const f=Math.min(.95,(k+1)*5/d);
    motes.push([this.last[0]+(to[0]-this.last[0])*f,this.last[1]+(to[1]-this.last[1])*f,this.last[2]+(to[2]-this.last[2])*f]);
   }
  }
  if(left.length===0){
   const n=reduced?8:14;
   for(let k=0;k<n;k++){const a=k/n*Math.PI*2+t*.25;motes.push([this.centre[0]+Math.cos(a)*HOME_RADIUS,this.centre[1],this.centre[2]+Math.sin(a)*HOME_RADIUS]);}
  }
  return {parts,motes};
 }
 snapshot(){return {solved:this.solved,begun:this.begun,caught:[...this.caught],hover:this.hover,idle:this.idle,flying:this.flying};}
}

export function createFlightMeshes(kit,ground){
 const {orb,cone,tri,material,upload}=kit;
 // Scenery: een klein verborgen driehoekje diep onder de tuinen, zodat de sleutel bestaat.
 const c=CENTRE,low=[c[0],-200,c[2]];
 tri(low,[c[0]+.5,-200,c[2]],[c[0],-200,c[2]+.5],[.1,.1,.1]);
 tri(low,[c[0],-200,c[2]+.5],[c[0]+.5,-200,c[2]],[.1,.1,.1]);
 material(0);const scenery=upload();
 // De druppel: een lichtgevende traan van ongeveer 0,7 m met een helderdere kern.
 orb(0,-.1,0,.22,.22,.22,[.5,1.45,1.55],12,8);
 cone(0,.05,0,.17,.01,.4,[.5,1.45,1.55],10);
 orb(0,-.1,0,.11,.11,.11,[1.3,1.9,1.9],8,6);
 material(0);const drop=upload();
 return {scenery,drop};
}
