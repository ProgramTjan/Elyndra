// De rustige interface: wie stilstaat, krijgt het woud zonder knoppen ervoor.
// Rondkijken telt als stilstaan; lopen, een toets of een tik brengt alles terug.
export const CALM_KEY='elyndra-calm-hud';
export const CALM_DELAY=5;
export const TAP_SLOP=8;

export function readCalmEnabled(storage){
  try{return storage.getItem(CALM_KEY)!=='off';}catch{return true;}
}
export function saveCalmEnabled(storage,enabled){
  try{storage.setItem(CALM_KEY,enabled?'on':'off');}catch{}
}

export class CalmInterface{
  constructor({delay=CALM_DELAY,enabled=true}={}){this.delay=delay;this.enabled=enabled;this.idle=0;this.calm=false;}
  wake(){this.idle=0;this.calm=false;}
  setEnabled(enabled){this.enabled=enabled;this.wake();}
  // moving: de speler loopt of vliegt. blocked: er is een menu, dialoog of film open.
  update(seconds,{moving=false,blocked=false}={}){
    if(!this.enabled||moving||blocked){this.wake();return this.calm;}
    this.idle+=Math.max(0,seconds);
    this.calm=this.idle>=this.delay;
    return this.calm;
  }
}

// Een tik op het beeld (zonder slepen) brengt de interface terug; slepen is rondkijken.
export function isTap(down,up){
  return !!down&&Math.hypot(up.x-down.x,up.y-down.y)<=TAP_SLOP;
}

// Met de muis: pas als de aanwijzer naar de rand gaat waar de knoppen staan,
// komt de interface terug. Zo blijft het beeld leeg tijdens het rondkijken.
export function inReach(y,height,top=120,bottom=150){
  return y<top||y>height-bottom;
}
