# Pokémon Cross-Game Persistence

Feature plan for extracting Pokémon from one game's save file, storing them as user-owned records, inspecting them, and porting them into another game.

Two named locations surface this feature in the UI:
- **Oak's Lab** — the portal for sending Pokémon to storage and receiving them back into a game
- **Oak's Ranch** — a read-only view of all Pokémon currently held in storage

---

## Background: Save File Structure (Gen 1)

The Gen 1 SRAM is 32 KiB (`0x8000`) split into 4 banks:

| Bank | Offset   | Contents                        |
|------|----------|---------------------------------|
| 0    | `0x0000` | Scratch + Hall of Fame          |
| 1    | `0x2000` | Main data (party, current box)  |
| 2    | `0x4000` | PC Boxes 1–6                    |
| 3    | `0x6000` | PC Boxes 7–12                   |

Pokémon live in three places in Bank 1:
- **Party** at `0x2F2C` — up to 6 Pokémon, **44 bytes each** (extended form)
- **Current Box mirror** at `0x30C0` — up to 20 Pokémon, **33 bytes each** (box form)

And in Bank 2/3 for the remaining 11 boxes.

Because Oak's Lab operates exclusively on saved `.sav` file blobs (never live emulator memory), all 12 PC boxes are always fully readable, and no in-game save action is required. The save file on disk is the authoritative source.

### Two Pokémon data formats

**Box form (33 bytes) — "permanent bytes":**
```
0x00  species index (1 byte)
0x01  current HP (2 bytes)
0x03  box level (1 byte)
0x04  status condition (1 byte)
0x05  type 1 (1 byte)
0x06  type 2 (1 byte)
0x07  catch rate / held item (1 byte)
0x08  move 1 index (1 byte)
0x09  move 2 index (1 byte)
0x0A  move 3 index (1 byte)
0x0B  move 4 index (1 byte)
0x0C  original trainer ID (2 bytes)
0x0E  experience points (3 bytes)
0x11  HP EV (2 bytes)
0x13  attack EV (2 bytes)
0x15  defense EV (2 bytes)
0x17  speed EV (2 bytes)
0x19  special EV (2 bytes)
0x1B  IV data (2 bytes — 4 bits per stat: Atk/Def/Spd/Spc; HP derived)
0x1D  move 1 PP (1 byte — high 2 bits: PP Ups, low 6: current PP)
0x1E  move 2 PP
0x1F  move 3 PP
0x20  move 4 PP
```

**Party form (44 bytes) — adds 11 "temporary bytes":**
```
0x21  level (1 byte)
0x22  max HP (2 bytes)
0x24  attack (2 bytes)
0x26  defense (2 bytes)
0x28  speed (2 bytes)
0x2A  special (2 bytes)
```

The extended bytes are recalculated from the 33 permanent bytes each time a Pokémon is withdrawn from the PC. This means **33 bytes is the canonical representation** — store this, recalculate the rest on port-in.

### Box data structure (one full PC box)

```
0x00        Pokémon count (1 byte)
0x01–0x14   Species ID list, 1 byte per slot + 0xFF terminator (20 slots + 1)
0x16        Unused padding (1 byte)
0x17–0x2AA  Pokémon box data, 33 bytes × 20
0x2AA–0x385 OT names, 11 bytes × 20 (0x50-terminated Gen1 charset strings)
0x386–0x461 Nicknames, 11 bytes × 20
```

### Checksum (Bank 1)

Covers bytes `0x2598`–`0x3522`. Algorithm: initialize to 255, subtract each byte, result is `0x3523`. Must be recalculated after any write to Bank 1. Already implemented in `SRAMParser.calculateMainDataChecksum()`.

---

## Existing Infrastructure

These are already implemented and can be used directly:

| File | What it provides |
|------|-----------------|
| `src/utils/sramParser.ts` | Full SRAM parse: `parseSRAM()`, `parsePokemonParty()`, `parsePokemonBox()`, `calculateMainDataChecksum()` |
| `src/utils/pokemon/parse.ts` | `parseParty()`, `parsePokemonStructure()`, IV extraction |
| `src/utils/sramParser.ts` | `TextEncoder.decodeString()` / `encodeString()` for Gen1 charset |
| `src/models/` | Mongoose models: User, Game, SaveState |
| `src/lib/db.ts` | `dbConnect()` |
| `src/app/api/blob/` | Blob upload/download for save files |
| `src/app/api/pokeapi/pokemon/[id]/` | PokeAPI proxy (base stats lookup) |
| `config.js` | `pokemonGifEndpoint`, `sugimoriRg/Rb/Frlg`, `pokemonStadiumGifEndpoint` — hosted sprite assets |
| `src/utils/pokemon/dicts.ts` | `dexDict`, `typeDict`, `statusDict` |

---

## App Trainer Identity

Every Gen 1 save file has a randomly-generated 16-bit **Player ID** at `0x2605` in Bank 1. This ID is stamped into every Pokémon caught in that save at offset `0x0C` (OT ID). The game uses it to determine ownership: if a Pokémon's OT ID matches the current save's Player ID, it is "yours" and behaves accordingly. If it doesn't match, the game treats it as a received trade — it may disobey above certain levels and won't respond to certain items.

To make a Pokémon feel native in every game it travels to, every app user is assigned a single persistent **App Trainer ID**: a 16-bit number stored on their User record, generated once on first connection. When a save file is **Connected** to Oak's Lab, this ID is written into the save's Player ID field. From then on, every Pokémon caught in that save carries the app Trainer ID as its OT ID.

When porting a Pokémon into a connected game, the OT ID bytes in the Pokémon data are always overwritten with the app Trainer ID — even if the Pokémon came from an unconnected save with a different ID. The Pokémon is yours; the game should know that.

### User model addition

```typescript
appTrainerId: number   // 16-bit (0–65535), generated on first Connect, permanent
```

Generated randomly and checked for uniqueness. Once set, never changes — it is the user's identity across all games.

### "Connect" operation

Connecting a save file writes the user's `appTrainerId` to offset `0x2605` in Bank 1, then recalculates and writes the Bank 1 checksum. The save blob is uploaded and `SaveState` is updated. This is reversible in principle (writing a new value to `0x2605`), but there's no reason to disconnect once set.

`SaveState` gets a `connected: boolean` field. Oak's Lab surfaces this clearly — unconnected saves are shown with a "Connect to Lab" prompt before any extract or port-in operation is allowed.

### On port-in

Before writing the 33-byte Pokémon data into the target save, overwrite bytes `0x0C–0x0D` (OT ID) with the app user's `appTrainerId`. The Pokémon's OT name (stored separately in the box structure) is left as-is — it reflects where the Pokémon originally came from, which is a nice piece of history.

---

## Data Model: `StoredPokemon`

New Mongoose model at `src/models/StoredPokemon.ts`.

```typescript
interface IStoredPokemon {
  userId:        ObjectId;        // owner
  sourceGameId:  ObjectId;        // Game the Pokémon was withdrawn from
  generation:    1 | 2;
  sourceSlot: {
    location:    'party' | 'box';
    boxNumber?:  number;          // 1–12, only for box
    slotIndex:   number;          // 0-5 (party) or 0-19 (box)
  };
  speciesIndex:  number;          // raw game species index byte
  speciesName:   string;          // human-readable, derived at extract time
  nickname:      string;          // decoded Gen1 charset
  otName:        string;
  otId:          number;          // 2-byte trainer ID
  level:         number;          // extracted for display/filtering
  rawBoxData:    Buffer;          // 33 bytes — canonical permanent data
  extractedAt:   Date;
  status:        'stashed' | 'in_game';
  currentGameId?: ObjectId;       // set when ported into a game, cleared on re-withdrawal
}
```

**Why rawBoxData is 33 bytes:** The extended stats (maxHP, attack, defense, speed, special) are derived values. Storing only the permanent bytes means port-in works correctly after recalculation.

**Uniqueness:** A Pokémon is a singular entity. Withdrawing removes it from the source save; porting in removes it from the Ranch and places it in the target save. It can travel game → Ranch → game → Ranch repeatedly, but it cannot be duplicated. `status: 'stashed'` means it is at the Ranch; `status: 'in_game'` means it currently lives in `currentGameId`'s save file.

**Healing on port-in:** Status condition byte (`0x04`) is cleared to `0x00`. Current HP (`0x01–0x02`) is set to the recalculated maxHP. The Pokémon arrives at full health with no conditions.

---

## API Routes

### `POST /api/pokemon/stored`

Withdraw one or more Pokémon from a save file into the Ranch. Always removes the Pokémon from the source save — there is no copy mode.

Request body:
```json
{
  "saveStateId": "<id>",
  "slots": [
    { "location": "party", "slotIndex": 0 },
    { "location": "box", "boxNumber": 3, "slotIndex": 7 }
  ]
}
```

Response: `{ created: StoredPokemon[], updatedSaveStateId: string }` — includes the ID of the patched save blob so the client can update its reference.

### `GET /api/pokemon/stored`

List stored Pokémon for the authenticated user. Supports query params:
- `generation=1`
- `status=stashed` (default — Ranch view only shows stashed)
- `speciesIndex=6`

### `DELETE /api/pokemon/stored/[id]`

Release a Pokémon from the ranch (permanent delete).

### `POST /api/pokemon/stored/[id]/port`

Port a stored Pokémon into a target game's save file.

Request body:
```json
{
  "targetSaveStateId": "<id>",
  "targetSlot": { "location": "party", "slotIndex": 2 }
}
```

---

## Phase 0 — App Trainer Identity + Connect

**Files to update:**
- `src/models/User.ts` — add `appTrainerId: number` (generated if absent, stored permanently)
- `src/models/SaveState.ts` — add `connected: boolean` (default `false`)

**New API route:**
- `POST /api/save-states/[id]/connect` — generates `appTrainerId` for the user if they don't have one, writes it to `0x2605` in the save blob, recalculates checksum, uploads patched blob, sets `SaveState.connected = true`

Connect is a prerequisite for all extract and port-in operations. Oak's Lab will not allow either until the relevant save is connected.

---

## Phase 1 — `StoredPokemon` model + API routes

**Files to create:**
- `src/models/StoredPokemon.ts`
- `src/app/api/pokemon/stored/route.ts` (GET, POST)
- `src/app/api/pokemon/stored/[id]/route.ts` (DELETE)
- `src/app/api/pokemon/stored/[id]/port/route.ts` (POST) — implement fully in Phase 4

**Files to update:**
- `src/models/index.ts` — export `StoredPokemon`

---

## Phase 2 — Extraction + SRAM write path

Withdrawal is the only extraction mode, so the read and write paths are built together here.

### `src/utils/pokemon/extract.ts`

```typescript
function extractFromSRAM(
  sramData: Uint8Array,
  slot: SourceSlot
): RawExtractedPokemon
```

Steps:
1. `parseSRAM(sramData)` — full parse
2. Navigate to the target bank/box/slot
3. Slice the 33-byte box data (or truncate from 44 bytes if party slot — take bytes `0x00`–`0x20`)
4. Decode nickname and OT name with `TextEncoder.decodeString()`
5. Return `{ rawBoxData, nickname, otName, otId, speciesIndex, level }`

**PC box access:** All 12 boxes are readable directly from the `.sav` blob at any time via a single `parseSRAM()` call. No in-game save action required.

### `src/utils/sramWriter.ts`

Two operations share this module:

**`clearSlot(sramData, slot) → Uint8Array`** — removes a Pokémon from a save after withdrawal:
1. Zero-fill the 33-byte Pokémon region at the target offset
2. Remove the species ID from the species list, shift remaining entries left, append `0xFF` terminator
3. Decrement the Pokémon count byte
4. Zero-fill the OT name and nickname entries for that slot
5. Recalculate and write Bank 1 checksum at `0x3523`
6. Return patched buffer

**`injectPokemon(sramData, storedPokemon, targetSlot) → Uint8Array`** — ports a Pokémon into a save:
1. Recalculate extended stats from rawBoxData (see Phase 4 for formula)
2. Overwrite OT ID bytes (`0x0C–0x0D`) with the app user's `appTrainerId`
3. Heal: set HP bytes (`0x01–0x02`) to recalculated maxHP, clear status byte (`0x04`) to `0x00`
4. For party target: write full 44-byte form; for box target: write 33-byte form
5. Insert species ID into species list at the correct position
6. Increment Pokémon count byte
7. Encode and write OT name + nickname
8. Recalculate and write Bank 1 checksum
9. Return patched buffer

**Write-back flow (shared by both operations):**
1. Fetch `.sav` blob for the relevant save state
2. Apply `clearSlot` or `injectPokemon` → patched buffer
3. Upload patched buffer via `/api/blob/upload`
4. Update `SaveState.filePath` to point at the new blob
5. Update `StoredPokemon.status` accordingly

---

## Phase 3 — Oak's Ranch

New route: `src/app/ranch/page.tsx`

**Layout:**
- Filter bar: generation toggle, search by species name, level range slider, status filter (stashed / ported)
- Pokémon grid: cards showing animated GIF sprite (`pokemonGifEndpoint/{pokedexNo}.gif`), nickname, species name, level, type chips
- Click a card → detail drawer/modal:
  - Full stat block (maxHP, Attack, Defense, Speed, Special) — display these as their _effective_ values (recalculate from rawBoxData, base stats, IVs, EVs, level)
  - IV grid (0–15 each)
  - EV totals
  - Moves with PP
  - OT name + ID, source game name, extracted date
  - "Release" button → DELETE, with confirmation
  - "Port into current game" CTA → opens Oak's Lab tab 2 (Phase 5)

**Stat display recalculation** (needed for display only — no write required yet):

Gen 1 formulas:
```
stat = floor(((base + IV) * 2 + floor(sqrt(EV))) * level / 100) + 5
maxHP = floor(((base_HP + IV) * 2 + floor(sqrt(HP_EV))) * level / 100) + level + 10
```

IV extraction from 2-byte IV field:
```
attackIV  = (iv >> 12) & 0xF
defenseIV = (iv >> 8) & 0xF
speedIV   = (iv >> 4) & 0xF
specialIV = iv & 0xF
hpIV      = (atk & 1) << 3 | (def & 1) << 2 | (spd & 1) << 1 | (spc & 1)
```

Base stats table: pull from PokeAPI or bundle a static `src/utils/pokemon/baseStats.ts` for the 151 Gen 1 Pokémon (preferred — no runtime latency, works offline).

---

## Phase 4 — Stat recalculation + port-in API

The write utilities live in Phase 2. This phase wires up the stat recalculation needed for `injectPokemon` and completes the port-in API endpoint.

### Stat recalculation (`src/utils/pokemon/stats.ts`)

Gen 1 formulas (used to expand 33-byte box data → 44-byte party data, and for Ranch display):

```
stat   = floor(((base + IV) * 2 + floor(sqrt(EV))) * level / 100) + 5
maxHP  = floor(((base_HP + IV) * 2 + floor(sqrt(HP_EV))) * level / 100) + level + 10
```

IV extraction from the packed 2-byte IV field at `0x1B`:
```
attackIV  = (iv >> 12) & 0xF
defenseIV = (iv >> 8)  & 0xF
speedIV   = (iv >> 4)  & 0xF
specialIV =  iv        & 0xF
hpIV      = (atk & 1) << 3 | (def & 1) << 2 | (spd & 1) << 1 | (spc & 1)
```

Base stats: bundle a static `src/utils/pokemon/baseStats.ts` table for all 151 Gen 1 Pokémon (keyed by species index). No runtime latency, no PokeAPI dependency for this calculation.

### Port-in flow

`POST /api/pokemon/stored/[id]/port`:
1. Verify the `StoredPokemon` belongs to the authenticated user and has `status: 'stashed'`
2. Fetch target save blob, run `injectPokemon()` (heals on write — full HP, no status)
3. Upload patched blob, update `SaveState.filePath`
4. Set `StoredPokemon.status = 'in_game'`, `currentGameId = targetGameId`
5. The Pokémon is present the next time the player loads that save — no action required in the emulator

---

## Phase 5 — Oak's Lab UI

A standalone page at `src/app/oaks-lab/page.tsx`, accessible from the main app navigation outside of any active game session. The user selects which save file (by game + save state) they are working with.

**Component:** `src/components/oaks-lab/OaksLab.tsx` — two-tab layout.

### Tab 1: "Leave a Pokémon" (extract)

1. User selects a game and save state — the `.sav` blob is fetched and parsed
2. Display all Pokémon across party + all 12 PC boxes, with animated GIF sprites
3. Checkbox multi-select across any slot in any box
4. "Send to Ranch" button → POST `/api/pokemon/stored` → success toast confirming withdrawal and Ranch receipt

### Tab 2: "Take a Pokémon" (port in)

1. User selects a target game and save state
2. Fetch user's stashed Pokémon from GET `/api/pokemon/stored?status=stashed`
3. Display Ranch grid (same card style as Oak's Ranch page)
4. Select target slot: auto (first available party/box slot) or manual slot picker
5. "Send to [GameName]" button → POST `/api/pokemon/stored/[id]/port`
6. On success: the save blob is updated — the Pokémon will be present the next time the game is loaded

---

## Build Order

```
Phase 0  App Trainer ID + Connect (User model, SaveState model, connect API)
Phase 1  StoredPokemon model + API routes (GET, POST, DELETE, port stub)
Phase 2  Extraction + SRAM write path (clearSlot, injectPokemon, write-back flow)
Phase 3  Oak's Ranch page (stat recalculation for display, animated sprites)
Phase 4  Stat recalculation + port-in API (complete the port stub)
Phase 5  Oak's Lab UI (Connect prompt, extract tab, port-in tab)
```

---

## Resolved Decisions

1. **Withdrawal only — no copy mode.** Extracting a Pokémon always removes it from the source save. The write path is required from Phase 2 onward.

2. **A Pokémon exists once.** It travels game → Ranch → game but is never duplicated. `status: 'stashed'` = at the Ranch; `status: 'in_game'` = lives in `currentGameId`'s save file.

3. **Healing on port-in.** Status condition cleared to `0x00`, current HP set to recalculated maxHP. The Pokémon arrives healthy.

4. **Gen 1 only.** Gen 2 support is a future follow-on.

5. **Sprites.** Use `pokemonGifEndpoint` from `config.js` as the primary sprite source (animated GIFs keyed by Pokédex number). Sugimori variants available for detail views.
