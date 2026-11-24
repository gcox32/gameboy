# Stadium 3D Models in Oak's Lab

Plan and checklist for showing every Pokémon on the Lab platform as its Pokémon Stadium 2 3D model, turning slowly and playing its idle loop, the way Stadium's own Oak's Lab shows them. The models are built from the player's own Stadium 2 cartridge dump, not downloaded.

Donphan (#232) is done and live. This document covers getting from one model to all 151 Gen 1 Pokémon, and then to all 251.

Related docs: [OAKS_LAB.md](OAKS_LAB.md) (the Lab itself), [GEN2_SUPPORT.md](GEN2_SUPPORT.md) (Gen 2 in `/play`; it leaves the Lab out of scope, so Gen 2 in the Lab still needs its own plan).

---

## Where things stand

**Live:** Donphan turns on the pad and plays its idle loop, including its blink, and stands at about its sprite's height. Any Pokémon without a model shows its sprite, as before.

| Piece | What it does | File |
|---|---|---|
| Platform | Shows the model if the Pokémon has one, otherwise the sprite | `src/components/oaks-lab/stage/Platform.tsx` |
| PlatformModel | Fetches the `.glb` itself, then hands it to `<model-viewer>` with autoplay `idle` and auto-rotate. Falls back to the sprite if the fetch fails | `src/components/oaks-lab/stage/PlatformModel.tsx` |
| Model list | Which Dex numbers have a model, and the version of each uploaded file | `MODEL_VERSIONS` in `src/lib/assets.ts` |
| Extractor | LuaJIT driver around StadiumBattleFX's Stadium 2 reader. Dumps bones, primitives, textures, materials, clips and texture streams as JSON | `scripts/stadium2/extract-model.lua` |
| Builder | Turns that dump into an animated `.glb` in `assets/pokemon/models/stadium/NNN.glb` | `scripts/stadium2/build-model.mjs` |
| Reader | [StadiumBattleFX](https://github.com/anxiousintrovert/StadiumBattleFX) (MIT), cloned at commit `0c6e004` | `scripts/stadium2/StadiumBattleFX/` |
| ROM | US Stadium 2, MD5 `1561c75d11cedf356a8ddb1a4a5f9d5d` | `assets/_inbox/roms/pokemon-stadium-2.z64` |

`scripts/` and `assets/` are gitignored, so the whole build pipeline exists only on this machine today (see [Decisions](#decisions)).

**To build and ship one model now:**

```sh
brew install luajit                                   # once
node scripts/stadium2/build-model.mjs 232             # prints the file's version
node --env-file=.env.local scripts/upload-assets.mjs --phase 1          # dry run: check only the model is listed
node --env-file=.env.local scripts/upload-assets.mjs --phase 1 --apply
# then set MODEL_VERSIONS.stadium['232'] to the printed version
```

Only `pokemon/models/stadium/232.glb` is in upload phase 1 today. `phaseOf()` in `upload-assets.mjs` needs a rule for the rest before they'll upload.

---

## How a model is built

Worth knowing before touching the builder. Each point below fixed a visible bug on Donphan.

- **The skeleton.** Stadium keeps bone scale out of the matrices children inherit: a bone's offset is multiplied by its parent's accumulated scale, and its own accumulated scale applies only to its own vertices. In glTF, scale passes down to children, so every bone becomes two nodes:
  - a *pivot* node with the rotation and scaled offset, which child bones hang from;
  - a *draw* node under it with the accumulated scale, which vertices are bound to.

  Every vertex belongs to exactly one bone at full weight. Rotations are the game's binary angles (32768 = π), applied in the game's order (Rz·Ry·Rx for column vectors).
- **Animations.** Each clip stores one value per frame at 30 Hz, so every frame becomes a keyframe. Quaternions are kept sign-continuous so the interpolation takes the short way round.
  - Only `idle` is written by default (Donphan: 128 KB; 585 KB with `--all-clips`).
- **Hidden parts.** Some models carry parts that the clips keep at scale 0 (Donphan's curled-up Rollout ball is always in the mesh). So:
  - a channel is written whenever any frame differs from the node's standing value, even if it never changes;
  - nodes stand in idle's first frame, not the rest pose.

  Dropping constant channels once left the ball frozen under Donphan's belly.
- **Blinks.** Face textures swap frame by frame from a value stream, which glTF can't express. The eye primitive is copied once per texture it can show, each copy on a helper joint, and a STEP scale track (1 shows it, 0 hides it) picks the copy. The stream is read at the skeleton's frame and holds its last value past its end, as the game does: one blink at the top of the loop.
- **Textures.**
  - Each primitive's wrap mode comes from the G_SETTILE in its material display list. Stadium clamps most textures and mirrors some, and its UVs run well past 0–1 on purpose.
  - Filtering is linear, matching the N64's bilinear filter.
  - Repeat wrap plus nearest filtering once gave Donphan striped flanks and jagged tusks.
- **Caching.** Blob serves assets with a 30-day cache, and an upload overwrites the same path. Model URLs therefore carry `?v=<first 8 hex of the file's SHA-1>`, and `build-model.mjs` prints that version.
- **Placement.** model-viewer frames the whole bounding sphere, so the camera radius is 70% of its default to bring a model to about its sprite's height. The canvas is shifted down 14% so the feet meet the pad.

---

## Known risks for the other species

The builder is generic, but it skips or ignores some things StadiumBattleFX handles. Expect these to break until each is handled:

| Risk | What goes wrong | Likely species |
|---|---|---|
| Effect geometry (`prim.generated`, callback `0x81000038`) | Dropped entirely, so no tail flame | Charmander line, Ponyta, Rapidash, Moltres, Magmar, Gen 2 fire types |
| Callback textures (`callbackTextureRequired`, callback `0x81000140`, texgen) | The surface's texture comes from game code, not the model, so it renders untextured or flat | Shiny/reflective parts; check Magnemite, Onix, Steelix, Scizor |
| Additive blending (callbacks `0x38` / `0x68`) | Written as ordinary opaque or alpha-masked material, so glows render solid | Ghosts (Gastly line), flames |
| Dual-texture materials (callback `0x81000048`) | Only the first texture is used | Unknown until audited |
| Species the mod special-cases | The mod has hand fixes for these (mostly for its own Stadium 1 skeleton, so not all will apply here) | 6, 8, 9, 16–18, 35, 77, 78, 88, 89, 90, 92, 109, 110, 146 |
| Vertex-colour primitives (`vertexSemantics: 'color'`) | Written with `COLOR_0` and no normals. Untested | Unknown until audited |
| Hidden or extra parts | Anything else kept at scale 0, or swapped in by clips we don't ship | Any; Donphan had one |
| Size | Bounding-sphere framing at 70% may be wrong for very tall, very wide or tiny models (Onix, Gyarados, Diglett) | Outliers by bounds |
| Unown | 26 forms are separate model-table records (254–278 plus 201) | 201 |

---

## Plan

### Phase 1 — Batch tooling

- [ ] `build-model.mjs` accepts a range or list (`1-151`, `232`), builds each in turn, and keeps going past failures
- [ ] Write versions to a generated manifest (e.g. `src/data/stadiumModels.json`) instead of hand-edited `MODEL_VERSIONS`. `assets.ts` imports it
  - [ ] Keep a separate "approved" list, so a built model only ships once someone has looked at it
- [ ] **Audit report** per species, flagged automatically:
  - dropped `generated` primitives
  - primitives needing callback textures or texgen
  - additive or dual-texture materials
  - fallback textures used
  - bones held at scale 0
  - extractor warnings
  - unusual bounds or height compared with the Pokédex height
  - file size
- [ ] **Contact sheet**: a throwaway route plus headless Chrome renders every built model at the same idle frame and angle, on one page, with the audit flags beside each
- [ ] `upload-assets.mjs`: put approved models in their own phase, so an upload can't sweep in anything else

### Phase 2 — Gen 1 triage (151 + Donphan)

- [ ] Run the batch for 1–151, then read the contact sheet and audit
- [ ] Sort species into: good, fixable, keep the sprite for now
- [ ] Fixes, roughly in order of how many species they unlock:
  - [ ] **Flames**: port `render_callbacks/flame.lua` geometry and its eight-frame texture loop (STEP-switched copies, like the blink)
  - [ ] **Callback textures and texgen**: bake a fixed texture for the reflective surfaces; animated reflection is out of scope
  - [ ] **Additive blending**: emit glows as a separate unlit material. model-viewer has no additive blend, so they may need a custom material or have to be accepted as alpha blending
  - [ ] **Per-species fixes**: check each special-cased species above against the native Stadium 2 data; port only the fixes that still apply
- [ ] Per-species size correction where bounding-sphere framing misjudges (a small override table, or framing from the actual bounds)

### Phase 3 — Ship Gen 1

- [ ] Upload the approved models: about 152 Blob operations of the ~2,000/month Hobby budget. Check usage first
- [ ] Bandwidth: 151 × ~130 KB ≈ 20 MB in total, but each Lab view loads only one model at a time
- [ ] Watch: load time on mobile, and that only one WebGL context is alive (the pad shows one Pokémon at a time)
- [ ] Credit StadiumBattleFX (MIT) wherever the app credits third-party work

### Phase 4 — Gen 2 (152–251)

Waits on the Lab handling Gen 2 Pokémon at all. The Lab reads Gen 1 saves and looks species up in `dexDict`, which only maps Gen 1 internal indexes (Donphan comes in through the Gen 1 hack), and [GEN2_SUPPORT.md](GEN2_SUPPORT.md) leaves the Lab out of scope.

- [ ] Run the same batch for 152–251; expect more flames, more steel and more effects
- [ ] Unown: build the forms (records 201 and 254–278) and choose a form from the Pokémon's DVs, as Gen 2 does
- [ ] Platform: look models up by Dex number directly for Gen 2, since its species byte *is* the Dex number

### Phase 5 — Extras (each optional)

- [ ] **Shinies**: the ROM has a shiny palette or dedicated shiny textures per species (`rareVariation`, `applyDedicatedRareTextures`). Build `NNN-shiny.glb` and show it when the stored Pokémon is shiny
- [ ] **Entrance clip**: play `entrance` once when a Pokémon arrives on the pad, then settle into `idle`. It's in the ROM; ship it with `--all-clips` or a two-clip build
- [ ] **Lighting**: closer to Stadium's look (a key light from the front-left, less ambient wash) than model-viewer's neutral environment
- [ ] **Interaction**: drag to turn the model. Check against the Lab's static-hardware rule first (controls never appear, move or change with state; only screens change). The pad is a screen, so it may be fine

---

## Decisions

- **Built from the cartridge, not downloaded.** models-resource.com is missing many models and blocks automated downloads. The ROM has all 251, plus animations, blinks and shinies.
- **The ROM never leaves this machine.** It lives in `assets/_inbox/` (gitignored, and skipped by the uploader). Only the derived `.glb` files are uploaded.
- **The pipeline stays out of git for now**, like the other asset scripts. Open question below.
- **Sprites are the fallback, always.** A species with no approved model, or a model that fails to load, shows its sprite. A partial rollout is fine.
- **Idle only by default.** Other clips cost about 4× the file size, and the Lab only plays idle.

## Open questions

- Commit `extract-model.lua` and `build-model.mjs` (not the StadiumBattleFX clone) so the pipeline survives a new machine? The clone could become a pinned `git clone` step.
- Pin StadiumBattleFX to commit `0c6e004`. Its reader changes often, and an update could change the output.
- These are still Nintendo's assets on a public Blob URL, the same exposure as the hosted sprites. Fine for a personal or friends app; revisit if the app goes wider.
