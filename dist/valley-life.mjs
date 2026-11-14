// Het leven van de vallei: wat je ziet en hoort hangt af van de ritmes die zijn hersteld.
// In het begin is de vallei stil: de rivier staat laag, de kleuren zijn dof en er zingen
// weinig vogels. Elk hersteld ritme geeft een deel terug; het zaad voegt daar later iets aan toe.
// De waarden bewegen langzaam naar hun doel, zodat je de vallei ziet terugkomen.
export const RIVER_BASE=-2.3;      // hoogte van het wateroppervlak als de rivier vol staat
export const RIVER_DROP=1.5;       // zoveel lager staat de rivier zolang het water niet terug is
export const LAKE_FROM=80,LAKE_TO=110; // ten zuiden hiervan ligt het sterrenmeer, dat altijd vol blijft
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};

// Wat de vallei op dit punt in het verhaal hoort te zijn.
// restored: [water, licht, adem, stem]; seed: effects() van de zaadkeuze (mag ontbreken).
export function lifeTarget(restored=[],seed={}){
  const [water,light,breath,voice]=[0,1,2,3].map(i=>!!restored[i]),count=[water,light,breath,voice].filter(Boolean).length,gift=clamp(seed.river??0);
  return {
    drop:water?(gift?-.35*gift:0):RIVER_DROP,                 // negatief: de rivier staat hoger dan ooit
    flow:water?1+.3*gift:.22,                        // hoe luid de rivier klinkt
    colour:clamp(.12+.16*count+(light?.24:0))+.12*gift, // 0 dof .. 1 vol; het licht geeft het meeste terug
    song:breath?1:.3+.05*count,                      // hoe vaak er vogels zingen
    count
  };
}

// Hoogte van het water op een plek langs de rivier. Moet gelijk lopen met de vertex-shader.
export function waterLevelAt(z,drop=0){return RIVER_BASE-drop*(1-smooth((z-LAKE_FROM)/(LAKE_TO-LAKE_FROM)));}

export class ValleyLife{
  constructor(restored=[],seed={}){this.now={...lifeTarget(restored,seed)};this.target={...this.now};}
  aim(restored,seed){this.target=lifeTarget(restored,seed);}
  // De rivier stijgt in ongeveer twintig seconden; kleur en zang komen iets sneller.
  update(seconds){
    const dt=Math.max(0,Math.min(.5,seconds)),ease=(key,rate)=>{const d=this.target[key]-this.now[key];this.now[key]=Math.abs(d)<.0005?this.target[key]:this.now[key]+d*(1-Math.exp(-rate*dt));};
    ease('drop',.16);ease('flow',.22);ease('colour',.3);ease('song',.4);this.now.count=this.target.count;
    return this.now;
  }
  waterAt(z){return waterLevelAt(z,this.now.drop);}
}
