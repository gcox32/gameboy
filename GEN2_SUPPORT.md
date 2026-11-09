# Gen 2 Support for /play

Plan and checklist for making the `/play` widgets (Active Party + details modal, Badges, Town Map, Pokédex, dynamic background) work with Gold, Silver and Crystal, and Gen 2 hacks that keep the vanilla 251 species (no expanded-Dex hacks; see [Decisions](#decisions)).

Oak's Lab, the Ranch and save editing are **out of scope** here (see [Out of scope](#out-of-scope)). They read SRAM, while the `/play` widgets read live WRAM, so the two can move separately.

---

## Where things stand

Everything the widgets show is read from live WRAM through `useInGameMemoryWatcher` (`src/utils/MemoryWatcher.js`), then parsed with Gen 1 assumptions. Nothing in the render path checks the generation.

| Area | Gen 1 assumption today | File |
|---|---|---|
| Address discovery | Finds `wCurMap` by matching a pokered routine, then places party/badges/Pokédex at fixed distances from it | `src/utils/pokemon/maps.ts` |
| Fallback addresses | `0xD163` party, `0xD2F6+0x5F` badges, `0xD2F7` Pokédex | `ActiveParty/index.tsx`, `GymBadgeCase/index.tsx`, `maps.ts` |
| Party parsing | 44-byte structs, Gen 1 field offsets, internal species index → `dexDict` | `src/utils/pokemon/parse.ts` |
| Species | `dexDict` maps Gen 1 internal indexes; crashes (`dexDict[...]` undefined) on anything else | `src/utils/pokemon/dicts.ts` |
| Types | Read from the party struct (Gen 2 has no type bytes); `typeDict` lacks Steel/Dark | `parse.ts`, `dicts.ts` |
| Stats | Single Special stat; labels `HP ATK DEF SPD SPC` | `DetailsModal/StatsPanel.tsx` |
| Moves | Scans for a 6-byte move table, 165 vanilla moves, 27 types | `src/utils/pokemon/moves.ts` |
| Badges | One byte, 8 Kanto badges, Kanto gyms/leaders | `GymBadgeCase/index.tsx`, `utils/pokemon/gyms.ts` |
| Town Map | Kanto art, Kanto `locations`, a single `wCurMap` byte and the pokered town map tables | `TownMap/*`, `utils/pokemon/locations.ts`, `maps.ts` |
| Pokédex | 151 entries, 19-byte owned/seen flags, an odd `152 → 232` special case | `Pokedex/index.tsx` |
| Dynamic background | Kanto place names → Kanto artwork | `FullScreenContainer`, `maps.ts` (`LOCATION_IMAGES`) |
| Presets | Gen 2 entries exist but are wrong (see below) and aren't used by the widgets | `src/data/memoryPresets.ts` |

What already works in our favour:

- **WRAM banking.** Gen 2 keeps the player's data in WRAM bank 1 (`0xD000–0xDFFF`). `sliceMemoryWithGBC` already reads that range from `GBCMemory`, and `GBCMemory[0]` is bank 1 (`gbcRamBankPosition = ((bank - 1) << 12) - 0xD000`), so reads land in the right bank whichever bank is switched in.
- **Text.** Gen 2 English text uses the same letters, digits and `0x50` terminator as Gen 1, so `translateIntegerArray` mostly works as-is.
- **Types for Gen 2 fields.** `PokemonDetails` already has optional `heldItem`, `friendship`, `pokerus`, `caughtData`, `specialAttack`, `specialDefense`.
- **Sprites by Dex number.** `pokemonGifUrl` takes a National Dex number, and in Gen 2 the species byte *is* the Dex number.
- **Memory scanner.** `memoryScanner.ts` already has Gen 2 sizes and species limits for the manual scan in Game settings.

### Problems found in the existing Gen 2 presets

`memoryPresets.ts` mixes Gold/Silver and Crystal values:

| | Preset | Gold / Silver | Crystal |
|---|---|---|---|
| `wPartyCount` | `0xDCD7` | `0xDA22` | `0xDCD7` |
| `wJohtoBadges` | `0xD57C` | `0xD57C` | `0xD857` |
| Party block size | `0x1A0` | `0x1AC` | `0x1AC` |

Gold/Silver values are from community RAM maps and still need checking against a `pokegold` build. The block size is too short: count (1) + species list (7) + 6 × 48 struct + 6 × 11 OT names + 6 × 11 nicknames = `0x1AC`, so `0x1A0` cuts off the last nicknames. Confirmed against the local pokecrystal `.sym` (`wPartyCount` → `wPartyMonNicknamesEnd` is `0x1AC`).

> The local `~/Documents/Play/Projects/pokemon/pokecrystal` build does **not** match retail (its SHA-1 differs from `roms.sha1`), and its `.sym` puts `wPartyCount` at `0xDCDB`, 4 bytes after retail. Use it for structure and relative distances; use a retail ROM for absolute addresses. The same shift is a good argument for finding addresses from the ROM instead of hard-coding them.

---

## Approach

Introduce a **generation adapter**: one object per generation that the widgets ask for addresses, parsing and static data, instead of importing Gen 1 modules directly.

```ts
// src/utils/pokemon/generations/types.ts (sketch)
interface GenerationAdapter {
  generation: 1 | 2;
  dexSize: 151 | 251;
  addresses(rom: Rom): {
    party: number | null;
    badges: number | null;     // Gen 2: Johto byte, Kanto byte follows
    pokedex: number | null;    // owned flags, then seen flags
    currentMap: number | null; // Gen 2: map group, map number follows
  };
  partyBlockSize: number;
  parseParty(bytes: number[], rom: Rom | null): PokemonDetails[];
  statLabels: string[];
  badges: Badge[];
  gyms: Gym[];
  getMapLocation(rom: Rom, mapBytes: number[]): MapLocation | null;
  // ...
}
```

`useGame()` already exposes the ROM; add a `useGeneration()` hook that picks the adapter once per ROM (header title, then CGB flag and pattern matches as fallbacks) and memoises it. Gen 1 code moves behind the Gen 1 adapter unchanged, so Gen 1 behaviour is preserved and testable on its own.

Keep the current **ROM-first** principle: find addresses and tables by matching the game's own routines, with presets only as a fallback. That's what makes Gen 1 hacks work today, and it covers the Crystal revision differences above.

---

## Checklist

### Phase 0 — Ground truth and fixtures

- [ ] Get retail Gold, Silver and Crystal (1.0 and 1.1) ROMs into `~/Documents/Play/Projects/pokemon/` for testing.
- [ ] Clone and build [`pret/pokegold`](https://github.com/pret/pokegold) next to `pokecrystal` so Gold/Silver have a `.sym` too; rebuild `pokecrystal` until it matches `roms.sha1`.
- [ ] Capture WRAM dumps (bank 0 + bank 1) at a few save points per game: new game, mid-Johto with a full party (incl. an Egg, a shiny, a Pokémon holding an item, one with Pokérus), and post-game with Kanto badges. Store small JSON fixtures like `data/20260121-memory-*.json`.
- [ ] Add one Gen 2 hack to the test set that moves RAM but keeps species 1–251, to prove pattern-based discovery. Expanded-Dex hacks (e.g. Polished Crystal) aren't supported.
- [ ] Update the `reference_rom_sources` memory note once the Gen 2 ROMs and syms are in place.

### Phase 1 — Detection and addresses

- [ ] Add `src/utils/pokemon/generations/` with `gen1.ts` (wrapping today's code) and `gen2.ts`, plus `useGeneration()`.
- [ ] Fix generation detection in `romDetection.ts`: the fallback `isColorGame ? 2 : 1` misreads **Yellow**, which sets the CGB flag. Prefer: preset title → Gen 1 routine match (`CURRENT_MAP_PATTERN`) → Gen 2 routine match → CGB-only flag (`0xC0`).
- [ ] Gen 2: find `wMapGroup` from a stable routine (e.g. the `ld a, [wMapGroup] / ld b, a / ld a, [wMapNumber]` sequence used by `GetWorldMapLocation` / `GetMapSceneID`) and place the rest at fixed distances, as `maps.ts` does for Gen 1. Distances from the Crystal sym: party `+0x22`, Pokédex caught `+0x1E4`, badges `-0x451`. Measure Gold/Silver separately; they differ.
- [ ] Correct `memoryPresets.ts`: split Gold/Silver from Crystal, fix the badge address and block size, and keep them as fallbacks only.
- [ ] Make `ActiveParty` and `GymBadgeCase` take their fallback config from the adapter instead of the hard-coded Gen 1 `DEFAULT_WATCHER_CONFIG`.
- [ ] Check imported games: their saved `memoryWatchers` metadata holds Red/Blue addresses (see the comment in `ActiveParty`). Make sure ROM-derived Gen 2 addresses still win over that.

### Phase 2 — Data layer

**Species and names**
- [ ] Gen 2 species byte = National Dex number (1–251); no `dexDict` lookup. `0xFD` in the species list means an **Egg**; `0x00`/`0xFF` end it.
- [ ] Species names: read from the ROM's `PokemonNames` table (10 bytes each, fixed width) so hacks get their own names; fall back to a static 251-name list.
- [ ] Guard every `dexDict[...]` access in shared code (`parse.ts`, `sprites.ts`, `usePokemonSizes.ts`); today an unknown index throws and the whole party is dropped.
- [ ] Only species 1–251 are supported. Anything outside that (other than the Egg marker) shows as an unknown Pokémon rather than breaking the party, and no work goes into expanded-Dex layouts.

**Party struct (48 bytes)** — see `refs/gen-2/bulbapedia.txt`
- [ ] Write `parseGen2Party`: count at `+0`, species list at `+1`, structs at `+8`, OTs at `+8 + 6×48`, nicknames after OTs.
- [ ] Field offsets: species `0x00`, item `0x01`, moves `0x02–0x05`, OT ID `0x06`, exp `0x08` (3 bytes), stat exp `0x0B–0x14`, DVs `0x15`, PP `0x17–0x1A`, friendship/egg cycles `0x1B`, Pokérus `0x1C`, caught data `0x1D` (Crystal), level `0x1F`, status `0x20`, HP `0x22`, max HP `0x24`, Atk/Def/Spe/SpA/SpD `0x26–0x2F`.
- [ ] Populate the existing optional fields: `heldItem`, `friendship`, `pokerus`, `caughtData`, `specialAttack`, `specialDefense`.
- [ ] Derived values from DVs: **gender** (Attack DV vs the species' gender ratio from base data), **shiny** (Def/Spe/Spc = 10, Atk ∈ {2,3,6,7,10,11,14,15}), **Unown letter**. Gender and shininess need base data (below).
- [ ] Status byte: same bits as Gen 1; keep `parseStatus`.

**Types and base data**
- [ ] Gen 2 party structs have no type bytes. Read types (and gender ratio, growth rate) from the ROM's `BaseData` table (32 bytes per species, indexed by Dex number), with a static fallback.
- [ ] Extend `typeDict`: `STEEL` = 9, `DARK` = 27 (`0x1B`); `0x13` is the `???`/Curse type. Add Steel and Dark wherever type colours or icons are defined.

**Moves** (`moves.ts`)
- [ ] Gen 2 move table entries are **7 bytes** (adds effect chance) and there are 251 moves. Parameterise `MOVE_ENTRY_SIZE`, `VANILLA_MOVE_COUNT`, and `TYPE_COUNT` (28) by generation.
- [ ] Check the `MoveNames` anchor (`POUND@KARATE`) and `TypeNames` pointer search still hit in Gen 2 ROMs; Crystal keeps `MoveNames` in bank `0x72`, outside bank 1, so confirm `readString`'s bank assumption.
- [ ] `getMaxPP`: same formula in Gen 2; confirm.

**Items**
- [ ] New: item names for `heldItem`. Read the ROM's item name table, with a static fallback.

**Text**
- [ ] Diff the Gen 1 and Gen 2 charmaps (`charmap.asm` in each repo) and add a Gen 2 map only if real differences show up in names (e.g. `'d`, `'l`, `'m` ligatures, `PK`/`MN`).

### Phase 3 — Widgets

Gen 1 hardware stays exactly as it is. Where Gen 2 needs more room, it gets its own next-iteration piece built on the Gen 1 one, sharing styles and animations where it can, picked once per game by the generation layer.

**Active Party** (`components/pokemon/ActiveParty`)
- [ ] Use the adapter's address, block size and parser.
- [ ] Eggs: show an Egg in the ball instead of a sprite; no stats modal, or a cut-down one (no nickname, species hidden).
- [ ] Shiny sprites when shiny (check the GIF sets have shiny variants; otherwise a sparkle overlay).
- [ ] Keep the 6-slot belt as is; Gen 2 party size is the same.

**Details modal** (`ActiveParty/DetailsModal`)
- [ ] `StatsPanel`: six stats for Gen 2 (`HP ATK DEF SPA SPD SPE`) vs five for Gen 1. The radar handles any label count, but `STAT_LABELS` and the `values` arrays are fixed. Labels come from the adapter.
- [ ] DVs/stat exp: show the Special DV and Special stat exp **once**, labelled `SPC`. Both can't be unique per Pokémon: the Gen 2 struct stores a single Special DV (low nibble of byte `0x16`) and a single Special stat-exp word (`0x13`), and the game uses each for both SpA and SpD. So the IV and EV modes keep Gen 1's five rows (`HP ATK DEF SPE SPC`), while the Stats mode shows six (`HP ATK DEF SPA SPD SPE`), since the calculated stats do differ.
- [ ] Add Gen 2 rows: held item, friendship, Pokérus, gender, caught level/time/location (Crystal only, and only when `caughtData` is set).
- [ ] Follow the static-hardware rule: the modal's layout and labels shouldn't jump between Gen 1 and Gen 2 more than needed. Rows that don't apply to Gen 1 can be omitted per generation, but within a game they stay put.

**Badges** (`components/pokemon/GymBadgeCase`)
- [ ] Two bytes: Johto (`wJohtoBadges`) then Kanto (`wKantoBadges`); the watcher size becomes 2.
- [ ] Gen 2 badge + gym data: 8 Johto (Falkner → Clair) and 8 Kanto (Brock → Blue, with Blue at Viridian). Badge effects (obedience levels, stat boosts, HM use outside battle) differ from Gen 1.
- [ ] A Gen 2 badge case: the next iteration of the Gen 1 case, built with space for 16 badges (Johto and Kanto). Same materials, lid, clasp and opening animation, sized for 16. Gen 1 games keep today's 8-badge case unchanged.
- [ ] `toBadges` and `GymModal` get their lists from the adapter.

**Town Map** (`components/pokemon/TownMap`)
- [ ] Current location is two bytes (`wMapGroup`, `wMapNumber`), resolved to a **landmark** via the ROM's per-map landmark data and `Landmarks` table (coords + name pointer), not pokered's town map tables.
- [ ] A Gen 2 town map: the next iteration of the Gen 1 folding map, opening **twice as wide** because it holds both regions side by side (Johto and Kanto). Same paper, fold, marker and expand behaviour; the marker sits on whichever half the player is in. Both regions are always visible, so no region switch is needed. Gen 1 games keep today's Kanto map unchanged.
- [ ] Fold and expand animations scale to the wider sheet (more panels or wider flaps), and the expanded view fits both regions.
- [ ] New `locations` data for Johto (and Gen 2's Kanto, which differs from Gen 1's), plus map art and `geometry.ts` sizes per region (`ART_WIDTH`/`ART_HEIGHT` and tile offsets are fixed to the Kanto art now).
- [ ] The Gen 2 map's cover and `aria-label` name both regions; the Gen 1 map's stay as they are.

**Pokédex** (`components/pokemon/Pokedex`)
- [ ] Same device for both generations; it mostly looks the same and just holds 251 entries for Gen 2.
- [ ] 251 entries; owned and seen flags are 32 bytes each (`flag_array 251`), so the watcher reads `0x40`, and the split is at 32, not 19.
- [ ] Replace the hard-coded `151` (bit loop, totals, completion, list) with `dexSize`.
- [ ] Remove the `152 → 232` special case in `loadPokemonData`. It's left over from a Gen 1 hack that once gave Donphan Dex number 152. Today the hack's Donphan resolves to `232` through `dexDict` (internal index 175), and the Gen 1 list stops at 151, so the line never runs. In Gen 2 it would turn Chikorita into Donphan.
- [ ] Unown: optionally read `wUnownDex` to show caught forms.
- [ ] Check `ListView` and `DualScreens` scale to 251 rows.

**Dynamic background** (`FullScreenContainer`)
- [ ] Watch the 2-byte map ID through the adapter, and map Gen 2 landmark names to new Johto/Kanto artwork.
- [ ] Optional: tint by in-game time of day (`wTimeOfDay`), which Gen 2 tracks. The sky background (`lib/sky.ts`) may already make this easy.

**Photoshoot** — still disabled; no Gen 2 work until it exists for Gen 1.

### Phase 4 — Assets (assets.letmedemo.com)

Run `node scripts/check-gen2-assets.mjs` (add `--shiny` once that's decided) to see what's still missing. It exits 1 until everything below is uploaded. Paths marked *proposed* aren't used by the app yet; if you rename one, change it in the script too. All paths are under `public/gameboy/`.

State on 2026-11-09: only the cries (`audio/anime/152.wav`–`251.wav`) are complete. In both GIF sets, `152.gif` and `232.gif` are the same Donphan file (see below), and no other Gen 2 species have GIFs or art yet.

**Per species**
- [ ] Pokémon GIFs `152.gif`–`251.gif` (zero-padded) for both sprite sources: `images/pokemon/gifs/` and `images/pokemon/stadium/gifs/`.
- [ ] **Replace `152.gif` in both sets with Chikorita.** The current file is Donphan, left over from a Gen 1 hack that gave Donphan Dex number 152; it's byte-identical to `232.gif`. Nothing references it, so just overwrite it. The script flags it until it's replaced.
- [ ] Art sets for the details modal. The current sets (`sugimori/rb/`, `rg/`, `frlg/`) are named for Gen 1 games and have no Johto art, so Gen 2 doesn't extend them. Instead, `ART_SETS` moves out of `DetailsModal/index.tsx` and the generation adapter supplies it, like the stat labels. Gen 2 gets three sets of its own covering **all 251** species (so Gen 1 species in a Gen 2 party have art in every set). Proposed: `sugimori/gs/`, `sugimori/crystal/`, `sugimori/hgss/`. The file `sugimori/rb/232.png` is another leftover from the hack and can stay.
- [x] Cries `audio/anime/152.wav`–`251.wav` (not zero-padded). All present.
- [ ] Decide on shiny sprites: either shiny GIFs for both sets (251 × 2, proposed `gifs/shiny/` and `stadium/gifs/shiny/`) or a sparkle overlay with no new assets. Decide before collecting GIFs, so both versions can come from the same source.
- [ ] Egg sprite in both sprite styles (proposed `gifs/egg.gif`, `stadium/gifs/egg.gif`).

**Badges and gyms**
- [ ] 8 Johto badge images in `images/pokemon/badges/` (`zephyr`, `hive`, `plain`, `fog`, `storm`, `mineral`, `glacier`, `rising`), next to the Kanto ones. Gen 2 versions of the Kanto badges only if they look different.
- [ ] Johto gym leader portraits in a subfolder so they don't collide with `characters/gyms/1_Brock.png`…`8_Giovanni.png` (proposed `characters/gyms/johto/1_Falkner.png`…`8_Clair.png`).
- [ ] Kanto leaders who change in Gen 2: Janine (Fuchsia) and Blue (Viridian) (proposed `characters/gyms/kanto-gen2/5_Janine.png`, `8_Blue.png`). The other six reuse the Gen 1 portraits.

**Town Map and backgrounds**
- [ ] Town map art for the Gen 2 map: Johto and Gen 2 Kanto side by side on one double-width sheet (proposed `images/pokemon/maps/gsc-johto-kanto-town-map.png`). Choose the source art before writing `geometry.ts`, since its pixel size sets `ART_WIDTH`/`ART_HEIGHT`.
- [ ] Johto location artwork for the dynamic background in `images/pokemon/locations/`: 10 towns, Routes 26–46 under `routes/`, and the dungeons and landmarks (Sprout Tower, Ruins of Alph, Union Cave, Ilex Forest, Burned/Tin Tower, Whirl Islands, Ice Path, Dragon's Den, Mt. Silver, …). Keys are Gen 2 landmark names; Gen 2 Kanto landmarks map to the existing Gen 1 art.
- [ ] Check `/api/pokeapi/pokemon/[id]` and `/size` already work for 152–251 (they should; PokéAPI covers them).

### Phase 5 — Tests and verification

- [ ] Unit tests next to the existing ones (`*.test.ts`): Gen 2 party parsing from fixtures, Egg handling, shiny/gender derivation, address discovery on each retail ROM + one hack, move table discovery, Pokédex flag decoding at 251.
- [ ] Regression: Gen 1 fixtures still parse identically after moving behind the adapter (Red, Blue, Yellow, and the hacks in `reference_rom_sources`).
- [ ] Play-test in each game with headless screenshots (see `reference_headless_screenshots` memory): party belt, details modal, 16-badge case, both maps, 251-entry Pokédex.
- [ ] Emulator check: Gen 2 uses an MBC3 real-time clock. Make sure save states and in-game time behave, since time-of-day features depend on it.
- [ ] Update `how-it-works/page.tsx` copy, which currently says the features are for first-generation games.

---

## Suggested order

1. Phase 0 fixtures + Phase 1 adapter skeleton with Gen 1 moved behind it (no behaviour change, Gen 1 tests pass).
2. Gen 2 detection and addresses, then **Active Party** end to end (the most visible win). Assets: GIFs 152–251.
3. Details modal (six stats, held item, gender, shiny).
4. Pokédex (mostly counts and flag sizes, cheap).
5. The Gen 2 badge case with space for 16 (needs data + art).
6. The double-width Gen 2 town map and the dynamic background (most new data and art).

## Out of scope

These read and write **SRAM** and are built around `gen1Save.ts`; they need their own plan:

- Oak's Lab extract / port-in / IV editing (`src/components/oaks-lab`, `api/pokemon/stored/*`, `api/save-states/[id]/*`).
- Ranch storage of Gen 2 Pokémon (`StoredPokemon.generation` already allows `2`).
- Gen 1 ↔ Gen 2 transfers (Time Capsule rules: held item vs catch rate, Gen 2-only species and moves).

Keep the Gen 2 parsing helpers here free of React and of `/play` concerns, so that work can reuse them (as with `lab_in_save_editing` in memory).

## Decisions

- **Expanded-Dex hacks:** not supported. Gen 2 support covers species 1–251 only; hacks that move RAM but keep the vanilla species list should still work through pattern matching.
- **Hardware per generation:** Gen 1 games keep the Gen 1 hardware exactly as it is. Gen 2 games get the next iteration of each piece, built on the same ideas and look (no trainer card pages or Pokégear):
  - **Town Map:** opens twice as wide, holding Johto and Kanto side by side.
  - **Badge case:** has space for 16 badges.
  - **Pokédex:** mostly the same device, with 251 entries.

  Each piece is fixed for its generation, so nothing appears, disappears or resizes while playing.
- **Special DV and stat exp:** show both only if each Pokémon can have different values. In Gen 2 it can't: there is one Special DV and one Special stat-exp value, shared by SpA and SpD. So they're shown once, as `SPC`. The calculated SpA and SpD stats are shown separately.
e