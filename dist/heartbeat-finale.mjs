// The four colours and tones follow the letters in the adventure overview,
// regardless of which puzzle the visitor happened to finish last.
export const HEARTBEATS = [
  {name:'Het geheugen', words:'Een draad van honingkleurig licht klimt uit de wortels naar zijn hand.', colour:[1,.66,.22], note:261.63, from:[-13,-15,3]},
  {name:'De drempel', words:'De lichtpoort antwoordt. Een blauwe gloed strijkt langs de bast.', colour:[.2,.9,1], note:329.63, from:[-15,1,-5]},
  {name:'Het evenwicht', words:'Een zaaddrone daalt uit de tuinen en wacht boven het jonge hout.', colour:[.57,1,.42], note:392, from:[-9,10,-1]},
  {name:'De stem', words:'De moswachter buigt zijn hoofd. “Bewaar iets dat nog kan groeien.” Een blad vouwt open.', colour:[1,.8,.47], note:523.25, from:[-10,-5,-6]}
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
