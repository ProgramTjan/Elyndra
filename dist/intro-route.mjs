export const INTRO_SHOTS=[
{duration:5.5,from:[8,18,72],to:[-16,12,22],look:[-48,25,-65],title:'Een woud dat zich herinnert.',text:'Lang geleden leerden natuur en machines voor elkaar te zorgen.'},
{duration:5.5,from:[43,22,-60],to:[66,15,-79],look:[66,13,-110],title:'Vier hartslagen zijn stilgevallen.',text:'Wortels, poorten en tuinen wachten op iemand die hun taal begrijpt.'},
{duration:5.5,from:[-55,76,-128],to:[-126,69,-151],look:[-96,43,-180],title:'Herstel wat hen verbindt.',text:'Los vier verschillende puzzels op. Elke oplossing onthult een verborgen visioen.'},
{duration:5.5,from:[118,27,70],to:[103,21,58],look:[86,17,36],title:'Het kleinste gebaar kan een wereld wekken.',text:'Geen haast. Geen strijd. Alleen jouw nieuwsgierigheid.'}
];
export const INTRO_DURATION=INTRO_SHOTS.reduce((s,x)=>s+x.duration,0);
export function introFrame(elapsed){let time=Math.max(0,Math.min(INTRO_DURATION,elapsed)),start=0,index=0;while(index<INTRO_SHOTS.length-1&&time>=start+INTRO_SHOTS[index].duration){start+=INTRO_SHOTS[index].duration;index++}const shot=INTRO_SHOTS[index],local=time-start,t=Math.min(1,local/shot.duration),ease=t*t*(3-2*t),position=shot.from.map((x,i)=>x+(shot.to[i]-x)*ease),d=shot.look.map((x,i)=>x-position[i]);return{index,position,yaw:Math.atan2(d[0],-d[2]),pitch:Math.atan2(d[1],Math.hypot(d[0],d[2])),fade:Math.max(0,1-local/.45,1-(shot.duration-local)/.45),progress:time/INTRO_DURATION,done:elapsed>=INTRO_DURATION}}
