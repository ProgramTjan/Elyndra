# Contract for in-world minigames and story modules

Read this fully before writing code. The world is a hand-written WebGL2 game in `dist/` (no build step, ES modules served as-is). `dist/world.js` is a large, dense file that only the lead integrates into; **module authors never edit `world.js`, `index.html`, `style.css` or files not listed in their task**.

## Coordinates and helpers

- World units are metres. `x` east, `z` south (north is `-z`), `y` up. Player eye is `ground(x,z)+2.4` on foot. `yaw=0` looks north; forward is `(sin(yaw), -cos(yaw))`.
- `ground(x,z)` returns terrain height. River/lake water surface is `y=-2.3`.
- A module receives the helpers it needs as arguments; it never imports `world.js`.

Mesh-building kit (same object other creators receive): 

```js
{orb, cone, beam, curveTube, tri, upload, material}
orb(x,y,z, rx,ry,rz, colour, segments=12, rings=7)      // ellipsoid, smooth normals
cone(x,y,z, r1,r2,h, colour, sides=8)                   // tapered cylinder standing on y, r1 bottom, r2 top
beam(a,b, radius, colour)                               // a,b are [x,y,z]
curveTube(points, radii, colour, sides=10)              // polyline tube; give >=6 points for smooth curves
tri(a,b,c, colour)                                      // one-sided triangle; call twice with swapped winding for two-sided
material(n)                                             // 0 plain, 1 ground, 2 leaf (translucent), 3 rock, 4 water, 5 bark/wood
upload()                                                // finishes everything built since the previous upload and returns a mesh handle
```

- Colours are `[r,g,b]` in 0..1. **Any channel above 1.01 makes the surface emissive** (it glows and blooms), e.g. `[.4,1.4,1.25]` teal light, `[1.6,.9,.3]` warm light.
- Always call `material(0)` before returning. Use your own seeded random generator (`let seed=…; const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;`), never `Math.random()` for geometry.
- Keep geometry modest: a minigame's scenery should stay under ~6,000 triangles.

## Minigame interface

Each minigame is one file `dist/minigame-<name>.mjs` exporting a class and a mesh creator:

```js
export class <Name>Game {
  constructor(ground, options)          // computes all positions from ground(); options may carry tuning
  solved                                // boolean (settable by the lead when progress is restored: game.solved=true)
  begun                                 // true once the visitor has interacted at least once
  near(pos)                             // boolean: is the visitor in the play area (used to show the objective note)
  prompt(pos, {flying})                 // string|null: label for the action button right now, in Dutch, <= 28 chars (e.g. 'Draai de sluis')
  interact(pos, {flying, yaw})          // called when the action button is pressed; returns events[]
  update(seconds, pos, {moving, flying, yaw})   // every frame; returns events[] (usually empty)
  words()                               // [title, text] in Dutch for the objective note, or null. Must change as progress changes.
  visuals(clock, reduced)               // {parts:[{mesh:'key', position:[x,y,z], rotation:radiansAroundY}], motes:[[x,y,z],...]}
  snapshot()                            // plain JSON-able state for tests/debugging
  reset()                               // back to the unsolved starting state
}
export function create<Name>Meshes(kit, ground)   // returns {scenery: mesh, <key>: mesh, ...}
```

- `events` is an array of `{type:'solved'}`, `{type:'toast', text}`, `{type:'bell', note, pan?}` (a soft glass bell at `note` Hz), `{type:'chime'}`, `{type:'step', surface}`.  Emit `{type:'solved'}` exactly once.
- `scenery` is the static part, built in world coordinates and always drawn at the origin. Movable or state-dependent pieces are separate small meshes built **around the local origin** and placed through `visuals().parts` (translation and rotation about the y axis only; no scaling). To show something lit/unlit, build two meshes and pick one.
- `motes` are small floating lights the world draws for you (an existing sprite-like mesh). Use them for beams of light, flowing water sparkles, guidance. Keep under 80 per frame; return fewer when `reduced` is true and never animate when `reduced` is true.
- **Design rules (the game's DNA):** no timer, no fail state, nothing can be lost; mistakes just leave things as they were. Playable on a phone with one thumb: the only inputs are walking/flying to a place and pressing one action button. Standing still is valued. A session takes two to four minutes. Give gentle escalating guidance through `words()` if the visitor lingers (e.g. after 90 s and 180 s without progress, name the next useful step).
- Everything must be deterministic given the same inputs (no `Date`, no `Math.random` in logic unless injected).
- Interaction distance: a station can be used within 3.2 m on foot.

## Tests

Each module ships `tests/<file>.test.mjs` using `node:test` and `node:assert/strict`, importing from `../dist/…`. Test the logic, a full winning playthrough via the public interface, that it cannot be solved by accident (random walking), `reset()`, `words()` changing, `visuals()` returning finite numbers and existing mesh keys, and that the mesh creator runs with a stub kit:

```js
const kit=()=>{let n=0;const f=()=>{};return {orb:f,cone:f,beam:f,curveTube:f,tri:f,material:f,upload:()=>({id:++n})};};
```

Run only your own test file (`node --test tests/<file>.test.mjs`) until it passes. Do not run git commands. Do not start servers or browsers.

## Style

Dense but readable ES modules, Dutch comments explaining the *why*, Dutch player-facing text in the tone of `docs/verhaal.md` (quiet, short sentences, no exclamation marks). Look at `dist/dragon-guest.mjs`, `dist/realm.mjs` and `tests/realm.test.mjs` for the house style.

## What to report back

The exported names, the mesh keys, every tunable position constant (so the lead can move the play area if it collides with trees), and anything you were unsure about.
