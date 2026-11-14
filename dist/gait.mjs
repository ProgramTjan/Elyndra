// Loopgevoel: een korte aanloop en uitloop in plaats van aan/uit bewegen,
// en een kleine deining van de blik in het ritme van de voetstappen.
import {STRIDE} from './soundscape.mjs?v=story52';

// Beweeg de snelheid naar het doel toe. Te voet snel en vast, vliegend met meer zweef.
export function glide(velocity,target,seconds,flying=false){
  const moving=Math.hypot(target[0],target[1],target[2])>.01;
  const rate=flying?(moving?4.5:5):(moving?12:20);
  const k=1-Math.exp(-rate*Math.max(0,seconds));
  const next=velocity.map((v,i)=>v+(target[i]-v)*k);
  return next.map(v=>Math.abs(v)<.002?0:v);
}

export class HeadBob{
  constructor(){this.phase=0;this.amount=0;}
  // distance: afgelegde meters in dit beeld. Geeft de verticale verschuiving van de blik (m).
  update(distance,{grounded=true,running=false,still=false}={},seconds=1/60){
    const walking=grounded&&!still&&distance>0&&distance<2;
    const stride=running?STRIDE.run:STRIDE.walk;
    if(walking)this.phase=(this.phase+distance/stride*Math.PI)%(Math.PI*2);
    const want=walking?(running?.075:.045):0;
    this.amount+=(want-this.amount)*(1-Math.exp(-8*Math.max(0,seconds)));
    if(this.amount<.0005){this.amount=0;return 0;}
    return -Math.abs(Math.sin(this.phase))*this.amount; // de blik zakt licht bij elke stap
  }
}
