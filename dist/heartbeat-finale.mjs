// The four colours and tones follow the rhythms in the chronicle (water, light,
// breath, voice), regardless of which one the visitor happened to restore last.
export const HEARTBEATS = [
  {name:'Het water', words:'Uit de wortels klimt een draad van warm licht. Daaronder loopt het water weer.', colour:[1,.66,.22], note:261.63, from:[-13,-15,3]},
  {name:'Het licht', words:'De lichtpoort antwoordt. Een blauwe gloed strijkt langs de bast, en de kleuren worden dieper.', colour:[.2,.9,1], note:329.63, from:[-15,1,-5]},
  {name:'De adem', words:'Uit de tuinen daalt een groene adem. Eerst zingt één vogel, dan zingen ze allemaal.', colour:[.57,1,.42], note:392, from:[-9,10,-1]},
  {name:'De stem', words:'De moswachter buigt zijn hoofd. “Bewaar iets dat nog kan groeien.” In zijn hand beweegt het zaad.', colour:[1,.8,.47], note:523.25, from:[-10,-5,-6]}
];
export const BEAT_SECONDS = 4;
export const FINALE_SECONDS = 18;

// Paths arrive from the roots, the gate, the sky and the keeper's chest.
// In reduced motion the same colours appear as stationary lights at the bud.
export function addHeartbeatLights(sparks, tip, elapsed, reduced) {
  const beat = Math.min(3, Math.floor(elapsed / BEAT_SECONDS));
  const travel = Math.min(1, (elapsed - beat * BEAT_SECONDS) / 2.8);
  for (let i = 0; i <= beat; i++) {
    const {colour, from} = HEARTBEATS[i];
    const angle = i * Math.PI / 2;
    const end = [tip[0] + 1.1 * Math.cos(angle), tip[1] + 2.1, tip[2] + 1.1 * Math.sin(angle)];
    const moving = i === beat && travel < 1 && !reduced;
    const count = moving ? 6 : 1;
    for (let j = 0; j < count; j++) {
      const t = moving ? Math.max(0, travel - j * .055) : 1;
      const p = end.map((v,k) => v + from[k] * (1-t));
      p[1] += 2.2 * Math.sin(t * Math.PI);
      sparks.push({p, c:colour, k:1-j*.12, size:j === 0 ? 1.2 : .50});
    }
  }
}
