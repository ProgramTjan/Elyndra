// Het geluid van de vallei: voetstappen per ondergrond, vogels per dagdeel,
// de rivier die je hoort naderen en krekels in de nacht.
// Bovenaan staat het rekenwerk (zonder audio te testen), onderaan de klank zelf.
// Alles is gesynthetiseerd; er worden geen geluidsbestanden geladen.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));

// ── Voetstappen ─────────────────────────────────────────────────────────────
export const STRIDE=Object.freeze({walk:2.9,run:4.1});
export function surfaceAt({height=0,water=-99,onBridge=false,wet=0}={}){
  if(onBridge)return 'wood';
  if(height<water+.12)return 'water';
  return wet>.4?'wet':'grass';
}
export class Footsteps{
  constructor(){this.travel=0;this.side=1;}
  // distance: afgelegde meters sinds het vorige beeld. Geeft -1 (links), 1 (rechts) of 0.
  update(distance,{grounded=true,running=false}={}){
    if(!grounded||!(distance>0)||distance>2){if(!grounded)this.travel=0;return 0;} // vliegen of reizen maakt geen stap
    this.travel+=distance;
    const stride=running?STRIDE.run:STRIDE.walk;
    if(this.travel<stride)return 0;
    this.travel=0;this.side=-this.side;return this.side;
  }
}

// ── Stilte ──────────────────────────────────────────────────────────────────
// Wie stilstaat, hoort het woud terugkomen. Rennen jaagt de vogels even weg.
export class Stillness{
  constructor(){this.value=.35;}
  update(seconds,{moving=false,running=false}={}){
    const rate=running?-1/1.5:moving?-1/14:1/18;
    this.value=clamp(this.value+rate*Math.max(0,seconds));
    return this.value;
  }
}

// ── Vogels per dagdeel ──────────────────────────────────────────────────────
export const SPECIES=Object.freeze(['robin','blackbird','wren','tit','chiffchaff','cuckoo','owl']);
const HOURS=[
  // van, tot, rust tussen zangers (s), wie er zingt, krekels
  [5,7.5,[1.2,3.5],{robin:3,blackbird:3,wren:2,tit:2,chiffchaff:1},0],
  [7.5,11,[3,7],{tit:3,chiffchaff:3,robin:2,wren:1,cuckoo:.4},0],
  [11,16,[7,15],{chiffchaff:2,tit:2,cuckoo:.3},0],
  [16,18.2,[4,9],{blackbird:3,robin:2,tit:1},.1],
  [18.2,20.6,[5,11],{blackbird:4,robin:2},.5],
];
const NIGHT=[[14,28],{owl:1},1];
export function chorusProfile(hour,{rain=0}={}){
  const h=((hour%24)+24)%24,row=HOURS.find(r=>h>=r[0]&&h<r[1]);
  const [gap,species,crickets]=row?row.slice(2):NIGHT;
  const hush=1+2.5*clamp(rain); // in de regen houden de meeste vogels zich stil
  return {gap:[gap[0]*hush,gap[1]*hush],species,crickets:crickets*(1-clamp(rain))};
}
export class BirdChorus{
  constructor(random=Math.random){this.random=random;this.wait=2.5;}
  update(seconds,profile,stillness=.5){
    this.wait-=Math.max(0,seconds)*(.55+1.1*clamp(stillness));
    if(this.wait>0)return null;
    const r=this.random,[min,max]=profile.gap;this.wait=min+(max-min)*r();
    const names=Object.keys(profile.species),total=names.reduce((s,n)=>s+profile.species[n],0);
    let pick=r()*total,species=names[names.length-1];
    for(const n of names){pick-=profile.species[n];if(pick<=0){species=n;break;}}
    return {species,pan:r()*1.6-.8,distance:species==='cuckoo'||species==='owl'?.6+.4*r():.15+.85*r()};
  }
}

// ── Achter de poort ─────────────────────────────────────────────────────────
// Geen vogels daar: een zacht akkoord, glazen klokjes en druppels bij de poel.
// Wie stilstaat, hoort meer klokjes, zoals het woud in de vallei meer gaat zingen.
export const BELL_NOTES=Object.freeze([392,440,523.25,587.33,659.25,783.99,880]);
export class RealmChimes{
  constructor(random=Math.random){this.random=random;this.bell=3;this.drip=1.5;}
  update(seconds,{stillness=.5,poolDistance=99}={}){
    const dt=Math.max(0,seconds),r=this.random,events=[];
    this.bell-=dt*(.5+1.3*clamp(stillness));
    if(this.bell<=0){this.bell=3.5+r()*6;events.push({type:'bell',note:BELL_NOTES[Math.floor(r()*BELL_NOTES.length)],pan:r()*1.6-.8,distance:.2+.8*r()});}
    if(poolDistance<32){this.drip-=dt;if(this.drip<=0){this.drip=.9+r()*3.2;events.push({type:'drip',distance:clamp(poolDistance/32)});}}
    return events;
  }
}

// ── De rivier ───────────────────────────────────────────────────────────────
// across: afstand tot de oever, dwars op de stroom; positief = rivier ligt in +x.
export function riverPresence({across=0,height=0,yaw=0,reach=48}={}){
  const near=clamp(1-Math.abs(across)/reach)*clamp(1-height/70,.2,1);
  return {level:near*near,pan:clamp(Math.cos(yaw)*across/14,-1,1),bright:near};
}

// ── Zangpartijen: lijsten van noten {at, dur, from, to, amp, vib} ────────────
export function phrase(species,random=Math.random){
  const r=random,n=[];let t=0;
  const note=(dur,from,to=from,amp=1,vib=0)=>{n.push({at:t,dur,from,to,amp,vib});t+=dur;};
  const rest=s=>{t+=s;};
  if(species==='tit'){const hi=3900+r()*500,lo=hi*.78,k=3+Math.floor(r()*2);for(let i=0;i<k;i++){note(.11,hi,hi*.99);rest(.04);note(.13,lo,lo*.98);rest(.09);}}
  else if(species==='chiffchaff'){const k=6+Math.floor(r()*4);for(let i=0;i<k;i++){const f=r()<.55?4500:3800;note(.085,f*1.05,f*.93,.9);rest(.13+r()*.03);}}
  else if(species==='robin'){const k=6+Math.floor(r()*5);for(let i=0;i<k;i++){const f=2400+r()*2800;note(.06+r()*.16,f,f*(.8+r()*.45),.6+r()*.4,r()<.3?.03:0);rest(.03+r()*.12);}}
  else if(species==='blackbird'){const k=4+Math.floor(r()*3);for(let i=0;i<k;i++){const f=1700+r()*1200;note(.18+r()*.2,f,f*(.9+r()*.25),1,.012);rest(.05+r()*.08);}rest(.06);note(.05,4300+r()*600,5200,.35);rest(.03);note(.07,5000,4200,.3);}
  else if(species==='wren'){let f=5600;for(let i=0;i<3;i++){note(.07,f,f*.9,.8);rest(.04);f*=.92;}const k=14+Math.floor(r()*7),c=5000+r()*500;for(let i=0;i<k;i++){note(.034,c*1.04,c*.96,.9);rest(.028);}}
  else if(species==='cuckoo'){const k=2+Math.floor(r()*2);for(let i=0;i<k;i++){note(.2,668,662,1);rest(.13);note(.3,542,534,1);rest(.85);}}
  else if(species==='owl'){note(.55,372,348,1,.02);rest(1.1);note(.16,360,350,.7);rest(.12);note(.8,366,338,1,.035);}
  return n;
}
export function phraseSeconds(notes){return notes.reduce((m,x)=>Math.max(m,x.at+x.dur),0);}

// ── De klank ────────────────────────────────────────────────────────────────
export function createVoices(ctx,out){
  const now=()=>ctx.currentTime;
  const panner=()=>ctx.createStereoPanner?ctx.createStereoPanner():null;
  const chain=(...nodes)=>{const real=nodes.filter(Boolean);for(let i=0;i<real.length-1;i++)real[i].connect(real[i+1]);return real[0];};
  const gain=v=>{const g=ctx.createGain();g.gain.value=v;return g;};
  const filter=(type,f,q=.7)=>{const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;return b;};

  // Een zachte echo geeft de droge synthese ruimte: het woud antwoordt.
  let air=null;
  if(ctx.createDelay){
    air=gain(1);const delay=ctx.createDelay(.5),damp=filter('lowpass',2600),back=gain(.3),wet=gain(.4);
    delay.delayTime.value=.19;air.connect(delay);delay.connect(damp);damp.connect(back);back.connect(delay);damp.connect(wet);wet.connect(out);
  }

  const seconds=2,buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*seconds),ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const noise=(loop=false)=>{const s=ctx.createBufferSource();s.buffer=buffer;s.loop=loop;return s;};

  // Korte ruisstoot met een omhullende: de basis van elke stap.
  function burst(t,{type='bandpass',f=800,q=.8,peak=.1,attack=.004,decay=.1,to=null,top=2400,dest}){
    const s=noise(),b=filter(type,f,q),ceiling=filter('lowpass',top,.5),g=gain(0);
    if(to)b.frequency.exponentialRampToValueAtTime(to,t+attack+decay);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+attack);g.gain.exponentialRampToValueAtTime(.0005,t+attack+decay);
    chain(s,b,ceiling,g,dest);s.start(t,Math.random()*(seconds-.6));s.stop(t+attack+decay+.05);
  }
  function thump(t,{from=80,to=50,peak=.1,decay=.07,dest}){
    const o=ctx.createOscillator(),g=gain(0);o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+decay);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.006);g.gain.exponentialRampToValueAtTime(.0005,t+decay);
    chain(o,g,dest);o.start(t);o.stop(t+decay+.05);
  }
  function step(surface,side=1,running=false){
    const t=now()+.01,v=(.85+Math.random()*.3)*(running?1.25:1),p=panner(),dest=gain(v);
    if(p)p.pan.value=side*.16;chain(dest,p,out);
    if(surface==='wood'){thump(t,{from:150,to:92,peak:.2,decay:.09,dest});burst(t,{f:440+Math.random()*90,q:3,peak:.13,decay:.05,top:1600,dest});}
    else if(surface==='water'){burst(t,{f:2200,to:700,q:.7,peak:.3,attack:.015,decay:.3,top:4200,dest});burst(t+.07+Math.random()*.04,{f:3000,q:.9,peak:.1,attack:.01,decay:.18,top:5200,dest});thump(t,{from:120,to:70,peak:.05,decay:.08,dest});}
    else{burst(t,{f:520+Math.random()*320,q:1.1,peak:.3,decay:.11,top:2000,dest});thump(t,{from:78,to:48,peak:.085,decay:.06,dest});
      if(surface==='wet')burst(t+.02,{f:1700,q:1.4,peak:.14,attack:.012,decay:.14,top:3600,dest});}
  }

  function bird(species,{pan=0,distance=.5}={}){
    const notes=phrase(species),t0=now()+.03,far=clamp(distance);
    const low=species==='owl'||species==='cuckoo',level=(low?.11:.05)*(1-.72*far);
    const bus=gain(level),tone=filter('lowpass',low?1800:9500-5500*far),p=panner();
    if(p)p.pan.value=clamp(pan,-1,1);chain(bus,tone,p,out);
    if(air){const send=gain(.35+.6*far);(p??tone).connect(send);send.connect(air);}
    for(const x of notes){
      const t=t0+x.at,o=ctx.createOscillator(),g=gain(0),edge=Math.min(.012,x.dur*.3),soft=low?Math.min(.06,x.dur*.3):edge;
      o.frequency.setValueAtTime(x.from,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,x.to),t+x.dur);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(x.amp,t+soft);g.gain.setValueAtTime(x.amp,t+x.dur-edge);g.gain.linearRampToValueAtTime(0,t+x.dur);
      if(x.vib){const l=ctx.createOscillator(),d=gain(x.from*x.vib);l.frequency.value=low?6:28;l.connect(d);d.connect(o.frequency);l.start(t);l.stop(t+x.dur+.02);}
      chain(o,g,bus);o.start(t);o.stop(t+x.dur+.02);
    }
    return phraseSeconds(notes);
  }

  // De rivier: brede ruis voor de stroom, een heldere band voor het klateren dichtbij.
  const riverGain=gain(0),riverBody=filter('lowpass',600,.5),riverPan=panner(),flow=noise(true);
  chain(flow,riverBody,riverGain,riverPan,out);flow.start();
  const sparkleGain=gain(0),sparkle=filter('bandpass',3400,1.2),flow2=noise(true);
  chain(flow2,sparkle,sparkleGain,riverPan??out);flow2.start(0,.7);
  function setRiver({level=0,pan=0,bright=0}={},ease=.5){
    const t=now();riverGain.gain.setTargetAtTime(level*.26,t,ease);sparkleGain.gain.setTargetAtTime(level*bright*bright*.07,t,ease);
    riverBody.frequency.setTargetAtTime(450+1500*bright,t,ease);if(riverPan)riverPan.pan.setTargetAtTime(pan,t,.3);
  }

  // Krekels: een hoge toon die in korte tsjirpen aan en uit gaat.
  const cricketGain=gain(0);cricketGain.connect(out);
  for(const [f,rate,side] of [[4300,1.25,-.5],[4720,1.6,.55]]){
    const o=ctx.createOscillator(),pulse=gain(0),gate=gain(0),p=panner();o.frequency.value=f;
    const fast=ctx.createOscillator(),fastDepth=gain(.5),slow=ctx.createOscillator(),slowDepth=gain(.5);
    fast.type='square';fast.frequency.value=36;slow.type='square';slow.frequency.value=rate;
    pulse.gain.value=.5;gate.gain.value=.5;fast.connect(fastDepth);fastDepth.connect(pulse.gain);slow.connect(slowDepth);slowDepth.connect(gate.gain);
    if(p)p.pan.value=side;chain(o,pulse,gate,p,cricketGain);o.start();fast.start();slow.start();
  }
  function setCrickets(level=0,ease=2){cricketGain.gain.setTargetAtTime(level*.02,now(),ease);}

  // Achter de poort: een zwevend akkoord dat langzaam ademt.
  const realmGain=gain(0),realmTone=filter('lowpass',1500,.6);chain(realmTone,realmGain,out);if(air){const send=gain(.5);realmGain.connect(send);send.connect(air);}
  for(const [f,level,rate] of [[196,.5,.07],[293.66,.36,.11],[392,.3,.05],[493.88,.16,.09],[587.33,.12,.13]]){
    const o=ctx.createOscillator(),v=gain(level*.5),l=ctx.createOscillator(),d=gain(level*.5);o.frequency.value=f*(1+(Math.random()-.5)*.004);l.frequency.value=rate;
    l.connect(d);d.connect(v.gain);chain(o,v,realmTone);o.start();l.start();}
  function setRealm(level=0,ease=1.5){realmGain.gain.setTargetAtTime(level*.06,now(),ease);}
  // Een glazen klokje: grondtoon met een hoge boventoon en een lange uitklank.
  function bell(note=523.25,{pan=0,distance=.5}={}){
    const t=now()+.02,far=clamp(distance),bus=gain((1-.6*far)*.09),p=panner();if(p)p.pan.value=clamp(pan,-1,1);chain(bus,p,out);
    if(air){const send=gain(.5+.5*far);(p??bus).connect(send);send.connect(air);}
    for(const [ratio,level,decay] of [[1,1,2.6],[2.76,.32,1.1],[5.4,.1,.5]]){const o=ctx.createOscillator(),g=gain(0);o.frequency.value=note*ratio;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level,t+.006);g.gain.exponentialRampToValueAtTime(.0004,t+decay);chain(o,g,bus);o.start(t);o.stop(t+decay+.05);}
  }
  // Een druppel in stil water.
  function drip({distance=.5,pan=.3}={}){
    const t=now()+.02,o=ctx.createOscillator(),g=gain(0),p=panner(),f=900+Math.random()*700;if(p)p.pan.value=pan;
    o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.9,t+.07);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07*(1-.7*clamp(distance)),t+.004);g.gain.exponentialRampToValueAtTime(.0004,t+.16);
    chain(o,g,p,out);if(air){const send=gain(.6);g.connect(send);send.connect(air);}o.start(t);o.stop(t+.2);
  }
  // De zachte roep van een sterrenvacht: twee lage fluittonen.
  function call({pan=0}={}){
    const t=now()+.05,bus=gain(.07),tone=filter('lowpass',1400),p=panner();if(p)p.pan.value=clamp(pan,-1,1);chain(bus,tone,p,out);if(air){const send=gain(.8);(p??tone).connect(send);send.connect(air);}
    for(const [at,from,to,dur] of [[0,330,392,.55],[.7,392,349,.8]]){const o=ctx.createOscillator(),g=gain(0);o.frequency.setValueAtTime(from,t+at);o.frequency.exponentialRampToValueAtTime(to,t+at+dur);
      g.gain.setValueAtTime(0,t+at);g.gain.linearRampToValueAtTime(1,t+at+.12);g.gain.setValueAtTime(1,t+at+dur-.2);g.gain.linearRampToValueAtTime(0,t+at+dur);chain(o,g,bus);o.start(t+at);o.stop(t+at+dur+.05);}
  }
  return {step,bird,setRiver,setCrickets,setRealm,bell,drip,call};
}
