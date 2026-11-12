// Automatische beeldkwaliteit: begin op een verstandige stand en stuur bij op
// de gemeten framerate. Puur rekenwerk, zodat het zonder WebGL te testen is.
export const AUTO_KEY='elyndra-auto-tier';
export const SLOW_FPS=34,CRAWL_FPS=26,SMOOTH_FPS=55;
export const SCALES=[1,.8,.65];
const REMEMBER_MS=7*24*3600*1000;

// Resolutie, schaduwkaart en schaduwfilter per stand.
export function tierSettings(tier,scale=1,dpr=1){
  return tier==='high'
    ?{pixel:Math.min(2,dpr||1),shadow:2048,soft:1}
    :{pixel:scale,shadow:512,soft:0};
}

// Een eerdere terugschakeling geldt een week; daarna mag het apparaat het
// opnieuw proberen (een trage dag hoeft geen blijvend oordeel te zijn).
export function readRemembered(storage,now=Date.now()){
  try{
    const saved=JSON.parse(storage.getItem(AUTO_KEY)||'null');
    if(!saved||!['fast','high'].includes(saved.tier))return null;
    if(!(now-saved.at<REMEMBER_MS))return null;
    return {tier:saved.tier,scale:SCALES.includes(saved.scale)?saved.scale:1,locked:saved.locked===true};
  }catch{return null;}
}
export function saveRemembered(storage,governor,now=Date.now()){
  try{storage.setItem(AUTO_KEY,JSON.stringify({tier:governor.tier,scale:governor.scale,locked:governor.locked,at:now}));}catch{}
}

export class QualityGovernor{
  constructor({mobile=false,remembered=null,windowSeconds=2.5,warmupSeconds=1.5}={}){
    this.mobile=mobile;this.windowSeconds=windowSeconds;this.warmupSeconds=warmupSeconds;
    this.tier=remembered?.tier??(mobile?'fast':'high');
    this.scale=this.tier==='fast'?(remembered?.scale??1):1;
    // Na een terugschakeling proberen we in dit bezoek niet opnieuw omhoog:
    // heen en weer springen is storender dan een iets lichter beeld.
    this.locked=remembered?.locked===true;
    this.fps=0;this.rest();
  }
  rest(){this.warm=0;this.time=0;this.frames=0;this.good=0;this.stalls=0;}
  lower(){
    if(this.tier==='high'){this.tier='fast';this.scale=1;}
    else{const next=SCALES[SCALES.indexOf(this.scale)+1];if(!next)return false;this.scale=next;}
    this.locked=true;this.rest();return true;
  }
  // Geef de duur van elk beeld door. Geeft true terug als de stand verandert.
  sample(seconds){
    if(!(seconds>0))return false;
    // Eén lang beeld is een tabwissel of pauze. Drie op rij is een apparaat dat
    // het niet trekt: dan meteen een stap terug, zonder op een meetvenster te wachten.
    if(seconds>1){return ++this.stalls>=3?this.lower():false;}
    this.stalls=0;
    if(this.warm<this.warmupSeconds){this.warm+=seconds;return false;}
    this.time+=seconds;this.frames++;
    if(this.time<this.windowSeconds)return false;
    const fps=this.fps=this.frames/this.time;this.time=0;this.frames=0;
    if(fps<(this.tier==='high'?SLOW_FPS:CRAWL_FPS))return this.lower();
    if(this.tier==='fast'&&fps>SMOOTH_FPS&&this.scale===1&&!this.locked){
      if(++this.good>=3){this.tier='high';this.rest();return true;}
    }else this.good=0;
    return false;
  }
}
