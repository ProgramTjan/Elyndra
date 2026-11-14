export const INTRO_SHOTS=[
{duration:5.5,from:[8,18,72],to:[-16,12,22],look:[-48,25,-65],title:'Eens ademde deze vallei.',text:'Water, licht, adem en stem. Vier ritmes, en alles wat leefde bewoog erop mee.'},
{duration:5.5,from:[43,22,-60],to:[66,15,-79],look:[66,13,-110],title:'Toen kwam de stilte.',text:'De beek zakte tot een draad. De poort doofde, de tuinen hielden hun adem in, de wachter zweeg.'},
{duration:5.5,from:[-55,76,-128],to:[-126,69,-151],look:[-96,43,-180],title:'Eén zaad is er nog.',text:'Het wacht op een vallei die weer ademt. Geef elke plek haar ritme terug, daar, met je eigen handen.'},
{duration:5.5,from:[118,27,70],to:[103,21,58],look:[86,17,36],title:'Het kleinste gebaar kan een wereld wekken.',text:'Geen haast. Geen strijd. Als de vier ritmes terug zijn, zoekt het zaad een plek. Die kies jij.'}
];
export const INTRO_DURATION=INTRO_SHOTS.reduce((s,x)=>s+x.duration,0);
export function introFrame(elapsed){let time=Math.max(0,Math.min(INTRO_DURATION,elapsed)),start=0,index=0;while(index<INTRO_SHOTS.length-1&&time>=start+INTRO_SHOTS[index].duration){start+=INTRO_SHOTS[index].duration;index++}const shot=INTRO_SHOTS[index],local=time-start,t=Math.min(1,local/shot.duration),ease=t*t*(3-2*t),position=shot.from.map((x,i)=>x+(shot.to[i]-x)*ease),d=shot.look.map((x,i)=>x-position[i]);return{index,position,yaw:Math.atan2(d[0],-d[2]),pitch:Math.atan2(d[1],Math.hypot(d[0],d[2])),fade:Math.max(0,1-local/.45,1-(shot.duration-local)/.45),progress:time/INTRO_DURATION,done:elapsed>=INTRO_DURATION}}
