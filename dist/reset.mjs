import {WONDERS,readJournal} from './wonder-journal.mjs';

// Terugkeren naar een eerdere situatie. Alle voortgang staat in localStorage onder
// sleutels die met 'elyndra-' beginnen; hier staat welke sleutel waartoe hoort en
// hoe een checkpoint de verhaalsleutels herschrijft. Puur rekenwerk op een storage-
// object (getItem/setItem/removeItem), dus zonder browser te testen.
export const GROUPS = Object.freeze({
  // Voorkeuren, geen voortgang: een herstel raakt ze nooit aan.
  settings: Object.freeze(['elyndra-quality', 'elyndra-auto-tier', 'elyndra-calm-hud', 'elyndra-weather']),
  // De vier hartslagen (puzzelstand) en de finale die erop volgt.
  rhythms: Object.freeze(['elyndra-heartbeats-v1', 'elyndra-four-heartbeats-v1']),
  // De drie hoofdstukken van de samenkomst. De bron van de vos hoort erbij: de vos kan pas
  // uitnodigen als zijn bron is gevonden (world.js: foxInvitation.available eist springFound),
  // en het reismenu-knopje 'Ontdek plekken' voor de bron bestaat alleen voor dat hoofdstuk.
  gathering: Object.freeze(['elyndra-gathering-squirrel-v1', 'elyndra-gathering-fox-v1', 'elyndra-gathering-dragon-v1', 'elyndra-fox-spring-v1']),
  // Het zaad en de plek waar het blijft (nieuw; JSON {place, phase}).
  ending: Object.freeze(['elyndra-seed-v1']),
  // Het journaal van gevonden wonderen in het reismenu (JSON-lijst van id's).
  wonders: Object.freeze(['elyndra-wonders-v1']),
  // Ontmoetingen met bewoners en plekken. Dit is geheugen van wie je kent, geen verhaalstand:
  // een herstel naar eerder laat je die gezichten houden, tenzij de speler zelf vergeet.
  meetings: Object.freeze(['elyndra-met-dwellers', 'elyndra-starcoats-v1', 'elyndra-realm-v1', 'elyndra-keeper-light-v1',
    'elyndra-conversations-v1', 'elyndra-secret-garden', 'elyndra-squirrel-monument-v1', 'elyndra-dragon-known']),
});

export const CHECKPOINTS = Object.freeze([
  Object.freeze({id: 'begin', label: 'Het begin', description: 'De vallei is stil. Niets is nog gewekt.'}),
  Object.freeze({id: 'awake', label: 'De vallei is gewekt', description: 'Vier ritmes klinken. De samenkomst moet nog beginnen.'}),
  Object.freeze({id: 'gathered', label: 'De samenkomst is compleet', description: 'Eekhoorn, vos en draak zijn er. Het zaad wacht op een plek.'}),
]);

const [HEARTBEATS, FINALE] = GROUPS.rhythms;
const [SQUIRREL, FOX, DRAGON, SPRING] = GROUPS.gathering;
const [SEED] = GROUPS.ending;
const ORDER = ['begin', 'awake', 'gathered', 'ended'];

const read = (storage, key) => { try { const v = storage.getItem(key); return typeof v === 'string' ? v : null; } catch { return null; } };
const parse = raw => { try { return JSON.parse(raw); } catch { return null; } };

// Leest dezelfde formaten als de echte laders, maar laat bij kapotte waarden de veilige stand over.
export function progress(storage) {
  const state = {rhythms: 0, finale: false, gathering: 'none', ending: null, wonders: 0, stage: 'begin'};
  const beats = parse(read(storage, HEARTBEATS));
  if (beats && beats.version === 1 && Array.isArray(beats.solved)) state.rhythms = [0, 1, 2, 3].filter(i => beats.solved[i] === true).length;
  state.finale = read(storage, FINALE) === 'bloom';
  // De hoofdstukken volgen elkaar op (vos na eekhoorn, draak na vos): de verste afgeronde in die rij.
  if (read(storage, SQUIRREL) === 'done') {
    state.gathering = 'squirrel';
    if (read(storage, FOX) === 'done') { state.gathering = 'fox'; if (read(storage, DRAGON) === 'done') state.gathering = 'dragon'; }
  }
  const seed = parse(read(storage, SEED));
  if (seed && typeof seed === 'object' && !Array.isArray(seed) && typeof seed.place === 'string' && typeof seed.phase === 'string') state.ending = {place: seed.place, phase: seed.phase};
  try { state.wonders = readJournal(storage).length; } catch {}
  // De finale is geen voorwaarde voor de samenkomst (alleen vier ritmes), dus ook hier niet.
  state.stage = state.ending ? 'ended' : state.rhythms === 4 && state.gathering === 'dragon' ? 'gathered' : state.rhythms === 4 ? 'awake' : 'begin';
  return state;
}

export function reachable(storage, {all = false} = {}) {
  if (all) return [...CHECKPOINTS];
  const at = ORDER.indexOf(progress(storage).stage);
  return CHECKPOINTS.filter(c => ORDER.indexOf(c.id) <= at);
}

// Wat een checkpoint bewaart: een waarde per sleutel, of null als de sleutel er niet hoort te zijn.
const SOLVED = JSON.stringify({version: 1, solved: [true, true, true, true], hints: [0, 0, 0, 0]});
const PLANS = {
  begin: {[HEARTBEATS]: null, [FINALE]: null, [SQUIRREL]: null, [FOX]: null, [DRAGON]: null, [SPRING]: null, [SEED]: null},
  awake: {[HEARTBEATS]: SOLVED, [FINALE]: 'bloom', [SQUIRREL]: null, [FOX]: null, [DRAGON]: null, [SPRING]: null, [SEED]: null},
  gathered: {[HEARTBEATS]: SOLVED, [FINALE]: 'bloom', [SQUIRREL]: 'done', [FOX]: 'done', [DRAGON]: 'done', [SPRING]: 'found', [SEED]: null},
};

export function applyCheckpoint(storage, id) {
  const plan = PLANS[id];
  if (!plan || !CHECKPOINTS.some(c => c.id === id)) throw new RangeError('Onbekend checkpoint: ' + id);
  const changed = [];
  for (const [key, value] of Object.entries(plan)) {
    try {
      const before = storage.getItem(key);
      if (value === null) { if (before !== null && before !== undefined) { storage.removeItem(key); changed.push(key); } }
      else if (before !== value) { storage.setItem(key, value); changed.push(key); }
    } catch {}
  }
  return changed;
}

// Alleen wat de speler zelf mag vergeten; verhaalsleutels gaan uitsluitend via een checkpoint.
export function forget(storage, group) {
  if (group !== 'wonders' && group !== 'meetings') throw new RangeError('Alleen wonderen of ontmoetingen kunnen worden vergeten: ' + group);
  const removed = [];
  for (const key of GROUPS[group]) {
    try {
      const before = storage.getItem(key);
      if (before !== null && before !== undefined) { storage.removeItem(key); removed.push(key); }
    } catch {}
  }
  return removed;
}

const WORDS = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'];
const word = n => WORDS[n] ?? String(n);
const SPOKEN = {begin: 'het begin', awake: 'de vallei is gewekt', gathered: 'de samenkomst is compleet', ended: 'het slot van het verhaal'};

export function describe(storage) {
  const {stage, wonders} = progress(storage), total = WONDERS.length;
  const found = wonders === 0 ? 'Nog geen wonderen gevonden.'
    : wonders >= total ? `Alle ${word(total)} wonderen gevonden.`
    : `${(wonders === 1 ? 'Eén' : word(wonders).replace(/^./, c => c.toUpperCase()))} van de ${word(total)} wonderen gevonden.`;
  return `Je bent bij: ${SPOKEN[stage]}. ${found}`;
}
