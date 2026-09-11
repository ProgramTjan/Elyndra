# Elyndra: smaller, richer, more natural

User direction: improve in deliberate stages. Prefer a compact, realistic environment over a large, sparsely detailed world. Nature remains dominant; ancient fantasy and benevolent robotics coexist. Preserve public access, free movement, mobile controls, and the four photorealistic visions.

## Stage 1 — implemented

- Travel footprint reduced from 620 × 620 to 310 × 415 world units (about 67% less area). Retain all five destinations at their established coordinates.
- Closer starting view, slower walking, connecting trails, forested edges.
- Fine terrain mesh with smooth normals, procedural ground and bark variation.
- Individual moving canopy leaves, ferns, grass, mossy riverbank stones.
- Directional shadow map with soft sampling; atmospheric sky, clouds and sun.
- Animated water shading with view-dependent sky reflection and sun highlights (not scene reflections).
- Smooth ellipsoid surfaces for existing creatures and robot details; trunk collision.
- Reduced foliage density and shadow resolution for touch devices.
- Preserve four vision images, creature hotspots, camera-position restoration, portal, day/night and sound.

Validation: JavaScript syntax, actual EGL shader compilation/linking for scene/sky/depth programs, finite geometry buffers, desktop/mobile scene startup and movement/control integration in a mock DOM. No browser visual QA or measured device frame-rate benchmark was performed.

## Next bounded stages

1. Root cathedral: detailed hero tree and bark/root/leaf materials, designed micro-clearings, stonework and convincing scale. Use the existing root-cathedral render as the reference direction.
2. Gate and gardens: richer weathered masonry, water edges, convincing island undersides and waterfalls; maintain a limited view area rather than expanding terrain.
3. Inhabitants: better anatomically coherent models, articulated animation, ground contact, believable idle behavior and spatial sound.

Treat the renders as art direction, not as a claim that real-time graphics already match their photorealism. Keep the user involved between stages. Do not expand world size or remove the existing visions to improve rendering performance.

## Game layer — The four heartbeats

User requested setting-specific, fun and challenging puzzles with the four renders as rewards. Integrated a 4×4 rotating root network, a six-rune ordering deduction, a three-of-six vector balance, and a visual memory sequence of 3/5/7 signals. Logic and balance puzzles each have exactly one solution.

Each solved puzzle unlocks its existing vision, updates nearby prompts, and creates a light celebration at the landmark. Solving the gate also activates the portal. The Avontuur overview and nearby V interaction both launch puzzles; direct gallery navigation respects unlocks. Progress, partial puzzle inputs, memory round and hint counts persist in device-local storage under elyndra-heartbeats-v1, with graceful in-session fallback if storage fails. Three progressive hints per puzzle; no time limit, score penalty or login. Replay preserves rewards.

Verification: tests/puzzles.test.mjs checks solvability, uniqueness and saved-state recovery. A scratch DOM integration harness exercised all four solutions, a wrong memory input, closing during playback, reward gating, modal handoff/pause and completion. No browser visual QA was performed.

## Opening journey and root-cathedral detail

The welcome screen now offers a 22-second, four-shot in-engine introduction or a direct route to the guide. Captions explain the story without revealing reward images. The film can be skipped, replayed from help and optionally accompanied by the existing ambience. Reduced-motion preference goes straight to the guide.

The guide explains exploration, the four puzzle types and vision rewards, with touch/keyboard-specific instructions. Start at the root cathedral or roam freely. Replaying the film preserves the previous camera position and all game progress. Native modal state continues to pause the world correctly.

Root cathedral: replace the simple cone trunk and straight root cylinders with smooth curved tubes, tapered buttress roots, three higher root arches, irregular branches, hanging vines, luminous seed pods, small fungi, mossy stones and a seed shrine. Add a dedicated procedural bark/moss material. Existing world scale and all puzzle/reward systems remain intact.

Checks: actual EGL scene/sky/depth shader compile/link, finite geometry, tests/intro.test.mjs for camera paths and timing, full and reduced-motion opening/skip/replay/guide integration plus the four-puzzle reward flow. No browser visual QA performed.

## Intro visibility repair

Confirmed live HTML contained the intro and intro-route.mjs was served as JavaScript. Found that reduced-motion automatically bypassed even explicit replay. Explicit Watch intro and Replay now opt into the cinematic; the separate Guide & start button is animation-free. Start buttons remain disabled while modules load, with clear loading/error/retry feedback. A small boot module loads versioned script URLs consistently; static cache headers request revalidation. No puzzle progress is changed. tests/intro-start.test.mjs verifies explicit watch and replay under reduced motion, natural completion, skip, guide-only entry and camera restoration with the real scene controller and mocked WebGL/DOM. This is not an on-device browser reproduction of the user's issue.

## Light-gate refinement and touch look

Horizontal touch look is inverted from its previous direction: dragging right now increases camera yaw. Mouse dragging and vertical movement retain their prior behavior. Pointer-type detection keeps hybrids predictable.

Light gate now has individually modeled stone wedges, two layered pylons with trailing ivy, irregular approach paving, scattered fragments, inset lights and a receding filament tunnel when active. Portal rings no longer rotate about the vertical axis and become edge-on; orbiting particles provide movement instead. Geometry remains in the existing static mesh batch, with a limited active particle budget on phones.

Validation: intro/start controller harness exercises touch and mouse drags and preserved vertical pitch; intro completion/replay/skip and puzzle model checks still pass. No actual-device frame rate or browser visual QA is claimed.


## Floating gardens — iteration 8
Five deliberately placed islands replace seven generic cones. Layered irregular stone, trailing curved roots with foliage, open stone sanctuaries, bent trees, individual flower petals and suspended wooden bridges create closer detail. Existing flight exploration remains; bridges are visual geometry, not new walkable collision surfaces. Travel arrives at garden height. Mobile uses fewer leaves and flowers. Preserve downstream random scenery by advancing the old garden random sequence separately. No new shaders or textures. Validation: JS syntax and mocked startup/intro/control regression; no real-device visual or FPS claim.


## Keeper and flowers — iteration 9
Rebuilt the guardian at the established position and pose with overlapping shell plates, visible joints and pistons, inset heart, lens rims, cupped fingers, curved cables, moss and trailing ivy. Sapling retains the existing leafling on the palm. Replaced scattered flower dots with three petal-based forms, curved stems, paired leaves and clustered colonies, plus a garden at the guardian feet with an open approach. Mobile reduces flower and leaf density. Existing shader programs, puzzles and touch controls unchanged. Checked startup and interaction regression in mocked WebGL; no real-device visual or frame-rate measurement.


## Mountains, leaves and wildlife — iteration 10
Replaced cone peaks with 24-sided, nine-level ridged mountains, offset summits and uneven snowfields. Leaf geometry now folds along a raised central ridge with contrasting halves; reduced leaf counts limit the extra triangles. Deer gains jointed legs, hooves, muzzle, eyes and curved antlers; brook creatures gain eyes, toes, markings and curved tails; dragon gains layered folded feathers and horns; leafling gains eyes, muzzle and leaf plates. Existing locations and gameplay unchanged. Validation uses startup/control regression and finite geometry upload checks, not real-device visual QA.


## Render-quality foundation — iteration 11
Assessment: retain native WebGL2 for the first lighting slice. The renderer already has materials, directional depth shadows and separate sky/water passes; changing engines before a measured need would disrupt working gameplay. Future textured assets, animation and image-based lighting may justify migration. No claim of PBR or true global illumination in this slice.
Added persistent Auto / Smooth / Beautiful settings controlling pixel ratio, shadow resolution and weighted 9/25-tap filtering. Live switching preserves camera and puzzles. Corrected shadow camera to match the shader sun direction. Hemisphere ambient, approximate warm ground bounce, canopy shelter and gentle heart illumination improve the cathedral lighting foundation. A fixed travel viewpoint resets daylight and animation time for future comparisons. Mobile defaults remain conservative. Device frame-rate comparison and real visual before/after remain unmeasured; do not claim otherwise.

Validation: all three shader programs compiled and linked with EGL/OpenGL ES; mocked interaction checks cover live quality switching, camera preservation and repeatable reference viewpoint.


## Material feel — iteration 12
Procedural bark furrows, layered stone with fissures/lichen/moss, and granular soil with patchy dampness. Screen-space surface gradients perturb lighting normals to give actual shading relief; no displacement or scanned/PBR texture claim. Distance fade removes tiny relief beyond 80 world units. Wetness controls subdued specular and darkening, while dry material remains matte. Cathedral approach gains isolated-seed leaf litter, twigs and small stones; mobile reduces their density. Geometry stays in the existing shared mesh. Validation: shader compilation/linking plus finite-geometry/startup/quality/viewpoint interaction checks; real-device appearance/performance unmeasured.


## Cathedral organic forms — iteration 13
Replaced focal-tree spherical leaf distributions with seven asymmetric forks and paired twig sprays per crown. Keeps similar leaf budgets and preserves the old random stream (eight random draws per old leaf). Added tapered bark ridges following the actual trunk radius/centerline, small rootlets, a fallen branch with shelf fungi and fern colonies clear of the path. This is procedural mesh refinement, not scanned or manually sculpted assets. The reference viewpoint and previous material/light improvements remain. Validate finite uploads and startup/control/quality/viewpoint regression; no real-device visual or performance claim.


## Cathedral arrival — iteration 14
Sheltered 25-unit approach with paired curved trunks, lateral fern beds and open centerline. Starting at the tree and travel to it now enter this approach; the fixed comparison viewpoint remains unchanged. Nearby falling leaves and spores use shared meshes, reduced mobile counts and static positions under reduced-motion preference. Optional existing sound toggle now includes proximity-based warm harmonics and filtered rustle; local layers fade during dialogs. No autoplay. Check finite geometry, onboarding/control/quality/viewpoint regression; real-device visual, audio and performance not measured.


## Living keeper — iteration 15
Tagged keeper vertices preserve the existing shared mesh and material IDs while adding articulated head yaw/pitch, subtle upper-body breathing and finger curl. Head foliage follows the head; sapling and palm inhabitant follow the same body lift. A proximity encounter blends from sapling gaze to visitor, holds, and returns within eight seconds, rearming only after leaving the wider area. Reduced motion removes idle breathing/curl. Nearby shadow updates are throttled to 2 Hz on touch devices and 4 Hz on desktop. Validate shader compile/link, pure pose bounds, startup and controls. Actual device frame rate and visual continuity remain unmeasured.


## Deer anatomy and motion — iteration 16
First animal completed before moving on to brook creatures and dragon. Rebuilt deer with smooth shoulder/haunch volumes, tapered curved neck, finer muzzle, inset eyes, branched antlers and split hooves. Eighteen rigid bone matrices articulate neck/head, ears, tail and four three-part legs in one draw. A slow small circular walk alternates with pauses; support hoof world positions stay fixed, swing feet lift and land on terrain, and two-bone IK preserves limb lengths. Stops walking within four units of the visitor and smoothly glances toward visitors within ten. Subtle breathing/ear flicks/tail movement; reduced motion keeps the deer in place. Shadow pass includes deer and reuses the nearby throttled update. Shader compilation/linking, finite matrices, leg reach on the actual valley, support contact, approach stop and regressions checked. Real-device visual quality and frame rate remain unmeasured.


## Brook beings and dragon — iteration 17
Rebuilt both creature meshes using the shared 18-matrix animal palette, preserving keeper/deer behavior. Brook beings have tapered bodies, fine eyes/muzzles, leaflike gills, fixed supporting feet and four attached tail segments. Independent phases, slow head tracking and subtle gill/body movement give the pair distinct rhythms; no walking or swimming claim. Dragon has a hierarchical neck/head, paired shoulder/elbow wings, layered double-sided feathers and a two-section tail. Smooth periodic wingbeats blend into gliding, with gentle banking. Corrected flight heading to match the circular trajectory; altitude 78–82 clears the garden crowns. Reduced-motion mode holds new creatures still. Both rigs cast animated shadows through existing throttled shadow passes.
Validation: shader compile/link, finite matrices and matching uniform names, joint attachment, planted feet, flight heading, glide/wingbeat continuity, reduced motion, existing deer/keeper/puzzle/intro/control/audio checks and asset references. No browser visual QA or real-device FPS/audio assessment.


## First conversations — iteration 18
Three nearby NPCs now offer authored Dutch choice conversations: guardian main-story encounter, relaxed white deer, cheerful squirrel on guardian palm. Guardian introduces the remembered promise/seed and links to existing memory puzzle 3; solved and all-four-complete states change follow-up text without awarding progress. Deer acknowledges the restored root puzzle. Visits stored separately under elyndra-conversations-v1, with storage failure tolerated. Proximity/altitude-aware candidates come from live player and deer positions; shared native dialog selects among nearby speakers, pauses movement through existing modal events, and safely hands off to puzzles. Touch button plus T, Escape/close, focus restoration and polite text announcement. No free-text AI, external requests, spoken audio or new puzzle gates.
Validation: conversation graph reachability and content states, range/altitude, saved visits, modal pause/close and puzzle handoff, plus world startup/control/audio/quality tests and local asset references. No actual browser/device visual QA.


## River and banks — iteration 19
Subdivided water surface carries sampled riverbed depth for shallow/deep tint, subtle procedural bed detail/caustics, sky Fresnel and smaller highlights. Three rock riffles at z -75, 25 and 110 generate matched downstream foam/ripple accents; no physical fluid simulation or actual scene reflection/transparency claim. Focused reeds, seed heads and pebbles track the actual shoreline via bisection, avoiding trails. Independent random seed preserves the rest of the valley. Fixed water elevation keeps shore geometry and depth consistent, with movement in surface normals. Mobile reduces reed density. Shader compile/link, finite geometry, gameplay/interaction regressions checked; real-device appearance and FPS unmeasured.
